# Learning Management System (LMS) with Teaching Schedule

A comprehensive Learning Management System built with React, Vite, and Supabase, featuring an advanced Teaching Schedule Management System.

## 🎯 Features

- 🎓 **Course Management** - Create and manage courses with content
- 📝 **Quiz & Assignments** - Interactive quizzes and assignment submissions
- 👥 **User Roles** - Student, Instructor, and Admin roles
- 💬 **Forum System** - Discussion forums for courses
- 🗓️ **Teaching Schedule** - Advanced drag-and-drop schedule management with real-time coordination
- 📊 **Progress Tracking** - Track learning progress and achievements
- 🎨 **Modern UI** - Built with Tailwind CSS and Framer Motion
- 🔐 **Authentication** - Secure user authentication with Supabase

## 🏗️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **UI Components:** Radix UI, Lucide React
- **Animations:** Framer Motion, React-DnD
- **Routing:** React Router DOM

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/techit45/LMS_LoginLearning_Platfrom.git
   cd LMS_LoginLearning_Platfrom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   Run these SQL files in your Supabase SQL Editor in order:
   - `supabase_setup/01_master_schema.sql` - Main database schema
   - `supabase_setup/02_security_policies.sql` - Row Level Security policies
   - `supabase_setup/03_storage_setup_fixed.sql` - Storage bucket policies
   - `database/migrations/TEACHING_COURSES_SETUP.sql` - Teaching schedule system
   - `supabase_setup/04_initial_data_fixed.sql` - Sample data (optional)
   
   See `database/README.md` for detailed setup instructions.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 📋 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── draggable/      # Drag & drop components
│   ├── forms/          # Form components
│   ├── schedule/       # Teaching schedule components
│   └── ui/             # Base UI components
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Services and utilities
├── pages/             # Page components
└── main.jsx           # App entry point
```

## 🎯 Key Features

### Teaching Schedule System
- 📅 **Drag & Drop Interface** - Intuitive course scheduling
- 🗓️ **Week Navigation** - Calendar-based week picker
- 👨‍🏫 **Instructor Management** - Assign instructors to courses
- 🎨 **Color Coding** - Visual course organization
- ⏰ **Conflict Detection** - Prevent scheduling conflicts

### Course Management
- Create courses with multiple content types
- Video lessons, quizzes, assignments
- Progress tracking and completion

### User Roles
- **Students:** Enroll in courses, take quizzes, submit assignments
- **Instructors:** Create courses, grade assignments, manage content
- **Admins:** Full system management

## 🚀 Deployment

### Deploy to Netlify (Recommended)

The project is pre-configured for Netlify deployment:

1. **Push to GitHub** (already done)
2. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select this repository
   - Build settings are auto-configured

3. **Set Environment Variables in Netlify:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

For detailed instructions, see `DEPLOYMENT_INSTRUCTIONS.md`

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables

## 📚 Documentation

- `docs/` - Comprehensive documentation directory
  - `docs/CLAUDE.md` - System architecture documentation
  - `docs/DEPLOYMENT_INSTRUCTIONS.md` - Detailed deployment guide
  - `docs/TEACHING_SCHEDULE_SYSTEM_DOCUMENTATION.md` - Teaching schedule feature guide
- `database/` - Database schemas and migration files
- `development/` - Development and testing files (git ignored)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is for educational purposes.

## 🆘 Support

For support, please create an issue in the repository or contact the development team.
