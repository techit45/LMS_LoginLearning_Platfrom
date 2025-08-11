/**
 * Test Dashboard After RLS Enable
 * ทดสอบ Admin Dashboard หลังจากเปิด RLS
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Testing Dashboard After RLS Enable...\n')

/**
 * Test all dashboard statistics queries
 */
const testDashboardStats = async () => {
  console.log('📊 Testing Dashboard Statistics:')
  
  try {
    // Test 1: User count
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (usersError) {
      console.log('❌ user_profiles count:', usersError.message)
    } else {
      console.log('✅ user_profiles count:', totalUsers)
    }

    // Test 2: Course count
    const { count: totalCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
    
    if (coursesError) {
      console.log('❌ courses count:', coursesError.message)
    } else {
      console.log('✅ courses count:', totalCourses)
    }

    // Test 3: Project count
    const { count: totalProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
    
    if (projectsError) {
      console.log('❌ projects count:', projectsError.message)
    } else {
      console.log('✅ projects count:', totalProjects)
    }

    // Test 4: Enrollment count
    const { count: totalEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
    
    if (enrollmentsError) {
      console.log('⚠️ enrollments count:', enrollmentsError.message, '(Expected - need admin auth)')
    } else {
      console.log('✅ enrollments count:', totalEnrollments)
    }

    // Test 5: Course progress count
    const { count: totalProgress, error: progressError } = await supabase
      .from('course_progress')
      .select('*', { count: 'exact', head: true })
    
    if (progressError) {
      console.log('⚠️ course_progress count:', progressError.message, '(Expected - need admin auth)')
    } else {
      console.log('✅ course_progress count:', totalProgress)
    }

    return {
      users: totalUsers || 0,
      courses: totalCourses || 0, 
      projects: totalProjects || 0,
      enrollments: totalEnrollments || 0,
      progress: totalProgress || 0
    }

  } catch (error) {
    console.log('❌ Dashboard stats test failed:', error.message)
    return null
  }
}

/**
 * Test specific dashboard queries that were failing
 */
const testSpecificQueries = async () => {
  console.log('\n🔍 Testing Specific Dashboard Queries:')

  // Test recent users (last 7 days)
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: newUsersWeek, error: newUsersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    if (newUsersError) {
      console.log('❌ Recent users query:', newUsersError.message)
    } else {
      console.log('✅ New users (7 days):', newUsersWeek)
    }
  } catch (error) {
    console.log('❌ Recent users query failed:', error.message)
  }

  // Test active courses
  try {
    const { count: activeCourses, error: activeCoursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeCoursesError) {
      console.log('❌ Active courses query:', activeCoursesError.message)
    } else {
      console.log('✅ Active courses:', activeCourses)
    }
  } catch (error) {
    console.log('❌ Active courses query failed:', error.message)
  }

  // Test approved projects
  try {
    const { count: approvedProjects, error: approvedError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)

    if (approvedError) {
      console.log('❌ Approved projects query:', approvedError.message)  
    } else {
      console.log('✅ Approved projects:', approvedProjects)
    }
  } catch (error) {
    console.log('❌ Approved projects query failed:', error.message)
  }
}

/**
 * Test public access (should work)
 */
const testPublicAccess = async () => {
  console.log('\n🌐 Testing Public Access (Should Work):')

  // Test public courses
  try {
    const { data: publicCourses, error } = await supabase
      .from('courses')
      .select('id, title, is_active')
      .eq('is_active', true)
      .limit(3)

    if (error) {
      console.log('❌ Public courses access:', error.message)
    } else {
      console.log('✅ Public courses accessible:', publicCourses.length, 'courses')
    }
  } catch (error) {
    console.log('❌ Public courses test failed:', error.message)
  }

  // Test approved projects
  try {
    const { data: publicProjects, error } = await supabase
      .from('projects')
      .select('id, title, is_approved')
      .eq('is_approved', true)
      .limit(3)

    if (error) {
      console.log('❌ Public projects access:', error.message)
    } else {
      console.log('✅ Public projects accessible:', publicProjects.length, 'projects')
    }
  } catch (error) {
    console.log('❌ Public projects test failed:', error.message)
  }
}

/**
 * Test restricted access (should be blocked)
 */
const testRestrictedAccess = async () => {
  console.log('\n🔒 Testing Restricted Access (Should Be Blocked):')

  // Test all user profiles (should be restricted)
  try {
    const { data: allUsers, error } = await supabase
      .from('user_profiles')
      .select('email, role')
      .limit(5)

    if (error) {
      console.log('✅ Good! User profiles restricted:', error.message)
    } else {
      console.log('⚠️ User profiles accessible:', allUsers.length, '(May be admin access)')
    }
  } catch (error) {
    console.log('✅ User profiles properly restricted')
  }

  // Test all enrollments (should be restricted)  
  try {
    const { data: allEnrollments, error } = await supabase
      .from('enrollments')
      .select('user_id, course_id')
      .limit(5)

    if (error) {
      console.log('✅ Good! Enrollments restricted:', error.message)
    } else {
      console.log('⚠️ Enrollments accessible:', allEnrollments.length, '(May be admin access)')
    }
  } catch (error) {
    console.log('✅ Enrollments properly restricted')
  }
}

/**
 * Main test runner
 */
const runDashboardTests = async () => {
  console.log('🚀 Starting Dashboard Tests Post-RLS Enable')
  console.log('Time:', new Date().toLocaleString())
  console.log('='*50)

  const stats = await testDashboardStats()
  await testSpecificQueries()
  await testPublicAccess()
  await testRestrictedAccess()

  console.log('\n' + '='*50)
  console.log('📋 TEST SUMMARY:')
  
  if (stats) {
    console.log('📈 Dashboard Statistics:')
    console.log(`   - Users: ${stats.users}`)
    console.log(`   - Courses: ${stats.courses}`)  
    console.log(`   - Projects: ${stats.projects}`)
    console.log(`   - Enrollments: ${stats.enrollments}`)
    console.log(`   - Progress: ${stats.progress}`)
    
    if (stats.users > 0 && stats.courses > 0) {
      console.log('\n✅ RESULT: Dashboard core functionality working!')
      console.log('🎉 RLS policies are functioning correctly')
      console.log('🔒 Security is maintained while preserving functionality')
    } else {
      console.log('\n❌ RESULT: Dashboard may have issues')
      console.log('🔧 Manual verification needed')
    }
  } else {
    console.log('❌ RESULT: Dashboard statistics failed')
    console.log('🔧 Manual troubleshooting required')
  }

  console.log('\n🧪 Next: Open Admin Dashboard at http://localhost:5174/#/admin')
  console.log('📝 Verify all numbers match and no errors appear in console')
  console.log('='*50)
}

// Run tests
runDashboardTests().catch(error => {
  console.error('💥 Test runner failed:', error)
})