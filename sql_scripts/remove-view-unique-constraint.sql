-- Remove unique constraint to allow multiple views per day
ALTER TABLE public.project_views 
DROP CONSTRAINT IF EXISTS project_views_user_id_project_id_view_date_key;

-- Optional: If you want to track every single view, you might want to add a session_id
-- ALTER TABLE public.project_views 
-- ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT gen_random_uuid()::text;