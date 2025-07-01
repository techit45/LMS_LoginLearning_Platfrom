import { supabase } from './supabaseClient';

// ==========================================
// FORUM SERVICE - API functions for discussion forum
// ==========================================

// ==========================================
// FORUM CATEGORIES
// ==========================================

/**
 * Get all categories for a course
 */
export const getCourseCategories = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course categories:', error);
    return { data: null, error };
  }
};

/**
 * Create a new forum category (Instructor only)
 */
export const createCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return { data: null, error };
  }
};

// ==========================================
// FORUM TOPICS
// ==========================================

/**
 * Get topics for a course with pagination and filtering
 */
export const getCourseTopics = async (courseId, options = {}) => {
  try {
    const {
      categoryId = null,
      topicType = null,
      search = null,
      sortBy = 'last_activity_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = options;

    // First get topics only
    let query = supabase
      .from('forum_topics')
      .select('*')
      .eq('course_id', courseId);

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (topicType) {
      query = query.eq('topic_type', topicType);
    }

    if (search) {
      query = query.textSearch('search_vector', search);
    }

    // Apply sorting
    query = query.order('is_pinned', { ascending: false });
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: topics, error, count } = await query;

    if (error) throw error;

    if (!topics || topics.length === 0) {
      return {
        data: [],
        error: null,
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false
        }
      };
    }

    // Get unique author IDs and category IDs
    const authorIds = [...new Set(topics.map(t => t.author_id).filter(Boolean))];
    const categoryIds = [...new Set(topics.map(t => t.category_id).filter(Boolean))];

    // Get user profiles
    let userProfiles = {};
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, user_role')
        .in('user_id', authorIds);
      
      if (profiles) {
        profiles.forEach(profile => {
          userProfiles[profile.user_id] = profile;
        });
      }
    }

    // Get categories
    let categories = {};
    if (categoryIds.length > 0) {
      const { data: cats } = await supabase
        .from('forum_categories')
        .select('id, name')
        .in('id', categoryIds);
      
      if (cats) {
        cats.forEach(cat => {
          categories[cat.id] = cat;
        });
      }
    }

    // Combine data
    const enrichedTopics = topics.map(topic => ({
      ...topic,
      user_profiles: userProfiles[topic.author_id] || null,
      forum_categories: categories[topic.category_id] || null
    }));

    return {
      data: enrichedTopics,
      error: null,
      pagination: {
        page,
        limit,
        total: count,
        hasMore: count > to + 1
      }
    };
  } catch (error) {
    console.error('Error fetching course topics:', error);
    return { data: null, error, pagination: null };
  }
};

/**
 * Get a single topic with replies
 */
export const getTopicWithReplies = async (topicId) => {
  try {
    // First get the topic
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError) throw topicError;

    // Get topic author profile
    let topicAuthorProfile = null;
    if (topic.author_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, user_role')
        .eq('user_id', topic.author_id)
        .single();
      topicAuthorProfile = profile;
    }

    // Get topic category
    let topicCategory = null;
    if (topic.category_id) {
      const { data: category } = await supabase
        .from('forum_categories')
        .select('id, name')
        .eq('id', topic.category_id)
        .single();
      topicCategory = category;
    }

    // Get course info
    let courseInfo = null;
    if (topic.course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', topic.course_id)
        .single();
      courseInfo = course;
    }

    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    // Get reply authors
    let replyProfiles = {};
    if (replies && replies.length > 0) {
      const authorIds = [...new Set(replies.map(r => r.author_id).filter(Boolean))];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url, user_role')
          .in('user_id', authorIds);
        
        if (profiles) {
          profiles.forEach(profile => {
            replyProfiles[profile.user_id] = profile;
          });
        }
      }
    }

    // Enrich replies with user profiles
    const enrichedReplies = (replies || []).map(reply => ({
      ...reply,
      user_profiles: replyProfiles[reply.author_id] || null
    }));

    // Update view count
    await incrementTopicViewCount(topicId);

    // Combine all data
    const enrichedTopic = {
      ...topic,
      user_profiles: topicAuthorProfile,
      forum_categories: topicCategory,
      courses: courseInfo,
      replies: enrichedReplies
    };

    return {
      data: enrichedTopic,
      error: null
    };
  } catch (error) {
    console.error('Error fetching topic with replies:', error);
    return { data: null, error };
  }
};

/**
 * Create a new topic
 */
export const createTopic = async (topicData) => {
  try {
    const currentUser = await supabase.auth.getUser();
    const userId = currentUser.data.user?.id;

    const { data: topic, error } = await supabase
      .from('forum_topics')
      .insert([{
        ...topicData,
        author_id: userId
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Get user profile
    let userProfile = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, user_role')
        .eq('user_id', userId)
        .single();
      userProfile = profile;
    }

    // Get category
    let category = null;
    if (topic.category_id) {
      const { data: cat } = await supabase
        .from('forum_categories')
        .select('id, name')
        .eq('id', topic.category_id)
        .single();
      category = cat;
    }

    // Combine data
    const enrichedTopic = {
      ...topic,
      user_profiles: userProfile,
      forum_categories: category
    };

    return { data: enrichedTopic, error: null };
  } catch (error) {
    console.error('Error creating topic:', error);
    return { data: null, error };
  }
};

/**
 * Update a topic (author or instructor only)
 */
export const updateTopic = async (topicId, updates) => {
  try {
    const { data, error } = await supabase
      .from('forum_topics')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', topicId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating topic:', error);
    return { data: null, error };
  }
};

/**
 * Delete a topic (author or instructor only)
 */
export const deleteTopic = async (topicId) => {
  try {
    const { error } = await supabase
      .from('forum_topics')
      .delete()
      .eq('id', topicId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting topic:', error);
    return { error };
  }
};

/**
 * Pin/Unpin a topic (instructor only)
 */
export const toggleTopicPin = async (topicId, isPinned) => {
  try {
    const { data, error } = await supabase
      .from('forum_topics')
      .update({ is_pinned: isPinned })
      .eq('id', topicId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error toggling topic pin:', error);
    return { data: null, error };
  }
};

/**
 * Lock/Unlock a topic (instructor only)
 */
export const toggleTopicLock = async (topicId, isLocked) => {
  try {
    const { data, error } = await supabase
      .from('forum_topics')
      .update({ is_locked: isLocked })
      .eq('id', topicId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error toggling topic lock:', error);
    return { data: null, error };
  }
};

/**
 * Mark topic as solved (instructor only)
 */
export const markTopicSolved = async (topicId, solvedReplyId = null) => {
  try {
    const { data, error } = await supabase
      .from('forum_topics')
      .update({ 
        is_solved: true,
        solved_reply_id: solvedReplyId
      })
      .eq('id', topicId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking topic as solved:', error);
    return { data: null, error };
  }
};

/**
 * Increment topic view count
 */
export const incrementTopicViewCount = async (topicId) => {
  try {
    // Get current view count
    const { data: topic } = await supabase
      .from('forum_topics')
      .select('view_count')
      .eq('id', topicId)
      .single();

    const currentCount = topic?.view_count || 0;

    // Update view count
    const { error } = await supabase
      .from('forum_topics')
      .update({ view_count: currentCount + 1 })
      .eq('id', topicId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    // Non-critical error, don't throw
    console.warn('Error incrementing view count:', error);
    return { error };
  }
};

// ==========================================
// FORUM REPLIES
// ==========================================

/**
 * Create a new reply
 */
export const createReply = async (replyData) => {
  try {
    const currentUser = await supabase.auth.getUser();
    const userId = currentUser.data.user?.id;

    const { data: reply, error } = await supabase
      .from('forum_replies')
      .insert([{
        ...replyData,
        author_id: userId
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Get user profile
    let userProfile = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, user_role')
        .eq('user_id', userId)
        .single();
      userProfile = profile;
    }

    // Combine data
    const enrichedReply = {
      ...reply,
      user_profiles: userProfile
    };

    return { data: enrichedReply, error: null };
  } catch (error) {
    console.error('Error creating reply:', error);
    return { data: null, error };
  }
};

/**
 * Update a reply (author only)
 */
export const updateReply = async (replyId, updates) => {
  try {
    const { data, error } = await supabase
      .from('forum_replies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', replyId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating reply:', error);
    return { data: null, error };
  }
};

/**
 * Delete a reply (author or instructor only)
 */
export const deleteReply = async (replyId) => {
  try {
    const { error } = await supabase
      .from('forum_replies')
      .delete()
      .eq('id', replyId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting reply:', error);
    return { error };
  }
};

/**
 * Mark reply as best answer (instructor only)
 */
export const markReplyAsBestAnswer = async (replyId, topicId) => {
  try {
    // First, remove best answer status from all other replies
    await supabase
      .from('forum_replies')
      .update({ is_best_answer: false })
      .eq('topic_id', topicId);

    // Then mark this reply as best answer
    const { data, error } = await supabase
      .from('forum_replies')
      .update({ is_best_answer: true })
      .eq('id', replyId)
      .select()
      .single();

    if (error) throw error;

    // Mark the topic as solved
    await markTopicSolved(topicId, replyId);

    return { data, error: null };
  } catch (error) {
    console.error('Error marking reply as best answer:', error);
    return { data: null, error };
  }
};

// ==========================================
// FORUM LIKES
// ==========================================

/**
 * Toggle like on topic or reply
 */
export const toggleLike = async (targetType, targetId) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Check if like exists
    const { data: existingLike, error: checkError } = await supabase
      .from('forum_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from('forum_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;
      return { data: { liked: false }, error: null };
    } else {
      // Add like
      const { data, error: insertError } = await supabase
        .from('forum_likes')
        .insert([{
          user_id: userId,
          target_type: targetType,
          target_id: targetId
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      return { data: { liked: true }, error: null };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return { data: null, error };
  }
};

/**
 * Get user's like status for topics/replies
 */
export const getUserLikes = async (targetType, targetIds) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return { data: {}, error: null };

    const { data, error } = await supabase
      .from('forum_likes')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .in('target_id', targetIds);

    if (error) throw error;

    // Convert to lookup object
    const likesMap = {};
    data.forEach(like => {
      likesMap[like.target_id] = true;
    });

    return { data: likesMap, error: null };
  } catch (error) {
    console.error('Error fetching user likes:', error);
    return { data: {}, error };
  }
};

// ==========================================
// FORUM SUBSCRIPTIONS
// ==========================================

/**
 * Subscribe to topic notifications
 */
export const subscribeToTopic = async (topicId, notificationType = 'all') => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('forum_subscriptions')
      .upsert([{
        user_id: userId,
        topic_id: topicId,
        notification_type: notificationType
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return { data: null, error };
  }
};

/**
 * Unsubscribe from topic notifications
 */
export const unsubscribeFromTopic = async (topicId) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('forum_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('topic_id', topicId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return { error };
  }
};

/**
 * Get user's subscription status for topics
 */
export const getUserSubscriptions = async (topicIds) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return { data: {}, error: null };

    const { data, error } = await supabase
      .from('forum_subscriptions')
      .select('topic_id, notification_type')
      .eq('user_id', userId)
      .in('topic_id', topicIds);

    if (error) throw error;

    // Convert to lookup object
    const subscriptionsMap = {};
    data.forEach(sub => {
      subscriptionsMap[sub.topic_id] = sub.notification_type;
    });

    return { data: subscriptionsMap, error: null };
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return { data: {}, error };
  }
};

// ==========================================
// FORUM SEARCH
// ==========================================

/**
 * Search across topics and replies
 */
export const searchForum = async (courseId, searchQuery, options = {}) => {
  try {
    const { page = 1, limit = 20 } = options;

    // Search topics only for now - simpler approach
    const { data: topics, error: topicsError } = await supabase
      .from('forum_topics')
      .select('*')
      .eq('course_id', courseId)
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .order('last_activity_at', { ascending: false })
      .limit(limit);

    if (topicsError) throw topicsError;

    // Get user profiles for topic authors
    let userProfiles = {};
    if (topics && topics.length > 0) {
      const authorIds = [...new Set(topics.map(t => t.author_id).filter(Boolean))];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url, user_role')
          .in('user_id', authorIds);
        
        if (profiles) {
          profiles.forEach(profile => {
            userProfiles[profile.user_id] = profile;
          });
        }
      }
    }

    // Get categories
    let categories = {};
    if (topics && topics.length > 0) {
      const categoryIds = [...new Set(topics.map(t => t.category_id).filter(Boolean))];
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from('forum_categories')
          .select('id, name')
          .in('id', categoryIds);
        
        if (cats) {
          cats.forEach(cat => {
            categories[cat.id] = cat;
          });
        }
      }
    }

    // Enrich topics with user and category data
    const enrichedTopics = (topics || []).map(topic => ({
      ...topic,
      user_profiles: userProfiles[topic.author_id] || null,
      forum_categories: categories[topic.category_id] || null
    }));

    return {
      data: {
        topics: enrichedTopics,
        replies: [] // For now, only search topics
      },
      error: null
    };
  } catch (error) {
    console.error('Error searching forum:', error);
    return { data: { topics: [], replies: [] }, error };
  }
};

// ==========================================
// FORUM STATISTICS
// ==========================================

/**
 * Get forum statistics for a course
 */
export const getForumStats = async (courseId) => {
  try {
    // Get topic count by category
    const { data: categoryStats, error: categoryError } = await supabase
      .from('forum_topics')
      .select('category_id, forum_categories(name)')
      .eq('course_id', courseId);

    if (categoryError) throw categoryError;

    // Get total counts
    const { count: topicCount, error: topicCountError } = await supabase
      .from('forum_topics')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (topicCountError) throw topicCountError;

    const { count: replyCount, error: replyCountError } = await supabase
      .from('forum_replies')
      .select('topic_id, forum_topics!inner(course_id)', { count: 'exact', head: true })
      .eq('forum_topics.course_id', courseId);

    if (replyCountError) throw replyCountError;

    // Get active users count
    const { data: activeUsers, error: activeUsersError } = await supabase
      .from('forum_topics')
      .select('author_id')
      .eq('course_id', courseId);

    if (activeUsersError) throw activeUsersError;

    const uniqueActiveUsers = new Set(activeUsers.map(t => t.author_id)).size;

    return {
      data: {
        totalTopics: topicCount || 0,
        totalReplies: replyCount || 0,
        activeUsers: uniqueActiveUsers,
        categoryBreakdown: categoryStats || []
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching forum stats:', error);
    return { data: null, error };
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format relative time for forum posts
 */
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get topic type display name
 */
export const getTopicTypeDisplay = (topicType) => {
  const types = {
    'discussion': 'การสนทนา',
    'question': 'คำถาม',
    'announcement': 'ประกาศ',
    'assignment_help': 'ความช่วยเหลือเรื่องงาน'
  };
  return types[topicType] || topicType;
};

/**
 * Get topic type color
 */
export const getTopicTypeColor = (topicType) => {
  const colors = {
    'discussion': 'blue',
    'question': 'yellow',
    'announcement': 'red',
    'assignment_help': 'green'
  };
  return colors[topicType] || 'gray';
};