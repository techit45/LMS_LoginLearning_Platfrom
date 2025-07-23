import { supabase } from "./supabaseClient";

// ==========================================
// TESTING UTILITIES
// ฟังก์ชันสำหรับทดสอบระบบและวินิจฉัยปัญหา
// ==========================================

/**
 * ฟังก์ชันทดสอบสิทธิ์การเข้าถึงสำหรับ Student
 */
export const testStudentAccess = async () => {
  const results = {
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  console.log("🔍 Starting Student Access Tests...");

  try {
    // Test 1: ทดสอบการเข้าถึงคอร์สเรียน
    console.log("Testing course access...");
    try {
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, is_active")
        .eq("is_active", true)
        .limit(5);

      results.tests.push({
        name: "Course Access",
        status: coursesError ? "failed" : "passed",
        details: coursesError
          ? coursesError.message
          : `Found ${courses?.length || 0} active courses`,
        data: courses?.length || 0,
      });

      if (!coursesError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Course Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 2: ทดสอบการเข้าถึงโปรเจค
    console.log("Testing project access...");
    try {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, is_approved")
        .eq("is_approved", true)
        .limit(5);

      results.tests.push({
        name: "Project Access",
        status: projectsError ? "failed" : "passed",
        details: projectsError
          ? projectsError.message
          : `Found ${projects?.length || 0} approved projects`,
        data: projects?.length || 0,
      });

      if (!projectsError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Project Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 3: ทดสอบการเข้าถึงเนื้อหาคอร์ส
    console.log("Testing course content access...");
    try {
      const { data: content, error: contentError } = await supabase
        .from("course_content")
        .select("id, title, course_id")
        .limit(5);

      results.tests.push({
        name: "Course Content Access",
        status: contentError ? "failed" : "passed",
        details: contentError
          ? contentError.message
          : `Found ${content?.length || 0} content items`,
        data: content?.length || 0,
      });

      if (!contentError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Course Content Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 4: ทดสอบการเข้าถึงข้อมูลผู้ใช้
    console.log("Testing user profile access...");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id, full_name, role")
          .eq("user_id", user.id)
          .maybeSingle();

        results.tests.push({
          name: "User Profile Access",
          status: profileError ? "failed" : "passed",
          details: profileError
            ? profileError.message
            : profile
            ? `Profile found for user: ${profile.role}`
            : "No profile found",
          hasProfile: !!profile,
          role: profile?.role || "unknown",
        });

        if (!profileError) results.summary.passed++;
        else results.summary.failed++;
      } else {
        results.tests.push({
          name: "User Profile Access",
          status: "warning",
          details: "No authenticated user - cannot test profile access",
        });
        results.summary.warnings++;
      }
    } catch (error) {
      results.tests.push({
        name: "User Profile Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.push({
      name: "General Access Test",
      status: "failed",
      details: `Unexpected error: ${error.message}`,
    });
    results.summary.failed++;
  }

  console.log("🎯 Student Access Tests Complete");
  return results;
};

/**
 * ฟังก์ชันทดสอบ RLS Policies สำหรับ Admin
 */
export const adminTestRLSPolicies = async () => {
  const results = {
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  console.log("🔐 Starting Admin RLS Policy Tests...");

  try {
    // Test 1: ทดสอบการเข้าถึงข้อมูลผู้ใช้ทั้งหมด (Admin only)
    console.log("Testing admin user access...");
    try {
      const { data: users, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, full_name, role, created_at")
        .limit(10);

      results.tests.push({
        name: "Admin User Access",
        status: usersError ? "failed" : "passed",
        details: usersError
          ? usersError.message
          : `Found ${users?.length || 0} user profiles`,
        data: users?.length || 0,
      });

      if (!usersError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Admin User Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 2: ทดสอบการเข้าถึงคอร์สที่ไม่ active (Admin only)
    console.log("Testing admin inactive course access...");
    try {
      const { data: inactiveCourses, error: inactiveCoursesError } =
        await supabase
          .from("courses")
          .select("id, title, is_active")
          .eq("is_active", false)
          .limit(5);

      results.tests.push({
        name: "Admin Inactive Course Access",
        status: inactiveCoursesError ? "failed" : "passed",
        details: inactiveCoursesError
          ? inactiveCoursesError.message
          : `Found ${inactiveCourses?.length || 0} inactive courses`,
        data: inactiveCourses?.length || 0,
      });

      if (!inactiveCoursesError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Admin Inactive Course Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 3: ทดสอบการเข้าถึงข้อมูลการลงทะเบียน
    console.log("Testing admin enrollment access...");
    try {
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("id, user_id, course_id, is_active")
        .limit(10);

      results.tests.push({
        name: "Admin Enrollment Access",
        status: enrollmentsError ? "failed" : "passed",
        details: enrollmentsError
          ? enrollmentsError.message
          : `Found ${enrollments?.length || 0} enrollments`,
        data: enrollments?.length || 0,
      });

      if (!enrollmentsError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Admin Enrollment Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 4: ทดสอบการเข้าถึงโปรเจคที่ยังไม่อนุมัติ
    console.log("Testing admin unapproved project access...");
    try {
      const { data: unapprovedProjects, error: unapprovedError } =
        await supabase
          .from("projects")
          .select("id, title, is_approved")
          .eq("is_approved", false)
          .limit(5);

      results.tests.push({
        name: "Admin Unapproved Project Access",
        status: unapprovedError ? "failed" : "passed",
        details: unapprovedError
          ? unapprovedError.message
          : `Found ${unapprovedProjects?.length || 0} unapproved projects`,
        data: unapprovedProjects?.length || 0,
      });

      if (!unapprovedError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Admin Unapproved Project Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.push({
      name: "General Admin Access Test",
      status: "failed",
      details: `Unexpected error: ${error.message}`,
    });
    results.summary.failed++;
  }

  console.log("🔐 Admin RLS Policy Tests Complete");
  return results;
};

/**
 * ฟังก์ชันแสดงผลการทดสอบ
 */
export const displayTestResults = (results) => {
  console.log("\n=== 📊 TEST RESULTS ===");
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️ Warnings: ${results.summary.warnings}`);
  console.log("\n=== 📋 DETAILED RESULTS ===");

  results.tests.forEach((test, index) => {
    const statusIcon =
      test.status === "passed" ? "✅" : test.status === "failed" ? "❌" : "⚠️";
    console.log(`${index + 1}. ${statusIcon} ${test.name}`);
    console.log(`   Details: ${test.details}`);
    if (test.data !== undefined) {
      console.log(`   Data Count: ${test.data}`);
    }
    if (test.hasProfile !== undefined) {
      console.log(`   Has Profile: ${test.hasProfile}`);
    }
    if (test.role) {
      console.log(`   User Role: ${test.role}`);
    }
    console.log("");
  });

  // Recommendations
  if (results.summary.failed > 0) {
    console.log("\n=== 🔧 RECOMMENDATIONS ===");
    console.log("1. Check Supabase configuration and RLS policies");
    console.log("2. Verify environment variables are set correctly");
    console.log("3. Ensure database tables exist and have proper structure");
    console.log("4. Check user authentication and permissions");
  }

  return results;
};

/**
 * ฟังก์ชันสร้าง SQL Fix Commands
 */
export const getSQLFixCommands = () => {
  const sqlCommands = `
-- ==========================================
-- SQL FIX COMMANDS FOR STUDENT ACCESS
-- Copy and run these commands in Supabase SQL Editor
-- ==========================================

-- 1. Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone to view active courses
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
CREATE POLICY "Anyone can view active courses" ON courses
  FOR SELECT USING (is_active = true);

-- 3. Allow anyone to view approved projects
DROP POLICY IF EXISTS "Anyone can view approved projects" ON projects;
CREATE POLICY "Anyone can view approved projects" ON projects
  FOR SELECT USING (is_approved = true);

-- 4. Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Allow students to view course content they're enrolled in
DROP POLICY IF EXISTS "Students can view enrolled course content" ON course_content;
CREATE POLICY "Students can view enrolled course content" ON course_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = course_content.course_id
      AND enrollments.user_id = auth.uid()
      AND enrollments.is_active = true
    ) OR
    is_free_preview = true
  );

-- 8. Allow users to view their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments
  FOR SELECT USING (user_id = auth.uid());

-- 9. Allow users to create their own enrollments
DROP POLICY IF EXISTS "Users can create own enrollments" ON enrollments;
CREATE POLICY "Users can create own enrollments" ON enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 10. Admin policies - Allow admins to view all data
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
CREATE POLICY "Admins can view all courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
CREATE POLICY "Admins can manage all projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up2
      WHERE up2.user_id = auth.uid() 
      AND up2.role IN ('admin', 'instructor')
    )
  );

-- 11. Performance indexes
CREATE INDEX IF NOT EXISTS idx_courses_active_featured ON courses(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_approved_featured ON projects(is_approved, is_featured);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_course_content_course ON course_content(course_id);

-- 12. Update table statistics
ANALYZE courses;
ANALYZE projects;
ANALYZE user_profiles;
ANALYZE enrollments;
ANALYZE course_content;

-- ==========================================
-- VERIFICATION QUERIES
-- Run these to verify the fixes worked
-- ==========================================

-- Check if policies are enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('courses', 'projects', 'user_profiles', 'enrollments', 'course_content');

-- Check active courses count
SELECT COUNT(*) as active_courses FROM courses WHERE is_active = true;

-- Check approved projects count  
SELECT COUNT(*) as approved_projects FROM projects WHERE is_approved = true;

-- Check user profiles count
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Check enrollments count
SELECT COUNT(*) as total_enrollments FROM enrollments;
`;

  return sqlCommands;
};

/**
 * ฟังก์ชันทดสอบการเชื่อมต่อ Storage
 */
export const testStorageAccess = async () => {
  const results = {
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  console.log("💾 Starting Storage Access Tests...");

  try {
    // Test 1: ทดสอบการเข้าถึง Storage Buckets
    console.log("Testing storage bucket access...");
    try {
      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();

      results.tests.push({
        name: "Storage Bucket Access",
        status: bucketsError ? "failed" : "passed",
        details: bucketsError
          ? bucketsError.message
          : `Found ${buckets?.length || 0} storage buckets`,
        data: buckets?.map((b) => b.name) || [],
      });

      if (!bucketsError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Storage Bucket Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 2: ทดสอบการเข้าถึง course-files bucket
    console.log("Testing course-files bucket...");
    try {
      const { data: files, error: filesError } = await supabase.storage
        .from("course-files")
        .list("", { limit: 5 });

      results.tests.push({
        name: "Course Files Bucket Access",
        status: filesError ? "failed" : "passed",
        details: filesError
          ? filesError.message
          : `Bucket accessible, found ${files?.length || 0} items`,
        data: files?.length || 0,
      });

      if (!filesError) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Course Files Bucket Access",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.push({
      name: "General Storage Test",
      status: "failed",
      details: `Unexpected error: ${error.message}`,
    });
    results.summary.failed++;
  }

  console.log("💾 Storage Access Tests Complete");
  return results;
};

/**
 * ฟังก์ชันทดสอบการทำงานของ Authentication
 */
export const testAuthenticationFlow = async () => {
  const results = {
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  console.log("🔐 Starting Authentication Flow Tests...");

  try {
    // Test 1: ทดสอบการดึงข้อมูลผู้ใช้ปัจจุบัน
    console.log("Testing current user session...");
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      results.tests.push({
        name: "Current User Session",
        status: userError ? "failed" : user ? "passed" : "warning",
        details: userError
          ? userError.message
          : user
          ? `User authenticated: ${user.email}`
          : "No authenticated user",
        hasUser: !!user,
        userEmail: user?.email || null,
      });

      if (!userError && user) results.summary.passed++;
      else if (!userError && !user) results.summary.warnings++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Current User Session",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }

    // Test 2: ทดสอบการดึงข้อมูล Session
    console.log("Testing session data...");
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      results.tests.push({
        name: "Session Data",
        status: sessionError ? "failed" : session ? "passed" : "warning",
        details: sessionError
          ? sessionError.message
          : session
          ? "Valid session found"
          : "No active session",
        hasSession: !!session,
        expiresAt: session?.expires_at || null,
      });

      if (!sessionError && session) results.summary.passed++;
      else if (!sessionError && !session) results.summary.warnings++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Session Data",
        status: "failed",
        details: `Exception: ${error.message}`,
      });
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.push({
      name: "General Authentication Test",
      status: "failed",
      details: `Unexpected error: ${error.message}`,
    });
    results.summary.failed++;
  }

  console.log("🔐 Authentication Flow Tests Complete");
  return results;
};

/**
 * ฟังก์ชันรวมทดสอบทั้งหมด
 */
export const runAllTests = async () => {
  console.log("🚀 Starting Comprehensive System Tests...");

  const allResults = {
    timestamp: new Date().toISOString(),
    tests: {
      studentAccess: null,
      adminRLS: null,
      storage: null,
      authentication: null,
    },
    summary: {
      totalPassed: 0,
      totalFailed: 0,
      totalWarnings: 0,
    },
  };

  try {
    // Run all test suites
    allResults.tests.studentAccess = await testStudentAccess();
    allResults.tests.adminRLS = await adminTestRLSPolicies();
    allResults.tests.storage = await testStorageAccess();
    allResults.tests.authentication = await testAuthenticationFlow();

    // Calculate totals
    Object.values(allResults.tests).forEach((testSuite) => {
      if (testSuite && testSuite.summary) {
        allResults.summary.totalPassed += testSuite.summary.passed;
        allResults.summary.totalFailed += testSuite.summary.failed;
        allResults.summary.totalWarnings += testSuite.summary.warnings;
      }
    });

    console.log("\n🎯 COMPREHENSIVE TEST RESULTS");
    console.log("================================");
    console.log(`✅ Total Passed: ${allResults.summary.totalPassed}`);
    console.log(`❌ Total Failed: ${allResults.summary.totalFailed}`);
    console.log(`⚠️ Total Warnings: ${allResults.summary.totalWarnings}`);
    console.log(
      `📊 Success Rate: ${Math.round(
        (allResults.summary.totalPassed /
          (allResults.summary.totalPassed +
            allResults.summary.totalFailed +
            allResults.summary.totalWarnings)) *
          100
      )}%`
    );
  } catch (error) {
    console.error("Error running comprehensive tests:", error);
  }

  return allResults;
};

export default {
  testStudentAccess,
  adminTestRLSPolicies,
  displayTestResults,
  getSQLFixCommands,
  testStorageAccess,
  testAuthenticationFlow,
  runAllTests,
};
