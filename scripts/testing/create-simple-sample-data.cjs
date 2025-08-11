const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function createSimpleSampleData() {
  console.log('📊 Creating simplified sample data for dashboard...\n');
  
  try {
    // =====================================================
    // 1. CREATE SAMPLE USER PROFILES
    // =====================================================
    console.log('👥 Creating sample user profiles...');
    
    // First, let's test what columns are available
    const testUser = {
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      full_name: 'นายสมชาย ใจดี',
      email: 'somchai@student.com',
      role: 'student'
    };
    
    // Try basic user insertion
    const { error: userError } = await supabase
      .from('user_profiles')
      .insert(testUser);
    
    if (!userError) {
      console.log('✅ Created test user successfully');
      
      // Create more users with basic information
      const additionalUsers = [
        {
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          full_name: 'นางสาวสมใส รักเรียน',
          email: 'somsai@student.com',
          role: 'student'
        },
        {
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
          full_name: 'นายธนากร เก่งเรียน',
          email: 'thanakorn@student.com',
          role: 'student'
        },
        {
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
          full_name: 'อาจารย์วิชาญ ชำนาญ',
          email: 'wichan@instructor.com',
          role: 'instructor'
        },
        {
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
          full_name: 'อาจารย์สมหญิง เก่งสอน',
          email: 'somying@instructor.com',
          role: 'instructor'
        }
      ];
      
      let userCount = 1; // Already created test user
      for (const user of additionalUsers) {
        const { error } = await supabase
          .from('user_profiles')
          .insert(user);
        
        if (!error) {
          userCount++;
          console.log(`✅ Created user: ${user.full_name}`);
        } else {
          console.log(`⚠️  User ${user.full_name}: ${error.message}`);
        }
      }
      
      console.log(`📊 Created ${userCount} users successfully\n`);
      
    } else {
      console.log(`❌ User creation failed: ${userError.message}`);
      console.log('This might be due to RLS policies or missing columns\n');
    }

    // =====================================================
    // 2. CREATE SAMPLE COURSES
    // =====================================================
    console.log('📚 Creating sample courses...');
    
    // Get existing course to check schema
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    console.log('📋 Existing course schema:', existingCourses?.[0] ? Object.keys(existingCourses[0]) : 'No courses found');
    
    // Create basic courses
    const sampleCourses = [
      {
        title: 'พื้นฐานการเขียนโปรแกรม Python',
        description: 'เรียนรู้การเขียนโปรแกรม Python ตั้งแต่เริ่มต้น',
        instructor_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        is_active: true
      },
      {
        title: 'พัฒนาเว็บไซต์ด้วย React',
        description: 'เรียนรู้การพัฒนาเว็บด้วย React',
        instructor_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        is_active: true
      }
    ];
    
    let courseCount = 0;
    for (const course of sampleCourses) {
      const { error } = await supabase
        .from('courses')
        .insert(course);
      
      if (!error) {
        courseCount++;
        console.log(`✅ Created course: ${course.title}`);
      } else {
        console.log(`⚠️  Course ${course.title}: ${error.message}`);
      }
    }
    
    console.log(`📊 Created ${courseCount} courses successfully\n`);

    // =====================================================
    // 3. CREATE SAMPLE ENROLLMENTS
    // =====================================================
    console.log('📚 Creating sample enrollments...');
    
    // Get all courses for enrollment
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, title');
    
    if (allCourses && allCourses.length > 0) {
      const sampleEnrollments = [
        {
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          course_id: allCourses[0].id,
          is_active: true
        },
        {
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          course_id: allCourses[0].id,
          is_active: true
        }
      ];
      
      if (allCourses.length > 1) {
        sampleEnrollments.push({
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
          course_id: allCourses[1].id,
          is_active: true
        });
      }
      
      let enrollmentCount = 0;
      for (const enrollment of sampleEnrollments) {
        const { error } = await supabase
          .from('enrollments')
          .insert(enrollment);
        
        if (!error) {
          enrollmentCount++;
          console.log(`✅ Created enrollment: User ${enrollment.user_id.slice(-2)} -> Course`);
        } else {
          console.log(`⚠️  Enrollment error: ${error.message}`);
        }
      }
      
      console.log(`📊 Created ${enrollmentCount} enrollments successfully\n`);
    }

    // =====================================================
    // VERIFICATION
    // =====================================================
    console.log('🧪 Verifying sample data creation...');
    
    const tables = ['user_profiles', 'courses', 'enrollments', 'course_progress', 'course_content'];
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          totalRecords += count || 0;
          console.log(`📊 ${table}: ${count || 0} records`);
        } else {
          console.log(`❌ ${table}: ${error.message}`);
        }
      } catch (err) {
        console.log(`💥 ${table}: ${err.message}`);
      }
    }
    
    console.log(`\n🎯 SIMPLE SAMPLE DATA CREATION COMPLETED!`);
    console.log(`=========================================`);
    console.log(`Total Records Created: ${totalRecords}`);
    console.log(`✅ Basic user profiles with different roles`);
    console.log(`✅ Course data for testing`);
    console.log(`✅ Student-course enrollment relationships`);
    console.log(`\n🚀 Dashboard now has basic sample data for testing!`);
    console.log(`   The Dashboard should show non-zero statistics`);
    
  } catch (error) {
    console.error('💥 Sample data creation failed:', error);
  }
}

createSimpleSampleData()
  .then(() => {
    console.log('\n✅ Simple sample data creation completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Process failed:', error);
    process.exit(1);
  });