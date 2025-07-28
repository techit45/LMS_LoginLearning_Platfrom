# Claude.md - Enterprise Learning Management System (LMS)

## 📋 System Overview
**Domain**: Educational Technology Platform  
**Architecture**: Single-Page Application (SPA) with Database as a Service (DBaaS)  
**Scale**: Mid-tier educational platform (~1000 concurrent users)  
**Purpose**: Comprehensive Learning Management System designed for middle school engineering education with advanced scheduling capabilities.

### Core Business Requirements
- **Student Management**: User registration, profiles, role-based access control
- **Course Delivery**: Content management, progress tracking, assessments
- **Teaching Coordination**: Real-time schedule management with drag-and-drop interface
- **Project Showcase**: Student portfolio and project management
- **Administrative Control**: Multi-tenant admin dashboard with analytics

**NEW**: Teaching Schedule Management System with real-time coordination capabilities

## 🏗️ System Architecture

### Technology Stack
- **Frontend Layer**: React 18 + Vite (Build Tool) + Tailwind CSS (Styling)
- **Interactive Components**: React-DnD (Drag & Drop), Framer Motion (Animations)
- **Backend-as-a-Service**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI Framework**: Radix UI (Accessibility) + Lucide React (Icons)
- **Routing**: React Router DOM (Client-side routing)
- **Deployment**: Edge deployment (Netlify/Vercel)

### Architectural Pattern
**Pattern**: JAMstack (JavaScript, APIs, Markup) with Backend-as-a-Service  
**Communication**: RESTful APIs with WebSocket for real-time features  
**State Management**: React Context + Local State  
**Authentication**: JWT-based with Row Level Security (RLS)

## 🗄️ Data Layer Architecture

### Database Infrastructure
**Database Type**: PostgreSQL (via Supabase DBaaS)  
**Database Pattern**: Multi-tenant with Row Level Security (RLS)  
**Region**: Asia Pacific Southeast (ap-southeast-1)  
**Status**: ACTIVE_HEALTHY  
**Scaling Strategy**: Vertical scaling with connection pooling  

### Current Data Volume
- **Active Users**: 4 (2 admin, 1 instructor, 1 student)
- **Course Catalog**: 2 main courses + 2 teaching schedule courses
- **Student Projects**: 9 project submissions
- **Database Tables**: 23+ normalized tables
- **Storage**: File attachments via Supabase Storage

### Data Consistency Model
**Consistency**: Strong consistency (ACID compliance)  
**Transactions**: PostgreSQL native transactions  
**Replication**: Built-in PostgreSQL streaming replication  
**Backup**: Automated daily backups with point-in-time recovery

## 📊 Database Schema

### Core LMS Tables
1. **user_profiles** (15 columns) - User information and roles
2. **courses** (21 columns) - Course management (main LMS)
3. **course_content** (12 columns) - Course materials
4. **course_progress** (26 columns) - Learning progress tracking
5. **projects** (29 columns) - Student projects showcase
6. **enrollments** (8 columns) - Course enrollments
7. **quizzes** (13 columns) - Quiz system
8. **assignments** (10 columns) - Assignment system
9. **forum_topics** (11 columns) - Discussion forums
10. **attachments** (15 columns) - File management

### Teaching Schedule System Tables (NEW)
11. **teaching_courses** (8 columns) - Schedule-specific courses
    - `id` (UUID, Primary Key)
    - `name` (VARCHAR) - Course name
    - `company` (VARCHAR) - Company/organization
    - `location` (VARCHAR) - Physical location
    - `company_color` (VARCHAR) - Course color code
    - `duration_hours` (INTEGER) - Course duration (1-4 hours)
    - `description` (TEXT) - Course description
    - `created_by` (UUID) - Creator reference

12. **weekly_schedules** (11+ columns) - Weekly schedule entries
    - `id` (UUID, Primary Key)
    - `year` (INTEGER) - Schedule year
    - `week_number` (INTEGER) - Week of year
    - `schedule_type` (VARCHAR) - 'weekends', 'weekdays', etc.
    - `instructor_id` (UUID) - Foreign key to user_profiles
    - `course_id` (UUID) - Foreign key to teaching_courses
    - `day_of_week` (VARCHAR) - Monday, Tuesday, etc.
    - `time_slot` (VARCHAR) - Time range (e.g., '08:00-12:00')
    - `start_time`, `end_time` (TIME) - Specific time slots
    - `duration` (INTEGER) - Duration in hours
    - `created_by` (UUID) - Creator reference

13. **instructor_profiles** (VIEW) - Non-student users for teaching
    - Filtered view of user_profiles where role ≠ 'student'

### Additional Tables
- achievements, assignment_submissions, forum_replies, forum_likes
- project_comments, project_likes, project_views
- quiz_attempts, user_progress, user_settings, video_progress

## 👥 User Roles System
- **SUPER_ADMIN**: Full system access (email domain: @login-learning.com)
- **INSTRUCTOR**: Course creation and management
- **STUDENT**: Course enrollment and learning (default role)
- **GUEST**: Public content access

## 🚀 Key Features

### ✅ Implemented Features
- **Authentication & Authorization**: Complete user management with role-based access
- **Course Management**: CRUD operations for courses and content
- **Teaching Schedule System**: Complete drag-and-drop schedule management (NEW)
  - Drag-and-drop course placement
  - Instructor assignment with avatars
  - Weekly schedule grid (08:00-17:00 time slots)
  - Course creation with company/location color coding
  - Real-time schedule updates
  - Responsive table design
- **Project Showcase**: Student project gallery with approval system
- **User Profiles**: Comprehensive user information management with avatar support
- **File Management**: Upload/download with storage integration
- **Admin Dashboard**: Complete administrative interface
- **Forum System**: Discussion boards for courses
- **Responsive Design**: Mobile-first approach with optimized table layouts
- **SEO Optimization**: Meta tags and social sharing

### 🔶 Partial Implementation
- **Quiz System**: Database structure ready, UI partially complete
- **Assignment System**: Backend ready, frontend in progress
- **Video Progress**: Tracking system implemented
- **Achievement System**: Database structure ready
- **Notification System**: Basic framework in place

### 🚧 Planned Features
- Advanced reporting and analytics
- Live chat system
- Mobile app development
- API documentation
- Automated testing suite

## 📁 Project Structure
```
src/
├── App.jsx                          # Main app component with routing
├── main.jsx                        # App entry point with environment validation
├── contexts/
│   └── AuthContext.jsx            # Authentication state management
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── schedule/                  # Teaching schedule components (NEW)
│   │   ├── CourseManager.jsx     # Course CRUD modal
│   │   └── ScheduleItem.jsx      # Schedule item display
│   ├── draggable/                # Drag-and-drop components (NEW)
│   ├── forms/                    # Form components (NEW)
│   ├── AdminLayout.jsx           # Admin panel layout
│   ├── Navbar.jsx                # Navigation component
│   ├── ErrorBoundary.jsx         # Error handling component
│   └── ...                       # Other components
├── pages/
│   ├── HomePage.jsx              # Landing page
│   ├── DashboardPage.jsx         # User dashboard
│   ├── AdminPage.jsx             # Admin dashboard
│   ├── TeachingSchedulePageNew.jsx # Teaching schedule system (NEW)
│   └── ...                       # Other pages
├── lib/
│   ├── supabaseClient.js         # Database connection
│   ├── courseService.js          # Course-related operations (LMS)
│   ├── teachingScheduleService.js # Teaching schedule operations (NEW)
│   ├── projectService.js         # Project-related operations
│   ├── userService.js            # User management
│   ├── weekUtils.js              # Week calculation utilities (NEW)
│   ├── migrationSystem.js        # Data migration utilities (NEW)
│   └── ...                       # Other services
├── types/                        # TypeScript type definitions (NEW)
└── utils/
    └── envValidation.js          # Environment validation
```

## 🔧 Development Commands
```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 🔐 Security Features
- Row Level Security (RLS) policies on all tables
- Role-based access control throughout the application
- File upload validation and sanitization
- XSS protection with DOMPurify
- CSRF protection via Supabase
- Secure session management

## 🌐 Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 UI/UX Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Smooth loading animations
- **Error Handling**: Comprehensive error boundaries and messaging
- **Toast Notifications**: User feedback system
- **Animations**: Smooth transitions with Framer Motion
- **Accessibility**: ARIA labels and keyboard navigation

## 🗃️ Key Services

### courseService.js (LMS Courses)
- `getAllCourses()` - Fetch all active courses
- `getCourseById(id)` - Get course details
- `createCourse(data)` - Create new course (admin)
- `updateCourse(id, data)` - Update course (admin)
- `getFeaturedCourses()` - Get featured courses for homepage

### teachingScheduleService.js (NEW - Teaching Schedule System)
#### Instructor Functions
- `getInstructors()` - Get all non-student users with profiles/avatars
- `getInstructorById(id)` - Get specific instructor details

#### Course Functions
- `getCourses()` - Get all teaching courses (separate from LMS courses)
- `createCourse(data)` - Create new teaching course with color coding
- `updateCourse(id, data)` - Update teaching course
- `deleteCourse(id)` - Delete course with cascade delete of schedules

#### Schedule Functions
- `getWeeklySchedules(year, week, type)` - Get schedules for specific week
- `createSchedule(data)` - Create/update schedule entry (with duplicate handling)
- `updateSchedule(id, data)` - Update existing schedule
- `deleteSchedule(id)` - Remove schedule entry
- `isTimeSlotAvailable()` - Check slot availability
- `getInstructorWeeklySchedules()` - Get instructor's specific week schedule

#### Utility Functions
- `getWeekInfo(date)` - Calculate week number and date ranges
- `cloneWeeklySchedules()` - Copy schedules between weeks
- `clearWeeklySchedules()` - Remove all schedules for a week

### projectService.js
- `getAllProjects()` - Fetch approved projects
- `getProjectById(id)` - Get project details
- `getFeaturedProjects()` - Get featured projects
- `createProject(data)` - Create new project

### userService.js
- User profile management
- Role assignment
- Admin user operations

## 🔄 Data Flow
1. **Authentication**: Supabase Auth → AuthContext → Components
2. **Data Fetching**: Services → Supabase → UI Components
3. **State Management**: React Context + Local State
4. **File Uploads**: Component → Service → Supabase Storage

## 📋 Common Tasks

### Creating a New Page
1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Update navigation if needed
4. Add SEO metadata

### Adding New API Functions
1. Create/update service file in `src/lib/`
2. Add error handling
3. Update TypeScript types if applicable
4. Test with different user roles

### Database Changes
1. Update schema in Supabase dashboard
2. Update RLS policies if needed
3. Update service functions
4. Test with different user roles

## 🐛 Known Issues & Recent Fixes

### ✅ Recently Fixed Issues
- **Foreign Key Constraint Error (409)**: Fixed course deletion by cascading delete of related schedules
- **Instructor Display Bug**: Fixed instructor_profiles view to show all non-student users (3 instructors now visible)
- **Dropdown UI Bug**: Fixed black dropdown text in course creation form
- **Color Change Bug**: Fixed color selection not working in course edit mode
- **Table Responsiveness**: Improved schedule table to fit screen without horizontal scrolling
- **Avatar Display**: Added proper avatar support with fallback to initials

### 🔄 Ongoing Issues
- Some quiz and assignment features are incomplete
- Video progress tracking needs optimization
- Mobile responsiveness could be improved on some admin pages

## 📞 Support
For technical issues or feature requests, check the project documentation or contact the development team.

## 🔄 Recent Updates

### 🆕 Teaching Schedule System Implementation (July 2025)
- **Complete Drag-and-Drop System**: Implemented React-DnD for course and instructor management
- **Database Architecture**: Added `teaching_courses` and `weekly_schedules` tables with proper relationships
- **User Interface**: Created responsive schedule grid with 08:00-17:00 time slots
- **Course Management**: Full CRUD operations with color coding by company/location  
- **Instructor Management**: Avatar support with fallback to initials, proper role filtering
- **Real-time Updates**: Live schedule updates without page refresh
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **RLS Policies**: Updated Row Level Security for new tables

### 🔧 Bug Fixes & Improvements
- Fixed foreign key constraints for course deletion
- Resolved instructor display issues (now shows 3 instructors correctly)
- Fixed dropdown styling issues in course forms
- Improved table responsiveness for better mobile experience
- Enhanced color selection system for course editing
- Added proper avatar display with graceful fallbacks

### 🏗️ Architecture Improvements
- Separated teaching courses from main LMS courses
- Implemented proper service layer for schedule operations
- Added comprehensive week calculation utilities
- Enhanced error boundaries and user feedback systems
- Improved state management for real-time updates

---
**Last Updated**: July 28, 2025  
**Status**: Teaching Schedule System fully operational  
**Active Features**: LMS + Teaching Schedule Management + Project Showcase