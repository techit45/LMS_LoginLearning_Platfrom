-- Grading System Tables
-- Run this in Supabase dashboard

-- Grading History Table
CREATE TABLE IF NOT EXISTS grading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  feedback TEXT,
  rubric_scores JSONB DEFAULT '{}'::jsonb,
  graded_by TEXT NOT NULL, -- user_id or 'system' for auto-grading
  auto_graded BOOLEAN DEFAULT false,
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE
);

-- Update assignment_submissions table to include grading fields
DO $$
BEGIN
  -- Add grading columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'status') THEN
    ALTER TABLE assignment_submissions ADD COLUMN status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned', 'draft'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'graded_at') THEN
    ALTER TABLE assignment_submissions ADD COLUMN graded_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'rubric_scores') THEN
    ALTER TABLE assignment_submissions ADD COLUMN rubric_scores JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'auto_graded') THEN
    ALTER TABLE assignment_submissions ADD COLUMN auto_graded BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'graded_by') THEN
    ALTER TABLE assignment_submissions ADD COLUMN graded_by TEXT;
  END IF;
END $$;

-- Update assignments table for rubric support
DO $$
BEGIN
  -- Add rubric columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'rubric') THEN
    ALTER TABLE assignments ADD COLUMN rubric JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'rubric_total_points') THEN
    ALTER TABLE assignments ADD COLUMN rubric_total_points DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'auto_grading_config') THEN
    ALTER TABLE assignments ADD COLUMN auto_grading_config JSONB DEFAULT '{"enabled": false}'::jsonb;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grading_history_submission_id ON grading_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_grading_history_graded_by ON grading_history(graded_by);
CREATE INDEX IF NOT EXISTS idx_grading_history_graded_at ON grading_history(graded_at);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_graded_at ON assignment_submissions(graded_at);

-- RLS Policies
ALTER TABLE grading_history ENABLE ROW LEVEL SECURITY;

-- Instructors can view grading history for their assignments
CREATE POLICY "Instructors can view grading history" ON grading_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM assignment_submissions asub
    JOIN assignments a ON a.id = asub.assignment_id
    JOIN courses c ON c.id = a.course_id
    WHERE asub.id = grading_history.submission_id
    AND c.instructor_id::TEXT = auth.uid()::TEXT
  )
);

-- System can create grading history
CREATE POLICY "System can create grading history" ON grading_history
FOR INSERT WITH CHECK (true);

-- Sample rubric data (only if courses exist)
INSERT INTO assignments (id, title, description, course_id, max_score, due_date, rubric, rubric_total_points, auto_grading_config) 
SELECT 
  gen_random_uuid(), 
  'Sample Assignment with Rubric', 
  'This is a sample assignment with rubric for testing grading system', 
  c.id,
  100, 
  NOW() + INTERVAL '7 days',
  '[
    {
      "id": "content",
      "name": "Content Quality",
      "description": "Quality and accuracy of content",
      "max_points": 40,
      "type": "manual"
    },
    {
      "id": "presentation", 
      "name": "Presentation",
      "description": "Organization and clarity",
      "max_points": 30,
      "type": "manual"
    },
    {
      "id": "completion",
      "name": "Completion",
      "description": "Assignment requirements met",
      "max_points": 30,
      "type": "completion",
      "min_words": 200
    }
  ]'::jsonb,
  100,
  '{"enabled": true, "auto_grade_completion": true}'::jsonb
FROM courses c 
WHERE c.title IS NOT NULL 
LIMIT 1;

SELECT 'Grading system tables created successfully' as message;