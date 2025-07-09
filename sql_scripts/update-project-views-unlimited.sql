-- Option 1: Allow multiple views per day (remove unique constraint)
ALTER TABLE public.project_views 
DROP CONSTRAINT IF EXISTS project_views_user_id_project_id_view_date_key;

-- Option 2: Or if you want unique views but with session tracking
-- Add session_id column and use that instead
-- ALTER TABLE public.project_views 
-- ADD COLUMN IF NOT EXISTS session_id TEXT;
-- 
-- DROP CONSTRAINT IF EXISTS project_views_user_id_project_id_view_date_key;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_project_views_session 
-- ON public.project_views(user_id, project_id, session_id) 
-- WHERE session_id IS NOT NULL;

-- Option 3: Keep daily unique views but handle duplicates gracefully
-- (This is already handled in the JavaScript code with error code 23505)