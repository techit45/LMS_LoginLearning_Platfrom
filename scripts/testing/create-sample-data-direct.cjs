const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function createDirectSampleData() {
  console.log('📊 Creating sample data using direct API calls...\n');
  
  try {
    // =====================================================
    // 1. CREATE SAMPLE USER PROFILES
    // =====================================================
    console.log('👥 Creating sample user profiles...');
    
    const sampleUsers = [
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        full_name: 'นายสมชาย ใจดี',
        email: 'somchai@student.com',
        role: 'student',
        phone: '081-234-5678',
        bio: 'นักเรียนชั้น ม.6 สนใจด้านคอมพิวเตอร์',
        location: 'กรุงเทพฯ'
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        full_name: 'นางสาวสมใส รักเรียน',
        email: 'somsai@student.com',
        role: 'student',
        phone: '089-876-5432',
        bio: 'หลงใหลในการออกแบบเว็บไซต์',
        location: 'เชียงใหม่'
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        full_name: 'นายธนากร เก่งเรียน',
        email: 'thanakorn@student.com',
        role: 'student',
        phone: '092-555-7777',
        bio: 'ชอบเขียนโปรแกรม Python',
        location: 'ขอนแก่น'
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        full_name: 'อาจารย์วิชาญ ชำนาญ',
        email: 'wichan@instructor.com',
        role: 'instructor',
        phone: '081-999-8888',
        bio: 'อาจารย์สอนการเขียนโปรแกรม',
        location: 'กรุงเทพฯ'
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        full_name: 'อาจารย์สมหญิง เก่งสอน',
        email: 'somying@instructor.com',
        role: 'instructor',
        phone: '089-777-6666',
        bio: 'ผู้เชี่ยวชาญด้าน Web Development',
        location: 'กรุงเทพฯ'
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
        full_name: 'ผู้ดูแลระบบ แอดมิน',
        email: 'admin@loginlearning.com',
        role: 'admin',
        phone: '081-000-1111',
        bio: 'ผู้ดูแลระบบ Login Learning Platform',
        location: 'กรุงเทพฯ'
      }
    ];
    
    let userCount = 0;
    for (const user of sampleUsers) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .insert(user);
        
        if (!error) {
          userCount++;
          console.log(`✅ Created user: ${user.full_name} (${user.role})`);
        } else {
          console.log(`⚠️  User ${user.full_name}: ${error.message}`);
        }
      } catch (err) {
        console.log(`💥 User ${user.full_name}: ${err.message}`);
      }
    }
    
    console.log(`📊 Created ${userCount} users successfully\n`);
    
    // =====================================================
    // 2. CREATE SAMPLE COURSES
    // =====================================================
    console.log('📚 Creating sample courses...');
    
    const instructorId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'; // วิชาญ
    const instructor2Id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'; // สมหญิง
    
    const sampleCourses = [
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        title: 'พื้นฐานการเขียนโปรแกรม Python',
        description: 'เรียนรู้การเขียนโปรแกรม Python ตั้งแต่เริ่มต้น เหมาะสำหรับผู้เริ่มต้น ครอบคลุมตั้งแต่ syntax พื้นฐานไปจนถึงการสร้างโปรเจคจริง',
        instructor_id: instructorId,
        is_active: true,
        difficulty_level: 'beginner',
        duration_hours: 40
      },
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        title: 'พัฒนาเว็บไซต์ด้วย React และ Node.js',
        description: 'เรียนรู้การพัฒนาเว็บแอพพลิเคชันแบบ Full Stack ด้วย React สำหรับ Frontend และ Node.js สำหรับ Backend รวมถึงการจัดการฐานข้อมูล',
        instructor_id: instructor2Id,
        is_active: true,
        difficulty_level: 'intermediate',
        duration_hours: 60
      },
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        title: 'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง',
        description: 'ทำความเข้าใจหลักการพื้นฐานของ AI และ Machine Learning พร้อมการปฏิบัติจริงด้วย Python และ TensorFlow',
        instructor_id: instructorId,
        is_active: true,
        difficulty_level: 'advanced',
        duration_hours: 80
      }
    ];
    
    let courseCount = 0;
    for (const course of sampleCourses) {
      try {
        const { error } = await supabase
          .from('courses')
          .upsert(course);
        
        if (!error) {
          courseCount++;
          console.log(`✅ Created course: ${course.title}`);
        } else {
          console.log(`⚠️  Course ${course.title}: ${error.message}`);
        }
      } catch (err) {
        console.log(`💥 Course ${course.title}: ${err.message}`);
      }
    }
    
    console.log(`📊 Created/Updated ${courseCount} courses successfully\n`);
    
    // =====================================================
    // 3. CREATE SAMPLE COURSE CONTENT
    // =====================================================
    console.log('📖 Creating sample course content...');
    
    const sampleContent = [
      {
        id: 'cc0ebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        title: 'บทที่ 1: รู้จักกับ Python',
        content_type: 'lesson',
        content: 'Python เป็นภาษาโปรแกรมมิ่งที่เรียนรู้ง่าย เหมาะสำหรับผู้เริ่มต้น ในบทเรียนนี้เราจะมาทำความรู้จักกับ Python กัน...',
        order_index: 1,
        is_free: true,
        is_preview: true,
        duration_minutes: 45
      },
      {
        id: 'cc0ebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        title: 'บทที่ 2: ตัวแปรและข้อมูล',
        content_type: 'lesson',
        content: 'การใช้งานตัวแปรใน Python และชนิดข้อมูลต่างๆ เช่น string, integer, float, boolean...',
        order_index: 2,
        is_free: false,
        is_preview: true,
        duration_minutes: 50
      },
      {
        id: 'cc0ebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        title: 'บทนำ: ทำความรู้จัก React',
        content_type: 'lesson',
        content: 'React เป็น JavaScript Library สำหรับสร้าง User Interface ที่ได้รับความนิยมสูง...',
        order_index: 1,
        is_free: true,
        is_preview: true,
        duration_minutes: 40
      }
    ];
    
    let contentCount = 0;
    for (const content of sampleContent) {
      try {
        const { error } = await supabase
          .from('course_content')
          .upsert(content);
        
        if (!error) {
          contentCount++;
          console.log(`✅ Created content: ${content.title}`);
        } else {
          console.log(`⚠️  Content ${content.title}: ${error.message}`);
        }
      } catch (err) {
        console.log(`💥 Content ${content.title}: ${err.message}`);
      }
    }
    
    console.log(`📊 Created ${contentCount} course content items successfully\n`);
    
    // =====================================================
    // 4. CREATE SAMPLE ENROLLMENTS
    // =====================================================
    console.log('📚 Creating sample enrollments...');
    
    const sampleEnrollments = [
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        progress: 85.5,
        is_active: true
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        progress: 45.2,
        is_active: true
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        progress: 92.0,
        is_active: true
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        progress: 15.8,
        is_active: true
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        progress: 78.3,
        is_active: true
      }
    ];
    
    let enrollmentCount = 0;
    for (const enrollment of sampleEnrollments) {
      try {
        const { error } = await supabase
          .from('enrollments')
          .upsert(enrollment);
        
        if (!error) {
          enrollmentCount++;
          console.log(`✅ Created enrollment: User ${enrollment.user_id.slice(-2)} -> Course ${enrollment.course_id.slice(-2)}`);
        } else {
          console.log(`⚠️  Enrollment error: ${error.message}`);
        }
      } catch (err) {
        console.log(`💥 Enrollment exception: ${err.message}`);
      }
    }
    
    console.log(`📊 Created ${enrollmentCount} enrollments successfully\n`);
    
    // =====================================================
    // 5. CREATE SAMPLE COURSE PROGRESS
    // =====================================================
    console.log('📈 Creating sample course progress...');
    
    const sampleProgress = [
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        content_id: 'cc0ebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        progress_type: 'content',
        progress_value: 100.0,
        completed: true,
        time_spent: 2700
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        content_id: 'cc0ebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        progress_type: 'content',
        progress_value: 75.5,
        completed: false,
        time_spent: 2100
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        content_id: 'cc0ebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        progress_type: 'content',
        progress_value: 100.0,
        completed: true,
        time_spent: 2850
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        course_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        content_id: 'cc0ebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        progress_type: 'content',
        progress_value: 85.0,
        completed: false,
        time_spent: 1800
      }
    ];
    
    let progressCount = 0;
    for (const progress of sampleProgress) {
      try {
        const { error } = await supabase
          .from('course_progress')
          .upsert(progress);
        
        if (!error) {
          progressCount++;
          console.log(`✅ Created progress: ${progress.progress_value}% for user ${progress.user_id.slice(-2)}`);
        } else {
          console.log(`⚠️  Progress error: ${error.message}`);
        }
      } catch (err) {
        console.log(`💥 Progress exception: ${err.message}`);
      }
    }
    
    console.log(`📊 Created ${progressCount} progress records successfully\n`);
    
    // =====================================================
    // VERIFICATION
    // =====================================================
    console.log('🧪 Verifying sample data creation...');
    
    const tables = [
      'user_profiles',
      'courses',
      'course_content', 
      'enrollments',
      'course_progress'
    ];
    
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
    
    console.log(`\n🎯 SAMPLE DATA CREATION COMPLETED!`);
    console.log(`=====================================`);
    console.log(`Total Records Created: ${totalRecords}`);
    console.log(`✅ Users: Students, Instructors, Admin`);
    console.log(`✅ Courses: Python, React, AI/ML`);
    console.log(`✅ Course Content: Lessons and materials`);
    console.log(`✅ Enrollments: Student-course relationships`);
    console.log(`✅ Progress: Learning progress tracking`);
    console.log(`\n🚀 Dashboard is now ready with realistic sample data!`);
    console.log(`   Visit your dashboard to see the populated analytics`);
    
  } catch (error) {
    console.error('💥 Sample data creation failed:', error);
  }
}

createDirectSampleData()
  .then(() => {
    console.log('\n✅ Sample data creation process completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Process failed:', error);
    process.exit(1);
  });