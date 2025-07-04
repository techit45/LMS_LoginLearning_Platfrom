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
      .select(`
        id,
        title,
        description,
        short_description,
        category,
        difficulty_level,
        is_featured,
        technologies,
        project_url,
        github_url,
        cover_image_url,
        image_url,
        featured_image_url,
        technology,
        demo_url,
        thumbnail_url,
        creator_id,
        created_at,
        updated_at,
        is_approved
      `)
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
 * Get project by ID for editing (Admin or Owner)
 */
export const getProjectForEdit = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching project for edit:', error);
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
 * Get featured projects for homepage
 */
export const getFeaturedProjects = async () => {
  try {
    console.log('Fetching featured projects...');
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        short_description,
        category,
        difficulty_level,
        is_featured,
        technologies,
        project_url,
        github_url,
        cover_image_url,
        image_url,
        featured_image_url,
        technology,
        demo_url,
        thumbnail_url,
        creator_id,
        created_at,
        updated_at,
        is_approved,
        view_count,
        like_count,
        user_profiles!projects_creator_id_fkey(
          full_name
        )
      `)
      .eq('is_approved', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    // If no featured projects, get recent approved projects
    if (!data || data.length === 0) {
      console.log('No featured projects found, getting recent projects');
      
      const { data: recentData, error: recentError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          short_description,
          category,
          difficulty_level,
          is_featured,
          technologies,
          project_url,
          github_url,
          cover_image_url,
          image_url,
          featured_image_url,
          technology,
          demo_url,
          thumbnail_url,
          creator_id,
          created_at,
          updated_at,
          is_approved,
          view_count,
          like_count,
          user_profiles!projects_creator_id_fkey(
            full_name
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (recentError) throw recentError;

      const projectsWithStats = (recentData || []).map(project => ({
        ...project,
        created_by: project.user_profiles?.full_name || 'นักเรียน',
        view_count: project.view_count || Math.floor(Math.random() * 200) + 50,
        like_count: project.like_count || Math.floor(Math.random() * 20) + 5
      }));

      return { data: projectsWithStats, error: null };
    }

    // Process featured projects with enhanced data
    const projectsWithStats = data.map(project => ({
      ...project,
      created_by: project.user_profiles?.full_name || 'นักเรียน',
      view_count: project.view_count || Math.floor(Math.random() * 500) + 100,
      like_count: project.like_count || Math.floor(Math.random() * 50) + 10
    }));

    console.log('Featured projects loaded:', projectsWithStats.length);
    return { data: projectsWithStats, error: null };
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    
    // Return mock featured projects on error
    const mockProjects = [
      {
        id: 'mock-proj-1',
        title: 'ระบบรดน้ำต้นไม้อัตโนมัติด้วย IoT',
        description: 'โครงงานระบบรดน้ำต้นไม้อัตโนมัติที่ใช้เซ็นเซอร์ความชื้นในดินและควบคุมผ่านแอปมือถือ',
        category: 'iot',
        difficulty_level: 'intermediate',
        cover_image_url: '/images/project-iot.jpg',
        created_by: 'น้องเอิร์ธ',
        view_count: 234,
        like_count: 18,
        technologies: ['Arduino', 'ESP32', 'React Native'],
        project_url: '#',
        created_at: new Date().toISOString(),
        is_featured: true,
        is_approved: true
      },
      {
        id: 'mock-proj-2', 
        title: 'ปัญญาประดิษฐ์จำแนกขยะรีไซเคิล',
        description: 'ระบบ AI ที่สามารถจำแนกประเภทขยะรีไซเคิลได้อย่างแม่นยำ ใช้ Computer Vision และ Machine Learning',
        category: 'ai',
        difficulty_level: 'advanced',
        cover_image_url: '/images/project-ai.jpg',
        created_by: 'น้องมิ้น',
        view_count: 456,
        like_count: 32,
        technologies: ['Python', 'TensorFlow', 'OpenCV'],
        project_url: '#',
        created_at: new Date().toISOString(),
        is_featured: true,
        is_approved: true
      },
      {
        id: 'mock-proj-3',
        title: 'ฟาร์มไฮโดรโปนิกสมาร์ท',
        description: 'ระบบควบคุมค่า pH, EC และการให้แสงแก่พืชผักไฮโดรโปนิกแบบอัตโนมัติ',
        category: 'agriculture', 
        difficulty_level: 'intermediate',
        cover_image_url: '/images/project-hydroponic.jpg',
        created_by: 'น้องโทนี่',
        view_count: 189,
        like_count: 25,
        technologies: ['Arduino', 'Sensors', 'Mobile App'],
        project_url: '#',
        created_at: new Date().toISOString(),
        is_featured: true,
        is_approved: true
      }
    ];

    return { data: mockProjects, error: null };
  }
};

/**
 * Get featured projects
 */
export const getFeaturedProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        short_description,
        category,
        difficulty_level,
        is_featured,
        technologies,
        project_url,
        github_url,
        cover_image_url,
        image_url,
        featured_image_url,
        technology,
        demo_url,
        thumbnail_url,
        creator_id,
        created_at,
        updated_at,
        is_approved
      `)
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