import { supabase } from "./supabaseClient";

// ตัดฟังก์ชัน progress tracking ออกไปก่อน - ไม่ต้องใช้งาน
// /**
//  * Mark content as viewed by the user
//  * @param {string} contentId - The content ID
//  * @returns {Promise<{data: Object, error: Error}>}
//  */
export const markContentAsViewed = async (contentId) => {
  // ส่งคืนค่าเพื่อไม่ให้ระบบเสีย แต่ไม่ทำอะไร
  return { data: { disabled: true }, error: null };
  /*
  try {
    if (!contentId) {
      return { data: null, error: new Error("Content ID is required") };
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return { data: null, error: new Error("Authentication required") };
    }

    // Check if progress record exists
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("content_id", contentId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = not found
      return { data: null, error: checkError };
    }

    let result;
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from("user_progress")
        .update({
          viewed: true,
          view_count: (existingProgress.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new progress record
      const { data, error } = await supabase
        .from("user_progress")
        .insert({
          user_id: user.id,
          content_id: contentId,
          viewed: true,
          view_count: 1,
          last_viewed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      result = { data, error };
    }

    return result;
  } catch (error) {
    console.error("Error in markContentAsViewed:", error);
    return { data: null, error };
  }
};

/**
 * Get user's progress for a specific course
 * @param {string} courseId - The course ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const getUserCourseProgress = async (courseId) => {
  // ตัดฟังก์ชัน progress tracking ออกไปก่อน - ไม่ต้องใช้งาน
  return { data: { disabled: true, completion_percentage: 0, completed: false }, error: null };
  /*
  try {
    if (!courseId) {
      return { data: null, error: new Error("Course ID is required") };
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return { data: null, error: new Error("Authentication required") };
    }

    // Get all content items for the course
    const { data: contentItems, error: contentError } = await supabase
      .from("course_content")
      .select("id, title, content_type")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (contentError) {
      return { data: null, error: contentError };
    }

    // Get user progress for all content items
    const { data: progressData, error: progressError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .in(
        "content_id",
        contentItems.map((item) => item.id)
      );

    if (progressError) {
      return { data: null, error: progressError };
    }

    // Create a map of content ID to progress
    const progressMap = {};
    progressData?.forEach((progress) => {
      progressMap[progress.content_id] = progress;
    });

    // Calculate overall progress
    const totalItems = contentItems.length;
    const viewedItems = progressData?.filter((p) => p.viewed).length || 0;
    const completedItems = progressData?.filter((p) => p.completed).length || 0;

    // Calculate percentage
    const viewPercentage =
      totalItems > 0 ? Math.round((viewedItems / totalItems) * 100) : 0;
    const completionPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Create detailed progress data
    const detailedProgress = contentItems.map((item) => ({
      content_id: item.id,
      title: item.title,
      content_type: item.content_type,
      viewed: !!progressMap[item.id]?.viewed,
      completed: !!progressMap[item.id]?.completed,
      score: progressMap[item.id]?.score || null,
      total_score: progressMap[item.id]?.total_score || null,
      last_viewed_at: progressMap[item.id]?.last_viewed_at || null,
    }));

    return {
      data: {
        course_id: courseId,
        total_items: totalItems,
        viewed_items: viewedItems,
        completed_items: completedItems,
        view_percentage: viewPercentage,
        completion_percentage: completionPercentage,
        detailed_progress: detailedProgress,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in getUserCourseProgress:", error);
    return { data: null, error };
  }
};

/**
 * Update user's progress for a specific content item
 * @param {string} contentId - The content ID
 * @param {Object} progressData - The progress data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const updateContentProgress = async (contentId, progressData) => {
  // ตัดฟังก์ชัน progress tracking ออกไปก่อน - ไม่ต้องใช้งาน
  return { data: { disabled: true }, error: null };
  /*
  try {
    if (!contentId) {
      return { data: null, error: new Error("Content ID is required") };
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return { data: null, error: new Error("Authentication required") };
    }

    // Check if progress record exists
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("content_id", contentId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = not found
      return { data: null, error: checkError };
    }

    let result;
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from("user_progress")
        .update({
          ...progressData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new progress record
      const { data, error } = await supabase
        .from("user_progress")
        .insert({
          user_id: user.id,
          content_id: contentId,
          ...progressData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      result = { data, error };
    }

    // If this content is marked as completed, update course completion status
    if (progressData.completed) {
      // Get the course ID for this content
      const { data: contentData } = await supabase
        .from("course_content")
        .select("course_id")
        .eq("id", contentId)
        .single();

      if (contentData?.course_id) {
        // Update course completion status
        await updateCourseCompletionStatus(contentData.course_id);
      }
    }

    return result;
  } catch (error) {
    console.error("Error in updateContentProgress:", error);
    return { data: null, error };
  }
};

/**
 * Update course completion status based on content progress
 * @param {string} courseId - The course ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
const updateCourseCompletionStatus = async (courseId) => {
  try {
    if (!courseId) {
      return { data: null, error: new Error("Course ID is required") };
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return { data: null, error: new Error("Authentication required") };
    }

    // Get course progress
    const { data: progressData, error: progressError } =
      await getUserCourseProgress(courseId);
    if (progressError) {
      return { data: null, error: progressError };
    }

    // Check if all required items are completed
    const isCompleted = progressData.completion_percentage >= 100;

    // Update enrollment record
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from("course_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (enrollmentError && enrollmentError.code !== "PGRST116") {
      return { data: null, error: enrollmentError };
    }

    let result;
    if (enrollmentData) {
      // Update existing enrollment
      const { data, error } = await supabase
        .from("course_enrollments")
        .update({
          completed: isCompleted,
          completion_percentage: progressData.completion_percentage,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollmentData.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new enrollment record
      const { data, error } = await supabase
        .from("course_enrollments")
        .insert({
          user_id: user.id,
          course_id: courseId,
          completed: isCompleted,
          completion_percentage: progressData.completion_percentage,
          completed_at: isCompleted ? new Date().toISOString() : null,
          enrolled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      result = { data, error };
    }

    return result;
  } catch (error) {
    console.error("Error in updateCourseCompletionStatus:", error);
    return { data: null, error };
  }
  */
  // ตัดฟังก์ชัน progress tracking ออกไปก่อน - ไม่ต้องใช้งาน
  return { data: { disabled: true, completed: false, completion_percentage: 0 }, error: null };
};
