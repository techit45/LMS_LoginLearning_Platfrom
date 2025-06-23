import { supabase } from './supabaseClient';

// ==========================================
// QUIZ MANAGEMENT
// ==========================================

/**
 * Get quiz by content ID
 */
export const getQuizByContentId = async (contentId) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('content_id', contentId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return { data: null, error };
  }
};

/**
 * Get quiz attempts for user
 */
export const getUserQuizAttempts = async (quizId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('quiz_id', quizId)
      .order('attempt_number', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return { data: [], error };
  }
};

/**
 * Start new quiz attempt
 */
export const startQuizAttempt = async (quizId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get quiz details
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    // Check existing attempts
    const { data: existingAttempts, error: attemptsError } = await getUserQuizAttempts(quizId);
    
    if (attemptsError) throw attemptsError;

    const attemptNumber = existingAttempts.length + 1;

    // Check if user has exceeded max attempts
    if (quiz.max_attempts > 0 && existingAttempts.length >= quiz.max_attempts) {
      throw new Error(`คุณได้ทำแบบทดสอบครบจำนวนครั้งที่กำหนดแล้ว (${quiz.max_attempts} ครั้ง)`);
    }

    // Create new attempt
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([{
        user_id: user.id,
        quiz_id: quizId,
        attempt_number: attemptNumber,
        answers: {},
        score: 0,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return { data: { ...data, quiz }, error: null };
  } catch (error) {
    console.error('Error starting quiz attempt:', error);
    return { data: null, error };
  }
};

/**
 * Submit quiz attempt
 */
export const submitQuizAttempt = async (attemptId, answers) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get attempt and quiz details
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes(*)
      `)
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError) throw attemptError;

    const quiz = attempt.quizzes;
    
    // Calculate score
    const scoreResult = calculateQuizScore(quiz.questions, answers);
    
    const isPassed = scoreResult.percentage >= quiz.passing_score;
    const completedAt = new Date().toISOString();
    
    // Calculate time spent
    const startTime = new Date(attempt.started_at);
    const endTime = new Date(completedAt);
    const timeSpentMinutes = Math.round((endTime - startTime) / (1000 * 60));

    // Update attempt
    const { data, error } = await supabase
      .from('quiz_attempts')
      .update({
        answers,
        score: scoreResult.percentage,
        max_score: 100,
        completed_at: completedAt,
        time_spent_minutes: timeSpentMinutes,
        is_passed: isPassed,
        feedback: scoreResult.feedback
      })
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .select(`
        *,
        quizzes(*)
      `)
      .single();

    if (error) throw error;

    return { 
      data: {
        ...data,
        score_details: scoreResult
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return { data: null, error };
  }
};

/**
 * Calculate quiz score
 */
const calculateQuizScore = (questions, answers) => {
  let correctCount = 0;
  const feedback = {};
  
  questions.forEach((question, index) => {
    const questionId = question.id || index.toString();
    const userAnswer = answers[questionId];
    const isCorrect = checkAnswer(question, userAnswer);
    
    if (isCorrect) {
      correctCount++;
    }
    
    feedback[questionId] = {
      is_correct: isCorrect,
      correct_answer: getCorrectAnswer(question),
      user_answer: userAnswer,
      explanation: question.explanation || null
    };
  });
  
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  
  return {
    correct_count: correctCount,
    total_questions: questions.length,
    percentage,
    feedback
  };
};

/**
 * Check if answer is correct
 */
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case 'multiple_choice':
      return userAnswer === question.correct_answer;
    
    case 'true_false':
      return userAnswer === question.correct_answer;
    
    case 'fill_blank':
      const correctAnswers = Array.isArray(question.correct_answer) 
        ? question.correct_answer 
        : [question.correct_answer];
      return correctAnswers.some(correct => 
        userAnswer?.toLowerCase().trim() === correct.toLowerCase().trim()
      );
    
    case 'multiple_select':
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correct_answer)) {
        return false;
      }
      const userSet = new Set(userAnswer.sort());
      const correctSet = new Set(question.correct_answer.sort());
      return userSet.size === correctSet.size && 
             [...userSet].every(answer => correctSet.has(answer));
    
    default:
      return false;
  }
};

/**
 * Get correct answer for display
 */
const getCorrectAnswer = (question) => {
  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return question.correct_answer;
    
    case 'fill_blank':
      return Array.isArray(question.correct_answer) 
        ? question.correct_answer[0] 
        : question.correct_answer;
    
    case 'multiple_select':
      return question.correct_answer;
    
    default:
      return null;
  }
};

// ==========================================
// ADMIN QUIZ MANAGEMENT
// ==========================================

/**
 * Create new quiz (Admin only)
 */
export const createQuiz = async (quizData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('quizzes')
      .insert([{
        ...quizData,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating quiz:', error);
    return { data: null, error };
  }
};

/**
 * Update quiz (Admin only)
 */
export const updateQuiz = async (quizId, quizData) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update(quizData)
      .eq('id', quizId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating quiz:', error);
    return { data: null, error };
  }
};

/**
 * Get all quiz attempts for admin
 */
export const getAllQuizAttempts = async (quizId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        user_profiles!quiz_attempts_user_id_fkey(full_name)
      `)
      .eq('quiz_id', quizId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all quiz attempts:', error);
    return { data: null, error };
  }
};

/**
 * Get quiz statistics
 */
export const getQuizStats = async (quizId) => {
  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('score, is_passed, time_spent_minutes, completed_at')
      .eq('quiz_id', quizId)
      .not('completed_at', 'is', null);

    if (error) throw error;

    if (attempts.length === 0) {
      return {
        data: {
          total_attempts: 0,
          average_score: 0,
          pass_rate: 0,
          average_time_minutes: 0
        },
        error: null
      };
    }

    const stats = {
      total_attempts: attempts.length,
      average_score: Math.round(
        attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length
      ),
      pass_rate: Math.round(
        (attempts.filter(attempt => attempt.is_passed).length / attempts.length) * 100
      ),
      average_time_minutes: Math.round(
        attempts.reduce((sum, attempt) => sum + (attempt.time_spent_minutes || 0), 0) / attempts.length
      ),
      score_distribution: {
        '90-100': attempts.filter(a => a.score >= 90).length,
        '80-89': attempts.filter(a => a.score >= 80 && a.score < 90).length,
        '70-79': attempts.filter(a => a.score >= 70 && a.score < 80).length,
        '60-69': attempts.filter(a => a.score >= 60 && a.score < 70).length,
        '0-59': attempts.filter(a => a.score < 60).length
      }
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    return { data: null, error };
  }
};

// ==========================================
// QUIZ VALIDATION HELPERS
// ==========================================

/**
 * Validate quiz data
 */
export const validateQuizData = (quizData) => {
  const errors = [];

  if (!quizData.title?.trim()) {
    errors.push('ชื่อแบบทดสอบไม่สามารถว่างได้');
  }

  if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    errors.push('ต้องมีคำถามอย่างน้อย 1 ข้อ');
  }

  if (quizData.questions) {
    quizData.questions.forEach((question, index) => {
      if (!question.question?.trim()) {
        errors.push(`คำถามที่ ${index + 1}: ข้อความคำถามไม่สามารถว่างได้`);
      }

      if (!question.type) {
        errors.push(`คำถามที่ ${index + 1}: ต้องระบุประเภทคำถาม`);
      }

      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.length < 2) {
          errors.push(`คำถามที่ ${index + 1}: ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก`);
        }
        if (!question.correct_answer) {
          errors.push(`คำถามที่ ${index + 1}: ต้องระบุคำตอบที่ถูกต้อง`);
        }
      }

      if (question.type === 'multiple_select') {
        if (!question.options || question.options.length < 2) {
          errors.push(`คำถามที่ ${index + 1}: ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก`);
        }
        if (!question.correct_answer || !Array.isArray(question.correct_answer) || question.correct_answer.length === 0) {
          errors.push(`คำถามที่ ${index + 1}: ต้องระบุคำตอบที่ถูกต้องอย่างน้อย 1 ข้อ`);
        }
      }

      if (question.type === 'fill_blank') {
        if (!question.correct_answer) {
          errors.push(`คำถามที่ ${index + 1}: ต้องระบุคำตอบที่ถูกต้อง`);
        }
      }

      if (question.type === 'true_false') {
        if (question.correct_answer !== true && question.correct_answer !== false) {
          errors.push(`คำถามที่ ${index + 1}: ต้องระบุคำตอบเป็น true หรือ false`);
        }
      }
    });
  }

  if (quizData.passing_score && (quizData.passing_score < 0 || quizData.passing_score > 100)) {
    errors.push('คะแนนผ่านต้องอยู่ระหว่าง 0-100');
  }

  if (quizData.time_limit && quizData.time_limit < 0) {
    errors.push('เวลาจำกัดต้องเป็นจำนวนบวกหรือ 0');
  }

  if (quizData.max_attempts && quizData.max_attempts < 1) {
    errors.push('จำนวนครั้งที่ทำได้สูงสุดต้องมากกว่า 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate sample quiz questions
 */
export const generateSampleQuestions = () => {
  return [
    {
      id: '1',
      type: 'multiple_choice',
      question: 'ข้อใดต่อไปนี้เป็นภาษาโปรแกรมมิ่ง?',
      options: ['JavaScript', 'HTML', 'CSS', 'SQL'],
      correct_answer: 'JavaScript',
      explanation: 'JavaScript เป็นภาษาโปรแกรมมิ่งที่ใช้ในการพัฌนาเว็บไซต์',
      points: 1
    },
    {
      id: '2',
      type: 'true_false',
      question: 'HTML ย่อมาจาก HyperText Markup Language',
      correct_answer: true,
      explanation: 'ถูกต้อง HTML ย่อมาจาก HyperText Markup Language',
      points: 1
    },
    {
      id: '3',
      type: 'fill_blank',
      question: 'ภาษา _______ ใช้สำหรับการจัดรูปแบบหน้าเว็บ',
      correct_answer: ['CSS', 'css'],
      explanation: 'CSS (Cascading Style Sheets) ใช้สำหรับการจัดรูปแบบหน้าเว็บ',
      points: 1
    }
  ];
};