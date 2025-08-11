import { supabase } from './supabaseClient';
import NotificationIntegrations from './notificationIntegrations';

// ==========================================
// ASSIGNMENT MANAGEMENT
// ==========================================

/**
 * Get assignment by content ID - Always use fallback approach to avoid column errors
 */
export const getAssignmentByContentId = async (contentId) => {
  try {
    console.log('Using course_id approach for assignment lookup to avoid schema issues');
    
    // Get the course_id and title from content
    const { data: content, error: contentError } = await supabase
      .from('course_content')
      .select('course_id, title')
      .eq('id', contentId)
      .single();
    
    if (contentError || !content) {
      return { data: null, error: null };
    }
    
    // Find assignment by course_id (this avoids the content_id column issue)
    const result = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', content.course_id)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1);
    
    if (result.error) {
      console.error('Error fetching assignments by course_id:', result.error);
      return { data: null, error: null };
    }
    
    // Return the first assignment if found
    const assignments = result.data || [];
    return { data: assignments.length > 0 ? assignments[0] : null, error: null };
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return { data: null, error: null }; // Return null error to prevent UI crashes
  }
};

/**
 * Get user's submissions for an assignment
 */
export const getUserSubmissions = async (assignmentId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('assignment_id', assignmentId)
      .order('id', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return { data: [], error };
  }
};

/**
 * Create new assignment submission
 */
export const createSubmission = async (assignmentId, submissionData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create new submission
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert([{
        user_id: user.id,
        assignment_id: assignmentId,
        submission_text: submissionData.text || ''
      }])
      .select(`
        *,
        assignments(
          title,
          course_id,
          courses(
            title,
            instructor_id
          )
        )
      `)
      .single();

    if (error) throw error;

    // Send assignment submission notification to instructor
    try {
      if (data && data.assignments && data.assignments.courses) {
        await NotificationIntegrations.handleAssignmentSubmission(
          user.id,
          {
            id: assignmentId,
            title: data.assignments.title
          },
          {
            id: data.assignments.course_id,
            title: data.assignments.courses.title,
            instructor_id: data.assignments.courses.instructor_id
          }
        );
        console.log('Assignment submission notification sent');
      }
    } catch (notificationError) {
      console.error('Error sending assignment submission notification:', notificationError);
      // Don't fail the submission if notification fails
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating submission:', error);
    return { data: null, error };
  }
};

/**
 * Update existing submission (before final submission)
 */
export const updateSubmission = async (submissionId, submissionData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        submission_text: submissionData.text || ''
      })
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating submission:', error);
    return { data: null, error };
  }
};

/**
 * Submit draft as final submission
 */
export const submitFinalSubmission = async (submissionId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        submitted_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error submitting final submission:', error);
    return { data: null, error };
  }
};

// ==========================================
// FILE UPLOAD UTILITIES
// ==========================================

/**
 * Upload file to Supabase Storage
 */
export const uploadAssignmentFile = async (file, assignmentId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `assignments/${assignmentId}/${user.id}/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from('course-files')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    return {
      data: {
        path: data.path,
        url: publicUrl,
        originalName: file.name,
        size: file.size,
        type: file.type
      },
      error: null
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { data: null, error };
  }
};

/**
 * Delete file from Supabase Storage
 */
export const deleteAssignmentFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('course-files')
      .remove([filePath]);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { error };
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (file, assignment) => {
  const errors = [];

  // Check file size
  if (file.size > (assignment.max_file_size || 10485760)) {
    errors.push(`ไฟล์ ${file.name} มีขนาดใหญ่เกินกำหนด (${(assignment.max_file_size / 1024 / 1024).toFixed(1)} MB)`);
  }

  // Check file type
  const fileExt = file.name.split('.').pop().toLowerCase();
  const allowedTypes = assignment.allowed_file_types || ['pdf', 'doc', 'docx', 'jpg', 'png'];
  
  if (!allowedTypes.includes(fileExt)) {
    errors.push(`ไฟล์ ${file.name} ไม่ใช่ประเภทที่อนุญาต (${allowedTypes.join(', ')})`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ==========================================
// ADMIN ASSIGNMENT MANAGEMENT
// ==========================================

/**
 * Create new assignment (Admin only)
 */
export const createAssignment = async (assignmentData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert([assignmentData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return { data: null, error };
  }
};

/**
 * Create assignment for specific content (Admin only)
 */
export const createAssignmentForContent = async (contentId, courseId, assignmentData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if assignment already exists for this content
    const existingAssignment = await getAssignmentByContentId(contentId);
    if (existingAssignment.data) {
      throw new Error('งานมอบหมายสำหรับเนื้อหานี้มีอยู่แล้ว');
    }

    // Prepare assignment data with fallback logic (using only basic fields)
    const assignment = {
      title: assignmentData.title,
      description: assignmentData.description || '',
      instructions: assignmentData.instructions || '',
      due_date: assignmentData.due_date,
      max_score: assignmentData.max_score || 100,
      is_active: true
    };

    // Try to add content_id first, fallback to course_id if column doesn't exist
    try {
      assignment.content_id = contentId;
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignment])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.log('content_id column not found, using course_id fallback');
      
      // Fallback: use course_id instead
      delete assignment.content_id;
      assignment.course_id = courseId;
      
      const { data, error: fallbackError } = await supabase
        .from('assignments')
        .insert([assignment])
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error creating assignment for content:', error);
    return { data: null, error };
  }
};

/**
 * Update assignment (Admin only)
 */
export const updateAssignment = async (assignmentId, assignmentData) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .update(assignmentData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return { data: null, error };
  }
};

/**
 * Get all submissions for an assignment (Admin only)
 */
export const getAllSubmissions = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        user_profiles!assignment_submissions_user_id_fkey(full_name, avatar_url)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all submissions:', error);
    return { data: null, error };
  }
};

/**
 * Grade submission (Admin only)
 */
export const gradeSubmission = async (submissionId, gradeData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        score: gradeData.score,
        feedback: gradeData.feedback,
        graded_at: new Date().toISOString(),
        graded_by: user.id
        // status removed - using graded_at to determine graded status
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error grading submission:', error);
    return { data: null, error };
  }
};

/**
 * Get assignment by ID (for admin)
 */
export const getAssignmentById = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return { data: null, error };
  }
};

/**
 * Get assignment submissions with user data (for admin grading)
 */
export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        user_profiles!assignment_submissions_user_id_fkey(full_name, email, avatar_url)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    return { data: null, error };
  }
};

/**
 * Update submission grade (for admin)
 */
export const updateSubmissionGrade = async (submissionId, gradeData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        score: gradeData.score,
        feedback: gradeData.feedback,
        graded_at: gradeData.graded_at || new Date().toISOString(),
        graded_by: gradeData.graded_by || user.id,
        grading_rubric_scores: gradeData.grading_rubric_scores || null
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating submission grade:', error);
    return { data: null, error };
  }
};

/**
 * Get assignment statistics
 */
export const getAssignmentStats = async (assignmentId) => {
  try {
    const { data: submissions, error } = await supabase
      .from('assignment_submissions')
      .select('score, submitted_at, graded_at')
      .eq('assignment_id', assignmentId)
      .not('submitted_at', 'is', null); // Only get submitted assignments

    if (error) throw error;

    if (submissions.length === 0) {
      return {
        data: {
          total_submissions: 0,
          graded_submissions: 0,
          average_score: 0,
          late_submissions: 0,
          on_time_submissions: 0
        },
        error: null
      };
    }

    const gradedSubmissions = submissions.filter(s => s.score !== null);
    
    const stats = {
      total_submissions: submissions.length,
      graded_submissions: gradedSubmissions.length,
      average_score: gradedSubmissions.length > 0 
        ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
        : 0,
      late_submissions: submissions.filter(s => s.is_late).length,
      on_time_submissions: submissions.filter(s => !s.is_late).length,
      score_distribution: {
        '90-100': gradedSubmissions.filter(s => s.score >= 90).length,
        '80-89': gradedSubmissions.filter(s => s.score >= 80 && s.score < 90).length,
        '70-79': gradedSubmissions.filter(s => s.score >= 70 && s.score < 80).length,
        '60-69': gradedSubmissions.filter(s => s.score >= 60 && s.score < 70).length,
        '0-59': gradedSubmissions.filter(s => s.score < 60).length
      }
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    return { data: null, error };
  }
};