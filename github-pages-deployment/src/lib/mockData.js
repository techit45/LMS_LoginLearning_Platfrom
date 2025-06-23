// ==========================================
// MOCK DATA SERVICE FOR DEMO
// ข้อมูลปลอมสำหรับแสดงการทำงานของระบบ
// ==========================================

// จำลองข้อมูลผู้ใช้
export const mockUsers = [
  {
    id: '1',
    email: 'student@demo.com',
    password: 'password123',
    full_name: 'นักเรียนตัวอย่าง',
    role: 'student',
    created_at: '2024-01-15T00:00:00Z',
    profile: {
      phone: '081-234-5678',
      address: 'กรุงเทพมหานคร',
      education_level: 'มหาวิทยาลัย'
    }
  },
  {
    id: '2',
    email: 'admin@demo.com', 
    password: 'admin123',
    full_name: 'ผู้ดูแลระบบ',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      phone: '082-345-6789',
      address: 'กรุงเทพมหานคร',
      education_level: 'ปริญญาโท'
    }
  },
  {
    id: '3',
    email: 'teacher@demo.com',
    password: 'teacher123', 
    full_name: 'อาจารย์ผู้สอน',
    role: 'instructor',
    created_at: '2024-01-10T00:00:00Z',
    profile: {
      phone: '083-456-7890',
      address: 'นนทบุรี',
      education_level: 'ปริญญาเอก'
    }
  }
];

// จำลองข้อมูลคอร์ส
export const mockCourses = [
  {
    id: 'course-1',
    title: 'พื้นฐานการเขียนโปรแกรม Python',
    description: 'เรียนรู้การเขียนโปรแกรม Python จากพื้นฐานไปสู่ขั้นสูง พร้อมตัวอย่างและแบบฝึกหัดมากมาย',
    image_url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=400&fit=crop',
    instructor_id: '3',
    instructor_name: 'อาจารย์ผู้สอน',
    category: 'Programming',
    level: 'Beginner',
    duration_hours: 40,
    price: 2500,
    is_active: true,
    enrollment_count: 127,
    rating: 4.8,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  },
  {
    id: 'course-2', 
    title: 'React.js สำหรับผู้เริ่มต้น',
    description: 'สร้างเว็บแอปพลิเคชันด้วย React.js แบบครบถ้วน จากพื้นฐานไปจนถึงการทำ Project จริง',
    image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    instructor_id: '3',
    instructor_name: 'อาจารย์ผู้สอน',
    category: 'Web Development',
    level: 'Intermediate',
    duration_hours: 60,
    price: 3500,
    is_active: true,
    enrollment_count: 89,
    rating: 4.9,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-06-21T00:00:00Z'
  },
  {
    id: 'course-3',
    title: 'Data Science with Python',
    description: 'วิเคราะห์ข้อมูลด้วย Python, Pandas, NumPy และ Machine Learning เบื้องต้น',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    instructor_id: '3',
    instructor_name: 'อาจารย์ผู้สอน',
    category: 'Data Science',
    level: 'Advanced',
    duration_hours: 80,
    price: 4500,
    is_active: true,
    enrollment_count: 56,
    rating: 4.7,
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-06-22T00:00:00Z'
  },
  {
    id: 'course-4',
    title: 'UI/UX Design Fundamentals',
    description: 'หลักการออกแบบ User Interface และ User Experience สำหรับแอปพลิเคชันและเว็บไซต์',
    image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=400&fit=crop',
    instructor_id: '3',
    instructor_name: 'อาจารย์ผู้สอน',
    category: 'Design',
    level: 'Beginner',
    duration_hours: 35,
    price: 2000,
    is_active: true,
    enrollment_count: 134,
    rating: 4.6,
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  }
];

// จำลองข้อมูลเนื้อหาในคอร์ส
export const mockCourseContent = {
  'course-1': [
    {
      id: 'content-1-1',
      course_id: 'course-1',
      title: 'แนะนำ Python และการติดตั้ง',
      description: 'รู้จักกับภาษา Python และวิธีการติดตั้งบนระบบปฏิบัติการต่างๆ',
      content_type: 'video',
      content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration_minutes: 25,
      order_index: 1,
      is_free: true,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'content-1-2',
      course_id: 'course-1',
      title: 'ตัวแปรและประเภทข้อมูล',
      description: 'เรียนรู้เกี่ยวกับตัวแปร ประเภทข้อมูล และการใช้งานพื้นฐาน',
      content_type: 'video',
      content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration_minutes: 30,
      order_index: 2,
      is_free: false,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'content-1-3',
      course_id: 'course-1',
      title: 'แบบทดสอบบทที่ 1',
      description: 'ทดสอบความเข้าใจเกี่ยวกับพื้นฐาน Python',
      content_type: 'quiz',
      duration_minutes: 15,
      order_index: 3,
      is_free: false,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'content-1-4',
      course_id: 'course-1',
      title: 'การควบคุมการทำงาน (Control Flow)',
      description: 'เรียนรู้ if-else, loops และการควบคุมการทำงานของโปรแกรม',
      content_type: 'video',
      content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration_minutes: 35,
      order_index: 4,
      is_free: false,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'content-1-5',
      course_id: 'course-1',
      title: 'งานมอบหมาย: สร้างโปรแกรมคำนวณ',
      description: 'สร้างโปรแกรมคำนวณเงินเดือนอย่างง่าย',
      content_type: 'assignment',
      duration_minutes: 60,
      order_index: 5,
      is_free: false,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'content-1-6',
      course_id: 'course-1',
      title: 'เอกสาร Python Reference',
      description: 'เอกสารอ้างอิงการใช้งาน Python พื้นฐาน',
      content_type: 'document',
      duration_minutes: 0,
      order_index: 6,
      is_free: false,
      created_at: '2024-01-15T00:00:00Z'
    }
  ],
  'course-2': [
    {
      id: 'content-2-1',
      course_id: 'course-2',
      title: 'แนะนำ React.js และ JSX',
      description: 'รู้จักกับ React.js และไวยากรณ์ JSX เบื้องต้น',
      content_type: 'video',
      content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      duration_minutes: 40,
      order_index: 1,
      is_free: true,
      created_at: '2024-02-01T00:00:00Z'
    },
    {
      id: 'content-2-2',
      course_id: 'course-2',
      title: 'Components และ Props',
      description: 'การสร้างและใช้งาน React Components กับ Props',
      content_type: 'video',
      content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      duration_minutes: 45,
      order_index: 2,
      is_free: false,
      created_at: '2024-02-01T00:00:00Z'
    },
    {
      id: 'content-2-3',
      course_id: 'course-2',
      title: 'State และ Event Handling',
      description: 'การจัดการ State และการจัดการ Events ใน React',
      content_type: 'video',
      content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      duration_minutes: 50,
      order_index: 3,
      is_free: false,
      created_at: '2024-02-01T00:00:00Z'
    }
  ]
};

// จำลองข้อมูลแบบทดสอบ
export const mockQuizzes = {
  'content-1-3': {
    id: 'quiz-1',
    content_id: 'content-1-3',
    title: 'แบบทดสอบพื้นฐาน Python',
    description: 'ทดสอบความเข้าใจเกี่ยวกับพื้นฐาน Python',
    time_limit: 30,
    passing_score: 70,
    max_attempts: 3,
    show_correct_answers: true,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Python เป็นภาษาโปรแกรมประเภทใด?',
        options: [
          'Compiled Language',
          'Interpreted Language', 
          'Assembly Language',
          'Machine Language'
        ],
        correct_answer: 'Interpreted Language',
        points: 25,
        explanation: 'Python เป็น Interpreted Language ที่ทำงานผ่าน Python Interpreter'
      },
      {
        id: 'q2', 
        type: 'multiple_choice',
        question: 'ข้อใดคือการประกาศตัวแปรใน Python ที่ถูกต้อง?',
        options: [
          'int x = 5;',
          'var x = 5',
          'x = 5',
          'let x = 5'
        ],
        correct_answer: 'x = 5',
        points: 25,
        explanation: 'Python ใช้การประกาศตัวแปรแบบ Dynamic typing โดยไม่ต้องระบุประเภท'
      },
      {
        id: 'q3',
        type: 'true_false', 
        question: 'Python เป็นภาษาที่ Case Sensitive',
        correct_answer: true,
        points: 25,
        explanation: 'Python แยกความแตกต่างของตัวพิมพ์เล็กและใหญ่'
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'คำสั่งใดใช้สำหรับแสดงผลใน Python?',
        correct_answer: 'print',
        points: 25,
        explanation: 'ใช้คำสั่ง print() สำหรับแสดงผลใน Python'
      }
    ]
  }
};

// จำลองข้อมูลงานมอบหมาย
export const mockAssignments = {
  'content-1-5': {
    id: 'assignment-1',
    content_id: 'content-1-5',
    title: 'สร้างโปรแกรมคำนวณเงินเดือน',
    description: 'สร้างโปรแกรม Python สำหรับคำนวณเงินเดือนสุทธิ โดยหักภาษีและประกันสังคม',
    instructions: `
## งานมอบหมาย: โปรแกรมคำนวณเงินเดือน

### วัตถุประสงค์
สร้างโปรแกรม Python ที่สามารถคำนวณเงินเดือนสุทธิ

### รายละเอียด
1. รับข้อมูลเงินเดือนก่อนหักภาษี
2. คำนวณภาษีเงินได้ (10% ของเงินเดือน)
3. คำนวณประกันสังคม (5% ของเงินเดือน)
4. แสดงเงินเดือนสุทธิ

### ตัวอย่าง Output
\`\`\`
กรุณาใส่เงินเดือน: 30000
เงินเดือนก่อนหัก: 30,000 บาท
ภาษีเงินได้: 3,000 บาท
ประกันสังคม: 1,500 บาท
เงินเดือนสุทธิ: 25,500 บาท
\`\`\`

### การส่งงาน
- ส่งไฟล์ .py 
- ใส่ comment อธิบายโค้ด
- ทำการทดสอบกับตัวเลขต่างๆ
    `,
    max_points: 100,
    due_date: '2024-07-01T23:59:59Z',
    allowed_file_types: ['.py', '.txt', '.pdf'],
    max_file_size: 5242880, // 5MB
    created_at: '2024-01-15T00:00:00Z'
  }
};

// จำลองข้อมูลการลงทะเบียน
export const mockEnrollments = [
  {
    id: 'enrollment-1',
    user_id: '1',
    course_id: 'course-1',
    enrolled_at: '2024-01-20T00:00:00Z',
    status: 'active',
    progress_percentage: 60,
    completed_at: null
  },
  {
    id: 'enrollment-2', 
    user_id: '1',
    course_id: 'course-2',
    enrolled_at: '2024-02-15T00:00:00Z',
    status: 'active',
    progress_percentage: 25,
    completed_at: null
  }
];

// จำลองข้อมูลความคืบหน้า
export const mockProgress = {
  'course-1': {
    user_id: '1',
    course_id: 'course-1',
    progress_percentage: 60,
    completed_count: 3,
    total_count: 6,
    content_progress: [
      {
        id: 'content-1-1',
        is_completed: true,
        score: null,
        is_passed: true,
        completed_at: '2024-01-21T10:30:00Z'
      },
      {
        id: 'content-1-2', 
        is_completed: true,
        score: null,
        is_passed: true,
        completed_at: '2024-01-22T14:15:00Z'
      },
      {
        id: 'content-1-3',
        is_completed: true,
        score: 85,
        is_passed: true,
        completed_at: '2024-01-23T09:45:00Z'
      },
      {
        id: 'content-1-4',
        is_completed: false,
        score: null,
        is_passed: null,
        completed_at: null
      },
      {
        id: 'content-1-5',
        is_completed: false,
        score: null, 
        is_passed: null,
        completed_at: null
      },
      {
        id: 'content-1-6',
        is_completed: false,
        score: null,
        is_passed: null,
        completed_at: null
      }
    ]
  },
  'course-2': {
    user_id: '1',
    course_id: 'course-2', 
    progress_percentage: 25,
    completed_count: 1,
    total_count: 3,
    content_progress: [
      {
        id: 'content-2-1',
        is_completed: true,
        score: null,
        is_passed: true,
        completed_at: '2024-02-16T11:20:00Z'
      },
      {
        id: 'content-2-2',
        is_completed: false,
        score: null,
        is_passed: null,
        completed_at: null
      },
      {
        id: 'content-2-3',
        is_completed: false,
        score: null,
        is_passed: null,
        completed_at: null
      }
    ]
  }
};

// จำลองข้อมูลไฟล์แนบ
export const mockAttachments = {
  'content-1-6': [
    {
      id: 'attachment-1',
      content_id: 'content-1-6',
      file_name: 'Python_Reference_Guide.pdf',
      file_path: 'mock/python-reference.pdf',
      file_size: 2048576,
      file_type: 'pdf',
      mime_type: 'application/pdf',
      upload_order: 1,
      is_downloadable: true,
      is_preview_available: true,
      uploaded_by: '3',
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'attachment-2',
      content_id: 'content-1-6', 
      file_name: 'Python_Examples.zip',
      file_path: 'mock/python-examples.zip',
      file_size: 5242880,
      file_type: 'zip',
      mime_type: 'application/zip',
      upload_order: 2,
      is_downloadable: true,
      is_preview_available: false,
      uploaded_by: '3',
      created_at: '2024-01-15T00:00:00Z'
    }
  ]
};

// จำลองข้อมูลการเรียน Onsite
export const mockOnsiteCourses = [
  {
    id: 'onsite-1',
    title: 'Workshop: Python for Data Science',
    description: 'เรียนการวิเคราะห์ข้อมูลด้วย Python แบบ Intensive 3 วัน',
    instructor_name: 'ดร.สมชาย วิทยาการ',
    location: 'ห้องประชุม A ชั้น 5 อาคารเทคโนโลยี',
    start_date: '2024-07-15',
    end_date: '2024-07-17', 
    start_time: '09:00',
    end_time: '16:00',
    max_participants: 25,
    current_participants: 18,
    price: 8500,
    status: 'open',
    requirements: 'พื้นฐาน Python',
    created_at: '2024-06-01T00:00:00Z'
  },
  {
    id: 'onsite-2',
    title: 'React.js Bootcamp',
    description: 'สร้างเว็บแอป React.js ใน 5 วัน แบบ Hands-on',
    instructor_name: 'อ.วิชญ์ชัย เทคโนโลยี',
    location: 'ห้องปฏิบัติการ B ชั้น 3',
    start_date: '2024-08-01',
    end_date: '2024-08-05',
    start_time: '09:00', 
    end_time: '17:00',
    max_participants: 20,
    current_participants: 12,
    price: 12000,
    status: 'open',
    requirements: 'HTML, CSS, JavaScript พื้นฐาน',
    created_at: '2024-06-10T00:00:00Z'
  }
];

// จำลองข้อมูลข่าวสาร/ประกาศ
export const mockAnnouncements = [
  {
    id: 'news-1',
    title: 'เปิดรับสมัครคอร์สใหม่: Machine Learning ขั้นสูง',
    content: 'เรามีความยินดีที่จะประกาศเปิดคอร์สใหม่ Machine Learning ขั้นสูง โดยอาจารย์ผู้เชี่ยวชาญ สำหรับผู้ที่มีพื้นฐาน Python และ Data Science แล้ว',
    type: 'announcement',
    priority: 'high',
    published_at: '2024-06-20T00:00:00Z',
    expires_at: '2024-07-20T00:00:00Z'
  },
  {
    id: 'news-2',
    title: 'ปรับปรุงระบบการเรียนออนไลน์',
    content: 'เราได้ปรับปรุงระบบการเรียนออนไลน์ให้มีความเสถียรและรองรับผู้เรียนได้มากขึ้น รวมถึงเพิ่มฟีเจอร์การดูวิดีโอแบบ HD',
    type: 'update',
    priority: 'medium', 
    published_at: '2024-06-18T00:00:00Z',
    expires_at: null
  }
];

// ฟังก์ชันช่วยสำหรับ localStorage
export const STORAGE_KEYS = {
  AUTH_USER: 'demo_auth_user',
  ENROLLMENTS: 'demo_enrollments', 
  PROGRESS: 'demo_progress',
  QUIZ_ATTEMPTS: 'demo_quiz_attempts',
  ASSIGNMENT_SUBMISSIONS: 'demo_assignment_submissions'
};

// Helper functions for demo mode
export const isDemoMode = () => {
  return !window.location.hostname.includes('localhost') || 
         process.env.VITE_DEMO_MODE === 'true' ||
         !process.env.VITE_SUPABASE_URL;
};

export const getDemoUser = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
  return stored ? JSON.parse(stored) : null;
};

export const setDemoUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
};

export const clearDemoUser = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
};