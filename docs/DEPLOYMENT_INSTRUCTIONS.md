# 🚀 Netlify Deployment Instructions

## Prerequisites
- GitHub account
- Netlify account (free tier available)
- Supabase project with environment variables

## Step 1: Create GitHub Repository

1. Create a new repository on GitHub
2. Copy the repository URL

## Step 2: Push Code to GitHub

```bash
# Add all files to git
git add .

# Commit changes
git commit -m "🚀 Prepare for Netlify deployment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Add remote origin (replace with your repository URL)
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy on Netlify

### Option A: GitHub Integration (Recommended)

1. Go to [Netlify](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### Option B: Manual Deploy

1. Run `npm run build` locally
2. Go to Netlify Dashboard
3. Drag and drop the `dist` folder

## Step 4: Configure Environment Variables

In Netlify Dashboard > Site settings > Environment variables, add:

```env
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
VITE_APP_NAME=Learning Management System
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## Step 5: Configure Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Add custom domain
3. Configure DNS settings with your domain provider

## Build Configuration Files

The following files are already configured:

- ✅ `netlify.toml` - Main configuration
- ✅ `public/_redirects` - SPA routing
- ✅ `public/_headers` - Security headers
- ✅ `.env.example` - Environment template

## Security Features Included

- Content Security Policy (CSP)
- XSS Protection
- CSRF Protection
- HTTPS Enforcement
- Asset Caching
- Frame Options

## Build Optimization

- ✅ CSS/JS Minification
- ✅ Image Compression
- ✅ Asset Caching
- ✅ Gzip Compression
- ✅ Bundle Optimization

## Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
npm run build --clear-cache
```

### Environment Variables Not Working
- Check variable names start with `VITE_`
- Verify they're set in Netlify dashboard
- Redeploy after adding variables

### 404 Errors on Routes
- Ensure `_redirects` file exists in `public/`
- Check SPA redirect rules in `netlify.toml`

### CORS Issues
- Verify Supabase URL configuration
- Check RLS policies in Supabase

## Post-Deployment Checklist

- [ ] Test user registration/login
- [ ] Verify Supabase connection
- [ ] Test teaching schedule functionality
- [ ] Check responsive design
- [ ] Validate security headers
- [ ] Test all major features

## Monitoring

Consider setting up:
- Netlify Analytics
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

## Support

For deployment issues:
- Check Netlify deploy logs
- Verify build commands
- Test locally first with `npm run build && npm run preview`