import { supabase } from './supabaseClient';

// ==========================================
// PROJECT CRUD OPERATIONS
// ==========================================

/**
 * Get all approved projects
 */
export const getAllProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { data: null, error };
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('is_approved', true)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching project:', error);
    return { data: null, error };
  }
};

/**
 * Get projects by category
 */
export const getProjectsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('category', category)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching projects by category:', error);
    return { data: null, error };
  }
};

/**
 * Get featured projects
 */
export const getFeaturedProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_featured', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return { data: null, error };
  }
};

// ==========================================
// ADMIN PROJECT MANAGEMENT
// ==========================================

/**
 * Create new project (Admin only)
 */
export const createProject = async (projectData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...projectData,
        creator_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating project:', error);
    return { data: null, error };
  }
};

/**
 * Update project (Admin only)
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating project:', error);
    return { data: null, error };
  }
};

/**
 * Delete project (Admin only) - Reject approval
 */
export const deleteProject = async (projectId) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_approved: false })
      .eq('id', projectId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { error };
  }
};

/**
 * Toggle project approval status (Admin only)
 */
export const toggleProjectApproval = async (projectId, isApproved) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_approved: isApproved })
      .eq('id', projectId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error toggling project approval:', error);
    return { error };
  }
};

/**
 * Toggle project featured status (Admin only)
 */
export const toggleProjectFeatured = async (projectId, isFeatured) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_featured: isFeatured })
      .eq('id', projectId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error toggling project featured status:', error);
    return { error };
  }
};

/**
 * Get all projects for admin (including unapproved)
 */
export const getAllProjectsAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching admin projects:', error);
    return { data: null, error };
  }
};

/**
 * Get project statistics for admin dashboard
 */
export const getProjectStats = async () => {
  try {
    // Get total projects
    const { count: totalProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true);

    if (projectsError) throw projectsError;

    // Get featured projects
    const { count: featuredProjects, error: featuredError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)
      .eq('is_approved', true);

    if (featuredError) throw featuredError;

    // Get project categories
    const { data: categories, error: categoriesError } = await supabase
      .from('projects')
      .select('category')
      .eq('is_approved', true);

    if (categoriesError) throw categoriesError;

    const uniqueCategories = new Set(categories?.map(p => p.category) || []);

    return {
      data: {
        totalProjects: totalProjects || 0,
        featuredProjects: featuredProjects || 0,
        totalCategories: uniqueCategories.size,
        categories: Array.from(uniqueCategories)
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return { data: null, error };
  }
};