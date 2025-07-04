// Database Fix Helper for Admin
import { supabase } from './supabaseClient';

/**
 * ทดสอบการเข้าถึงข้อมูลจริงจาก Database
 */
export const testRealDataAccess = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    canAccessRealData: false,
    needsSQLFix: false
  };

  console.log('🔍 Testing Real Data Access...');

  try {
    // Test 1: Simple courses query without timeout
    console.log('Testing simple courses query...');
    const coursesStartTime = Date.now();
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, is_active')
      .eq('is_active', true)
      .limit(5);

    const coursesTime = Date.now() - coursesStartTime;
    
    results.tests.push({
      name: 'Simple Courses Query',
      status: coursesError ? 'failed' : 'passed',
      time: `${coursesTime}ms`,
      count: courses?.length || 0,
      error: coursesError?.message || null
    });

    // Test 2: Simple projects query without timeout  
    console.log('Testing simple projects query...');
    const projectsStartTime = Date.now();
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, is_approved')
      .eq('is_approved', true)
      .limit(5);

    const projectsTime = Date.now() - projectsStartTime;
    
    results.tests.push({
      name: 'Simple Projects Query',
      status: projectsError ? 'failed' : 'passed',
      time: `${projectsTime}ms`,
      count: projects?.length || 0,
      error: projectsError?.message || null
    });

    // Test 3: RLS Policy test
    console.log('Testing RLS policies...');
    
    // Test with anon role (simulate non-authenticated user)
    const { data: anonCourses, error: anonError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_active', true)
      .limit(1);
    
    results.tests.push({
      name: 'Anonymous Access Test',
      status: anonError ? 'failed' : 'passed',
      count: anonCourses?.length || 0,
      error: anonError?.message || null
    });

    // Evaluate results
    const failedTests = results.tests.filter(t => t.status === 'failed');
    const slowTests = results.tests.filter(t => parseInt(t.time) > 5000);
    
    if (failedTests.length === 0 && courses?.length > 0 && projects?.length > 0) {
      results.canAccessRealData = true;
      results.needsSQLFix = false;
    } else {
      results.canAccessRealData = false;
      results.needsSQLFix = true;
    }

    // Check for specific error patterns
    const hasRLSError = results.tests.some(t => 
      t.error && (
        t.error.includes('RLS') || 
        t.error.includes('policy') ||
        t.error.includes('permission')
      )
    );

    if (hasRLSError) {
      results.needsSQLFix = true;
      results.recommendedAction = 'Run SQL fix script to update RLS policies';
    } else if (slowTests.length > 0) {
      results.needsSQLFix = true;
      results.recommendedAction = 'Run SQL fix script to add database indexes';
    }

  } catch (error) {
    console.error('Database test failed:', error);
    results.tests.push({
      name: 'General Database Access',
      status: 'failed',
      error: error.message
    });
    results.needsSQLFix = true;
  }

  console.log('🎯 Real Data Access Test Results:', results);
  return results;
};

/**
 * รายการ SQL commands ที่จำเป็นสำหรับแก้ไขปัญหา
 */
export const getSQLFixCommands = () => {
  return {
    title: 'SQL Fix Commands for Database Issues',
    description: 'Copy and run these commands in Supabase SQL Editor',
    commands: [
      {
        step: 1,
        title: 'Fix RLS Policies for Public Read Access',
        sql: `-- Allow public read access to courses
DROP POLICY IF EXISTS "Allow public read courses" ON courses;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read courses" 
ON courses FOR SELECT TO public USING (is_active = true);

-- Allow public read access to projects  
DROP POLICY IF EXISTS "Allow public read projects" ON projects;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read projects" 
ON projects FOR SELECT TO public USING (is_approved = true);`
      },
      {
        step: 2,
        title: 'Add Performance Indexes',
        sql: `-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_active_featured 
ON courses(is_active, is_featured) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_projects_approved_featured 
ON projects(is_approved, is_featured) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_courses_created_at_desc 
ON courses(created_at DESC) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_projects_created_at_desc 
ON projects(created_at DESC) WHERE is_approved = true;`
      },
      {
        step: 3,
        title: 'Add Sample Data (if tables are empty)',
        sql: `-- Add sample course
INSERT INTO courses (
  id, title, description, category, level, price, duration_hours, 
  thumbnail_url, is_active, is_featured, instructor_id, created_at
) VALUES (
  gen_random_uuid(),
  'React เบื้องต้นสำหรับมือใหม่',
  'เรียนรู้การสร้าง Web Application ด้วย React',
  'การเขียนโปรแกรม',
  'beginner',
  0,
  15,
  '/images/placeholder.png',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Add sample project
INSERT INTO projects (
  id, title, description, category, difficulty_level, 
  cover_image_url, is_approved, is_featured, creator_id, created_at
) VALUES (
  gen_random_uuid(),
  'ระบบรดน้ำต้นไม้อัตโนมัติด้วย IoT',
  'โครงงานระบบรดน้ำต้นไม้อัตโนมัติ',
  'iot',
  'intermediate',
  '/images/project-iot.jpg',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
) ON CONFLICT (id) DO NOTHING;`
      },
      {
        step: 4,
        title: 'Test the Fix',
        sql: `-- Test public access
SET ROLE anon;
SELECT COUNT(*) as course_count FROM courses WHERE is_active = true;
SELECT COUNT(*) as project_count FROM projects WHERE is_approved = true;
RESET ROLE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';`
      }
    ],
    instructions: [
      '1. เปิด Supabase Dashboard',
      '2. ไปที่ SQL Editor',
      '3. Copy และ paste แต่ละ command ทีละขั้น',
      '4. กด Run บน command แต่ละตัว',
      '5. ตรวจสอบผลลัพธ์ที่ขั้นตอน Test the Fix',
      '6. Refresh หน้าเว็บเพื่อทดสอบการโหลดข้อมูลจริง'
    ]
  };
};

/**
 * แสดงผลการทดสอบในรูปแบบที่อ่านง่าย
 */
export const displayDatabaseTestResults = (results) => {
  console.log('🎯 Database Access Test Summary:');
  console.log(`✅ Can Access Real Data: ${results.canAccessRealData ? 'YES' : 'NO'}`);
  console.log(`🔧 Needs SQL Fix: ${results.needsSQLFix ? 'YES' : 'NO'}`);
  
  if (results.recommendedAction) {
    console.log(`💡 Recommended Action: ${results.recommendedAction}`);
  }
  
  console.log('');
  console.log('Test Details:');
  results.tests.forEach(test => {
    const icon = test.status === 'passed' ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.time) console.log(`   Time: ${test.time}`);
    if (test.count !== undefined) console.log(`   Records: ${test.count}`);
    if (test.error) console.log(`   Error: ${test.error}`);
  });

  if (results.needsSQLFix) {
    console.log('');
    console.log('🚨 SQL Fix Required!');
    console.log('Run the SQL commands from getSQLFixCommands() in Supabase SQL Editor');
  }

  return results;
};

export default { testRealDataAccess, getSQLFixCommands, displayDatabaseTestResults };