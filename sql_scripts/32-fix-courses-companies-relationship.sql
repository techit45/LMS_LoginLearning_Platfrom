-- Migration: Fix courses-companies relationship
-- Purpose: Add foreign key constraint and update existing data
-- Created: 2025-01-18

BEGIN;

-- Step 1: Update existing courses with NULL company_id based on company string
UPDATE courses 
SET company_id = (
    SELECT id 
    FROM companies 
    WHERE slug = courses.company
)
WHERE company_id IS NULL 
  AND company IS NOT NULL;

-- Step 2: Add foreign key constraint between courses and companies
ALTER TABLE courses 
ADD CONSTRAINT fk_courses_company_id 
FOREIGN KEY (company_id) 
REFERENCES companies(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 3: Create index for better performance on company_id joins
CREATE INDEX IF NOT EXISTS idx_courses_company_id 
ON courses(company_id);

-- Step 4: Create index on companies slug for better lookup performance
CREATE INDEX IF NOT EXISTS idx_companies_slug 
ON companies(slug);

-- Step 5: Add check constraint to ensure data consistency
-- Either company_id must be set OR company string must be set (but preferably company_id)
ALTER TABLE courses 
ADD CONSTRAINT chk_courses_company_reference 
CHECK (company_id IS NOT NULL OR company IS NOT NULL);

COMMIT;

-- Rollback instructions:
-- To rollback this migration, run:
-- BEGIN;
-- ALTER TABLE courses DROP CONSTRAINT IF EXISTS fk_courses_company_id;
-- ALTER TABLE courses DROP CONSTRAINT IF EXISTS chk_courses_company_reference;
-- DROP INDEX IF EXISTS idx_courses_company_id;
-- DROP INDEX IF EXISTS idx_companies_slug;
-- COMMIT;

-- Verification queries:
-- 1. Check foreign key constraint:
-- SELECT * FROM information_schema.table_constraints 
-- WHERE constraint_name = 'fk_courses_company_id';

-- 2. Test join functionality:
-- SELECT c.title, comp.name as company_name 
-- FROM courses c 
-- JOIN companies comp ON c.company_id = comp.id 
-- LIMIT 5;

-- 3. Check courses without company_id:
-- SELECT id, title, company_id, company 
-- FROM courses 
-- WHERE company_id IS NULL;