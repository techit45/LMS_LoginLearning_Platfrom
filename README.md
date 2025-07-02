# Learning Management System (LMS)

A comprehensive Learning Management System built with React, Vite, and Supabase.

## Features

- 🎓 **Course Management** - Create and manage courses with content
- 📝 **Quiz & Assignments** - Interactive quizzes and assignment submissions
- 👥 **User Roles** - Student, Instructor, and Admin roles
- 💬 **Forum System** - Discussion forums for courses
- 📊 **Progress Tracking** - Track learning progress and achievements
- 🎨 **Modern UI** - Built with Tailwind CSS and Framer Motion
- 🔐 **Authentication** - Secure user authentication with Supabase

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **UI Components:** Radix UI, Lucide React
- **Animations:** Framer Motion
- **Routing:** React Router DOM

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd learning-management-system
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
   - `complete-database-schema.sql` - Main database schema
   - `rls-policies.sql` - Row Level Security policies
   - `setup-storage-policies.sql` - Storage bucket policies
   - `05-sample-data.sql` - Sample data (optional)
   - `06-create-admin-user.sql` - Create admin user

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Database Setup

The system requires several database tables and policies. Run the SQL files in this order:

1. **Schema:** `complete-database-schema.sql`
2. **Security:** `rls-policies.sql` 
3. **Storage:** `setup-storage-policies.sql`
4. **Sample Data:** `05-sample-data.sql`
5. **Admin User:** `06-create-admin-user.sql`

## Deployment

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
   In Vercel Dashboard → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Deploy to Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder to Netlify**

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Services and utilities
├── pages/             # Page components
└── main.jsx           # App entry point
```

## Key Features

### Course Management
- Create courses with multiple content types
- Video lessons, quizzes, assignments
- Progress tracking and completion

### User Roles
- **Students:** Enroll in courses, take quizzes, submit assignments
- **Instructors:** Create courses, grade assignments, manage content
- **Admins:** Full system management

### Forum System
- Course-specific forums
- Topic creation and replies
- File attachments support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for educational purposes.

## Support

For support, please contact the development team or create an issue in the repository.