# Login Learning - Learning Management System

## Overview
Login Learning is a comprehensive Learning Management System (LMS) built with React, Vite, and Supabase. It provides a modern platform for online education with features including course management, video streaming, quizzes, assignments, and progress tracking.

## Features

### For Students
- 📚 Browse and enroll in courses
- 🎥 Watch video lessons with progress tracking
- 📝 Take interactive quizzes and assignments
- 📊 Track learning progress and achievements
- 📄 Download course materials and attachments
- 🎓 University admission information and guidance

### For Administrators
- 👨‍💼 Complete course management system
- 📋 Content creation with rich media support
- 📈 Student progress monitoring
- ✅ Assignment grading system
- 👥 User management
- 📊 Analytics and reporting

### Key Technologies
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **UI Components**: Lucide React Icons, Custom UI Components
- **Video Player**: Custom HTML5 video player with progress tracking
- **File Management**: Supabase Storage with preview capabilities

## Live Demo
🌐 **[Visit Login Learning](https://your-username.github.io/repository-name/)**

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation
1. Clone the repository
```bash
git clone https://github.com/your-username/repository-name.git
cd repository-name
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
Create a `.env.local` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Database Setup
Run the provided SQL scripts in your Supabase SQL editor:
- `database-complete-schema.sql` - Main database structure
- `content-attachments-schema-fixed.sql` - File attachment system
- `onsite-learning-schema.sql` - Onsite course features

5. Start Development Server
```bash
npm run dev
```

### Deployment to GitHub Pages

This repository is configured for automatic deployment to GitHub Pages using GitHub Actions.

#### Setup Steps:
1. Fork this repository
2. Go to Settings → Pages in your GitHub repository
3. Source: "GitHub Actions"
4. Push to main branch - deployment will start automatically

#### Custom Domain (Optional):
To use a custom domain, add a `CNAME` file to the `public/` folder with your domain name.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── VideoPlayer.jsx # Custom video player
│   ├── QuizPlayer.jsx  # Interactive quiz system
│   └── ...
├── pages/              # Main application pages
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Services and utilities
│   ├── supabaseClient.js
│   ├── courseService.js
│   └── ...
└── main.jsx           # Application entry point
```

## Configuration Files

### Vite Configuration
The project uses Vite for fast development and optimized builds, configured for GitHub Pages deployment.

### Tailwind CSS
Custom styling with Tailwind CSS for responsive design and modern UI components.

### Database Schema
Complete PostgreSQL schema included for:
- User management and authentication
- Course and content management
- Progress tracking and analytics
- File attachment system
- Quiz and assignment systems

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design optimized

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is open source and available under the [MIT License](LICENSE).

## Support
For support and questions:
- Create an issue in this repository
- Contact: [your-email@example.com]

## Acknowledgments
- Built with React and Vite
- UI Icons by Lucide React
- Backend powered by Supabase
- Animations by Framer Motion