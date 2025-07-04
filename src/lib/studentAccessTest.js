// Student Access Test - ทดสอบการเข้าถึงเนื้อหาสำหรับนักเรียน
import { supabase } from './supabaseClient';

/**
 * ทดสอบการเข้าถึงคอร์สและเนื้อหาสำหรับนักเรียน
 */
export const testStudentAccess = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  const addTest = (name, status, message, data = null) => {
    results.tests.push({ name, status, message, data });
    results.summary[status]++;
  };

  try {
    console.log('🔍 Starting Student Access Tests...');

    // Test 1: User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      addTest('User Authentication', 'failed', 'User not authenticated', authError);
      return results;
    }
    addTest('User Authentication', 'passed', `Authenticated as: ${user.email}`, { userId: user.id });

    // Test 2: User Profile Access
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      addTest('User Profile Access', 'failed', 'Cannot access user profile', profileError);
    } else if (!profile) {
      addTest('User Profile Access', 'warnings', 'No user profile found - need to create one');
    } else {
      addTest('User Profile Access', 'passed', `Profile found with role: ${profile.role}`, { role: profile.role });
    }

    // Test 3: Course List Access (Public)
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, is_active')
      .eq('is_active', true)
      .limit(5);

    if (coursesError) {
      addTest('Course List Access', 'failed', 'Cannot access course list', coursesError);
    } else {
      addTest('Course List Access', 'passed', `Can access ${courses.length} active courses`, { courseCount: courses.length });
    }

    // Test 4: User Enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        is_active,
        progress_percentage,
        enrolled_at,
        courses(title, is_active)
      `)
      .eq('user_id', user.id);

    if (enrollmentError) {
      addTest('User Enrollments', 'failed', 'Cannot access user enrollments', enrollmentError);
    } else {
      addTest('User Enrollments', 'passed', `Found ${enrollments.length} enrollments`, { 
        enrollmentCount: enrollments.length,
        enrollments: enrollments.map(e => ({ 
          courseTitle: e.courses?.title, 
          isActive: e.is_active,
          progress: e.progress_percentage 
        }))
      });
    }

    // Test 5: Course Content Access (for enrolled courses)
    if (enrollments && enrollments.length > 0) {
      const testEnrollment = enrollments[0];
      const { data: content, error: contentError } = await supabase
        .from('course_content')
        .select('id, title, content_type, is_preview, order_index')
        .eq('course_id', testEnrollment.course_id)
        .order('order_index');

      if (contentError) {
        addTest('Enrolled Course Content Access', 'failed', 'Cannot access course content for enrolled course', {
          error: contentError,
          courseId: testEnrollment.course_id,
          courseTitle: testEnrollment.courses?.title
        });
      } else {
        addTest('Enrolled Course Content Access', 'passed', `Can access ${content.length} content items for enrolled course`, {
          courseTitle: testEnrollment.courses?.title,
          contentCount: content.length,
          previewItems: content.filter(c => c.is_preview).length,
          regularItems: content.filter(c => !c.is_preview).length
        });
      }
    } else {
      addTest('Enrolled Course Content Access', 'warnings', 'No enrollments found to test content access');
    }

    // Test 6: Preview Content Access (for non-enrolled courses)
    if (courses && courses.length > 0) {
      // Find a course user is not enrolled in
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      const nonEnrolledCourse = courses.find(c => !enrolledCourseIds.includes(c.id));

      if (nonEnrolledCourse) {
        const { data: previewContent, error: previewError } = await supabase
          .from('course_content')
          .select('id, title, content_type, is_preview')
          .eq('course_id', nonEnrolledCourse.id)
          .eq('is_preview', true);

        if (previewError) {
          addTest('Preview Content Access', 'failed', 'Cannot access preview content for non-enrolled course', {
            error: previewError,
            courseId: nonEnrolledCourse.id,
            courseTitle: nonEnrolledCourse.title
          });
        } else {
          addTest('Preview Content Access', 'passed', `Can access ${previewContent.length} preview items for non-enrolled course`, {
            courseTitle: nonEnrolledCourse.title,
            previewCount: previewContent.length
          });
        }

        // Test 7: Restricted Content Access (should fail)
        const { data: restrictedContent, error: restrictedError } = await supabase
          .from('course_content')
          .select('id, title, content_type, is_preview')
          .eq('course_id', nonEnrolledCourse.id)
          .eq('is_preview', false);

        if (restrictedError || !restrictedContent || restrictedContent.length === 0) {
          addTest('Restricted Content Access (Should Fail)', 'passed', 'Correctly blocked access to non-preview content', {
            courseTitle: nonEnrolledCourse.title,
            blockedItems: restrictedError ? 'Error (as expected)' : 'Empty result (as expected)'
          });
        } else {
          addTest('Restricted Content Access (Should Fail)', 'failed', 'SECURITY ISSUE: Can access restricted content for non-enrolled course!', {
            courseTitle: nonEnrolledCourse.title,
            leakedContent: restrictedContent.length
          });
        }
      } else {
        addTest('Preview Content Access', 'warnings', 'User is enrolled in all available courses - cannot test non-enrolled access');
      }
    }

    // Test 8: Progress Tracking
    if (enrollments && enrollments.length > 0) {
      const testEnrollment = enrollments[0];
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', testEnrollment.course_id);

      if (progressError) {
        addTest('Progress Tracking', 'failed', 'Cannot access progress data', progressError);
      } else {
        addTest('Progress Tracking', 'passed', `Found ${progress.length} progress records`, {
          courseTitle: testEnrollment.courses?.title,
          progressCount: progress.length
        });
      }
    }

  } catch (error) {
    addTest('General Test Execution', 'failed', 'Unexpected error during testing', error);
  }

  console.log('📊 Student Access Test Results:', results);
  return results;
};

/**
 * แสดงผลการทดสอบในรูปแบบที่อ่านง่าย
 */
export const displayTestResults = (results) => {
  console.log('🎯 Student Access Test Summary:');
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️ Warnings: ${results.summary.warnings}`);
  console.log('');

  results.tests.forEach(test => {
    const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
    console.log(`${icon} ${test.name}: ${test.message}`);
    if (test.data) {
      console.log('   Data:', test.data);
    }
  });

  return results;
};

/**
 * ฟังก์ชันสำหรับ Admin ทดสอบ RLS policies
 */
export const adminTestRLSPolicies = async () => {
  console.log('🔐 Admin RLS Policy Test - Running comprehensive security checks...');
  
  try {
    // Test current user context
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Testing with user:', user?.email, 'Role check needed...');

    // Test 1: Can admin see all courses?
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, is_active, instructor_id');

    console.log('Admin course access:', {
      success: !coursesError,
      courseCount: allCourses?.length,
      error: coursesError?.message
    });

    // Test 2: Can admin see all enrollments?
    const { data: allEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, is_active')
      .limit(10);

    console.log('Admin enrollment access:', {
      success: !enrollmentsError,
      enrollmentCount: allEnrollments?.length,
      error: enrollmentsError?.message
    });

    // Test 3: Can admin see all course content?
    const { data: allContent, error: contentError } = await supabase
      .from('course_content')
      .select('id, course_id, title, is_preview')
      .limit(10);

    console.log('Admin content access:', {
      success: !contentError,
      contentCount: allContent?.length,
      error: contentError?.message
    });

    return {
      courses: { success: !coursesError, count: allCourses?.length, error: coursesError },
      enrollments: { success: !enrollmentsError, count: allEnrollments?.length, error: enrollmentsError },
      content: { success: !contentError, count: allContent?.length, error: contentError }
    };

  } catch (error) {
    console.error('Admin RLS test failed:', error);
    return { error };
  }
};

export default { testStudentAccess, displayTestResults, adminTestRLSPolicies };