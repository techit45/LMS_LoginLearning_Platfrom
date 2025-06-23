import { supabase } from './supabaseClient';

// ==========================================
// LEARNING KITS SERVICE
// บริการจัดการชุดการเรียนรู้
// ==========================================

/**
 * Get all learning kits
 */
export const getAllLearningKits = async (filters = {}) => {
  try {
    let query = supabase
      .from('learning_kits')
      .select(`
        *,
        courses(id, title, category),
        kit_reviews(rating),
        learning_kit_categories(
          kit_categories(name, color_hex)
        )
      `)
      .eq('is_available', true);

    // Apply filters
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    if (filters.kitType) {
      query = query.eq('kit_type', filters.kitType);
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.inStock) {
      query = query.gt('stock_quantity', 0);
    }

    // Sorting
    const sortBy = filters.sortBy || 'popularity_score';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    // Calculate average ratings
    const kitsWithRatings = data.map(kit => ({
      ...kit,
      average_rating: kit.kit_reviews?.length > 0 
        ? kit.kit_reviews.reduce((sum, review) => sum + review.rating, 0) / kit.kit_reviews.length 
        : 0,
      review_count: kit.kit_reviews?.length || 0
    }));

    return { data: kitsWithRatings, error: null };
  } catch (error) {
    console.error('Error fetching learning kits:', error);
    return { data: null, error };
  }
};

/**
 * Get learning kit by ID
 */
export const getLearningKitById = async (kitId) => {
  try {
    const { data, error } = await supabase
      .from('learning_kits')
      .select(`
        *,
        courses(id, title, description, instructor_name),
        kit_reviews(
          *,
          user_profiles!kit_reviews_user_id_fkey(full_name)
        ),
        learning_kit_categories(
          kit_categories(name, color_hex, icon_name)
        )
      `)
      .eq('id', kitId)
      .single();

    if (error) throw error;

    // Calculate ratings
    const reviews = data.kit_reviews || [];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    return { 
      data: {
        ...data,
        average_rating: averageRating,
        review_count: reviews.length
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching learning kit:', error);
    return { data: null, error };
  }
};

/**
 * Get learning kits by course ID
 */
export const getLearningKitsByCourse = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('learning_kits')
      .select(`
        *,
        kit_reviews(rating)
      `)
      .eq('course_id', courseId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Calculate average ratings
    const kitsWithRatings = data.map(kit => ({
      ...kit,
      average_rating: kit.kit_reviews?.length > 0 
        ? kit.kit_reviews.reduce((sum, review) => sum + review.rating, 0) / kit.kit_reviews.length 
        : 0,
      review_count: kit.kit_reviews?.length || 0
    }));

    return { data: kitsWithRatings, error: null };
  } catch (error) {
    console.error('Error fetching course learning kits:', error);
    return { data: null, error };
  }
};

/**
 * Search learning kits
 */
export const searchLearningKits = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('learning_kits')
      .select(`
        *,
        courses(title),
        kit_reviews(rating)
      `)
      .or(`kit_name.ilike.%${searchTerm}%,kit_description.ilike.%${searchTerm}%`)
      .eq('is_available', true)
      .order('popularity_score', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error searching learning kits:', error);
    return { data: null, error };
  }
};

// ==========================================
// SHOPPING CART & WISHLIST
// ==========================================

/**
 * Add to wishlist
 */
export const addToWishlist = async (kitId, notes = '') => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('kit_wishlist')
      .insert([{
        user_id: user.id,
        kit_id: kitId,
        notes
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return { data: null, error };
  }
};

/**
 * Remove from wishlist
 */
export const removeFromWishlist = async (kitId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('kit_wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('kit_id', kitId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return { error };
  }
};

/**
 * Get user's wishlist
 */
export const getUserWishlist = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('kit_wishlist')
      .select(`
        *,
        learning_kits(
          *,
          courses(title),
          kit_reviews(rating)
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return { data: null, error };
  }
};

// ==========================================
// REVIEWS
// ==========================================

/**
 * Create kit review
 */
export const createKitReview = async (kitId, reviewData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('kit_reviews')
      .insert([{
        kit_id: kitId,
        user_id: user.id,
        ...reviewData
      }])
      .select(`
        *,
        user_profiles!kit_reviews_user_id_fkey(full_name)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating kit review:', error);
    return { data: null, error };
  }
};

/**
 * Get kit reviews
 */
export const getKitReviews = async (kitId, filters = {}) => {
  try {
    let query = supabase
      .from('kit_reviews')
      .select(`
        *,
        user_profiles!kit_reviews_user_id_fkey(full_name)
      `)
      .eq('kit_id', kitId)
      .eq('is_approved', true);

    if (filters.rating) {
      query = query.eq('rating', filters.rating);
    }

    const sortBy = filters.sortBy || 'created_at';
    query = query.order(sortBy, { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching kit reviews:', error);
    return { data: null, error };
  }
};

// ==========================================
// CATEGORIES
// ==========================================

/**
 * Get all kit categories
 */
export const getKitCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('kit_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching kit categories:', error);
    return { data: null, error };
  }
};

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

/**
 * Create learning kit (Admin only)
 */
export const createLearningKit = async (kitData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('learning_kits')
      .insert([{
        ...kitData,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating learning kit:', error);
    return { data: null, error };
  }
};

/**
 * Update learning kit (Admin only)
 */
export const updateLearningKit = async (kitId, kitData) => {
  try {
    const { data, error } = await supabase
      .from('learning_kits')
      .update(kitData)
      .eq('id', kitId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating learning kit:', error);
    return { data: null, error };
  }
};

/**
 * Update kit stock
 */
export const updateKitStock = async (kitId, newQuantity, reason = '') => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get current stock
    const { data: currentKit, error: fetchError } = await supabase
      .from('learning_kits')
      .select('stock_quantity')
      .eq('id', kitId)
      .single();

    if (fetchError) throw fetchError;

    const quantityChange = newQuantity - currentKit.stock_quantity;

    // Update stock
    const { data, error } = await supabase
      .from('learning_kits')
      .update({ stock_quantity: newQuantity })
      .eq('id', kitId)
      .select()
      .single();

    if (error) throw error;

    // Log inventory change
    await supabase
      .from('kit_inventory_logs')
      .insert([{
        kit_id: kitId,
        change_type: 'adjustment',
        quantity_change: quantityChange,
        quantity_after: newQuantity,
        reason,
        created_by: user.id
      }]);

    return { data, error: null };
  } catch (error) {
    console.error('Error updating kit stock:', error);
    return { data: null, error };
  }
};

// ==========================================
// STATISTICS
// ==========================================

/**
 * Get kit sales statistics
 */
export const getKitSalesStats = async () => {
  try {
    const { data, error } = await supabase
      .from('kit_sales_stats')
      .select('*')
      .order('total_revenue', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching kit sales stats:', error);
    return { data: null, error };
  }
};

/**
 * Get course kit performance
 */
export const getCourseKitPerformance = async () => {
  try {
    const { data, error } = await supabase
      .from('course_kit_performance')
      .select('*')
      .order('total_kit_revenue', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course kit performance:', error);
    return { data: null, error };
  }
};