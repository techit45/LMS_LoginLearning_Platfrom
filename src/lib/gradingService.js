import { supabase } from './supabaseClient.js';

/**
 * Complete Assignment Grading Service
 * Handles assignment grading, rubrics, and auto-grading functionality
 */
class GradingService {
  
  // Get all assignments for grading (instructor view)
  async getAssignmentsForGrading(filters = {}) {
    try {
      const { 
        courseId = null,
        status = 'submitted',
        instructorId = null,
        page = 1,
        limit = 20 
      } = filters;

      let query = supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments (
            id,
            title,
            course_id,
            max_score,
            due_date,
            rubric,
            courses (
              title,
              instructor_id
            )
          ),
          user_profiles (
            full_name,
            email
          )
        `)
        .eq('status', status);

      if (courseId) {
        query = query.eq('assignments.course_id', courseId);
      }

      if (instructorId) {
        query = query.eq('assignments.courses.instructor_id', instructorId);
      }

      const { data, error } = await query
        .order('submitted_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Grade a single assignment submission
  async gradeAssignment(submissionId, gradingData) {
    try {
      const {
        score,
        maxScore,
        feedback,
        rubricScores = {},
        gradedBy,
        autoGraded = false
      } = gradingData;

      // Validate score
      if (score < 0 || score > maxScore) {
        throw new Error(`Score must be between 0 and ${maxScore}`);
      }

      const gradeData = {
        score,
        max_score: maxScore,
        feedback,
        rubric_scores: rubricScores,
        graded_by: gradedBy,
        graded_at: new Date().toISOString(),
        auto_graded: autoGraded,
        status: 'graded'
      };

      const { data, error } = await supabase
        .from('assignment_submissions')
        .update(gradeData)
        .eq('id', submissionId)
        .select(`
          *,
          assignments (
            title,
            course_id,
            courses (
              title
            )
          ),
          user_profiles (
            full_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Create grading history record
      await this.createGradingHistory(submissionId, gradeData);

      // Send notification to student
      await this.notifyStudentGraded(data);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Bulk grading for multiple submissions
  async bulkGradeAssignments(submissions, gradingTemplate) {
    const results = [];
    
    for (const submission of submissions) {
      const gradingData = {
        ...gradingTemplate,
        score: submission.score || gradingTemplate.score,
        feedback: submission.feedback || gradingTemplate.feedback
      };

      const result = await this.gradeAssignment(submission.id, gradingData);
      results.push({
        submissionId: submission.id,
        success: !result.error,
        error: result.error?.message,
        data: result.data
      });
    }

    return results;
  }

  // Auto-grade assignments based on rubric
  async autoGradeAssignment(submissionId) {
    try {
      // Get submission with assignment details
      const { data: submission, error: submissionError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments (
            rubric,
            max_score,
            auto_grading_config
          )
        `)
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      const assignment = submission.assignments;
      if (!assignment?.auto_grading_config?.enabled) {
        throw new Error('Auto-grading not enabled for this assignment');
      }

      // Implement basic auto-grading logic
      let autoScore = 0;
      const autoFeedback = [];
      const rubricScores = {};

      if (assignment.rubric && Array.isArray(assignment.rubric)) {
        for (const criterion of assignment.rubric) {
          let criterionScore = 0;
          
          // Basic keyword matching for auto-grading
          if (criterion.type === 'completion' && submission.submission_text) {
            // Check if submission meets minimum length requirements
            const wordCount = submission.submission_text.split(' ').length;
            const minWords = criterion.min_words || 50;
            
            if (wordCount >= minWords) {
              criterionScore = criterion.max_points;
              autoFeedback.push(`✓ Meets minimum length requirement (${wordCount} words)`);
            } else {
              criterionScore = criterion.max_points * 0.5;
              autoFeedback.push(`⚠ Below minimum length (${wordCount}/${minWords} words)`);
            }
          }
          
          rubricScores[criterion.id] = criterionScore;
          autoScore += criterionScore;
        }
      } else {
        // Simple auto-grading based on submission presence
        if (submission.submission_text || submission.file_url) {
          autoScore = assignment.max_score * 0.8; // 80% for completion
          autoFeedback.push('✓ Assignment submitted');
        }
      }

      // Grade the assignment
      return await this.gradeAssignment(submissionId, {
        score: Math.min(autoScore, assignment.max_score),
        maxScore: assignment.max_score,
        feedback: `Auto-graded submission:\n\n${autoFeedback.join('\n')}\n\nNote: This is an automated grade. Please review manually if needed.`,
        rubricScores,
        gradedBy: 'system',
        autoGraded: true
      });

    } catch (error) {
      return { data: null, error };
    }
  }

  // Create grading rubric
  async createRubric(assignmentId, rubricData) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({ 
          rubric: rubricData.criteria,
          rubric_total_points: rubricData.totalPoints 
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get grading statistics
  async getGradingStats(instructorId, filters = {}) {
    try {
      const { courseId = null, dateFrom = null, dateTo = null } = filters;

      let query = supabase
        .from('assignment_submissions')
        .select(`
          status,
          score,
          max_score,
          graded_at,
          assignments!inner (
            course_id,
            courses!inner (
              instructor_id
            )
          )
        `)
        .eq('assignments.courses.instructor_id', instructorId);

      if (courseId) {
        query = query.eq('assignments.course_id', courseId);
      }

      if (dateFrom) {
        query = query.gte('submitted_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('submitted_at', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        totalSubmissions: data.length,
        graded: data.filter(s => s.status === 'graded').length,
        pending: data.filter(s => s.status === 'submitted').length,
        averageScore: 0,
        gradingLoad: 0
      };

      const gradedSubmissions = data.filter(s => s.status === 'graded' && s.score !== null);
      if (gradedSubmissions.length > 0) {
        const totalPercentage = gradedSubmissions.reduce((sum, s) => 
          sum + (s.score / s.max_score * 100), 0);
        stats.averageScore = Math.round(totalPercentage / gradedSubmissions.length);
      }

      stats.gradingLoad = Math.round((stats.pending / stats.totalSubmissions) * 100) || 0;

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Create grading history record
  async createGradingHistory(submissionId, gradeData) {
    try {
      const { error } = await supabase
        .from('grading_history')
        .insert({
          submission_id: submissionId,
          score: gradeData.score,
          max_score: gradeData.max_score,
          feedback: gradeData.feedback,
          rubric_scores: gradeData.rubric_scores,
          graded_by: gradeData.graded_by,
          auto_graded: gradeData.auto_graded,
          graded_at: gradeData.graded_at
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create grading history:', error);
    }
  }

  // Notify student about grading
  async notifyStudentGraded(submissionData) {
    try {
      // This would integrate with the notification service
      const notificationData = {
        type: 'assignment_graded',
        user_id: submissionData.user_id,
        title: 'งานได้รับการตรวจแล้ว',
        message: `งาน "${submissionData.assignments.title}" ได้รับการตรวจแล้ว คะแนน: ${submissionData.score}/${submissionData.max_score}`,
        action_url: `/assignments/${submissionData.assignment_id}`,
        data: {
          assignment_id: submissionData.assignment_id,
          score: submissionData.score,
          max_score: submissionData.max_score
        }
      };

      // Import and use notification service
      const { default: notificationService } = await import('./notificationService.js');
      await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to notify student:', error);
    }
  }
}

// Export singleton instance
const gradingService = new GradingService();
export default gradingService;