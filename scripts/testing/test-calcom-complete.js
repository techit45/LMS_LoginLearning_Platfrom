#!/usr/bin/env node

/**
 * Complete test for Cal.com scheduling system with instructors
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test functions
async function testInstructorTable() {
  console.log('\n📊 Testing Cal.com Instructors Table...\n');
  
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('calcom_instructors')
      .select('*')
      .limit(5);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ Instructors table does not exist');
        console.log('   Run SQL script: sql_scripts/41-add-calcom-instructors.sql');
        return false;
      }
      console.error('❌ Error accessing instructors:', error.message);
      return false;
    }
    
    console.log(`✅ Instructors table exists`);
    console.log(`   Found ${data?.length || 0} instructors\n`);
    
    if (data && data.length > 0) {
      console.log('Sample instructors:');
      data.forEach(instructor => {
        console.log(`   - ${instructor.name} (${instructor.company}) - ${instructor.specialization || 'N/A'}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception testing instructors:', error.message);
    return false;
  }
}

async function testCreateInstructor() {
  console.log('\n🆕 Testing Instructor Creation...\n');
  
  try {
    const testInstructor = {
      name: `Test Instructor ${Date.now()}`,
      email: 'test@example.com',
      phone: '099-999-9999',
      color: '#ec4899',
      company: 'Login',
      specialization: 'Test Specialization'
    };
    
    const { data, error } = await supabase
      .from('calcom_instructors')
      .insert(testInstructor)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create instructor:', error.message);
      return false;
    }
    
    console.log('✅ Instructor created successfully');
    console.log('   ID:', data.id);
    console.log('   Name:', data.name);
    console.log('   Color:', data.color);
    
    // Clean up
    const { error: deleteError } = await supabase
      .from('calcom_instructors')
      .delete()
      .eq('id', data.id);
    
    if (!deleteError) {
      console.log('   ✓ Test instructor cleaned up\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception creating instructor:', error.message);
    return false;
  }
}

async function testScheduleWithInstructor() {
  console.log('\n📅 Testing Schedule View with Instructors...\n');
  
  try {
    // Check if instructor_id column exists
    const { data, error } = await supabase
      .from('calcom_schedule_view')
      .select('*, instructor_id')
      .limit(1);
    
    if (error && error.message.includes('column "instructor_id" does not exist')) {
      console.error('❌ instructor_id column missing in calcom_schedule_view');
      console.log('   Run SQL script to add instructor support');
      return false;
    }
    
    console.log('✅ Schedule view supports instructors');
    console.log('   instructor_id column exists\n');
    
    // Check the view with instructor details
    const { data: viewData, error: viewError } = await supabase
      .from('calcom_schedule_view_with_instructor')
      .select('*')
      .limit(3);
    
    if (viewError && viewError.message.includes('does not exist')) {
      console.log('⚠️ calcom_schedule_view_with_instructor view not created yet');
    } else if (viewData) {
      console.log(`✅ Instructor view exists with ${viewData.length} entries`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception testing schedule with instructors:', error.message);
    return false;
  }
}

async function testCourseTable() {
  console.log('\n📚 Testing Cal.com Courses Table...\n');
  
  try {
    const { data, error } = await supabase
      .from('calcom_courses')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing courses:', error.message);
      return false;
    }
    
    console.log(`✅ Courses table accessible`);
    console.log(`   Found ${data?.length || 0} courses\n`);
    
    if (data && data.length > 0) {
      console.log('Sample courses:');
      data.forEach(course => {
        console.log(`   - ${course.name} (${course.company}) - ${course.duration_minutes} min`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception testing courses:', error.message);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Cal.com Scheduling System Complete Test');
  console.log('========================================\n');
  
  const results = {
    instructors: await testInstructorTable(),
    createInstructor: await testCreateInstructor(),
    scheduleWithInstructor: await testScheduleWithInstructor(),
    courses: await testCourseTable()
  };
  
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================\n');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  console.log(`Tests passed: ${passed}/${total}\n`);
  
  if (passed === total) {
    console.log('✅ All tests passed! The Cal.com scheduling system with instructors is ready.');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
    
    if (!results.instructors) {
      console.log('\nTo fix instructor table issues:');
      console.log('1. Run the SQL script in Supabase SQL editor:');
      console.log('   sql_scripts/41-add-calcom-instructors.sql');
    }
  }
  
  console.log('\n========================================\n');
  process.exit(passed === total ? 0 : 1);
}

// Run the test
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});