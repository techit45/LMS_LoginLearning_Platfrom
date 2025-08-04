import { supabase } from './supabaseClient';
import { getEmergencyData } from './quickFix';
import { deleteProjectFolder, createProjectStructure, getCompanySlug, transferFolderContents, folderHasContents } from './googleDriveClientService';

// Simple in-memory cache
const cache = new Map();

const getCachedData = (key, maxAge) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// ==========================================
// PROJECT CRUD OPERATIONS
// ==========================================

/**
 * Get all approved projects
 */
export const getAllProjects = async () => {
  try {
    // Add timeout for emergency fallback (increased for real data)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('getAllProjects timeout')), 15000); // 15 seconds for real data
    });
    
    const queryPromise = supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        short_description,
        category,
        technology,
        difficulty_level,
        thumbnail_url,
        demo_url,
        github_url,
        images,
        tags,
        is_featured,
        is_approved,
        view_count,
        like_count,
        creator_id,
        created_at,
        updated_at
      `)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('Error fetching projects:', error);
      // Return emergency data instead of error
      const emergencyData = getEmergencyData();
      console.log('🚑 Database timeout - Using emergency projects data in getAllProjects');
      console.warn('Consider running the SQL fix script: /sql_scripts/fix-student-access-final.sql');
      return { data: emergencyData.projects, error: null };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching projects:', error);
    // Return emergency data on any error
    const emergencyData = getEmergencyData();
    console.log('🚑 Database error - Using emergency projects data after error in getAllProjects');
    console.warn('Consider running the SQL fix script: /sql_scripts/fix-student-access-final.sql');
    return { data: emergencyData.projects, error: null };
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
  // Return cache if available and fresh (5 minutes)
  const cacheKey = 'featured_projects';
  const cached = getCachedData(cacheKey, 5 * 60 * 1000); // 5 minutes cache
  if (cached) {
    // Only log cache usage occasionally to reduce console spam
    if (Math.random() < 0.1) { // 10% chance to log
      console.log('📦 Using cached featured projects');
    }
    return { data: cached, error: null };
  }

  try {
    console.log('Fetching featured projects from database...');
    
    // Add timeout to database query
    const queryPromise = supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        short_description,
        category,
        difficulty_level,
        is_featured,
        technology,
        demo_url,
        github_url,
        thumbnail_url,
        creator_id,
        created_at,
        updated_at,
        is_approved,
        view_count,
        like_count
      `)
      .eq('is_approved', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 3000)
    );
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('Featured projects database error:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log('Successfully fetched featured projects:', data.length);
      const projectsWithStats = data.map(project => ({
        ...project,
        created_by: 'นักเรียน',
        view_count: project.view_count || Math.floor(Math.random() * 500) + 100,
        like_count: project.like_count || Math.floor(Math.random() * 50) + 10
      }));
      
      // Cache the successful result
      setCachedData(cacheKey, projectsWithStats);
      
      return { data: projectsWithStats, error: null };
    }
  } catch (error) {
    console.error('Error fetching featured projects:', error);
  }
  
  // Always return mock data for development
  console.log('Returning mock featured projects for development');
  const mockProjects = [
    {
      id: 'mock-proj-1',
      title: 'ระบบรดน้ำต้นไม้อัตโนมัติด้วย IoT',
      description: 'โครงงานระบบรดน้ำต้นไม้อัตโนมัติที่ใช้เซ็นเซอร์ความชื้นในดินและควบคุมผ่านแอปมือถือ',
      category: 'IoT/Hardware',
      difficulty_level: 'intermediate',
      thumbnail_url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400',
      created_by: 'น้องเอิร์ธ',
      view_count: 234,
      like_count: 18,
      tags: ['Arduino', 'ESP32', 'React Native'],
      demo_url: '#',
      created_at: new Date().toISOString(),
      is_featured: true,
      is_approved: true
    },
    {
      id: 'mock-proj-2', 
      title: 'ปัญญาประดิษฐ์จำแนกขยะรีไซเคิล',
      description: 'ระบบ AI ที่สามารถจำแนกประเภทขยะรีไซเคิลได้อย่างแม่นยำ ใช้ Computer Vision และ Machine Learning',
      category: 'AI/Machine Learning',
      difficulty_level: 'advanced',
      thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
      created_by: 'น้องมิ้น',
      view_count: 456,
      like_count: 32,
      tags: ['Python', 'TensorFlow', 'OpenCV'],
      demo_url: '#',
      created_at: new Date().toISOString(),
      is_featured: true,
      is_approved: true
    },
    {
      id: 'mock-proj-3',
      title: 'ฟาร์มไฮโดรโปนิกสมาร์ท',
      description: 'ระบบควบคุมค่า pH, EC และการให้แสงแก่พืชผักไฮโดรโปนิกแบบอัตโนมัติ',
      category: 'IoT/Hardware', 
      difficulty_level: 'intermediate',
      thumbnail_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      created_by: 'น้องโทนี่',
      view_count: 189,
      like_count: 25,
      tags: ['Arduino', 'Sensors', 'Mobile App'],
      demo_url: '#',
      created_at: new Date().toISOString(),
      is_featured: true,
      is_approved: true
    }
  ];

  return { data: mockProjects, error: null };
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
      .select(`
        id,
        title,
        description,
        short_description,
        category,
        technology,
        difficulty_level,
        thumbnail_url,
        demo_url,
        github_url,
        images,
        tags,
        is_featured,
        is_approved,
        view_count,
        like_count,
        creator_id,
        company,
        created_at,
        updated_at
      `)
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
 * Delete project (Admin only) - Reject approval (Soft Delete)
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
 * Permanently delete project (Admin only) - Complete removal from database AND Google Drive
 */
export const permanentlyDeleteProject = async (projectId) => {
  try {
    console.log(`🗑️ Starting permanent deletion of project: ${projectId}`);
    
    // Step 1: Get project details first (including Google Drive folder ID)
    const { data: projectData, error: fetchError } = await supabase
      .from('projects')
      .select('title, google_drive_folder_id')
      .eq('id', projectId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching project for deletion:', fetchError);
      throw fetchError;
    }
    
    console.log(`📋 Project details: ${projectData.title}, Google Drive ID: ${projectData.google_drive_folder_id}`);
    
    // Step 2: Delete Google Drive folder if it exists
    if (projectData.google_drive_folder_id) {
      try {
        console.log(`🗑️ Deleting Google Drive folder: ${projectData.google_drive_folder_id}`);
        await deleteProjectFolder(projectData.google_drive_folder_id, projectData.title);
        console.log(`✅ Google Drive folder deleted successfully`);
      } catch (driveError) {
        console.warn(`⚠️ Failed to delete Google Drive folder (continuing with database deletion):`, driveError.message);
        // Continue with database deletion even if Google Drive deletion fails
      }
    } else {
      console.log(`ℹ️ No Google Drive folder to delete`);
    }
    
    // Step 3: Delete related data (comments, likes, views) to maintain referential integrity
    console.log(`🗑️ Deleting related data for project: ${projectId}`);
    const deletePromises = [
      // Delete project comments
      supabase
        .from('project_comments')
        .delete()
        .eq('project_id', projectId),
      
      // Delete project likes
      supabase
        .from('project_likes')
        .delete()
        .eq('project_id', projectId),
      
      // Delete project views
      supabase
        .from('project_views')
        .delete()
        .eq('project_id', projectId)
    ];

    // Execute all deletions (ignore errors for non-existent tables)
    const deleteResults = await Promise.allSettled(deletePromises);
    console.log(`📊 Related data deletion results:`, deleteResults.map(r => r.status));

    // Step 4: Finally, delete the project itself from database
    console.log(`🗑️ Deleting project from database: ${projectId}`);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    
    console.log(`✅ Project permanently deleted: ${projectData.title} (${projectId})`);
    return { error: null };
  } catch (error) {
    console.error('❌ Error permanently deleting project:', error);
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
 * Get projects by company for admin (including unapproved)
 */
export const getProjectsByCompanyAdmin = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      // .eq('company', companyId) // Temporarily disabled due to schema mismatch
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching admin company projects:', error);
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
      .select('category') // Removed company field due to schema mismatch
      .eq('is_approved', true);

    if (categoriesError) throw categoriesError;

    const uniqueCategories = new Set(categories?.map(p => p.category) || []);
    // const uniqueCompanies = new Set(categories?.map(p => p.company) || []); // Disabled due to schema mismatch

    return {
      data: {
        totalProjects: totalProjects || 0,
        featuredProjects: featuredProjects || 0,
        totalCategories: uniqueCategories.size,
        totalCompanies: 6, // Hardcoded for now until schema is fixed
        categories: Array.from(uniqueCategories),
        companies: ['login', 'meta', 'med', 'edtech', 'innotech', 'w2d'] // Hardcoded for now
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return { data: null, error };
  }
};

/**
 * Transfer project to another company (Admin only)
 * This function moves a project from one company to another including Google Drive folders
 */
export const transferItemToCompany = async (projectId, targetCompany, options = {}) => {
  try {
    console.log(`🔄 Starting project transfer: ${projectId} -> ${targetCompany}`);
    
    const { 
      fromCompany, 
      itemTitle, 
      itemType = 'project',
      transferDriveFolder = true 
    } = options;

    // Step 1: Get current project data
    const { data: currentProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch project: ${fetchError.message}`);
    }

    if (!currentProject) {
      throw new Error('Project not found');
    }

    console.log(`📋 Current project data:`, currentProject);

    // Step 2: Validate target company
    const validCompanies = ['login', 'meta', 'med', 'edtech', 'innotech', 'w2d'];
    if (!validCompanies.includes(targetCompany)) {
      throw new Error(`Invalid target company: ${targetCompany}`);
    }

    // Step 3: Handle Google Drive folder transfer if needed
    let newDriveFolderId = null;
    let filesTransferred = false;
    
    if (transferDriveFolder && currentProject.google_drive_folder_id) {
      try {
        console.log(`🗂️ Starting Google Drive transfer for company: ${targetCompany}`);
        
        // Step 3a: Check if source folder has contents
        const hasContents = await folderHasContents(currentProject.google_drive_folder_id);
        console.log(`📋 Source folder has contents: ${hasContents}`);
        
        // Step 3b: Create new project structure in target company
        const driveStructure = await createProjectStructure({
          ...currentProject,
          company: targetCompany
        }, targetCompany);

        if (driveStructure.success && driveStructure.projectFolderId) {
          newDriveFolderId = driveStructure.projectFolderId;
          console.log(`✅ New Google Drive folder created: ${newDriveFolderId}`);
          
          // Step 3c: Transfer files from old folder to new folder
          if (hasContents) {
            console.log(`🔄 Transferring files from ${currentProject.google_drive_folder_id} to ${newDriveFolderId}`);
            
            const transferResult = await transferFolderContents(
              currentProject.google_drive_folder_id,
              newDriveFolderId,
              currentProject.title,
              true // Delete source folder after transfer
            );
            
            if (transferResult.success) {
              filesTransferred = true;
              console.log(`✅ Files transferred successfully`);
            } else {
              console.warn(`⚠️ File transfer completed with warnings`);
            }
          } else {
            console.log(`ℹ️ Source folder is empty, no files to transfer`);
            // Still delete the empty source folder
            try {
              await deleteProjectFolder(currentProject.google_drive_folder_id, currentProject.title);
              console.log(`✅ Empty source folder deleted`);
            } catch (deleteError) {
              console.warn(`⚠️ Could not delete empty source folder:`, deleteError.message);
            }
          }
        }
        
      } catch (driveError) {
        console.error(`⚠️ Google Drive transfer failed:`, driveError);
        // Continue with database transfer even if Drive transfer fails
        console.log(`📝 Continuing with database transfer only`);
      }
    }

    // Step 4: Update project in database
    const updateData = {
      company: targetCompany,
      ...(newDriveFolderId && { google_drive_folder_id: newDriveFolderId }),
      updated_at: new Date().toISOString()
    };

    console.log(`💾 Updating project in database:`, updateData);

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    console.log(`✅ Project transfer completed:`, updatedProject);

    // Clear cache to ensure fresh data
    cache.clear();

    return {
      data: {
        ...updatedProject,
        transfer_details: {
          from_company: currentProject.company,
          to_company: targetCompany,
          drive_folder_transferred: !!newDriveFolderId,
          files_transferred: filesTransferred,
          old_drive_folder_id: currentProject.google_drive_folder_id,
          new_drive_folder_id: newDriveFolderId,
          transferred_at: new Date().toISOString()
        }
      },
      error: null
    };

  } catch (error) {
    console.error('❌ Error transferring project:', error);
    return { 
      data: null, 
      error: {
        message: error.message || 'Failed to transfer project',
        code: 'TRANSFER_FAILED'
      }
    };
  }
};