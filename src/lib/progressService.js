import { supabase } from "./supabaseClient";

// Progress tracking functions are temporarily disabled

/**
 * Mark content as viewed by the user
 * @param {string} contentId - The content ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const markContentAsViewed = async (contentId) => {
  // Return dummy data to prevent system errors
  return { data: { disabled: true }, error: null };
};

/**
 * Get user progress for a course
 * @param {string} courseId - The course ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const getUserProgress = async (courseId) => {
  // Return dummy data to prevent system errors
  return { data: { disabled: true, completion_percentage: 0, completed: false }, error: null };
};

/**
 * Get user progress for specific content
 * @param {string} contentId - The content ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const getContentProgress = async (contentId) => {
  // Return dummy data to prevent system errors
  return { data: { disabled: true }, error: null };
};

/**
 * Update course completion status
 * @param {string} courseId - The course ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const updateCourseCompletionStatus = async (courseId) => {
  // Return dummy data to prevent system errors
  return { data: { disabled: true, completed: false, completion_percentage: 0 }, error: null };
};

/**
 * Calculate course progress percentage
 * @param {string} courseId - The course ID
 * @returns {Promise<number>} Progress percentage (0-100)
 */
export const calculateCourseProgress = async (courseId) => {
  // Return 0 progress to prevent system errors
  return 0;
};

/**
 * Get all user progress data
 * @param {string} userId - The user ID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export const getAllUserProgress = async (userId) => {
  // Return empty array to prevent system errors
  return { data: [], error: null };
};

/**
 * Reset user progress for a course
 * @param {string} courseId - The course ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const resetCourseProgress = async (courseId) => {
  // Return dummy data to prevent system errors
  return { data: { disabled: true, reset: false }, error: null };
};

export default {
  markContentAsViewed,
  getUserProgress,
  getContentProgress,
  updateCourseCompletionStatus,
  calculateCourseProgress,
  getAllUserProgress,
  resetCourseProgress
};