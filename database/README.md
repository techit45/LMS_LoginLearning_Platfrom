# 🗄️ Database Files

This directory contains database schemas, migrations, and setup scripts.

## 📁 Directory Structure

- `migrations/` - Database migration files and patches
- `sample_data.sql` - Sample data for development
- `teaching_schedule_migration.sql` - Teaching schedule system migration

## 🚀 Setup Order

Run these files in your Supabase SQL Editor in this order:

1. **Schema Setup:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase_setup/01_master_schema.sql
   ```

2. **Security Policies:**
   ```sql
   -- File: supabase_setup/02_security_policies.sql
   ```

3. **Storage Setup:**
   ```sql
   -- File: supabase_setup/03_storage_setup_fixed.sql
   ```

4. **Teaching Schedule System:**
   ```sql
   -- File: migrations/TEACHING_COURSES_SETUP.sql
   ```

5. **Sample Data (Optional):**
   ```sql
   -- File: sample_data.sql or supabase_setup/04_initial_data_fixed.sql
   ```

## 📝 Migration Files

The `migrations/` directory contains:
- Setup scripts for new features
- Database patches and fixes
- Schema updates and modifications

## ⚠️ Important Notes

- Always backup your database before running migrations
- Test migrations in development environment first
- Follow the setup order for proper database initialization