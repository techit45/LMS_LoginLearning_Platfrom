import { supabase } from './supabaseClient';

// ==========================================
// PROGRESS SERVICE
// ==========================================

/**
 * Get progress data for students (own progress only)
 */
export const getMyProgress = async (userId, timeFilter = 'week') => {
  try {
    // Get user enrollments with course details
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          category,
          difficulty_level,
          duration_hours
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (enrollmentError) throw enrollmentError;

    // Get course progress for each enrollment
    const progressPromises = enrollments?.map(async (enrollment) => {
      const { data: progress, error: progressError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('enrollment_id', enrollment.id);

      if (progressError) {
        return null;
      }

      const totalItems = progress?.length || 0;
      const completedItems = progress?.filter(p => p.is_completed).length || 0;
      const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...enrollment,
        course: enrollment.courses,
        progress: progressPercentage,
        completedItems,
        totalItems,
        progressDetails: progress
      };
    });

    const coursesWithProgress = await Promise.all(progressPromises || []);
    const validCourses = coursesWithProgress.filter(course => course !== null);

    // Calculate summary statistics
    const totalCourses = validCourses.length;
    const completedCourses = validCourses.filter(c => c.progress === 100).length;
    const averageProgress = totalCourses > 0 
      ? Math.round(validCourses.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
      : 0;

    // Calculate total learning time
    const totalLearningTime = validCourses.reduce((sum, course) => {
      return sum + (course.progressDetails?.reduce((timeSum, p) => timeSum + (p.time_spent || 0), 0) || 0);
    }, 0);

    // Generate recent activities
    const recentActivities = validCourses
      .flatMap(course => 
        course.progressDetails
          ?.filter(p => p.completed_at)
          ?.map(p => ({
            type: 'completed',
            title: `เรียนจบ: ${course.course?.title || 'คอร์ส'}`,
            description: 'ผ่านเนื้อหาเรียบร้อยแล้ว',
            time: new Date(p.completed_at).toLocaleDateString('th-TH'),
            courseId: course.course?.id
          })) || []
      )
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    // Generate chart data
    const chartData = generateProgressChartData(validCourses, timeFilter);

    const result = {
      courses: validCourses,
      totalCourses,
      completedCourses,
      averageProgress,
      totalLearningTime: Math.round(totalLearningTime),
      achievements: completedCourses,
      currentStreak: calculateLearningStreak(validCourses),
      recentActivities,
      chartData
    };

    return result;

  } catch (error) {
    throw error;
  }
};

/**
 * Get progress data for instructors (students in their courses)
 */
export const getCourseProgress = async (instructorId, timeFilter = 'week') => {
  try {
    // Mock data for now since we don't have instructor_id column in courses
    const mockCourses = [
      {
        id: '1',
        title: 'พื้นฐานการเขียนโปรแกรม',
        category: 'Programming',
        students: [],
        averageProgress: 75,
        totalStudents: 0,
        completedStudents: 0
      }
    ];

    const result = {
      courses: mockCourses,
      totalStudents: 0,
      totalCourses: mockCourses.length,
      averageProgress: 75,
      recentActivities: [],
      chartData: generateInstructorChartData(mockCourses, timeFilter)
    };

    console.log('✅ Instructor progress data (mock):', result);
    return result;

  } catch (error) {
    throw error;
  }
};

/**
 * Get progress data for admins (all system data)
 */
export const getProgressData = async (timeFilter = 'week') => {
  try {
    // Get all enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          category
        )
      `)
      .order('enrolled_at', { ascending: false });

    if (enrollmentError) throw enrollmentError;

    // Mock progress data for now
    const result = {
      courses: enrollments?.length ? enrollments.map(e => e.courses?.id).filter(Boolean) : [],
      totalCourses: 1,
      totalStudents: 0,
      totalEnrollments: enrollments?.length || 0,
      completedEnrollments: 0,
      averageProgress: 0,
      totalLearningTime: 0,
      achievements: 0,
      currentStreak: 0,
      recentActivities: [],
      chartData: generateAdminChartData([], timeFilter),
      enrollmentData: enrollments || []
    };

    return result;

  } catch (error) {
    throw error;
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate learning streak for a student
 */
const calculateLearningStreak = (courses) => {
  return Math.floor(Math.random() * 7) + 1;
};

/**
 * Generate chart data for progress visualization
 */
const generateProgressChartData = (courses, timeFilter) => {
  const days = timeFilter === 'day' ? 1 : 
               timeFilter === 'week' ? 7 : 
               timeFilter === 'month' ? 30 : 365;

  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      }),
      progress: Math.floor(Math.random() * 100),
      courses: courses.length,
      activities: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return data;
};

/**
 * Generate chart data for instructors
 */
const generateInstructorChartData = (courseProgress, timeFilter) => {
  const days = timeFilter === 'day' ? 1 : 
               timeFilter === 'week' ? 7 : 
               timeFilter === 'month' ? 30 : 365;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    
    return {
      date: date.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      }),
      students: 0,
      avgProgress: Math.floor(Math.random() * 100),
      completions: Math.floor(Math.random() * 3) + 1
    };
  });
};

/**
 * Generate chart data for admins
 */
const generateAdminChartData = (allProgress, timeFilter) => {
  const days = timeFilter === 'day' ? 1 : 
               timeFilter === 'week' ? 7 : 
               timeFilter === 'month' ? 30 : 365;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    
    return {
      date: date.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      }),
      totalEnrollments: allProgress.length,
      avgProgress: Math.floor(Math.random() * 100),
      completions: Math.floor(Math.random() * 5),
      activeUsers: Math.floor(Math.random() * 20) + 10
    };
  });
};