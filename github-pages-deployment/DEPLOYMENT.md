# 🚀 GitHub Pages Deployment Guide

## Quick Start Deployment

### 1. Repository Setup
```bash
# Create new GitHub repository
git init
git add .
git commit -m "Initial commit: Login Learning LMS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

### 2. Environment Configuration
1. Create `.env.local` file in root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Set up Supabase database using provided SQL files:
   - Run `database-complete-schema.sql` first
   - Then run other schema files as needed

### 3. GitHub Pages Setup
1. Go to your repository on GitHub
2. Settings → Pages
3. Source: "GitHub Actions"
4. The deployment will start automatically on next push

### 4. Custom Domain (Optional)
To use custom domain:
1. Add `CNAME` file to `public/` folder with your domain
2. Configure DNS to point to `username.github.io`

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Structure for Deployment

### ✅ Included Files
- `/src/` - All React components and pages
- `/public/` - Static assets
- `package.json` - Dependencies and scripts
- `vite.config.js` - Optimized for GitHub Pages
- `index.html` - Entry point
- `Logo.png` - Your logo
- `.github/workflows/deploy.yml` - Auto-deployment

### ❌ Excluded Files
- `node_modules/` - Will be installed during build
- `.env` files - Create locally
- Development tools and plugins
- Database files

## Environment Variables

### Required for Production
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### GitHub Secrets (if needed)
For advanced deployments, add these as GitHub repository secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Troubleshooting

### Common Issues

#### Build Fails
- Check Node.js version (18+ required)
- Verify all dependencies in package.json
- Check for TypeScript/ESLint errors

#### 404 on Refresh
- GitHub Pages limitation with SPAs
- Users should use navigation within app

#### Images/Assets Not Loading
- Ensure `base: './'` in vite.config.js
- Check file paths are relative

#### Supabase Connection Issues
- Verify environment variables
- Check Supabase project settings
- Ensure database schema is deployed

### Performance Optimization
The build includes:
- ✅ Code splitting for faster loading
- ✅ Asset optimization
- ✅ Modern JavaScript bundling
- ✅ CSS optimization

## Monitoring & Analytics

### GitHub Actions
- Automatic builds on push to main
- Build status in repository Actions tab
- Deployment history and logs

### Optional Integrations
- Google Analytics (add to index.html)
- Error tracking (Sentry, LogRocket)
- Performance monitoring

## Security Notes

### Environment Variables
- Never commit `.env` files
- Use GitHub Secrets for sensitive data
- Supabase keys should be "anon" keys only

### Supabase Security
- Configure Row Level Security (RLS)
- Set up proper authentication policies
- Regular security audits

## Support & Maintenance

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Deploy updates
git add .
git commit -m "Update: description"
git push origin main
```

### Backup
- Regular Supabase database backups
- Git repository is your code backup
- Export user data if needed

---

**🎉 Your Login Learning LMS is ready for deployment!**

Remember to:
1. Set up your Supabase database
2. Configure environment variables  
3. Push to GitHub
4. Enable GitHub Pages
5. Test the live site

For issues, check the GitHub repository issues or deployment logs.