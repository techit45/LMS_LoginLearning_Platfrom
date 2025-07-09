# Netlify Environment Variables Setup

## 🚨 Production Error Fix

The current production errors are due to missing environment variables in Netlify:

```
[Error] Failed to load resource: the server responded with a status of 400 () (courses, line 0)
[Error] Featured courses database error
[Error] Sign in error: AuthApiError: Invalid login credentials
```

## 🔧 Required Environment Variables

You need to set these environment variables in your Netlify dashboard:

### Go to: Netlify Dashboard → Site Settings → Environment Variables

Add these variables:

```
VITE_SUPABASE_URL=https://vuitwzisazvikrhtfthh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE
```

## 📋 Steps to Fix:

1. **Go to Netlify Dashboard**
   - Open your Netlify site dashboard
   - Navigate to Site Settings → Environment Variables

2. **Add Environment Variables**
   - Click "Add a variable"
   - Add `VITE_SUPABASE_URL` with the Supabase URL
   - Add `VITE_SUPABASE_ANON_KEY` with the anonymous key

3. **Redeploy**
   - Trigger a new deployment
   - Or push a new commit to trigger auto-deployment

## 🔍 How to Verify:

After setting the variables, check the browser console in production:
- Should see "Supabase URL: Set"
- Should see "Supabase Key: Set"
- Database queries should work

## 🛡️ Security Note:

The VITE_SUPABASE_ANON_KEY is safe to expose in client-side code as it's the anonymous/public key designed for frontend use. The actual sensitive keys are stored securely in your Supabase project.