# 🗄️ Database Setup Guide

## 📁 Essential SQL Files

After cleanup, these are the **only SQL files** you need:

### ✅ **Active Files**
- **`database-complete-schema.sql`** - 🆕 **USE THIS ONE** - Complete consolidated schema
- **`database-schema.sql`** - ⚠️ Legacy core schema (can be replaced by complete schema)
- **`database-phase2-schema.sql`** - ⚠️ Legacy extended features (can be replaced by complete schema)
- **`content-attachments-schema-fixed.sql`** - ⚠️ Legacy attachments (can be replaced by complete schema)
- **`test-data.sql`** - 📊 Optional sample data for development

### ❌ **Removed Files** (No Longer Needed)
- ~~`database-update-admin-domain.sql`~~ - One-time update, no longer needed
- ~~`content-attachments-schema.sql`~~ - Had policy issues, replaced by fixed version
- ~~`supabase-storage-setup.sql`~~ - Complex setup, replaced by Dashboard method
- ~~`simple-storage-setup.sql`~~ - Basic bucket only, not needed
- ~~`storage-policies-setup.sql`~~ - Handled by SystemCheck component
- ~~`fix-storage-policies.sql`~~ - Troubleshooting file, no longer needed

## 🚀 Quick Setup (Recommended)

### Option 1: Use Consolidated Schema (Easiest)
```sql
-- Run this single file in Supabase SQL Editor
-- It includes everything you need
\i database-complete-schema.sql
```

### Option 2: Use Individual Files (If you prefer)
```sql
-- Run in order:
\i database-schema.sql
\i database-phase2-schema.sql  
\i content-attachments-schema-fixed.sql
\i test-data.sql  -- Optional
```

## 🔧 Post-Setup Steps

1. **Set Admin Role**
   ```sql
   UPDATE user_profiles 
   SET user_role = 'admin' 
   WHERE user_id = (
     SELECT id FROM auth.users 
     WHERE email = 'your-admin-email@gmail.com'
   );
   ```

2. **Storage Setup**
   - Create bucket `course-files` in Supabase Dashboard → Storage
   - Storage policies are handled automatically by the app

3. **Verify Setup**
   - Use the SystemCheck component in your app
   - Check that all tables exist
   - Test file upload functionality

## 📊 What's Included

The consolidated schema includes:

### Core Features
- ✅ Courses and course content
- ✅ User profiles with role system
- ✅ Enrollments and progress tracking
- ✅ Achievements and notifications

### Learning Features  
- ✅ Video progress tracking
- ✅ Quiz system with attempts
- ✅ Assignment system with submissions
- ✅ Google Classroom-style file attachments
- ✅ Learning analytics

### Security & Performance
- ✅ Row Level Security (RLS) policies
- ✅ Performance indexes
- ✅ Automated triggers and functions
- ✅ Admin and instructor role support

## 🧹 Cleanup Summary

**Removed:** 6 obsolete SQL files
**Kept:** 5 essential files (or just 1 if using consolidated schema)
**Space saved:** Cleaner project structure
**Maintenance:** Much easier to manage

Your database setup is now much cleaner and easier to maintain! 🎉