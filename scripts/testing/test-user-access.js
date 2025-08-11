/**
 * User Access Testing Script
 * ทดสอบการเข้าถึงข้อมูลของ student, instructor, admin
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test users from database
const testUsers = {
  student: {
    email: 'pethj02@gmail.com',
    role: 'student'
  },
  instructor: {
    email: 'techit45t@gmail.com', 
    role: 'instructor'
  },
  admin: {
    email: 'techit.y@login-learning.com',
    role: 'admin'
  }
}

/**
 * Test student access patterns
 */
const testStudentAccess = async () => {
  console.log('\n🎓 Testing Student Access...');
  
  try {
    // Test 1: Can student view courses?
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, is_active')
      .limit(3);
    
    console.log('✅ Student can view courses:', !coursesError, courses?.length || 0);
    if (coursesError) console.log('❌ Courses error:', coursesError.message);

    // Test 2: Can student view their enrollments?
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, course_id, enrolled_at')
      .limit(3);
    
    console.log('✅ Student can view enrollments:', !enrollError, enrollments?.length || 0);
    if (enrollError) console.log('❌ Enrollments error:', enrollError.message);

    // Test 3: Can student view their progress?
    const { data: progress, error: progressError } = await supabase
      .from('course_progress')
      .select('id, course_id, progress_value')
      .limit(3);
    
    console.log('✅ Student can view progress:', !progressError, progress?.length || 0);
    if (progressError) console.log('❌ Progress error:', progressError.message);

  } catch (error) {
    console.log('❌ Student access test failed:', error.message);
  }
};

/**
 * Test instructor access patterns
 */
const testInstructorAccess = async () => {
  console.log('\n👨‍🏫 Testing Instructor Access...');
  
  try {
    // Test 1: Can instructor view all enrollments (for courses they teach)?
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, progress_percentage')
      .limit(5);
    
    console.log('✅ Instructor can view enrollments:', !enrollError, enrollments?.length || 0);
    if (enrollError) console.log('❌ Enrollments error:', enrollError.message);

    // Test 2: Can instructor view student progress?
    const { data: progress, error: progressError } = await supabase
      .from('course_progress')
      .select('id, user_id, course_id, completed')
      .limit(5);
    
    console.log('✅ Instructor can view student progress:', !progressError, progress?.length || 0);
    if (progressError) console.log('❌ Progress error:', progressError.message);

    // Test 3: Can instructor view user profiles (students)?
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('role', 'student');
    
    console.log('✅ Instructor can view student profiles:', !studentsError, students?.length || 0);
    if (studentsError) console.log('❌ Students error:', studentsError.message);

  } catch (error) {
    console.log('❌ Instructor access test failed:', error.message);
  }
};

/**
 * Test admin access patterns
 */
const testAdminAccess = async () => {
  console.log('\n👨‍💼 Testing Admin Access...');
  
  try {
    // Test 1: Can admin access dashboard stats?
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Admin can count users:', !usersError, totalUsers || 0);
    if (usersError) console.log('❌ Users count error:', usersError.message);

    // Test 2: Can admin access all tables?
    const tables = ['courses', 'projects', 'enrollments', 'course_progress'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`✅ Admin can access ${table}:`, !error, count || 0);
      if (error) console.log(`❌ ${table} error:`, error.message);
    }

  } catch (error) {
    console.log('❌ Admin access test failed:', error.message);
  }
};

/**
 * Test RLS policies effectiveness
 */
const testRLSPolicies = async () => {
  console.log('\n🔒 Testing RLS Policies...');
  
  try {
    // Test without authentication (should be limited)
    const { data: publicCourses, error: publicError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_active', true);
    
    console.log('✅ Public access to courses:', !publicError, publicCourses?.length || 0);
    
    // Test sensitive data access (should be blocked for anon)
    const { data: sensitiveData, error: sensitiveError } = await supabase
      .from('user_profiles')
      .select('email, role')
      .limit(1);
    
    console.log('🔒 Anonymous access to user profiles:', !sensitiveError, sensitiveData?.length || 0);
    if (sensitiveError) console.log('✅ Good! Sensitive data blocked:', sensitiveError.message);

  } catch (error) {
    console.log('❌ RLS test failed:', error.message);
  }
};

/**
 * Main test runner
 */
const runAccessTests = async () => {
  console.log('🧪 Starting User Access Tests...');
  console.log('Current Environment:', supabaseUrl);
  
  await testStudentAccess();
  await testInstructorAccess(); 
  await testAdminAccess();
  await testRLSPolicies();
  
  console.log('\n✅ Access tests completed!');
  console.log('\nNote: These tests run with anon key - actual user session tests require authentication');
};

// Run tests
runAccessTests().catch(console.error);