import { supabase } from './supabaseClient';

// ==========================================
// PROJECT VIEWS TRACKING
// ==========================================

/**
 * Track a project view
 */
export const trackProjectView = async (projectId) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // Get client IP and user agent (in real app, you'd get these from request)
    const userAgent = navigator.userAgent;
    
    try {
      // Option 1: Check first (current approach - prevents duplicate errors)
      // Uncomment these lines if you want to keep daily unique views with no errors:
      
      // const today = new Date().toISOString().split('T')[0];
      // const { data: existingView } = await supabase
      //   .from('project_views')
      //   .select('id')
      //   .eq('user_id', userId)
      //   .eq('project_id', projectId)
      //   .eq('view_date', today)
      //   .maybeSingle();

      // if (existingView) {
      //   return { data: true, error: null };
      // }

      // Option 2: Simple insert (works with unlimited views after removing constraint)
      const { error } = await supabase
        .from('project_views')
        .insert([{
          user_id: userId, // Can be null for anonymous users
          project_id: projectId,
          user_agent: userAgent,
          view_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }]);

      if (error && error.code === '42P01') {
        // Table doesn't exist - update project directly
        console.warn('project_views table does not exist. Please run: sql_scripts/create-project-interactions-table.sql');
        
        try {
          await supabase
            .from('projects')
            .update({ view_count: supabase.raw('view_count + 1') })
            .eq('id', projectId);
        } catch (updateError) {
          console.warn('Could not update view count:', updateError.message);
        }
        
        return { data: true, error: null };
      }

      if (error && error.code === '23505') {
        // Duplicate - another request might have inserted at the same time
        return { data: true, error: null };
      }

      if (error) throw error;

      // Successfully inserted new view record
      return { data: true, error: null };
    } catch (dbError) {
      console.warn('Project view tracking unavailable:', dbError.message);
      
      // Fallback: try to update project view count directly
      try {
        await supabase
          .from('projects')
          .update({ view_count: supabase.raw('view_count + 1') })
          .eq('id', projectId);
        console.log('Updated view count directly on projects table');
      } catch (updateError) {
        console.warn('Could not update view count:', updateError.message);
      }
      
      return { data: true, error: null };
    }
  } catch (error) {
    console.error('Error tracking project view:', error);
    return { data: false, error };
  }
};

// ==========================================
// PROJECT LIKES
// ==========================================

/**
 * Toggle like for a project
 */
export const toggleProjectLike = async (projectId) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    try {
      // Check if like exists
      const { data: existingLike, error: checkError } = await supabase
        .from('project_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .maybeSingle();

      if (checkError && checkError.code === '42P01') {
        // Table doesn't exist - return mock data
        console.warn('project_likes table does not exist. Please run: sql_scripts/create-project-interactions-table.sql');
        return { data: { liked: true, mock: true }, error: null };
      }

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('project_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;
        return { data: { liked: false }, error: null };
      } else {
        // Add like
        const { error: insertError } = await supabase
          .from('project_likes')
          .insert([{
            user_id: userId,
            project_id: projectId
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        return { data: { liked: true }, error: null };
      }
    } catch (dbError) {
      // Database error - return mock response
      console.warn('Project likes functionality unavailable:', dbError.message);
      return { data: { liked: true, mock: true }, error: null };
    }
  } catch (error) {
    console.error('Error toggling project like:', error);
    return { data: null, error };
  }
};

/**
 * Get user's like status for projects
 */
export const getUserProjectLikes = async (projectIds) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return { data: [], error: null };

    try {
      const { data, error } = await supabase
        .from('project_likes')
        .select('project_id')
        .eq('user_id', userId)
        .in('project_id', projectIds);

      if (error && error.code === '42P01') {
        // Table doesn't exist - return empty data
        console.warn('project_likes table does not exist. Please run: sql_scripts/create-project-interactions-table.sql');
        return { data: [], error: null };
      }

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (dbError) {
      console.warn('Project likes functionality unavailable:', dbError.message);
      return { data: [], error: null };
    }
  } catch (error) {
    console.error('Error fetching user project likes:', error);
    return { data: [], error };
  }
};

/**
 * Get like count for a project
 */
export const getProjectLikeCount = async (projectId) => {
  try {
    try {
      const { count, error } = await supabase
        .from('project_likes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error && error.code === '42P01') {
        // Table doesn't exist - return 0
        console.warn('project_likes table does not exist. Please run: sql_scripts/create-project-interactions-table.sql');
        return { data: 0, error: null };
      }

      if (error) throw error;

      return { data: count || 0, error: null };
    } catch (dbError) {
      console.warn('Project likes functionality unavailable:', dbError.message);
      return { data: 0, error: null };
    }
  } catch (error) {
    console.error('Error fetching project like count:', error);
    return { data: 0, error };
  }
};

// ==========================================
// PROJECT COMMENTS
// ==========================================

/**
 * Get comments for a project
 */
export const getProjectComments = async (projectId) => {
  try {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          id,
          content,
          parent_id,
          is_edited,
          created_at,
          updated_at,
          user_id
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error && error.code === '42P01') {
        // Table doesn't exist - return empty data
        console.warn('project_comments table does not exist. Please run: sql_scripts/create-project-interactions-table.sql');
        return { data: [], error: null };
      }

      if (error) throw error;

      // Get user profiles separately to avoid foreign key issues
      const comments = data || [];
      const userIds = [...new Set(comments.map(c => c.user_id))];
      
      let userProfiles = {};
      if (userIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', userIds);
          
          userProfiles = (profiles || []).reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {});
        } catch (profileError) {
          console.warn('Could not fetch user profiles:', profileError.message);
        }
      }

      // Add user profile data to comments
      const commentsWithProfiles = comments.map(comment => ({
        ...comment,
        user_profiles: userProfiles[comment.user_id] || { full_name: 'ผู้ใช้', avatar_url: null }
      }));

      // Organize comments into threads
      const topLevelComments = commentsWithProfiles.filter(comment => !comment.parent_id);
      const replies = commentsWithProfiles.filter(comment => comment.parent_id);

      // Attach replies to their parent comments
      const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: replies.filter(reply => reply.parent_id === comment.id)
      }));

      return { data: commentsWithReplies, error: null };
    } catch (dbError) {
      console.warn('Project comments functionality unavailable:', dbError.message);
      return { data: [], error: null };
    }
  } catch (error) {
    console.error('Error fetching project comments:', error);
    return { data: [], error };
  }
};

/**
 * Add a comment to a project
 */
export const addProjectComment = async (projectId, content, parentId = null) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    if (!content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    try {
      const { data, error } = await supabase
        .from('project_comments')
        .insert([{
          user_id: userId,
          project_id: projectId,
          content: content.trim(),
          parent_id: parentId
        }])
        .select(`
          id,
          content,
          parent_id,
          is_edited,
          created_at,
          updated_at,
          user_id
        `)
        .single();

      if (error && error.code === '42P01') {
        // Table doesn't exist - return mock data
        console.warn('project_comments table does not exist. Please run: sql_scripts/create-project-interactions-table.sql');
        return { 
          data: { 
            id: 'mock-' + Date.now(),
            content: content.trim(),
            parent_id: parentId,
            is_edited: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: userId,
            user_profiles: { full_name: 'ผู้ใช้', avatar_url: null },
            mock: true
          }, 
          error: null 
        };
      }

      if (error) throw error;

      // Get user profile separately
      let userProfile = { full_name: 'ผู้ใช้', avatar_url: null };
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('user_id', userId)
          .single();
        
        if (profile) userProfile = profile;
      } catch (profileError) {
        console.warn('Could not fetch user profile:', profileError.message);
      }

      return { 
        data: {
          ...data,
          user_profiles: userProfile
        }, 
        error: null 
      };
    } catch (dbError) {
      console.warn('Project comments functionality unavailable:', dbError.message);
      return { 
        data: { 
          id: 'mock-' + Date.now(),
          content: content.trim(),
          parent_id: parentId,
          is_edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userId,
          user_profiles: { full_name: 'ผู้ใช้', avatar_url: null },
          mock: true
        }, 
        error: null 
      };
    }
  } catch (error) {
    console.error('Error adding project comment:', error);
    return { data: null, error };
  }
};

/**
 * Update a comment
 */
export const updateProjectComment = async (commentId, content) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    if (!content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    const { data, error } = await supabase
      .from('project_comments')
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(`
        id,
        content,
        parent_id,
        is_edited,
        created_at,
        updated_at,
        user_profiles:user_id(
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating project comment:', error);
    return { data: null, error };
  }
};

/**
 * Delete a comment
 */
export const deleteProjectComment = async (commentId) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting project comment:', error);
    return { data: false, error };
  }
};

/**
 * Get comment count for a project
 */
export const getProjectCommentCount = async (projectId) => {
  try {
    try {
      const { count, error } = await supabase
        .from('project_comments')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error && error.code === '42P01') {
        // Table doesn't exist - return 0
        console.warn('project_comments table does not exist. Please run: sql_scripts/create-project-interactions-table.sql');
        return { data: 0, error: null };
      }

      if (error) throw error;

      return { data: count || 0, error: null };
    } catch (dbError) {
      console.warn('Project comments functionality unavailable:', dbError.message);
      return { data: 0, error: null };
    }
  } catch (error) {
    console.error('Error fetching project comment count:', error);
    return { data: 0, error };
  }
};