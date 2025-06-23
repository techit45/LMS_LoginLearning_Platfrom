// ==========================================
// DEMO SERVICE - จำลองการทำงานของ Supabase
// สำหรับการแสดงผลเว็บไซต์โดยไม่ต้องตั้งค่า Database
// ==========================================

import { 
  mockUsers, 
  mockCourses, 
  mockCourseContent, 
  mockQuizzes,
  mockAssignments,
  mockEnrollments, 
  mockProgress,
  mockAttachments,
  mockOnsiteCourses,
  mockAnnouncements,
  STORAGE_KEYS,
  isDemoMode,
  getDemoUser,
  setDemoUser,
  clearDemoUser
} from './mockData.js';

// Simulate async operations
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// AUTHENTICATION SERVICE
// ==========================================

export const authService = {
  // เข้าสู่ระบบ
  signIn: async (email, password) => {
    await delay();
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      return { 
        data: null, 
        error: { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
      };
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      profile: user.profile
    };

    setDemoUser(sessionUser);
    
    return { 
      data: { user: sessionUser }, 
      error: null 
    };
  },

  // สมัครสมาชิก
  signUp: async (email, password, userData) => {
    await delay();

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return {
        data: null,
        error: { message: 'อีเมลนี้ถูกใช้งานแล้ว' }
      };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      full_name: userData.full_name || 'ผู้ใช้ใหม่',
      role: 'student',
      created_at: new Date().toISOString(),
      profile: userData.profile || {}
    };

    // เพิ่มผู้ใช้ใหม่ (ในโหมด demo จะไม่ save จริง)
    mockUsers.push(newUser);

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      profile: newUser.profile
    };

    setDemoUser(sessionUser);

    return {
      data: { user: sessionUser },
      error: null
    };
  },

  // ออกจากระบบ
  signOut: async () => {
    await delay(200);
    clearDemoUser();
    return { error: null };
  },

  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  getUser: async () => {
    await delay(100);
    const user = getDemoUser();
    return { 
      data: { user }, 
      error: null 
    };
  }
};

// ==========================================
// COURSE SERVICE
// ==========================================

export const courseService = {
  // ดึงรายการคอร์สทั้งหมด
  getCourses: async () => {
    await delay();
    return { 
      data: mockCourses.filter(c => c.is_active), 
      error: null 
    };
  },

  // ดึงข้อมูลคอร์สตาม ID
  getCourseById: async (courseId) => {
    await delay();
    const course = mockCourses.find(c => c.id === courseId);
    if (!course) {
      return { 
        data: null, 
        error: { message: 'ไม่พบคอร์สที่ต้องการ' }
      };
    }

    // เพิ่มเนื้อหาในคอร์ส
    const content = mockCourseContent[courseId] || [];
    
    return { 
      data: { ...course, content }, 
      error: null 
    };
  },

  // ดึงคอร์สสำหรับ Admin (รวมที่ปิดใช้งาน)
  getCourseByIdAdmin: async (courseId) => {
    await delay();
    const course = mockCourses.find(c => c.id === courseId);
    if (!course) {
      return { 
        data: null, 
        error: { message: 'ไม่พบคอร์สที่ต้องการ' }
      };
    }

    const content = mockCourseContent[courseId] || [];
    
    return { 
      data: { ...course, content }, 
      error: null 
    };
  }
};

// ==========================================
// ENROLLMENT SERVICE
// ==========================================

export const enrollmentService = {
  // ตรวจสอบการลงทะเบียน
  isUserEnrolled: async (courseId) => {
    await delay();
    const user = getDemoUser();
    if (!user) {
      return { 
        isEnrolled: false, 
        status: null, 
        error: { message: 'กรุณาเข้าสู่ระบบก่อน' }
      };
    }

    const enrollment = mockEnrollments.find(
      e => e.user_id === user.id && e.course_id === courseId
    );

    return {
      isEnrolled: !!enrollment,
      status: enrollment?.status || null,
      error: null
    };
  },

  // ลงทะเบียนเรียน
  enrollCourse: async (courseId) => {
    await delay();
    const user = getDemoUser();
    if (!user) {
      return { 
        data: null, 
        error: { message: 'กรุณาเข้าสู่ระบบก่อน' }
      };
    }

    // ตรวจสอบว่าลงทะเบียนแล้วหรือยัง
    const existingEnrollment = mockEnrollments.find(
      e => e.user_id === user.id && e.course_id === courseId
    );

    if (existingEnrollment) {
      return { 
        data: null, 
        error: { message: 'คุณได้ลงทะเบียนคอร์สนี้แล้ว' }
      };
    }

    const newEnrollment = {
      id: `enrollment-${Date.now()}`,
      user_id: user.id,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      status: 'active',
      progress_percentage: 0,
      completed_at: null
    };

    mockEnrollments.push(newEnrollment);

    return { 
      data: newEnrollment, 
      error: null 
    };
  }
};

// ==========================================
// PROGRESS SERVICE
// ==========================================

export const progressService = {
  // ดึงความคืบหน้าของคอร์ส
  getCourseProgress: async (courseId) => {
    await delay();
    const user = getDemoUser();
    if (!user) {
      return { data: null, error: { message: 'กรุณาเข้าสู่ระบบ' } };
    }

    const progress = mockProgress[courseId];
    if (!progress || progress.user_id !== user.id) {
      return { 
        data: {
          user_id: user.id,
          course_id: courseId,
          progress_percentage: 0,
          completed_count: 0,
          total_count: mockCourseContent[courseId]?.length || 0,
          content_progress: []
        }, 
        error: null 
      };
    }

    return { data: progress, error: null };
  },

  // อัปเดตความคืบหน้าวิดีโอ
  updateVideoProgress: async (contentId, progressData) => {
    await delay(200);
    // ในโหมด demo จะไม่บันทึกจริง แต่จะ return สำเร็จ
    return { error: null };
  },

  // ดึงความคืบหน้าวิดีโอ
  getVideoProgress: async (contentId) => {
    await delay(100);
    // Return mock video progress
    return { 
      data: {
        content_id: contentId,
        last_position: 120,
        total_duration: 300,
        is_completed: false
      }, 
      error: null 
    };
  }
};

// ==========================================
// QUIZ SERVICE
// ==========================================

export const quizService = {
  // ดึงแบบทดสอบ
  getQuizByContentId: async (contentId) => {
    await delay();
    const quiz = mockQuizzes[contentId];
    return { 
      data: quiz || null, 
      error: quiz ? null : { message: 'ไม่พบแบบทดสอบ' }
    };
  },

  // เริ่มทำแบบทดสอบ
  startQuizAttempt: async (quizId) => {
    await delay();
    const attempt = {
      id: `attempt-${Date.now()}`,
      quiz_id: quizId,
      user_id: getDemoUser()?.id,
      attempt_number: 1,
      started_at: new Date().toISOString(),
      status: 'in_progress'
    };

    return { data: attempt, error: null };
  },

  // ส่งคำตอบแบบทดสอบ
  submitQuizAttempt: async (attemptId, answers) => {
    await delay(1000);

    // คำนวณคะแนน (mock)
    const totalQuestions = 4;
    const correctAnswers = Math.floor(Math.random() * totalQuestions) + 1;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const isPassed = score >= 70;

    const result = {
      id: attemptId,
      score: score,
      max_score: 100,
      is_passed: isPassed,
      completed_at: new Date().toISOString(),
      time_spent_minutes: 15,
      score_details: {
        correct_count: correctAnswers,
        total_questions: totalQuestions,
        feedback: {
          q1: { is_correct: true, user_answer: 'Interpreted Language', correct_answer: 'Interpreted Language' },
          q2: { is_correct: score > 50, user_answer: 'x = 5', correct_answer: 'x = 5' },
          q3: { is_correct: score > 75, user_answer: true, correct_answer: true },
          q4: { is_correct: isPassed, user_answer: 'print', correct_answer: 'print' }
        }
      }
    };

    return { data: result, error: null };
  }
};

// ==========================================
// ASSIGNMENT SERVICE
// ==========================================

export const assignmentService = {
  // ดึงงานมอบหมาย
  getAssignmentByContentId: async (contentId) => {
    await delay();
    const assignment = mockAssignments[contentId];
    return { 
      data: assignment || null, 
      error: assignment ? null : { message: 'ไม่พบงานมอบหมาย' }
    };
  },

  // ส่งงาน
  submitAssignment: async (assignmentId, submissionData) => {
    await delay(1500);

    const submission = {
      id: `submission-${Date.now()}`,
      assignment_id: assignmentId,
      user_id: getDemoUser()?.id,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
      score: null, // จะให้คะแนนทีหลัง
      feedback: null,
      files: submissionData.files || []
    };

    return { data: submission, error: null };
  }
};

// ==========================================
// ATTACHMENT SERVICE  
// ==========================================

export const attachmentService = {
  // ดึงไฟล์แนบ
  getContentAttachments: async (contentId) => {
    await delay();
    const attachments = mockAttachments[contentId] || [];
    return { data: attachments, error: null };
  },

  // ดาวน์โหลดไฟล์ (mock)
  downloadAttachment: async (filePath, filename) => {
    await delay(500);
    
    // สร้าง mock file content
    const mockContent = `Mock file content for: ${filename}`;
    const blob = new Blob([mockContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { error: null };
  },

  // สร้าง signed URL (mock)
  getAttachmentDownloadUrl: async (filePath) => {
    await delay(200);
    return { 
      data: `https://mock-storage.demo.com/${filePath}?signed=true`, 
      error: null 
    };
  }
};

// ==========================================
// ONSITE SERVICE
// ==========================================

export const onsiteService = {
  // ดึงคอร์ส onsite
  getOnsiteCourses: async () => {
    await delay();
    return { data: mockOnsiteCourses, error: null };
  },

  // สมัครคอร์ส onsite
  registerOnsiteCourse: async (courseId, registrationData) => {
    await delay(800);
    
    const registration = {
      id: `onsite-reg-${Date.now()}`,
      course_id: courseId,
      user_id: getDemoUser()?.id,
      status: 'pending',
      registered_at: new Date().toISOString(),
      ...registrationData
    };

    return { data: registration, error: null };
  }
};

// ==========================================
// USER SERVICE
// ==========================================

export const userService = {
  // อัปเดตโปรไฟล์
  updateProfile: async (userData) => {
    await delay();
    const currentUser = getDemoUser();
    if (!currentUser) {
      return { data: null, error: { message: 'กรุณาเข้าสู่ระบบ' } };
    }

    const updatedUser = { ...currentUser, ...userData };
    setDemoUser(updatedUser);

    return { data: updatedUser, error: null };
  },

  // ดึงข้อมูลผู้ใช้
  getUserProfile: async () => {
    await delay();
    const user = getDemoUser();
    return { data: user, error: user ? null : { message: 'ไม่พบข้อมูลผู้ใช้' } };
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileCategory = (fileType) => {
  const categories = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
    document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    presentation: ['ppt', 'pptx', 'odp'],
    spreadsheet: ['xls', 'xlsx', 'ods', 'csv'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'json', 'xml']
  };

  for (const [category, types] of Object.entries(categories)) {
    if (types.includes(fileType?.toLowerCase())) {
      return category;
    }
  }
  
  return 'other';
};

// Export สำหรับการตรวจสอบว่าเป็นโหมด demo หรือไม่
export { isDemoMode };