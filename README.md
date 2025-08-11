# Login Learning Platform
## แพลตฟอร์มการศึกษาออนไลน์สำหรับวิศวกรรม

[![Production](https://img.shields.io/badge/Production-Live-brightgreen)](https://login-learning-platform-7pi9e05uq-techity-3442s-projects.vercel.app)
[![Version](https://img.shields.io/badge/Version-2.5.0-blue)](https://github.com/techity-3442/login-learning-platform)
[![Security](https://img.shields.io/badge/Security-95%25-green)](docs/project-overview/PROJECT_COMPLETE_OVERVIEW.md#security-implementation)

---

## 🎯 Overview

Login Learning เป็นแพลตฟอร์มการศึกษาออนไลน์ที่มุ่งเน้นการเรียนรู้ด้านวิศวกรรมสำหรับน้องๆ มัธยมปลาย เพื่อช่วยในการค้นหาความถนัดและเตรียมตัวสู่การศึกษาต่อในคณะวิศวกรรม

### ✨ Key Features

- 🎨 **3D Interactive Homepage** - Engineering mind map with isometric design
- 📚 **Complete Learning Management** - Courses, assignments, progress tracking
- 🎯 **Project Showcase** - Student project portfolio with community features
- 👥 **Real-time Collaboration** - Google Sheets-like teaching schedule system
- 📁 **Smart File Management** - Google Drive integration with automatic organization
- 🏢 **Multi-Company Support** - Support for 6 different organizations
- 🔒 **Enterprise Security** - 95%+ security score with Row Level Security

---

## 🚀 Live Demo

**Production URL**: https://login-learning-platform-7pi9e05uq-techity-3442s-projects.vercel.app

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + **Vite** - Modern development experience
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Router** - Client-side routing

### Backend  
- **Supabase** (PostgreSQL) - Database and authentication
- **Row Level Security** - Enterprise-grade security
- **Google Drive API** - File storage and organization
- **Express.js** - API server for integrations

### Deployment
- **Frontend**: Vercel (Production ready)
- **Database**: Supabase Cloud
- **File Storage**: Google Drive (Shared Drive)

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

## 📚 Key Documentation

- **[Complete Project Overview](docs/project-overview/PROJECT_COMPLETE_OVERVIEW.md)** - 200+ page comprehensive documentation
- **[System Requirements](docs/requirements/SYSTEM_REQUIREMENTS.md)** - Detailed requirements specification  
- **[Project Organization](docs/PROJECT_ORGANIZATION.md)** - File structure and navigation guide
- **[Setup Guides](docs/guides/)** - Installation and configuration guides
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions

### File Organization
```
📁 docs/                   # Complete documentation
├── project-overview/      # Main project docs
├── requirements/          # System requirements
├── guides/                # Setup guides
├── troubleshooting/       # Fix guides
└── api-docs/              # API documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is for educational purposes.

## 🆘 Support

For support, please create an issue in the repository or contact the development team.
