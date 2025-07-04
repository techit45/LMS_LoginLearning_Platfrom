// Quick Fix for Student Loading Issues
import { supabase } from './supabaseClient';

/**
 * ตรวจสอบการเชื่อมต่อ Supabase และปัญหาการโหลด
 */
export const diagnoseStudentLoadingIssues = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    issues: [],
    recommendations: []
  };

  console.log('🔍 Diagnosing Student Loading Issues...');

  try {
    // Test 1: Supabase Connection
    console.log('Testing Supabase connection...');
    const startTime = Date.now();
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const connectionTime = Date.now() - startTime;
      
      results.tests.push({
        name: 'Supabase Connection',
        status: authError ? 'failed' : 'passed',
        time: `${connectionTime}ms`,
        details: authError || 'Connection successful'
      });

      if (connectionTime > 3000) {
        results.issues.push('Slow Supabase connection detected');
        results.recommendations.push('Check network connection or Supabase status');
      }

    } catch (error) {
      results.tests.push({
        name: 'Supabase Connection',
        status: 'failed',
        details: error.message
      });
      results.issues.push('Cannot connect to Supabase');
    }

    // Test 2: Featured Courses Query
    console.log('Testing featured courses query...');
    const coursesStartTime = Date.now();
    
    try {
      // Simple query without complex joins
      const { data: courses, error: coursesError } = await Promise.race([
        supabase
          .from('courses')
          .select('id, title, description, is_active, is_featured')
          .eq('is_active', true)
          .limit(3),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        )
      ]);

      const coursesTime = Date.now() - coursesStartTime;
      
      results.tests.push({
        name: 'Featured Courses Query',
        status: coursesError ? 'failed' : 'passed',
        time: `${coursesTime}ms`,
        count: courses?.length || 0,
        details: coursesError || 'Query successful'
      });

      if (coursesTime > 2000) {
        results.issues.push('Slow courses query detected');
        results.recommendations.push('Consider using simpler queries or caching');
      }

    } catch (error) {
      results.tests.push({
        name: 'Featured Courses Query',
        status: 'failed',
        details: error.message
      });
      results.issues.push('Cannot load courses data');
    }

    // Test 3: Featured Projects Query  
    console.log('Testing featured projects query...');
    const projectsStartTime = Date.now();
    
    try {
      const { data: projects, error: projectsError } = await Promise.race([
        supabase
          .from('projects')
          .select('id, title, description, is_approved, is_featured')
          .eq('is_approved', true)
          .limit(3),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        )
      ]);

      const projectsTime = Date.now() - projectsStartTime;
      
      results.tests.push({
        name: 'Featured Projects Query',
        status: projectsError ? 'failed' : 'passed',
        time: `${projectsTime}ms`,
        count: projects?.length || 0,
        details: projectsError || 'Query successful'
      });

      if (projectsTime > 2000) {
        results.issues.push('Slow projects query detected');
        results.recommendations.push('Consider using simpler queries or caching');
      }

    } catch (error) {
      results.tests.push({
        name: 'Featured Projects Query',
        status: 'failed',
        details: error.message
      });
      results.issues.push('Cannot load projects data');
    }

    // Test 4: RLS Policies
    console.log('Testing RLS policies...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Test user can read their own profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id, role')
          .eq('user_id', user.id)
          .maybeSingle();

        results.tests.push({
          name: 'User Profile Access',
          status: profileError ? 'failed' : 'passed',
          hasProfile: !!profile,
          role: profile?.role || 'unknown',
          details: profileError || 'Profile access successful'
        });

        if (!profile) {
          results.issues.push('User profile not found');
          results.recommendations.push('Create user profile or check RLS policies');
        }
      }
    } catch (error) {
      results.tests.push({
        name: 'User Profile Access',
        status: 'failed',
        details: error.message
      });
    }

  } catch (error) {
    results.issues.push(`Unexpected error: ${error.message}`);
  }

  // Summary and recommendations
  const failedTests = results.tests.filter(t => t.status === 'failed').length;
  
  if (failedTests > 0) {
    results.recommendations.push('Check Supabase configuration and RLS policies');
    results.recommendations.push('Verify environment variables are set correctly');
  }

  if (results.issues.length > 0) {
    results.recommendations.push('Use fallback data to prevent blank screens');
    results.recommendations.push('Implement proper error handling and loading states');
  }

  console.log('🎯 Diagnosis Complete:', results);
  return results;
};

/**
 * เรียกข้อมูลแบบเร่งด่วนด้วย fallback data
 */
export const getEmergencyData = () => {
  console.log('🚑 Loading emergency fallback data...');
  
  return {
    courses: [
      {
        id: 'emergency-course-1',
        title: 'React เบื้องต้น',
        description: 'เรียนรู้ React ตั้งแต่พื้นฐาน',
        category: 'การเขียนโปรแกรม',
        level: 'beginner',
        price: 0,
        duration_hours: 10,
        thumbnail_url: '/images/placeholder.png',
        instructor_name: 'ครูผู้สอน',
        enrolled_count: 25,
        rating: 4.5,
        is_active: true,
        is_featured: true
      },
      {
        id: 'emergency-course-2',
        title: 'วิศวกรรมเคมี',
        description: 'พื้นฐานวิศวกรรมเคมี',
        category: 'วิศวกรรม',
        level: 'beginner',
        price: 1500,
        duration_hours: 15,
        thumbnail_url: '/images/placeholder.png',
        instructor_name: 'ครูผู้สอน',
        enrolled_count: 18,
        rating: 4.3,
        is_active: true,
        is_featured: true
      },
      {
        id: 'emergency-course-3',
        title: 'IoT และการประยุกต์',
        description: 'Internet of Things พื้นฐาน',
        category: 'เทคโนโลยี',
        level: 'intermediate',
        price: 2000,
        duration_hours: 20,
        thumbnail_url: '/images/placeholder.png',
        instructor_name: 'ครูผู้สอน',
        enrolled_count: 32,
        rating: 4.7,
        is_active: true,
        is_featured: true
      }
    ],
    projects: [
      {
        id: 'emergency-project-1',
        title: 'ระบบรดน้ำอัตโนมัติ',
        description: 'โครงงาน IoT ระบบรดน้ำต้นไม้อัตโนมัติ',
        category: 'iot',
        difficulty_level: 'intermediate',
        cover_image_url: '/images/project-placeholder.svg',
        created_by: 'นักเรียน',
        view_count: 156,
        like_count: 23,
        technologies: ['Arduino', 'ESP32'],
        is_featured: true,
        is_approved: true
      },
      {
        id: 'emergency-project-2',
        title: 'AI จำแนกขยะ',
        description: 'ระบบ AI สำหรับจำแนกประเภทขยะ',
        category: 'ai',
        difficulty_level: 'advanced',
        cover_image_url: '/images/project-placeholder.svg',
        created_by: 'นักเรียน',
        view_count: 234,
        like_count: 45,
        technologies: ['Python', 'TensorFlow'],
        is_featured: true,
        is_approved: true
      },
      {
        id: 'emergency-project-3',
        title: 'ฟาร์มไฮโดรโปนิก',
        description: 'ระบบควบคุมฟาร์มไฮโดรโปนิกอัตโนมัติ',
        category: 'agriculture',
        difficulty_level: 'intermediate',
        cover_image_url: '/images/project-placeholder.svg',
        created_by: 'นักเรียน',
        view_count: 189,
        like_count: 28,
        technologies: ['Arduino', 'Sensors'],
        is_featured: true,
        is_approved: true
      }
    ]
  };
};

export default { diagnoseStudentLoadingIssues, getEmergencyData };