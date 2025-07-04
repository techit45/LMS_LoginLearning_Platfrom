import { supabase } from './supabaseClient';

// ==========================================
// DASHBOARD STATISTICS SERVICE
// ==========================================

/**
 * Get comprehensive dashboard statistics for admin
 */
export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard statistics...');

    // Get user statistics
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.warn('Could not fetch user count:', usersError);
    }

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: newUsersWeek, error: newUsersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (newUsersError) {
      console.warn('Could not fetch new users count:', newUsersError);
    }

    // Get course statistics
    const { count: totalCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (coursesError) {
      console.warn('Could not fetch courses count:', coursesError);
    }

    const { count: activeCourses, error: activeCoursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeCoursesError) {
      console.warn('Could not fetch active courses count:', activeCoursesError);
    }

    // Get project statistics
    const { count: totalProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (projectsError) {
      console.warn('Could not fetch projects count:', projectsError);
    }

    const { count: approvedProjects, error: approvedProjectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true);

    if (approvedProjectsError) {
      console.warn('Could not fetch approved projects count:', approvedProjectsError);
    }

    const { count: pendingProjects, error: pendingProjectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false);

    if (pendingProjectsError) {
      console.warn('Could not fetch pending projects count:', pendingProjectsError);
    }

    // Get enrollment statistics
    const { count: totalEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });

    if (enrollmentsError) {
      console.warn('Could not fetch enrollments count:', enrollmentsError);
    }

    // Calculate growth rate (basic calculation)
    const userGrowthRate = totalUsers > 0 ? Math.round((newUsersWeek / totalUsers) * 100) : 0;

    // Get project view statistics
    const { data: projectViewData, error: projectViewError } = await supabase
      .from('projects')
      .select('view_count');

    let totalProjectViews = 0;
    if (!projectViewError && projectViewData) {
      totalProjectViews = projectViewData.reduce((sum, project) => sum + (project.view_count || 0), 0);
    }

    const stats = {
      // User Statistics
      totalUsers: totalUsers || 0,
      activeUsers: Math.round((totalUsers || 0) * 0.15), // Estimated 15% active
      newUsersToday: Math.round((newUsersWeek || 0) / 7), // Estimated daily average
      userGrowth: userGrowthRate,
      newUsersWeek: newUsersWeek || 0,

      // Course Statistics
      totalCourses: totalCourses || 0,
      activeCourses: activeCourses || 0,
      draftCourses: (totalCourses || 0) - (activeCourses || 0),
      courseEnrollments: totalEnrollments || 0,

      // Project Statistics
      totalProjects: totalProjects || 0,
      approvedProjects: approvedProjects || 0,
      pendingApproval: pendingProjects || 0,
      featuredProjects: Math.round((approvedProjects || 0) * 0.2), // Estimated 20% featured
      projectViews: totalProjectViews,

      // System Statistics (Mock for now)
      systemUptime: 99.8,
      serverLoad: Math.round(Math.random() * 30 + 40), // 40-70%
      storageUsed: 2.4,
      activeSessions: Math.round((totalUsers || 0) * 0.1) // Estimated 10% active sessions
    };

    console.log('Dashboard stats calculated:', stats);
    return { data: stats, error: null };

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { 
      data: {
        // Fallback data
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        userGrowth: 0,
        totalCourses: 0,
        activeCourses: 0,
        draftCourses: 0,
        courseEnrollments: 0,
        totalProjects: 0,
        approvedProjects: 0,
        pendingApproval: 0,
        featuredProjects: 0,
        projectViews: 0,
        systemUptime: 0,
        serverLoad: 0,
        storageUsed: 0,
        activeSessions: 0
      }, 
      error 
    };
  }
};

/**
 * Get recent activity for dashboard
 */
export const getRecentActivity = async () => {
  try {
    const activities = [];

    // Get recent user registrations
    const { data: recentUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!usersError && recentUsers) {
      recentUsers.forEach(user => {
        activities.push({
          type: 'user_registration',
          title: 'ผู้ใช้ใหม่ลงทะเบียน',
          description: `${user.full_name || user.email} เข้าร่วมระบบ`,
          timestamp: user.created_at,
          icon: 'user-plus'
        });
      });
    }

    // Get recent course updates
    const { data: recentCourses, error: coursesError } = await supabase
      .from('courses')
      .select('title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3);

    if (!coursesError && recentCourses) {
      recentCourses.forEach(course => {
        activities.push({
          type: 'course_update',
          title: 'คอร์สมีการอัปเดต',
          description: `"${course.title}" ได้รับการปรับปรุง`,
          timestamp: course.updated_at,
          icon: 'book-open'
        });
      });
    }

    // Get recent project submissions
    const { data: recentProjects, error: projectsError } = await supabase
      .from('projects')
      .select('title, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!projectsError && recentProjects) {
      recentProjects.forEach(project => {
        activities.push({
          type: 'project_submission',
          title: 'โครงงานใหม่',
          description: `"${project.title}" ถูกส่งเพื่อขออนุมัติ`,
          timestamp: project.created_at,
          icon: 'folder-plus'
        });
      });
    }

    // Sort by timestamp and return latest 10 activities
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return { data: sortedActivities, error: null };

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return { data: [], error };
  }
};

/**
 * Get system health status
 */
export const getSystemHealth = async () => {
  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const dbStatus = !dbError ? 'healthy' : 'error';

    // Mock other system health checks
    const health = {
      database: {
        status: dbStatus,
        responseTime: Math.round(Math.random() * 50 + 10) // 10-60ms
      },
      storage: {
        status: 'healthy',
        usage: 45 // percentage
      },
      api: {
        status: 'healthy',
        responseTime: Math.round(Math.random() * 100 + 50) // 50-150ms
      },
      overall: dbStatus === 'healthy' ? 'healthy' : 'warning'
    };

    return { data: health, error: null };

  } catch (error) {
    console.error('Error fetching system health:', error);
    return { 
      data: {
        database: { status: 'error', responseTime: 0 },
        storage: { status: 'unknown', usage: 0 },
        api: { status: 'error', responseTime: 0 },
        overall: 'error'
      }, 
      error 
    };
  }
};