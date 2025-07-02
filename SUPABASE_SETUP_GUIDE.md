# 🚀 Supabase Setup Guide - Learning Management System
**ฉบับสมบูรณ์สำหรับ Production - ห้ามผิดพลาดเด็ดขาด**

## 📋 Overview
Setup guide นี้สร้างขึ้นจากการวิเคราะห์โค้ดจริงของระบบ Learning Management System (LMS) ซึ่งประกอบด้วย:
- 👥 ระบบจัดการผู้ใช้ (Students, Instructors, Admins)
- 📚 ระบบคอร์สเรียนและเนื้อหา
- 📝 ระบบงานและแบบทดสอบ
- 📁 ระบบจัดการไฟล์
- 📊 ระบบติดตามความก้าวหน้า
- 🏆 ระบบโปรเจคและรางวัล

---

## 🗄️ 1. Database Schema Setup

### 1.1 Core User Management Tables

**user_profiles** - ข้อมูลผู้ใช้หลัก
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    age INTEGER,
    school_name VARCHAR(255),
    grade_level VARCHAR(50),
    phone VARCHAR(20),
    interested_fields TEXT[],
    bio TEXT,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**user_settings** - การตั้งค่าผู้ใช้
```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'th',
    font_size VARCHAR(20) DEFAULT 'medium',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Course Management Tables

**courses** - คอร์สเรียน
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    category VARCHAR(100),
    level VARCHAR(50) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    price DECIMAL(10,2) DEFAULT 0,
    duration_weeks INTEGER,
    instructor_id UUID REFERENCES user_profiles(user_id),
    thumbnail_url TEXT,
    video_url TEXT,
    learning_outcomes TEXT[],
    tools_used TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    max_students INTEGER,
    view_count INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**course_content** - เนื้อหาคอร์ส
```sql
CREATE TABLE course_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'lesson' CHECK (content_type IN ('lesson', 'quiz', 'assignment', 'video', 'document', 'text')),
    content TEXT,
    content_url TEXT,
    description TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER,
    is_free_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**enrollments** - การลงทะเบียนเรียน
```sql
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    completion_certificate_url TEXT,
    UNIQUE(user_id, course_id)
);
```

### 1.3 Assessment Tables

**assignments** - งานที่มอบหมาย
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    max_file_size INTEGER DEFAULT 10485760, -- 10MB
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png'],
    grading_rubric JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**assignment_submissions** - การส่งงาน
```sql
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    submission_text TEXT,
    file_urls TEXT[],
    file_names TEXT[],
    file_sizes INTEGER[],
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES user_profiles(user_id),
    grading_rubric_scores JSONB,
    is_late BOOLEAN DEFAULT false,
    max_score INTEGER DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, user_id, attempt_number)
);
```

**quizzes** - แบบทดสอบ
```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    time_limit INTEGER DEFAULT 0, -- 0 = no limit, in minutes
    max_attempts INTEGER DEFAULT 0, -- 0 = unlimited
    passing_score INTEGER DEFAULT 70,
    randomize_questions BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**quiz_attempts** - การทำแบบทดสอบ
```sql
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    answers JSONB DEFAULT '{}',
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    is_passed BOOLEAN DEFAULT false,
    feedback JSONB,
    questions_data JSONB, -- Store questions as they were when taken
    UNIQUE(quiz_id, user_id, attempt_number)
);
```

### 1.4 Progress Tracking Tables

**user_progress** - ความก้าวหน้าการเรียน
```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(user_id, course_id, content_id)
);
```

**video_progress** - ความก้าวหน้าการดูวิดีโอ
```sql
CREATE TABLE video_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    last_position DECIMAL(10,2) DEFAULT 0, -- Last position in seconds
    watched_duration DECIMAL(10,2) DEFAULT 0, -- Total watched time
    total_duration DECIMAL(10,2) DEFAULT 0, -- Video total duration
    watch_sessions JSONB DEFAULT '[]', -- Array of watch sessions
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_id)
);
```

### 1.5 File Management Tables

**attachments** - ไฟล์แนบ
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- course, assignment, quiz, etc.
    entity_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES user_profiles(user_id),
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 1.6 Project & Achievement Tables

**projects** - โปรเจค
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    category VARCHAR(100),
    technology VARCHAR(100),
    difficulty VARCHAR(50) DEFAULT 'beginner',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'featured', 'archived')),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    thumbnail_url TEXT,
    demo_url TEXT,
    github_url TEXT,
    images TEXT[],
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**achievements** - รางวัลและความสำเร็จ
```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    badge_url TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    course_id UUID REFERENCES courses(id),
    project_id UUID REFERENCES projects(id),
    metadata JSONB DEFAULT '{}'
);
```

### 1.7 Forum Tables (Optional)

**forum_topics** - หัวข้อฟอรั่ม
```sql
CREATE TABLE forum_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    last_reply_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**forum_replies** - ตอบกลับฟอรั่ม
```sql
CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES forum_replies(id),
    is_solution BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 2. Row Level Security (RLS) Policies

### 2.1 Enable RLS on All Tables
```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
```

### 2.2 User Profiles Policies
```sql
-- Public profiles viewable by everyone
CREATE POLICY "Public profiles viewable" ON user_profiles
    FOR SELECT USING (true);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

### 2.3 Courses Policies
```sql
-- Everyone can view active courses
CREATE POLICY "Active courses viewable" ON courses
    FOR SELECT USING (is_active = true);

-- Instructors can view all their courses
CREATE POLICY "Instructors view own courses" ON courses
    FOR SELECT USING (instructor_id = auth.uid());

-- Admins can view all courses
CREATE POLICY "Admins view all courses" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Instructors and admins can create courses
CREATE POLICY "Instructors can create courses" ON courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

-- Instructors can update own courses, admins can update any
CREATE POLICY "Instructors update own courses" ON courses
    FOR UPDATE USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

### 2.4 Course Content Policies
```sql
-- Enrolled users or preview content viewable
CREATE POLICY "Course content viewable" ON course_content
    FOR SELECT USING (
        is_free_preview = true OR
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = course_content.course_id 
            AND enrollments.user_id = auth.uid()
            AND enrollments.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Instructors can manage their course content
CREATE POLICY "Instructors manage course content" ON course_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

### 2.5 Enrollments Policies
```sql
-- Users can view own enrollments
CREATE POLICY "Users view own enrollments" ON enrollments
    FOR SELECT USING (user_id = auth.uid());

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors view course enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Admins can view all enrollments
CREATE POLICY "Admins view all enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can enroll themselves
CREATE POLICY "Users can enroll" ON enrollments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update own enrollment progress
CREATE POLICY "Users update own enrollment" ON enrollments
    FOR UPDATE USING (user_id = auth.uid());
```

### 2.6 Assignments & Submissions Policies
```sql
-- Students can view assignments for enrolled courses
CREATE POLICY "Students view course assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = assignments.course_id 
            AND enrollments.user_id = auth.uid()
            AND enrollments.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = assignments.course_id 
            AND courses.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Students can manage own submissions
CREATE POLICY "Students manage own submissions" ON assignment_submissions
    FOR ALL USING (user_id = auth.uid());

-- Instructors can view submissions for their assignments
CREATE POLICY "Instructors view assignment submissions" ON assignment_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

-- Instructors can update grades for their assignments
CREATE POLICY "Instructors grade submissions" ON assignment_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );
```

### 2.7 Progress Tracking Policies
```sql
-- Users can view/update own progress
CREATE POLICY "Users manage own progress" ON user_progress
    FOR ALL USING (user_id = auth.uid());

-- Instructors can view progress for their courses
CREATE POLICY "Instructors view course progress" ON user_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = user_progress.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Similar policies for video_progress
CREATE POLICY "Users manage own video progress" ON video_progress
    FOR ALL USING (user_id = auth.uid());
```

---

## 📦 3. Storage Setup

### 3.1 Storage Buckets
ในระบบต้องมี Storage Buckets ดังนี้:

**course-files** (Public bucket)
```sql
-- Create bucket in Supabase Dashboard or via SQL
INSERT INTO storage.buckets (id, name, public) VALUES ('course-files', 'course-files', true);
```

### 3.2 Storage Policies
```sql
-- Anyone can view course files
CREATE POLICY "Anyone can view course files" ON storage.objects
    FOR SELECT USING (bucket_id = 'course-files');

-- Authenticated users can upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'course-files' 
        AND auth.role() = 'authenticated'
    );

-- Users can update/delete their own files
CREATE POLICY "Users manage own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'course-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'course-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins can manage all files
CREATE POLICY "Admins manage all files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'course-files' 
        AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

### 3.3 File Structure
```
course-files/
├── attachments/
│   ├── {contentId}/
│   └── {assignmentId}/
├── assignments/
│   └── {assignmentId}/
│       └── {userId}/
├── course-covers/
├── profile-images/
└── project-images/
```

---

## ⚡ 4. Performance Indexes

```sql
-- Core performance indexes
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX idx_enrollments_course_active ON enrollments(course_id, is_active);
CREATE INDEX idx_course_content_course_order ON course_content(course_id, order_index);
CREATE INDEX idx_course_content_type ON course_content(content_type, course_id);

-- Assignment & progress indexes
CREATE INDEX idx_assignments_course_due ON assignments(course_id, due_date);
CREATE INDEX idx_assignment_submissions_user_assignment ON assignment_submissions(user_id, assignment_id);
CREATE INDEX idx_user_progress_user_course ON user_progress(user_id, course_id);
CREATE INDEX idx_user_progress_content_completed ON user_progress(content_id, is_completed);

-- User & profile indexes
CREATE INDEX idx_user_profiles_role_active ON user_profiles(role, is_active);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active) WHERE is_active = true;

-- Attachment indexes
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_user ON attachments(uploaded_by, created_at DESC);

-- Search indexes
CREATE INDEX idx_courses_search ON courses USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_projects_search ON projects USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));

-- Composite indexes for complex queries
CREATE INDEX idx_courses_active_featured ON courses(is_active, is_featured, created_at DESC) WHERE is_active = true;
CREATE INDEX idx_enrollments_recent ON enrollments(created_at DESC, course_id) WHERE is_active = true;
CREATE INDEX idx_user_profiles_last_login ON user_profiles(last_login_at DESC) WHERE is_active = true;

-- Update statistics
ANALYZE user_profiles;
ANALYZE courses;
ANALYZE course_content;
ANALYZE enrollments;
ANALYZE assignments;
ANALYZE assignment_submissions;
ANALYZE projects;
ANALYZE attachments;
ANALYZE user_progress;
```

---

## 🔐 5. Authentication Setup

### 5.1 Supabase Auth Configuration
ใน Supabase Dashboard > Authentication > Settings:

```
Site URL: https://yourdomain.com
Redirect URLs: 
  - https://yourdomain.com
  - https://yourdomain.com/auth/callback
  - http://localhost:5173 (สำหรับ development)

JWT Settings:
  - JWT expiry: 3600 (1 hour)
  - Refresh token rotation: Enabled
  - Reuse interval: 10 seconds

Email Settings:
  - Enable email confirmations: true
  - Enable email change confirmations: true
  - Enable phone confirmations: false
```

### 5.2 OAuth Providers
```
Google OAuth:
  - Client ID: your-google-client-id
  - Client Secret: your-google-client-secret
  - Redirect URL: https://your-project.supabase.co/auth/v1/callback
```

### 5.3 Custom Claims Function
```sql
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Get user role from user_profiles
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE user_id = (event->>'user_id')::uuid;

  claims := event->'claims';
  
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
```

---

## 🌱 6. Sample Data Script

```sql
-- Create sample admin user profile (run after user signs up)
INSERT INTO user_profiles (
    user_id, 
    full_name, 
    email, 
    role, 
    is_active
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@login-learning.com' LIMIT 1),
    'ผู้ดูแลระบบ',
    'admin@login-learning.com',
    'admin',
    true
) ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Create sample courses
INSERT INTO courses (
    title,
    description,
    short_description,
    category,
    level,
    price,
    duration_weeks,
    instructor_id,
    thumbnail_url,
    is_active,
    is_featured
) VALUES
(
    'โครงงานระบบควบคุมอัตโนมัติ',
    'เรียนรู้การสร้างระบบควบคุมอัตโนมัติด้วย Arduino และ IoT เพื่อประยุกต์ใช้ในชีวิตประจำวัน พัฒนาทักษะการเขียนโปรแกรม การต่อวงจร และการแก้ไขปัญหา',
    'เรียนรู้การสร้างระบบควบคุมอัตโนมัติด้วย Arduino และ IoT',
    'วิศวกรรมไฟฟ้า',
    'beginner',
    1990.00,
    8,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1635251595512-dc52146d5ae8',
    true,
    true
),
(
    'การออกแบบโครงสร้างอาคาร',
    'หลักการออกแบบและคำนวณโครงสร้างอาคารสูง พร้อมแนวทางปฏิบัติจริงและการใช้โปรแกรมช่วยในการออกแบบ',
    'หลักการออกแบบและคำนวณโครงสร้างอาคารสูง',
    'วิศวกรรมโยธา',
    'advanced',
    2990.00,
    12,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1596496181861-5fc5346995ba',
    true,
    true
),
(
    'โครงงานพลังงานทดแทน',
    'สร้างระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์และลม เพื่อพลังงานที่ยั่งยืนและเป็นมิตรกับสิ่งแวดล้อม',
    'สร้างระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์และลม',
    'วิศวกรรมสิ่งแวดล้อม',
    'intermediate',
    2490.00,
    10,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e',
    true,
    false
),
(
    'การพัฒนาแอปพลิเคชั่น IoT',
    'สร้างแอปพลิเคชั่นควบคุมอุปกรณ์ IoT ผ่านสมาร์ทโฟน เรียนรู้การเชื่อมต่อ sensors และการส่งข้อมูล',
    'สร้างแอปพลิเคชั่นควบคุมอุปกรณ์ IoT ผ่านสมาร์ทโฟน',
    'วิศวกรรมคอมพิวเตอร์',
    'intermediate',
    1990.00,
    6,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176',
    true,
    false
),
(
    'วิศวกรรมหุ่นยนต์เบื้องต้น',
    'เรียนรู้การสร้างหุ่นยนต์อัตโนมัติและการควบคุมการเคลื่อนไหว พร้อมทำความเข้าใจหลักการทำงานของ sensors',
    'เรียนรู้การสร้างหุ่นยนต์อัตโนมัติและการควบคุมการเคลื่อนไหว',
    'วิศวกรรมเครื่องกล',
    'beginner',
    1790.00,
    6,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    true,
    false
),
(
    'การวิเคราะห์ข้อมูลด้วย Python',
    'เรียนรู้การใช้ Python ในการวิเคราะห์และสร้างกราฟข้อมูลทางวิศวกรรม เพื่อการตัดสินใจที่มีประสิทธิภาพ',
    'เรียนรู้การใช้ Python ในการวิเคราะห์และสร้างกราฟข้อมูล',
    'วิศวกรรมข้อมูล',
    'intermediate',
    2290.00,
    8,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    true,
    false
);

-- Create sample course content
INSERT INTO course_content (
    course_id,
    title,
    content_type,
    content_url,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'แนะนำคอร์ส: ' || c.title,
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'วิดีโอแนะนำคอร์ส ' || c.title || ' และภาพรวมของสิ่งที่จะได้เรียนรู้',
    15,
    1,
    true
FROM courses c
WHERE c.is_active = true;

INSERT INTO course_content (
    course_id,
    title,
    content_type,
    content_url,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'บทที่ 1: พื้นฐานและหลักการ',
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'เรียนรู้พื้นฐานและหลักการสำคัญของ ' || c.title,
    45,
    2,
    false
FROM courses c
WHERE c.is_active = true;

INSERT INTO course_content (
    course_id,
    title,
    content_type,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'แบบทดสอบความเข้าใจ',
    'quiz',
    'แบบทดสอบเพื่อทบทวนความเข้าใจในเนื้อหา ' || c.title,
    30,
    3,
    false
FROM courses c
WHERE c.is_active = true;

-- Update course enrollment counts
UPDATE courses SET enrollment_count = 0 WHERE enrollment_count IS NULL;
```

---

## 🚀 7. Environment Configuration

### 7.1 Environment Variables
```env
# .env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Admin domain for automatic admin access
VITE_ADMIN_DOMAIN=login-learning.com

# App configuration
VITE_APP_NAME=Login Learning
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Optional: File upload limits
VITE_MAX_FILE_SIZE=50000000
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif,mp4,mp3
```

### 7.2 Supabase Client Configuration
```javascript
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const ADMIN_DOMAIN = import.meta.env.VITE_ADMIN_DOMAIN || "login-learning.com";
```

---

## ✅ 8. Setup Checklist

### 8.1 Database Setup
- [ ] **Schema Creation**: รันสคริปต์สร้างตารางทั้งหมด
- [ ] **RLS Policies**: เปิดใช้งาน Row Level Security และสร้าง policies
- [ ] **Performance Indexes**: เพิ่ม indexes สำหรับการค้นหาที่เร็วขึ้น
- [ ] **Sample Data**: เพิ่มข้อมูลตัวอย่างสำหรับทดสอบ

### 8.2 Storage Setup  
- [ ] **Bucket Creation**: สร้าง `course-files` bucket
- [ ] **Storage Policies**: ตั้งค่า policies สำหรับการอัปโหลดไฟล์
- [ ] **File Upload Test**: ทดสอบการอัปโหลดและดาวน์โหลดไฟล์

### 8.3 Authentication Setup
- [ ] **Auth Configuration**: ตั้งค่า Site URL และ Redirect URLs
- [ ] **OAuth Setup**: เปิดใช้งาน Google OAuth (ถ้าต้องการ)
- [ ] **Email Templates**: ปรับแต่ง email templates เป็นภาษาไทย
- [ ] **Admin User**: สร้างผู้ใช้ admin คนแรก

### 8.4 Frontend Configuration
- [ ] **Environment Variables**: ตั้งค่า .env ไฟล์
- [ ] **Supabase Client**: อัปเดต URL และ API keys
- [ ] **Connection Test**: ทดสอบการเชื่อมต่อ database

### 8.5 Testing
- [ ] **User Registration**: ทดสอบการสมัครสมาชิกและ login
- [ ] **Course Enrollment**: ทดสอบการลงทะเบียนเรียนคอร์ส
- [ ] **Content Access**: ทดสอบการเข้าถึงเนื้อหาคอร์ส
- [ ] **File Upload**: ทดสอบการอัปโหลดไฟล์งาน
- [ ] **Progress Tracking**: ทดสอบการติดตามความก้าวหน้า
- [ ] **Admin Functions**: ทดสอบฟังก์ชัน admin
- [ ] **Assignment Submission**: ทดสอบการส่งงาน
- [ ] **Quiz System**: ทดสอบระบบแบบทดสอบ

---

## 🔧 9. Troubleshooting

### 9.1 Common Issues

**RLS Policy Errors**
```sql
-- ตรวจสอบ policies ที่มีอยู่
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- ลบ policy ที่มีปัญหา
DROP POLICY "policy_name" ON table_name;
```

**Foreign Key Constraint Errors**
```sql
-- ตรวจสอบ foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint 
WHERE contype = 'f';

-- ลบข้อมูลที่ขัดแย้งตามลำดับ
DELETE FROM child_table WHERE parent_id NOT IN (SELECT id FROM parent_table);
```

**Storage Permission Errors**
```sql
-- ตรวจสอบ storage policies
SELECT * FROM storage.policies;

-- เพิ่ม policy ใหม่หากจำเป็น
CREATE POLICY "policy_name" ON storage.objects FOR SELECT USING (true);
```

### 9.2 Performance Optimization

**Slow Queries**
```sql
-- เปิดใช้งาน query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- ตรวจสอบ slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC;
```

**Missing Indexes**
```sql
-- ตรวจสอบ table scans ที่ใช้เวลานาน
SELECT schemaname, tablename, seq_scan, seq_tup_read, 
       idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 100;
```

---

## 📚 10. Additional Resources

### 10.1 SQL Scripts
- `complete-database-schema.sql` - สคริปต์สร้าง database schema
- `rls-policies.sql` - Row Level Security policies
- `performance-indexes.sql` - Performance optimization indexes
- `sample-data.sql` - ข้อมูลตัวอย่างสำหรับทดสอบ

### 10.2 Configuration Files
- `.env.example` - ตัวอย่างไฟล์ environment variables
- `supabase-config.js` - การตั้งค่า Supabase client

### 10.3 Documentation Links
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎯 Summary

ระบบ Learning Management System นี้ได้รับการออกแบบมาเพื่อรองรับ:
- ✅ การจัดการผู้ใช้หลายบทบาท (Students, Instructors, Admins)
- ✅ ระบบคอร์สเรียนที่ครบครัน
- ✅ การส่งงานและแบบทดสอบ
- ✅ การติดตามความก้าวหน้า
- ✅ ระบบไฟล์และสื่อการเรียน
- ✅ ความปลอดภัยระดับสูงด้วย RLS
- ✅ ประสิทธิภาพที่ดีด้วย indexes

**🚀 พร้อมสำหรับ Production!**

ทำตาม checklist ทั้งหมดแล้วระบบจะพร้อมใช้งานจริง 🎉