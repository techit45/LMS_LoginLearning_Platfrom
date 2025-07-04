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
    title: 'SQL Fix Commands for Content Visibility (All Roles)',
    description: 'ให้ทุก Role เห็นเนื้อหาได้ แต่แค่ Admin เท่านั้นที่แก้ไข/เพิ่มได้',
    commands: [
      {
        step: 1,
        title: 'Fix COURSES - ทุกคนเห็นได้ แค่ Admin แก้ไขได้',
        sql: `-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow public read courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated read courses" ON courses;
DROP POLICY IF EXISTS "Allow admin manage courses" ON courses;

-- ทุกคนอ่านคอร์สที่เปิดใช้งานได้
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read active courses"
ON courses FOR SELECT TO public USING (is_active = true);

-- แค่ Admin สร้าง/แก้ไข/ลบคอร์สได้
CREATE POLICY "Only admin can manage courses"
ON courses FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));`
      },
      {
        step: 2,
        title: 'Fix PROJECTS - ทุกคนเห็นได้ แค่ Admin แก้ไขได้',
        sql: `-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow public read projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated read projects" ON projects;
DROP POLICY IF EXISTS "Allow admin manage projects" ON projects;

-- ทุกคนอ่านโครงงานที่อนุมัติแล้วได้
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read approved projects"
ON projects FOR SELECT TO public USING (is_approved = true);

-- แค่ Admin สร้าง/แก้ไข/ลบโครงงานได้
CREATE POLICY "Only admin can manage projects"
ON projects FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));`
      },
      {
        step: 3,
        title: 'Fix COURSE_CONTENT - ทุกคนเห็นได้ แค่ Admin แก้ไขได้',
        sql: `-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow public read course content" ON course_content;
DROP POLICY IF EXISTS "Allow authenticated read course content" ON course_content;
DROP POLICY IF EXISTS "Allow admin manage course content" ON course_content;

-- ทุกคนอ่านเนื้อหาของคอร์สที่เปิดใช้งานได้
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read course content"
ON course_content FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_content.course_id AND courses.is_active = true));

-- แค่ Admin สร้าง/แก้ไข/ลบเนื้อหาได้
CREATE POLICY "Only admin can manage course content"
ON course_content FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));`
      },
      {
        step: 4,
        title: 'Add Performance Indexes',
        sql: `-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_active_featured 
ON courses(is_active, is_featured) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_projects_approved_featured 
ON projects(is_approved, is_featured) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_course_content_course_id 
ON course_content(course_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role) WHERE role IN ('instructor', 'admin');`
      },
      {
        step: 5,
        title: 'Test the Fix',
        sql: `-- Test public access to all content
SET ROLE anon;
SELECT 'Courses' as table_name, COUNT(*) as visible_count FROM courses WHERE is_active = true;
SELECT 'Projects' as table_name, COUNT(*) as visible_count FROM projects WHERE is_approved = true;
SELECT 'Course Content' as table_name, COUNT(*) as visible_count FROM course_content cc JOIN courses c ON c.id = cc.course_id WHERE c.is_active = true;
RESET ROLE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';`
      }
    ],
    instructions: [
      '1. เปิด Supabase Dashboard → SQL Editor',
      '2. รัน Command ทีละขั้นตามลำดับ:',
      '   - Step 1: Fix COURSES policies',
      '   - Step 2: Fix PROJECTS policies', 
      '   - Step 3: Fix COURSE_CONTENT policies',
      '   - Step 4: Add Performance Indexes',
      '   - Step 5: Test the Fix',
      '3. ตรวจสอบผลลัพธ์ใน Step 5 - ควรเห็นข้อมูลทุกตาราง',
      '4. Refresh หน้าเว็บ → Student ควรเห็นข้อมูลจริง!',
      '',
      'ผลลัพธ์ที่คาดหวัง:',
      '✅ ทุก Role (รวม Student, Instructor, Admin) เห็นเนื้อหาได้',
      '✅ แค่ Admin เท่านั้นที่สามารถสร้าง/แก้ไข/ลบเนื้อหาได้',
      '✅ Student จะเห็นข้อมูลจริงจาก Database แทน Mock data'
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