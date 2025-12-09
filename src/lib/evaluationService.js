// Evaluation Service
// ระบบจัดการแบบประเมินความพึงพอใจและทดสอบความรู้

import { supabase } from './supabaseClient';

// ==========================================
// ERROR HANDLING
// ==========================================

const handleError = (error, context = '') => {
  console.error(`[Evaluation Service] ${context}:`, error);

  const errorMessages = {
    '23505': 'คุณได้ทำแบบประเมินนี้ไปแล้ว',
    '23503': 'ไม่พบข้อมูลที่เกี่ยวข้อง',
    'PGRST116': 'ไม่พบข้อมูลที่ต้องการ',
  };

  if (error.code && errorMessages[error.code]) {
    return { error: errorMessages[error.code], data: null };
  }

  return { error: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ', data: null };
};

// ==========================================
// EVALUATION CRUD OPERATIONS
// ==========================================

/**
 * Create new evaluation
 * @param {Object} evaluationData - Evaluation data
 * @returns {Promise<{data, error}>}
 */
export const createEvaluation = async (evaluationData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('กรุณาเข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        title: evaluationData.title,
        description: evaluationData.description,
        course_id: evaluationData.courseId || null,
        type: evaluationData.type || 'satisfaction',
        status: evaluationData.status || 'active',
        settings: evaluationData.settings || {},
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Create Evaluation');
  }
};

/**
 * Get all evaluations with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<{data, error}>}
 */
export const getEvaluations = async (filters = {}) => {
  try {
    let query = supabase
      .from('evaluations')
      .select(`
        *,
        course:courses(id, title),
        creator:user_profiles!evaluations_created_by_fkey(user_id, full_name, email),
        _count:evaluation_submissions(count)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Evaluations');
  }
};

/**
 * Get evaluation by ID with questions
 * @param {string} evaluationId - Evaluation ID
 * @returns {Promise<{data, error}>}
 */
export const getEvaluationById = async (evaluationId) => {
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        course:courses(id, title, description),
        questions:evaluation_questions(*)
      `)
      .eq('id', evaluationId)
      .order('display_order', { foreignTable: 'evaluation_questions', ascending: true })
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Evaluation By ID');
  }
};

/**
 * Update evaluation
 * @param {string} evaluationId - Evaluation ID
 * @param {Object} updates - Update data
 * @returns {Promise<{data, error}>}
 */
export const updateEvaluation = async (evaluationId, updates) => {
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .update({
        title: updates.title,
        description: updates.description,
        type: updates.type,
        status: updates.status,
        settings: updates.settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', evaluationId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Update Evaluation');
  }
};

/**
 * Delete evaluation
 * @param {string} evaluationId - Evaluation ID
 * @returns {Promise<{data, error}>}
 */
export const deleteEvaluation = async (evaluationId) => {
  try {
    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', evaluationId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return handleError(error, 'Delete Evaluation');
  }
};

// ==========================================
// EVALUATION QUESTIONS
// ==========================================

/**
 * Add question to evaluation
 * @param {Object} questionData - Question data
 * @returns {Promise<{data, error}>}
 */
export const addEvaluationQuestion = async (questionData) => {
  try {
    const { data, error } = await supabase
      .from('evaluation_questions')
      .insert({
        evaluation_id: questionData.evaluationId,
        question_text: questionData.questionText,
        question_type: questionData.questionType,
        options: questionData.options || {},
        is_required: questionData.isRequired !== false,
        display_order: questionData.displayOrder
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Add Question');
  }
};

/**
 * Update evaluation question
 * @param {string} questionId - Question ID
 * @param {Object} updates - Update data
 * @returns {Promise<{data, error}>}
 */
export const updateEvaluationQuestion = async (questionId, updates) => {
  try {
    const { data, error } = await supabase
      .from('evaluation_questions')
      .update({
        question_text: updates.questionText,
        question_type: updates.questionType,
        options: updates.options,
        is_required: updates.isRequired,
        display_order: updates.displayOrder
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Update Question');
  }
};

/**
 * Delete evaluation question
 * @param {string} questionId - Question ID
 * @returns {Promise<{data, error}>}
 */
export const deleteEvaluationQuestion = async (questionId) => {
  try {
    const { error } = await supabase
      .from('evaluation_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return handleError(error, 'Delete Question');
  }
};

/**
 * Reorder questions
 * @param {Array} questions - Array of {id, displayOrder}
 * @returns {Promise<{data, error}>}
 */
export const reorderQuestions = async (questions) => {
  try {
    const updates = questions.map(q =>
      supabase
        .from('evaluation_questions')
        .update({ display_order: q.displayOrder })
        .eq('id', q.id)
    );

    await Promise.all(updates);
    return { data: true, error: null };
  } catch (error) {
    return handleError(error, 'Reorder Questions');
  }
};

// ==========================================
// EVALUATION SUBMISSIONS
// ==========================================

/**
 * Submit evaluation response
 * @param {string} evaluationId - Evaluation ID
 * @param {Array} responses - Array of {questionId, value, data}
 * @param {Object} metadata - Additional metadata (ip, userAgent)
 * @returns {Promise<{data, error}>}
 */
export const submitEvaluation = async (evaluationId, responses, metadata = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('กรุณาเข้าสู่ระบบ');

    // Check if already submitted
    const { data: existing } = await supabase
      .from('evaluation_submissions')
      .select('id')
      .eq('evaluation_id', evaluationId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (existing) {
      throw new Error('คุณได้ทำแบบประเมินนี้ไปแล้ว');
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('evaluation_submissions')
      .insert({
        evaluation_id: evaluationId,
        student_id: user.id,
        ip_address: metadata.ipAddress || null,
        user_agent: metadata.userAgent || navigator.userAgent
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Insert responses
    const responsesData = responses.map(r => ({
      submission_id: submission.id,
      question_id: r.questionId,
      response_value: r.value?.toString() || '',
      response_data: r.data || {}
    }));

    const { error: responsesError } = await supabase
      .from('evaluation_responses')
      .insert(responsesData);

    if (responsesError) throw responsesError;

    return { data: submission, error: null };
  } catch (error) {
    return handleError(error, 'Submit Evaluation');
  }
};

/**
 * Get evaluation submissions with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<{data, error}>}
 */
export const getEvaluationSubmissions = async (filters = {}) => {
  try {
    let query = supabase
      .from('evaluation_submissions')
      .select(`
        *,
        evaluation:evaluations(id, title, type),
        student:user_profiles(user_id, full_name, email),
        responses:evaluation_responses(
          *,
          question:evaluation_questions(question_text, question_type, options)
        )
      `)
      .order('submitted_at', { ascending: false });

    if (filters.evaluationId) {
      query = query.eq('evaluation_id', filters.evaluationId);
    }
    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Submissions');
  }
};

/**
 * Get submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<{data, error}>}
 */
export const getSubmissionById = async (submissionId) => {
  try {
    const { data, error } = await supabase
      .from('evaluation_submissions')
      .select(`
        *,
        evaluation:evaluations(id, title, type, description),
        student:user_profiles(user_id, full_name, email),
        responses:evaluation_responses(
          *,
          question:evaluation_questions(question_text, question_type, options)
        )
      `)
      .eq('id', submissionId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Submission By ID');
  }
};

/**
 * Check if user has submitted evaluation
 * @param {string} evaluationId - Evaluation ID
 * @param {string} userId - User ID (optional, uses current user)
 * @returns {Promise<{data: boolean, error}>}
 */
export const hasSubmittedEvaluation = async (evaluationId, userId = null) => {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return { data: false, error: null };

    const { data, error } = await supabase
      .from('evaluation_submissions')
      .select('id')
      .eq('evaluation_id', evaluationId)
      .eq('student_id', uid)
      .maybeSingle();

    if (error) throw error;
    return { data: !!data, error: null };
  } catch (error) {
    return handleError(error, 'Check Submission');
  }
};

// ==========================================
// STATISTICS & ANALYTICS
// ==========================================

/**
 * Get evaluation statistics
 * @param {string} evaluationId - Evaluation ID
 * @returns {Promise<{data, error}>}
 */
export const getEvaluationStatistics = async (evaluationId) => {
  try {
    // Get basic stats using RPC function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_evaluation_stats', { eval_id: evaluationId });

    if (statsError) throw statsError;

    // Get question-specific stats
    const { data: submissions, error: submissionsError } = await supabase
      .from('evaluation_submissions')
      .select(`
        responses:evaluation_responses(
          question_id,
          response_value,
          question:evaluation_questions(question_text, question_type, options)
        )
      `)
      .eq('evaluation_id', evaluationId);

    if (submissionsError) throw submissionsError;

    // Process question statistics
    const questionStats = {};
    submissions.forEach(submission => {
      submission.responses.forEach(response => {
        const qId = response.question_id;
        if (!questionStats[qId]) {
          questionStats[qId] = {
            questionId: qId,
            questionText: response.question.question_text,
            questionType: response.question.question_type,
            responses: [],
            totalResponses: 0
          };
        }
        questionStats[qId].responses.push(response.response_value);
        questionStats[qId].totalResponses++;
      });
    });

    // Calculate statistics per question
    Object.values(questionStats).forEach(qStat => {
      if (qStat.questionType === 'rating') {
        const values = qStat.responses.map(r => parseFloat(r)).filter(v => !isNaN(v));
        qStat.average = values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;
        qStat.min = Math.min(...values);
        qStat.max = Math.max(...values);
      } else if (qStat.questionType === 'multiple_choice') {
        qStat.distribution = qStat.responses.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
      }
    });

    return {
      data: {
        totalSubmissions: stats[0]?.total_submissions || 0,
        averageRating: stats[0]?.average_rating || 0,
        completionRate: stats[0]?.completion_rate || 0,
        questionStats: Object.values(questionStats)
      },
      error: null
    };
  } catch (error) {
    return handleError(error, 'Get Statistics');
  }
};

/**
 * Export evaluation results to CSV
 * @param {string} evaluationId - Evaluation ID
 * @returns {Promise<{data: string, error}>}
 */
export const exportEvaluationToCSV = async (evaluationId) => {
  try {
    const { data: submissions, error } = await getEvaluationSubmissions({
      evaluationId
    });

    if (error) throw new Error(error);

    if (!submissions || submissions.length === 0) {
      return { data: null, error: 'ไม่มีข้อมูลสำหรับส่งออก' };
    }

    // Build CSV headers
    const headers = ['ผู้ทำแบบประเมิน', 'อีเมล', 'วันที่ทำ'];
    const questions = submissions[0].responses.map(r => r.question.question_text);
    const csvHeaders = [...headers, ...questions].join(',');

    // Build CSV rows
    const csvRows = submissions.map(sub => {
      const row = [
        sub.student.full_name,
        sub.student.email,
        new Date(sub.submitted_at).toLocaleDateString('th-TH')
      ];

      sub.responses.forEach(res => {
        row.push(res.response_value);
      });

      return row.join(',');
    });

    const csv = [csvHeaders, ...csvRows].join('\n');
    return { data: csv, error: null };
  } catch (error) {
    return handleError(error, 'Export to CSV');
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validate evaluation data
 * @param {Object} data - Evaluation data
 * @returns {Object} Validation result
 */
export const validateEvaluationData = (data) => {
  const errors = {};

  if (!data.title || data.title.trim() === '') {
    errors.title = 'กรุณาระบุชื่อแบบประเมิน';
  }

  if (!data.type) {
    errors.type = 'กรุณาเลือกประเภทแบบประเมิน';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate question data
 * @param {Object} data - Question data
 * @returns {Object} Validation result
 */
export const validateQuestionData = (data) => {
  const errors = {};

  if (!data.questionText || data.questionText.trim() === '') {
    errors.questionText = 'กรุณาระบุคำถาม';
  }

  if (!data.questionType) {
    errors.questionType = 'กรุณาเลือกประเภทคำถาม';
  }

  if (data.questionType === 'multiple_choice' && (!data.options?.choices || data.options.choices.length < 2)) {
    errors.options = 'กรุณาระบุตัวเลือกอย่างน้อย 2 ตัวเลือก';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  // Evaluations
  createEvaluation,
  getEvaluations,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,

  // Questions
  addEvaluationQuestion,
  updateEvaluationQuestion,
  deleteEvaluationQuestion,
  reorderQuestions,

  // Submissions
  submitEvaluation,
  getEvaluationSubmissions,
  getSubmissionById,
  hasSubmittedEvaluation,

  // Analytics
  getEvaluationStatistics,
  exportEvaluationToCSV,

  // Validation
  validateEvaluationData,
  validateQuestionData
};
