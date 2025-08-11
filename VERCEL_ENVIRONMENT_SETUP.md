# 🚀 Vercel Environment Variables Setup Guide

## 🔍 Issue Diagnosis
The student access issue is caused by **missing environment variables in Vercel**. The application works locally but fails in production because Vercel doesn't have the Supabase configuration.

## ✅ Required Environment Variables

### Vercel Dashboard Settings
Go to: **Project Settings > Environment Variables**

Add these **exact** variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://vuitwzisazvikrhtfthh.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE` | All |

## 📋 Step-by-Step Instructions

### 1. **Access Vercel Dashboard**
- Go to [vercel.com](https://vercel.com)
- Sign in to your account
- Select your project: **login-learning-platform** or similar

### 2. **Navigate to Environment Variables**
- Click **Settings** (gear icon)
- Select **Environment Variables** from sidebar

### 3. **Add Variables**
For each variable:
- Click **"Add"** button
- Enter **Name**: `VITE_SUPABASE_URL`
- Enter **Value**: `https://vuitwzisazvikrhtfthh.supabase.co`
- Select **Environments**: Check **Production**, **Preview**, **Development**
- Click **Save**

Repeat for `VITE_SUPABASE_ANON_KEY`.

### 4. **Redeploy**
- Go to **Deployments** tab
- Click **"Redeploy"** on the latest deployment
- **OR** push a new commit to trigger automatic deployment

## 🧪 Verification

### After setting environment variables:
1. **Check Browser Console** on deployed site:
   ```javascript
   // Should log:
   // Supabase URL: Set
   // Supabase Key: Set
   ```

2. **Test Student Access**:
   - Visit `/projects` page
   - Should load projects without timeout
   - No "getAllProjects timeout" errors

3. **Database Queries**:
   - Projects should load in <3 seconds
   - Courses should be accessible
   - No 400 errors in network tab

## 🔧 Alternative: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add VITE_SUPABASE_URL production
# Enter: https://vuitwzisazvikrhtfthh.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: [the long JWT token]

# Redeploy
vercel --prod
```

## ❌ Common Mistakes

### 1. **Wrong Variable Names**
- ❌ `SUPABASE_URL` (missing VITE_ prefix)
- ✅ `VITE_SUPABASE_URL`

### 2. **Missing Environments**
- Ensure variables are set for **ALL** environments
- Production, Preview, and Development

### 3. **Trailing Spaces**
- Copy values exactly without extra spaces
- URLs should not end with `/`

### 4. **Not Redeploying**
- Environment variables only apply to NEW deployments
- Must redeploy after adding variables

## 🎯 Expected Results

### ✅ After Fix:
- Projects page loads quickly
- No timeout errors
- Students can browse courses
- Database queries work normally

### ❌ Before Fix:
- `getAllProjects timeout` errors
- Empty project listings
- 400 errors in console
- Supabase client initialization failures

## 🔍 Debugging

### Check Environment Variables in Browser:
```javascript
// In browser console on deployed site:
console.log('Current URL:', window.location.href);

// Environment variables are replaced at build time
// Check if they're present in the source
```

### Verify API Access:
```javascript
// Test direct API call in browser console:
fetch('https://vuitwzisazvikrhtfthh.supabase.co/rest/v1/projects?select=id,title&is_approved=eq.true&limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
.then(r => r.json())
.then(console.log);
```

## 🚨 Security Notes
- These are **public API keys** safe for frontend use
- Supabase RLS policies control actual data access
- Never expose service account keys in frontend

---
**Status: READY FOR DEPLOYMENT**
*Date: 2025-01-11*