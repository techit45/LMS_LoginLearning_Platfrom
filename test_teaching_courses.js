// Test script for teaching courses system
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testTeachingCourses() {
  try {
    console.log('🧪 Testing Teaching Courses System...\n');
    
    // Test 1: Check teaching_courses table
    console.log('📚 Testing teaching_courses table...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('teaching_courses')
      .select('*')
      .limit(5);
      
    if (coursesError) {
      console.log('❌ teaching_courses table:', coursesError.message);
      if (coursesError.message.includes('relation "teaching_courses" does not exist')) {
        console.log('💡 Please run TEACHING_COURSES_SETUP.sql first');
      }
    } else {
      console.log('✅ teaching_courses table: Accessible');
      console.log(`📊 Sample courses: ${coursesData?.length || 0}`);
      if (coursesData && coursesData.length > 0) {
        console.log('Sample course:', coursesData[0]);
      }
    }
    
    // Test 2: Check instructor_profiles view
    console.log('\n👨‍🏫 Testing instructor_profiles view...');
    const { data: instructorsData, error: instructorsError } = await supabase
      .from('instructor_profiles')
      .select('*')
      .limit(3);
      
    if (instructorsError) {
      console.log('❌ instructor_profiles view:', instructorsError.message);
    } else {
      console.log('✅ instructor_profiles view: Accessible');
      console.log(`👥 Available instructors: ${instructorsData?.length || 0}`);
      if (instructorsData && instructorsData.length > 0) {
        console.log('Sample instructors:');
        instructorsData.forEach((instructor, i) => {
          console.log(`  ${i + 1}. ${instructor.full_name || instructor.email} (${instructor.role})`);
        });
      }
    }
    
    // Test 3: Check weekly_schedules table
    console.log('\n📅 Testing weekly_schedules table...');
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .limit(1);
      
    if (schedulesError) {
      console.log('❌ weekly_schedules table:', schedulesError.message);
    } else {
      console.log('✅ weekly_schedules table: Accessible');
      console.log(`📋 Current schedules: ${schedulesData?.length || 0}`);
    }
    
    console.log('\n🎯 Test complete!');
    
    if (coursesError || instructorsError || schedulesError) {
      console.log('\n⚠️  Some components need setup:');
      console.log('1. Run TEACHING_COURSES_SETUP.sql in Supabase Dashboard');
      console.log('2. Make sure you have instructor users with proper roles');
    } else {
      console.log('\n✅ All systems ready!');
      console.log('🚀 Teaching Schedule System is operational');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error);
  }
}

testTeachingCourses();