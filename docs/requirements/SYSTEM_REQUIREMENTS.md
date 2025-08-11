# 📚 Login Learning Platform - Complete System Requirements Specification
*Version 3.0 - Comprehensive Documentation*
*Last Updated: August 2025*

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Stakeholders & Users](#stakeholders--users)
4. [Functional Requirements](#functional-requirements)
5. [Non-Functional Requirements](#non-functional-requirements)
6. [System Architecture](#system-architecture)
7. [Database Design](#database-design)
8. [Integration Requirements](#integration-requirements)
9. [Security Requirements](#security-requirements)
10. [Performance Requirements](#performance-requirements)
11. [User Interface Requirements](#user-interface-requirements)
12. [Testing Requirements](#testing-requirements)
13. [Deployment Requirements](#deployment-requirements)
14. [Maintenance & Support](#maintenance--support)

---

## 1. Executive Summary

### 1.1 Project Vision
Login Learning Platform เป็นระบบ Learning Management System (LMS) แบบ Multi-tenant ที่ออกแบบมาเพื่อรองรับการเรียนการสอนด้านวิศวกรรมศาสตร์สำหรับนักเรียนระดับมัธยมศึกษาตอนปลาย โดยมีเป้าหมายหลักในการช่วยให้นักเรียนค้นพบความถนัดและเตรียมความพร้อมสู่การศึกษาต่อในระดับอุดมศึกษา

### 1.2 Business Objectives
- **Primary Goal**: สร้างแพลตฟอร์มการเรียนรู้ที่ครอบคลุมทุกสาขาวิศวกรรมศาสตร์
- **Secondary Goals**:
  - รองรับการใช้งานแบบ Multi-company (6+ organizations)
  - ระบบจัดการตารางสอนแบบ Real-time collaboration
  - Project showcase platform สำหรับผลงานนักเรียน
  - Integrated assessment system (Quiz, Assignment, Grading)

### 1.3 Scope
- **In Scope**:
  - Course management & delivery
  - Teaching schedule management
  - Student progress tracking
  - Project portfolio system
  - Real-time collaboration features
  - Google Workspace integration
  - Multi-tenant architecture
  
- **Out of Scope**:
  - Mobile native applications (Phase 2)
  - Video conferencing (use external tools)
  - Payment processing (Phase 2)

---

## 2. System Overview

### 2.1 System Context
```
┌─────────────────────────────────────────────────────────────┐
│                   Login Learning Platform                     │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Web    │  │Teaching  │  │ Project  │  │  Admin   │   │
│  │  Portal  │  │ Schedule │  │ Showcase │  │  Panel   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Core Services Layer                      │   │
│  │  • Authentication  • Course Engine  • Assessment     │   │
│  │  • Progress Track  • Notification   • Analytics      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Persistence Layer                   │   │
│  │         Supabase (PostgreSQL + Realtime)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              External Integrations                    │   │
│  │   Google Drive  │  Google Sheets  │  Email Service   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 Key Components

#### 2.2.1 Frontend Application
- **Technology**: React 18 + Vite
- **UI Framework**: Tailwind CSS + Radix UI
- **State Management**: React Context API
- **Real-time**: Supabase Realtime subscriptions
- **Routing**: React Router (Hash-based for compatibility)

#### 2.2.2 Backend Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Google Drive + Supabase Storage
- **Real-time**: WebSocket via Supabase
- **API Server**: Express.js (Google Drive integration)

#### 2.2.3 Infrastructure
- **Hosting**: Vercel (Frontend) + Custom VPS (API Server)
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in analytics + Custom dashboards
- **Backup**: Automated daily backups

---

## 3. Stakeholders & Users

### 3.1 User Roles

#### 3.1.1 Super Admin
- **Permissions**: Full system access
- **Responsibilities**:
  - System configuration
  - Company management
  - User management across companies
  - Global analytics access
  - Database maintenance

#### 3.1.2 Company Admin
- **Permissions**: Company-scoped administration
- **Responsibilities**:
  - Course management
  - Instructor assignment
  - Student enrollment
  - Company-specific settings
  - Teaching schedule management

#### 3.1.3 Instructor
- **Permissions**: Teaching and content management
- **Responsibilities**:
  - Course content creation
  - Assignment creation and grading
  - Student progress monitoring
  - Teaching schedule management (own classes)
  - Forum moderation

#### 3.1.4 Student
- **Permissions**: Learning and participation
- **Responsibilities**:
  - Course enrollment and learning
  - Assignment submission
  - Quiz participation
  - Project submission
  - Forum participation

### 3.2 Multi-Tenant Companies

```javascript
Companies = {
  login: {
    name: "Login Learning",
    domain: "login-learning.com",
    color: "indigo",
    features: ["all"],
    isDefault: true
  },
  meta: {
    name: "Meta Tech Academy",
    domain: "meta-tech.ac.th",
    color: "blue",
    features: ["cyber", "data", "webapp", "ai"]
  },
  med: {
    name: "Med Solutions",
    domain: "med-solutions.com",
    color: "green",
    features: ["biomedical", "health-tech"]
  },
  edtech: {
    name: "EdTech Innovation",
    domain: "edtech-innovation.com",
    color: "purple",
    features: ["education", "e-learning"]
  },
  innotech: {
    name: "InnoTech Labs",
    domain: "innotech-labs.com",
    color: "orange",
    features: ["innovation", "research"]
  },
  w2d: {
    name: "W2D Studio",
    domain: "w2d-studio.com",
    color: "red",
    features: ["design", "creative"]
  }
}
```

---

## 4. Functional Requirements

### 4.1 Course Management System

#### 4.1.1 Course Creation & Management
- **FR-CM-001**: System shall allow admins to create courses with:
  - Title, description, thumbnail
  - Duration (weeks/hours)
  - Prerequisites
  - Learning objectives
  - Instructor assignment
  - Company association
  - Pricing (if applicable)
  - Max enrollment limit

#### 4.1.2 Course Content Management
- **FR-CM-002**: Support multiple content types:
  - Video lessons (YouTube, Vimeo, Direct upload)
  - Documents (PDF, DOCX, PPTX)
  - Interactive content (H5P, embedded)
  - External links
  - Downloadable resources

- **FR-CM-003**: Content organization:
  - Modules/Chapters
  - Lessons within modules
  - Sequential or flexible navigation
  - Prerequisites between modules
  - Estimated time per lesson

#### 4.1.3 Course Delivery
- **FR-CM-004**: Progressive content unlock:
  - Time-based release
  - Completion-based progression
  - Manual unlock by instructor
  
- **FR-CM-005**: Multi-format support:
  - Self-paced learning
  - Instructor-led sessions
  - Blended learning
  - Cohort-based courses

### 4.2 Teaching Schedule Management

#### 4.2.1 Schedule Structure
- **FR-TS-001**: Weekly schedule grid:
  - 7 days (Monday-Sunday)
  - 7 time slots (08:00-21:15)
  - Duration support (1-6 hours per session)
  - Room assignment
  - Color coding by company/course

#### 4.2.2 Real-time Collaboration
- **FR-TS-002**: Multi-user editing:
  - WebSocket-based synchronization
  - Optimistic UI updates
  - Conflict resolution (version-based)
  - User presence indicators
  - Change notifications

#### 4.2.3 Drag & Drop Interface
- **FR-TS-003**: Interactive scheduling:
  - Drag instructors to time slots
  - Drag courses to schedule
  - Move existing schedules
  - Resize for duration adjustment
  - Visual feedback during operations

#### 4.2.4 Conflict Detection
- **FR-TS-004**: Automatic validation:
  - Instructor double-booking prevention
  - Room conflict detection
  - Time overlap checking
  - Duration boundary validation
  - Cross-company conflict alerts

#### 4.2.5 Data Persistence
- **FR-TS-005**: Schedule storage:
  ```sql
  teaching_schedules:
    - id (UUID)
    - week_start_date (DATE)
    - day_of_week (0-6)
    - time_slot_index (0-6)
    - duration (1-6)
    - course_id → teaching_courses
    - instructor_id → user_profiles
    - room (TEXT)
    - color (TEXT)
    - notes (TEXT)
    - company (TEXT)
    - version (INTEGER)
    - created_by, updated_by
    - created_at, updated_at
  ```

### 4.3 Assessment System

#### 4.3.1 Quiz Management
- **FR-AS-001**: Quiz creation:
  - Multiple question types (MCQ, True/False, Essay, Fill-in)
  - Question bank system
  - Random question selection
  - Time limits
  - Attempt restrictions
  - Instant or manual grading

#### 4.3.2 Assignment System
- **FR-AS-002**: Assignment workflow:
  - Create with instructions and rubrics
  - File submission support
  - Due date management
  - Late submission handling
  - Peer review option
  - Grading with feedback

#### 4.3.3 Grading System
- **FR-AS-003**: Comprehensive grading:
  - Point-based or percentage
  - Rubric-based evaluation
  - Grade categories and weights
  - Automatic grade calculation
  - Grade export functionality

### 4.4 Project Showcase System

#### 4.4.1 Project Submission
- **FR-PS-001**: Project management:
  - Title, description, technologies used
  - Multiple file attachments
  - Image gallery
  - Video demonstrations
  - GitHub repository links
  - Live demo URLs

#### 4.4.2 Google Drive Integration
- **FR-PS-002**: Automatic folder structure:
  ```
  Shared Drive/
  └── [COMPANY]/
      ├── คอร์สเรียน/
      │   └── [Course Name]/
      │       └── Files...
      └── โปรเจค/
          └── [Project Name]/
              └── Files...
  ```

#### 4.4.3 Social Features
- **FR-PS-003**: Engagement system:
  - Like/Unlike projects
  - Comment system
  - View counter
  - Share functionality
  - Featured projects
  - Project categories/tags

### 4.5 Progress Tracking System

#### 4.5.1 Learning Analytics
- **FR-PT-001**: Student progress:
  - Course completion percentage
  - Video watch progress
  - Assignment submission status
  - Quiz scores
  - Time spent per module
  - Learning streak tracking

#### 4.5.2 Instructor Analytics
- **FR-PT-002**: Teaching insights:
  - Class engagement metrics
  - Assignment completion rates
  - Average scores by topic
  - Student performance trends
  - Content effectiveness analysis

#### 4.5.3 Admin Dashboard
- **FR-PT-003**: System-wide analytics:
  - Active users count
  - Course enrollment trends
  - Platform usage statistics
  - Revenue metrics (if applicable)
  - System health monitoring

### 4.6 Communication System

#### 4.6.1 Forum System
- **FR-CO-001**: Discussion forums:
  - Course-specific forums
  - Topic creation
  - Threaded replies
  - Rich text formatting
  - File attachments
  - Moderation tools

#### 4.6.2 Notification System
- **FR-CO-002**: Multi-channel notifications:
  - In-app notifications
  - Email notifications
  - Real-time alerts
  - Notification preferences
  - Batch/digest options

#### 4.6.3 Announcement System
- **FR-CO-003**: Broadcasting:
  - System-wide announcements
  - Course announcements
  - Company-specific notices
  - Scheduled announcements
  - Priority levels

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

#### 5.1.1 Response Time
- **NFR-PR-001**: Page load time < 3 seconds
- **NFR-PR-002**: API response time < 200ms (95th percentile)
- **NFR-PR-003**: Real-time sync latency < 500ms
- **NFR-PR-004**: File upload speed > 1MB/s

#### 5.1.2 Scalability
- **NFR-PR-005**: Support 10,000+ concurrent users
- **NFR-PR-006**: Handle 1M+ database records
- **NFR-PR-007**: Process 100+ real-time updates/second
- **NFR-PR-008**: Store 10TB+ of educational content

#### 5.1.3 Availability
- **NFR-PR-009**: 99.9% uptime SLA
- **NFR-PR-010**: Maximum planned downtime: 4 hours/month
- **NFR-PR-011**: Recovery Time Objective (RTO): 1 hour
- **NFR-PR-012**: Recovery Point Objective (RPO): 1 hour

### 5.2 Security Requirements

#### 5.2.1 Authentication & Authorization
- **NFR-SE-001**: Multi-factor authentication support
- **NFR-SE-002**: OAuth 2.0 integration
- **NFR-SE-003**: JWT-based session management
- **NFR-SE-004**: Role-based access control (RBAC)
- **NFR-SE-005**: Row-level security (RLS) in database

#### 5.2.2 Data Protection
- **NFR-SE-006**: TLS 1.3 for all communications
- **NFR-SE-007**: Encryption at rest for sensitive data
- **NFR-SE-008**: PII data anonymization
- **NFR-SE-009**: GDPR compliance
- **NFR-SE-010**: Regular security audits

#### 5.2.3 Security Policies
```sql
-- Example RLS Policy for teaching_schedules
CREATE POLICY "instructors_can_edit_own_schedules"
ON teaching_schedules
FOR UPDATE
USING (
    auth.uid() = instructor_id 
    OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);
```

### 5.3 Usability Requirements

#### 5.3.1 User Interface
- **NFR-US-001**: Responsive design (320px - 4K)
- **NFR-US-002**: WCAG 2.1 AA compliance
- **NFR-US-003**: Multi-language support (Thai, English)
- **NFR-US-004**: Dark mode support
- **NFR-US-005**: Keyboard navigation

#### 5.3.2 User Experience
- **NFR-US-006**: Intuitive navigation (3-click rule)
- **NFR-US-007**: Consistent UI patterns
- **NFR-US-008**: Contextual help system
- **NFR-US-009**: Progressive disclosure
- **NFR-US-010**: Undo/Redo functionality

### 5.4 Compatibility Requirements

#### 5.4.1 Browser Support
- **NFR-CO-001**: Chrome 90+ (Primary)
- **NFR-CO-002**: Firefox 88+
- **NFR-CO-003**: Safari 14+
- **NFR-CO-004**: Edge 90+
- **NFR-CO-005**: Mobile browsers (iOS Safari, Chrome Mobile)

#### 5.4.2 Device Support
- **NFR-CO-006**: Desktop (Windows, macOS, Linux)
- **NFR-CO-007**: Tablet (iPad, Android tablets)
- **NFR-CO-008**: Mobile (Responsive web, not native)

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                           │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React SPA  │  │   Admin UI   │  │  Mobile Web  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        API Gateway                            │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │  Express.js  │  │   Webhooks   │      │
│  │     API      │  │   API Server │  │   Handler    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                      │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Service Modules                              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ • Auth Service      • Course Service                  │   │
│  │ • Schedule Service  • Assessment Service              │   │
│  │ • Progress Service  • Notification Service            │   │
│  │ • Project Service   • Analytics Service               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      Data Access Layer                        │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Storage    │  │   Cache      │      │
│  │  (Supabase)  │  │  (S3/GDrive) │  │   (Redis)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 Component Architecture

#### 6.2.1 Frontend Components Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   ├── course/          # Course-specific components
│   ├── schedule/        # Schedule management
│   ├── assessment/      # Quiz/Assignment components
│   └── project/         # Project showcase
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── contexts/           # React Context providers
├── lib/                # Utility functions
└── services/           # API service layer
```

#### 6.2.2 Service Layer Architecture
```javascript
// Example Service Structure
class CourseService {
  async getCourses(filters) { }
  async getCourseById(id) { }
  async createCourse(data) { }
  async updateCourse(id, data) { }
  async deleteCourse(id) { }
  async enrollStudent(courseId, studentId) { }
  async getProgress(courseId, studentId) { }
}

class RealtimeScheduleService {
  subscribeToWeek(weekDate, callbacks) { }
  unsubscribeFromWeek(weekDate) { }
  upsertSchedule(scheduleData) { }
  deleteSchedule(scheduleId) { }
  checkConflicts(scheduleData) { }
}
```

### 6.3 Data Flow Patterns

#### 6.3.1 Real-time Data Flow
```
User Action → Component State → Optimistic Update
     ↓                              ↓
Service Call → Supabase API → Database
     ↓                              ↓
WebSocket ← Real-time Event ← Trigger
     ↓
Update UI ← Component State ← Hook
```

#### 6.3.2 File Upload Flow
```
File Selection → Validation → Compression (if image)
        ↓                            ↓
Google Drive API ← Upload → Express Server
        ↓                            ↓
Folder Creation → File Storage → URL Generation
        ↓                            ↓
Database Update ← Save Reference → Return to UI
```

---

## 7. Database Design

### 7.1 Complete Database Schema

```sql
-- ========================================
-- Core User Management
-- ========================================

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('student', 'instructor', 'admin', 'super_admin')),
    avatar_url TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    bio TEXT,
    company TEXT DEFAULT 'login',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Course Management
-- ========================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES user_profiles(user_id),
    category TEXT,
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_hours INTEGER,
    price DECIMAL(10,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    company TEXT DEFAULT 'login',
    max_students INTEGER,
    prerequisites JSONB,
    learning_objectives JSONB,
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID,
    title TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('video', 'document', 'quiz', 'assignment', 'text', 'link')),
    content_data JSONB,
    video_url TEXT,
    document_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- ========================================
-- Teaching Schedule System
-- ========================================

CREATE TABLE teaching_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    company TEXT NOT NULL,
    location TEXT,
    company_color TEXT DEFAULT '#3B82F6',
    duration_hours INTEGER DEFAULT 1 CHECK (duration_hours >= 1 AND duration_hours <= 6),
    max_students INTEGER DEFAULT 30,
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teaching_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Temporal positioning
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time_slot_index INTEGER NOT NULL CHECK (time_slot_index >= 0 AND time_slot_index <= 6),
    duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 6),
    
    -- Relations
    course_id UUID REFERENCES teaching_courses(id) ON DELETE SET NULL,
    course_title TEXT NOT NULL, -- Denormalized for performance
    course_code TEXT,
    instructor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    instructor_name TEXT NOT NULL, -- Denormalized for performance
    
    -- Details
    room TEXT DEFAULT 'TBD',
    notes TEXT,
    color TEXT DEFAULT 'bg-blue-500',
    
    -- Multi-tenancy
    company TEXT DEFAULT 'login',
    
    -- Audit & Versioning
    created_by UUID REFERENCES user_profiles(user_id),
    updated_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT unique_schedule_slot UNIQUE (week_start_date, day_of_week, time_slot_index, company, room),
    CONSTRAINT no_instructor_conflict UNIQUE (week_start_date, day_of_week, time_slot_index, instructor_id)
);

-- Indexes for performance
CREATE INDEX idx_teaching_schedules_week ON teaching_schedules(week_start_date);
CREATE INDEX idx_teaching_schedules_instructor ON teaching_schedules(instructor_id);
CREATE INDEX idx_teaching_schedules_course ON teaching_schedules(course_id);
CREATE INDEX idx_teaching_schedules_company ON teaching_schedules(company);
CREATE INDEX idx_teaching_schedules_lookup ON teaching_schedules(week_start_date, day_of_week, time_slot_index);

-- ========================================
-- Enrollment & Progress
-- ========================================

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'suspended')),
    certificate_issued BOOLEAN DEFAULT false,
    UNIQUE(course_id, student_id)
);

CREATE TABLE course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    last_position INTEGER, -- For video resume
    notes TEXT,
    UNIQUE(enrollment_id, content_id)
);

CREATE TABLE video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    current_time DECIMAL(10,2) DEFAULT 0,
    duration DECIMAL(10,2),
    watched_segments JSONB DEFAULT '[]', -- Array of {start, end} timestamps
    total_watch_time INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, content_id)
);

-- ========================================
-- Assessment System
-- ========================================

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- Array of question objects
    time_limit_minutes INTEGER,
    passing_score DECIMAL(5,2) DEFAULT 60,
    max_attempts INTEGER DEFAULT 3,
    shuffle_questions BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    answers JSONB, -- Student's answers
    score DECIMAL(5,2),
    passed BOOLEAN,
    time_taken_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,
    UNIQUE(quiz_id, student_id, attempt_number)
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMPTZ,
    max_score DECIMAL(10,2) DEFAULT 100,
    rubric JSONB,
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percent DECIMAL(5,2) DEFAULT 10,
    submission_type TEXT CHECK (submission_type IN ('file', 'text', 'url', 'mixed')),
    max_file_size_mb INTEGER DEFAULT 10,
    allowed_file_types TEXT[],
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    submission_text TEXT,
    submission_files JSONB, -- Array of file URLs
    submission_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    score DECIMAL(10,2),
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES user_profiles(user_id),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    UNIQUE(assignment_id, student_id)
);

-- ========================================
-- Project Showcase System
-- ========================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    thumbnail_url TEXT,
    images JSONB DEFAULT '[]', -- Array of image URLs
    video_url TEXT,
    demo_url TEXT,
    github_url TEXT,
    technologies TEXT[],
    category TEXT,
    company TEXT DEFAULT 'login',
    google_drive_folder_id TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE TABLE project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    parent_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Forum System
-- ========================================

CREATE TABLE forum_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reply_id, user_id)
);

-- ========================================
-- File Management
-- ========================================

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'course', 'assignment', 'project', 'forum'
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    file_url TEXT NOT NULL,
    google_drive_id TEXT,
    uploaded_by UUID REFERENCES user_profiles(user_id),
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Notification System
-- ========================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'course', 'assignment', 'grade', 'forum', 'system'
    title TEXT NOT NULL,
    message TEXT,
    data JSONB, -- Additional context data
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Analytics & Tracking
-- ========================================

CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_spent_minutes INTEGER DEFAULT 0,
    videos_watched INTEGER DEFAULT 0,
    assignments_completed INTEGER DEFAULT 0,
    quizzes_taken INTEGER DEFAULT 0,
    forum_posts INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 1,
    UNIQUE(user_id, course_id, date)
);

-- ========================================
-- System Configuration
-- ========================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company TEXT DEFAULT 'login',
    setting_key TEXT NOT NULL,
    setting_value JSONB,
    setting_type TEXT CHECK (setting_type IN ('system', 'company', 'feature')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company, setting_key)
);

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    enabled_for_companies TEXT[],
    enabled_for_users UUID[],
    rollout_percentage DECIMAL(5,2) DEFAULT 0,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Database Functions & Triggers

```sql
-- ========================================
-- Automatic updated_at trigger
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
-- ... (apply to all tables)

-- ========================================
-- Teaching schedule conflict checker
-- ========================================

CREATE OR REPLACE FUNCTION check_schedule_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    -- Check instructor conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM teaching_schedules ts
    WHERE ts.week_start_date = NEW.week_start_date
      AND ts.instructor_id = NEW.instructor_id
      AND ts.day_of_week = NEW.day_of_week
      AND ts.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND (
        -- Check time overlap considering duration
        (ts.time_slot_index <= NEW.time_slot_index 
         AND ts.time_slot_index + ts.duration > NEW.time_slot_index)
        OR 
        (NEW.time_slot_index <= ts.time_slot_index 
         AND NEW.time_slot_index + NEW.duration > ts.time_slot_index)
      );
      
    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Instructor schedule conflict detected';
    END IF;
    
    -- Check room conflicts (if room is specified)
    IF NEW.room IS NOT NULL AND NEW.room != 'TBD' THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM teaching_schedules ts
        WHERE ts.week_start_date = NEW.week_start_date
          AND ts.room = NEW.room
          AND ts.day_of_week = NEW.day_of_week
          AND ts.company = NEW.company
          AND ts.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
          AND (
            (ts.time_slot_index <= NEW.time_slot_index 
             AND ts.time_slot_index + ts.duration > NEW.time_slot_index)
            OR 
            (NEW.time_slot_index <= ts.time_slot_index 
             AND NEW.time_slot_index + NEW.duration > ts.time_slot_index)
          );
          
        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Room schedule conflict detected';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_schedule_conflicts_trigger
    BEFORE INSERT OR UPDATE ON teaching_schedules
    FOR EACH ROW EXECUTE FUNCTION check_schedule_conflicts();

-- ========================================
-- Progress calculation function
-- ========================================

CREATE OR REPLACE FUNCTION calculate_course_progress(p_enrollment_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_total_content INTEGER;
    v_completed_content INTEGER;
    v_progress DECIMAL;
BEGIN
    -- Get total content count
    SELECT COUNT(*) INTO v_total_content
    FROM course_content cc
    JOIN enrollments e ON e.course_id = cc.course_id
    WHERE e.id = p_enrollment_id
      AND cc.is_mandatory = true;
    
    -- Get completed content count
    SELECT COUNT(*) INTO v_completed_content
    FROM course_progress cp
    WHERE cp.enrollment_id = p_enrollment_id
      AND cp.completed_at IS NOT NULL;
    
    -- Calculate percentage
    IF v_total_content > 0 THEN
        v_progress := (v_completed_content::DECIMAL / v_total_content) * 100;
    ELSE
        v_progress := 0;
    END IF;
    
    -- Update enrollment progress
    UPDATE enrollments 
    SET progress_percentage = v_progress,
        last_accessed_at = NOW()
    WHERE id = p_enrollment_id;
    
    RETURN v_progress;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Analytics aggregation function
-- ========================================

CREATE OR REPLACE FUNCTION update_learning_analytics(
    p_user_id UUID,
    p_course_id UUID,
    p_action TEXT,
    p_value INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
    INSERT INTO learning_analytics (
        user_id, 
        course_id, 
        date,
        time_spent_minutes,
        videos_watched,
        assignments_completed,
        quizzes_taken,
        forum_posts
    ) VALUES (
        p_user_id,
        p_course_id,
        CURRENT_DATE,
        CASE WHEN p_action = 'time_spent' THEN p_value ELSE 0 END,
        CASE WHEN p_action = 'video_watched' THEN p_value ELSE 0 END,
        CASE WHEN p_action = 'assignment_completed' THEN p_value ELSE 0 END,
        CASE WHEN p_action = 'quiz_taken' THEN p_value ELSE 0 END,
        CASE WHEN p_action = 'forum_post' THEN p_value ELSE 0 END
    )
    ON CONFLICT (user_id, course_id, date) 
    DO UPDATE SET
        time_spent_minutes = learning_analytics.time_spent_minutes + 
            CASE WHEN p_action = 'time_spent' THEN p_value ELSE 0 END,
        videos_watched = learning_analytics.videos_watched + 
            CASE WHEN p_action = 'video_watched' THEN p_value ELSE 0 END,
        assignments_completed = learning_analytics.assignments_completed + 
            CASE WHEN p_action = 'assignment_completed' THEN p_value ELSE 0 END,
        quizzes_taken = learning_analytics.quizzes_taken + 
            CASE WHEN p_action = 'quiz_taken' THEN p_value ELSE 0 END,
        forum_posts = learning_analytics.forum_posts + 
            CASE WHEN p_action = 'forum_post' THEN p_value ELSE 0 END;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Row Level Security (RLS) Policies

```sql
-- ========================================
-- Enable RLS on all tables
-- ========================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_schedules ENABLE ROW LEVEL SECURITY;
-- ... (enable for all tables)

-- ========================================
-- User Profiles Policies
-- ========================================

-- Users can view their own profile
CREATE POLICY "users_view_own_profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors and admins can view all profiles in their company
CREATE POLICY "instructors_admins_view_profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('instructor', 'admin', 'super_admin')
            AND up.company = user_profiles.company
        )
    );

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- Courses Policies
-- ========================================

-- Published courses are viewable by all authenticated users
CREATE POLICY "view_published_courses" ON courses
    FOR SELECT USING (
        is_published = true 
        OR instructor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Instructors can manage their own courses
CREATE POLICY "instructors_manage_own_courses" ON courses
    FOR ALL USING (
        instructor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- ========================================
-- Teaching Schedules Policies
-- ========================================

-- All authenticated users can view schedules
CREATE POLICY "authenticated_view_schedules" ON teaching_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Instructors can manage their own schedules
CREATE POLICY "instructors_manage_own_schedules" ON teaching_schedules
    FOR UPDATE USING (
        instructor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
            AND company = teaching_schedules.company
        )
    );

-- Only admins can insert/delete schedules
CREATE POLICY "admins_crud_schedules" ON teaching_schedules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
            AND company = teaching_schedules.company
        )
    );

CREATE POLICY "admins_delete_schedules" ON teaching_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
            AND company = teaching_schedules.company
        )
    );

-- ========================================
-- Enrollments Policies
-- ========================================

-- Students can view their own enrollments
CREATE POLICY "students_view_own_enrollments" ON enrollments
    FOR SELECT USING (student_id = auth.uid());

-- Instructors can view enrollments for their courses
CREATE POLICY "instructors_view_course_enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = enrollments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- ========================================
-- Projects Policies
-- ========================================

-- Public projects are viewable by all
CREATE POLICY "view_public_projects" ON projects
    FOR SELECT USING (
        is_public = true
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('instructor', 'admin', 'super_admin')
        )
    );

-- Students can manage their own projects
CREATE POLICY "students_manage_own_projects" ON projects
    FOR ALL USING (student_id = auth.uid());
```

---

## 8. Integration Requirements

### 8.1 Google Drive Integration

#### 8.1.1 Architecture
```javascript
// Google Drive Service Configuration
const driveConfig = {
  serviceAccount: {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  },
  sharedDrive: {
    id: process.env.GOOGLE_SHARED_DRIVE_ID,
    rootFolders: {
      courses: 'คอร์สเรียน',
      projects: 'โปรเจค'
    }
  },
  permissions: {
    default: 'reader',
    instructor: 'writer',
    admin: 'organizer'
  }
};
```

#### 8.1.2 Folder Structure
```
Shared Drive/
├── [LOGIN]/                    # Root company folder
│   ├── คอร์สเรียน/             # Courses folder
│   │   ├── [Course Name]/
│   │   │   ├── Materials/
│   │   │   ├── Assignments/
│   │   │   └── Submissions/
│   └── โปรเจค/                 # Projects folder
│       ├── [Project Name]/
│       │   ├── Source Code/
│       │   ├── Documentation/
│       │   └── Assets/
├── [META]/                     # Meta company folder
├── [MED]/                      # Med company folder
└── ...                         # Other companies
```

#### 8.1.3 API Endpoints
```javascript
// Express.js Google Drive API
app.post('/api/drive/create-folder', async (req, res) => {
  const { folderName, parentId, company } = req.body;
  // Create folder with proper permissions
});

app.post('/api/drive/upload-file', async (req, res) => {
  const { file, folderId, metadata } = req.body;
  // Upload with resumable upload for large files
});

app.delete('/api/drive/delete-file/:fileId', async (req, res) => {
  // Soft delete or move to trash
});

app.get('/api/drive/list-files/:folderId', async (req, res) => {
  // List with pagination
});
```

### 8.2 Google Sheets Integration

#### 8.2.1 Schedule Export Format
```javascript
// Teaching Schedule Sheet Structure
const sheetStructure = {
  headers: ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  timeSlots: [
    '08:00-09:30',
    '09:45-11:15',
    '11:30-13:00',
    '14:00-15:30',
    '15:45-17:15',
    '18:00-19:30',
    '19:45-21:15'
  ],
  cellFormat: {
    course: '{courseName}',
    instructor: '{instructorName}',
    room: 'Room: {room}',
    duration: '{duration}h'
  }
};
```

### 8.3 Email Integration

#### 8.3.1 Email Templates
```javascript
const emailTemplates = {
  welcome: {
    subject: 'Welcome to Login Learning Platform',
    template: 'welcome.html',
    variables: ['userName', 'loginUrl']
  },
  courseEnrollment: {
    subject: 'You have been enrolled in {courseName}',
    template: 'enrollment.html',
    variables: ['courseName', 'instructorName', 'startDate']
  },
  assignmentDue: {
    subject: 'Assignment Due: {assignmentName}',
    template: 'assignment-reminder.html',
    variables: ['assignmentName', 'dueDate', 'courseName']
  }
};
```

### 8.4 External API Integrations

#### 8.4.1 Video Platforms
- YouTube API for video metadata
- Vimeo API for private videos
- Custom video hosting with HLS streaming

#### 8.4.2 Payment Gateways (Future)
- Stripe for international payments
- PromptPay for Thai payments
- Invoice generation system

#### 8.4.3 Analytics Services
- Google Analytics 4
- Custom event tracking
- Learning analytics dashboard

---

## 9. Security Requirements

### 9.1 Authentication & Authorization

#### 9.1.1 Authentication Flow
```
User Login → Supabase Auth → JWT Generation
     ↓                            ↓
Session Storage ← Token ← Validation
     ↓
Protected Routes ← Authorization Check
     ↓
API Calls with Bearer Token
```

#### 9.1.2 Authorization Matrix

| Resource | Student | Instructor | Admin | Super Admin |
|----------|---------|-----------|-------|-------------|
| View Courses | ✓ (published) | ✓ | ✓ | ✓ |
| Create Course | ✗ | ✓ (own) | ✓ | ✓ |
| Edit Course | ✗ | ✓ (own) | ✓ | ✓ |
| View Schedule | ✓ | ✓ | ✓ | ✓ |
| Edit Schedule | ✗ | ✓ (own) | ✓ | ✓ |
| Submit Assignment | ✓ | ✗ | ✗ | ✗ |
| Grade Assignment | ✗ | ✓ | ✓ | ✓ |
| View Analytics | ✗ (own) | ✓ (course) | ✓ | ✓ |
| System Settings | ✗ | ✗ | ✓ (company) | ✓ |

### 9.2 Data Security

#### 9.2.1 Encryption
- **In Transit**: TLS 1.3 for all API calls
- **At Rest**: AES-256 for sensitive data
- **Password**: bcrypt with salt rounds = 10
- **Tokens**: JWT with RS256 algorithm

#### 9.2.2 Data Privacy
- GDPR compliance for EU users
- PDPA compliance for Thai users
- Data retention policies
- Right to deletion implementation

### 9.3 Security Best Practices

#### 9.3.1 Input Validation
```javascript
// Example validation schema
const courseSchema = {
  title: z.string().min(3).max(200),
  description: z.string().max(5000),
  instructor_id: z.string().uuid(),
  price: z.number().min(0).max(999999),
  company: z.enum(['login', 'meta', 'med', 'edtech', 'innotech', 'w2d'])
};
```

#### 9.3.2 SQL Injection Prevention
- Parameterized queries only
- Stored procedures for complex operations
- Input sanitization
- Least privilege database users

#### 9.3.3 XSS Prevention
- Content Security Policy headers
- HTML sanitization for user content
- React's automatic escaping
- Validated markdown rendering

---

## 10. Performance Requirements

### 10.1 Performance Metrics

#### 10.1.1 Response Times
| Operation | Target | Maximum |
|-----------|--------|---------|
| Page Load | < 2s | 3s |
| API Call | < 200ms | 500ms |
| Database Query | < 50ms | 200ms |
| File Upload (10MB) | < 10s | 30s |
| Real-time Sync | < 300ms | 1s |

#### 10.1.2 Throughput
- Concurrent Users: 10,000+
- Requests/Second: 1,000+
- Database Connections: 100 pooled
- WebSocket Connections: 5,000+

### 10.2 Optimization Strategies

#### 10.2.1 Frontend Optimization
- Code splitting and lazy loading
- Image optimization and WebP format
- CDN for static assets
- Service Worker caching
- Virtual scrolling for long lists

#### 10.2.2 Backend Optimization
- Database query optimization
- Indexed columns for frequent queries
- Caching with Redis
- Connection pooling
- Batch operations

#### 10.2.3 Real-time Optimization
- Debounced updates
- Optimistic UI updates
- Delta synchronization
- Binary protocols for large data

---

## 11. Testing Requirements

### 11.1 Testing Strategy

#### 11.1.1 Unit Testing
- Component testing with React Testing Library
- Service layer testing with Jest
- Database function testing
- Utility function testing
- Coverage target: 80%

#### 11.1.2 Integration Testing
- API endpoint testing
- Database integration tests
- External service mocking
- Authentication flow testing

#### 11.1.3 E2E Testing
- Critical user journeys
- Cross-browser testing
- Mobile responsive testing
- Performance testing

### 11.2 Test Scenarios

#### 11.2.1 Teaching Schedule Tests
```javascript
describe('Teaching Schedule Management', () => {
  test('Instructor can drag course to time slot', async () => {
    // Test drag & drop functionality
  });
  
  test('Conflict detection prevents double booking', async () => {
    // Test conflict validation
  });
  
  test('Real-time sync updates all connected clients', async () => {
    // Test WebSocket synchronization
  });
  
  test('Schedule persists after page refresh', async () => {
    // Test data persistence
  });
});
```

---

## 12. Deployment Requirements

### 12.1 Infrastructure

#### 12.1.1 Production Environment
```yaml
Frontend:
  platform: Vercel
  regions: [us-west-1, ap-southeast-1]
  cdn: Vercel Edge Network
  ssl: Auto-provisioned

Database:
  provider: Supabase
  region: ap-southeast-1 (Singapore)
  plan: Pro (8GB RAM, 4 CPUs)
  backup: Daily automated
  
API Server:
  provider: DigitalOcean/AWS EC2
  specs: 4 vCPUs, 8GB RAM
  os: Ubuntu 22.04 LTS
  runtime: Node.js 18 LTS
  
Storage:
  primary: Google Drive (Shared)
  secondary: Supabase Storage
  cdn: Cloudflare (for public assets)
```

### 12.2 CI/CD Pipeline

#### 12.2.1 Build Pipeline
```yaml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  test:
    - npm install
    - npm run lint
    - npm run test
    - npm run test:e2e
    
  build:
    - npm run build
    - optimize assets
    - generate source maps
    
  deploy:
    - deploy to Vercel
    - invalidate CDN cache
    - run smoke tests
    - notify team
```

### 12.3 Monitoring & Logging

#### 12.3.1 Application Monitoring
- Error tracking with Sentry
- Performance monitoring with Web Vitals
- User session recording (with consent)
- Custom analytics dashboard

#### 12.3.2 Infrastructure Monitoring
- Server metrics (CPU, RAM, Disk)
- Database performance metrics
- API response times
- WebSocket connection stats

---

## 13. Maintenance & Support

### 13.1 Maintenance Schedule

#### 13.1.1 Regular Maintenance
- **Daily**: Automated backups, log rotation
- **Weekly**: Security updates, performance review
- **Monthly**: Database optimization, dependency updates
- **Quarterly**: Security audit, load testing

### 13.2 Support Levels

#### 13.2.1 Support Tiers
| Tier | Response Time | Resolution Time | Channels |
|------|--------------|-----------------|----------|
| Critical | 1 hour | 4 hours | Phone, Email, Slack |
| High | 4 hours | 24 hours | Email, Slack |
| Medium | 24 hours | 3 days | Email, Forum |
| Low | 48 hours | 7 days | Forum |

### 13.3 Documentation

#### 13.3.1 Technical Documentation
- API documentation (OpenAPI/Swagger)
- Database schema documentation
- Architecture diagrams
- Deployment guides
- Troubleshooting guides

#### 13.3.2 User Documentation
- User manuals for each role
- Video tutorials
- FAQ section
- API integration guides
- Best practices guide

---

## 14. Future Enhancements (Roadmap)

### Phase 2 (Q1 2026)
- Native mobile applications (iOS/Android)
- Advanced analytics dashboard
- AI-powered content recommendations
- Automated grading with ML
- Payment integration

### Phase 3 (Q2 2026)
- Video conferencing integration
- AR/VR learning experiences
- Blockchain certificates
- Multi-language support (10+ languages)
- White-label solution

### Phase 4 (Q3 2026)
- AI teaching assistant
- Predictive analytics
- Adaptive learning paths
- Social learning features
- Marketplace for courses

---

## Appendix A: API Documentation

### A.1 RESTful API Endpoints

```
BASE_URL: https://api.login-learning.com/v1

Authentication:
  POST   /auth/login
  POST   /auth/logout
  POST   /auth/refresh
  POST   /auth/register
  POST   /auth/forgot-password
  POST   /auth/reset-password

Courses:
  GET    /courses
  GET    /courses/:id
  POST   /courses
  PUT    /courses/:id
  DELETE /courses/:id
  POST   /courses/:id/enroll
  GET    /courses/:id/content
  GET    /courses/:id/students

Teaching Schedules:
  GET    /schedules?week=2025-W32&company=login
  GET    /schedules/:id
  POST   /schedules
  PUT    /schedules/:id
  DELETE /schedules/:id
  POST   /schedules/check-conflicts
  GET    /schedules/export/sheets

Projects:
  GET    /projects
  GET    /projects/:id
  POST   /projects
  PUT    /projects/:id
  DELETE /projects/:id
  POST   /projects/:id/like
  POST   /projects/:id/comment

Analytics:
  GET    /analytics/dashboard
  GET    /analytics/courses/:id
  GET    /analytics/users/:id
  GET    /analytics/revenue
```

### A.2 WebSocket Events

```javascript
// Real-time Events
socket.on('schedule:created', (data) => { });
socket.on('schedule:updated', (data) => { });
socket.on('schedule:deleted', (data) => { });
socket.on('user:joined', (data) => { });
socket.on('user:left', (data) => { });
socket.on('notification', (data) => { });
```

---

## Appendix B: Database Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_schedules_week_company ON teaching_schedules(week_start_date, company);
CREATE INDEX idx_schedules_instructor_week ON teaching_schedules(instructor_id, week_start_date);
CREATE INDEX idx_progress_student_course ON course_progress(student_id, enrollment_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_content_course_order ON course_content(course_id, order_index);
CREATE INDEX idx_projects_company ON projects(company);
CREATE INDEX idx_projects_student ON projects(student_id);
```

---

## Document Control

- **Version**: 3.0
- **Last Updated**: August 2025
- **Author**: System Architecture Team
- **Approval**: CTO, Product Owner
- **Next Review**: September 2025

---

*End of System Requirements Specification*