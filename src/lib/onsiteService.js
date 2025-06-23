import { supabase } from './supabaseClient';

// ==========================================
// ONSITE LEARNING SERVICE
// บริการจัดการการเรียน Onsite
// ==========================================

/**
 * Get all onsite courses with schedules
 */
export const getOnsiteCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        onsite_course_schedules(
          *,
          onsite_registrations(count)
        )
      `)
      .in('delivery_type', ['onsite', 'hybrid'])
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process data to include registration stats
    const coursesWithStats = data.map(course => ({
      ...course,
      schedules: course.onsite_course_schedules?.map(schedule => ({
        ...schedule,
        current_registrations: schedule.onsite_registrations?.length || 0,
        is_full: (schedule.onsite_registrations?.length || 0) >= schedule.max_participants,
        spaces_left: schedule.max_participants - (schedule.onsite_registrations?.length || 0)
      })) || []
    }));

    return { data: coursesWithStats, error: null };
  } catch (error) {
    console.error('Error fetching onsite courses:', error);
    return { data: null, error };
  }
};

/**
 * Get course by ID with onsite details
 */
export const getOnsiteCourseById = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        onsite_course_schedules!inner(
          *,
          onsite_registrations(
            id,
            status,
            payment_status
          )
        ),
        onsite_project_templates(*)
      `)
      .eq('id', courseId)
      .in('delivery_type', ['onsite', 'hybrid'])
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching onsite course:', error);
    return { data: null, error };
  }
};

/**
 * Get project templates for a course
 */
export const getProjectTemplates = async (courseId, projectType = null) => {
  try {
    let query = supabase
      .from('onsite_project_templates')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true);

    if (projectType) {
      query = query.eq('project_type', projectType);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching project templates:', error);
    return { data: null, error };
  }
};

/**
 * Get available schedules for a course
 */
export const getAvailableSchedules = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('onsite_course_schedules')
      .select(`
        *,
        onsite_registrations(count)
      `)
      .eq('course_id', courseId)
      .in('status', ['open_registration'])
      .gte('registration_deadline', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true });

    if (error) throw error;

    // Calculate availability
    const schedulesWithAvailability = data.map(schedule => {
      const currentRegistrations = schedule.onsite_registrations?.length || 0;
      const spacesLeft = schedule.max_participants - currentRegistrations;
      
      return {
        ...schedule,
        current_registrations: currentRegistrations,
        spaces_left: spacesLeft,
        is_full: spacesLeft <= 0,
        is_early_bird: schedule.early_bird_deadline && 
                      new Date(schedule.early_bird_deadline) > new Date(),
        effective_price: (schedule.early_bird_deadline && 
                         new Date(schedule.early_bird_deadline) > new Date()) 
                         ? schedule.early_bird_price || schedule.price 
                         : schedule.price
      };
    });

    return { data: schedulesWithAvailability, error: null };
  } catch (error) {
    console.error('Error fetching available schedules:', error);
    return { data: null, error };
  }
};

/**
 * Submit onsite registration
 */
export const submitOnsiteRegistration = async (registrationData) => {
  try {
    console.log('Submitting onsite registration:', registrationData);

    // Calculate total amount based on schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('onsite_course_schedules')
      .select('price, early_bird_price, early_bird_deadline, additional_fees')
      .eq('id', registrationData.schedule_id)
      .single();

    if (scheduleError) throw scheduleError;

    // Calculate effective price
    const isEarlyBird = schedule.early_bird_deadline && 
                       new Date(schedule.early_bird_deadline) > new Date();
    const basePrice = isEarlyBird ? (schedule.early_bird_price || schedule.price) : schedule.price;
    
    // Add additional fees if any
    const additionalFees = schedule.additional_fees || {};
    const totalAdditionalFees = Object.values(additionalFees)
      .reduce((sum, fee) => sum + (parseFloat(fee) || 0), 0);
    
    const totalAmount = basePrice + totalAdditionalFees;

    // Prepare registration data
    const registrationRecord = {
      ...registrationData,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      submitted_at: new Date().toISOString()
    };

    // Insert registration
    const { data, error } = await supabase
      .from('onsite_registrations')
      .insert([registrationRecord])
      .select()
      .single();

    if (error) throw error;

    console.log('Registration submitted successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error submitting onsite registration:', error);
    return { data: null, error };
  }
};

/**
 * Check registration status by email
 */
export const checkRegistrationStatus = async (email, scheduleId = null) => {
  try {
    let query = supabase
      .from('onsite_registrations')
      .select(`
        *,
        onsite_course_schedules(
          batch_name,
          start_date,
          end_date,
          courses(title)
        )
      `)
      .eq('applicant_email', email);

    if (scheduleId) {
      query = query.eq('schedule_id', scheduleId);
    }

    query = query.order('submitted_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error checking registration status:', error);
    return { data: null, error };
  }
};

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

/**
 * Get all registrations for admin (with filters)
 */
export const getOnsiteRegistrations = async (filters = {}) => {
  try {
    let query = supabase
      .from('onsite_registrations')
      .select(`
        *,
        onsite_course_schedules(
          batch_name,
          start_date,
          courses(title)
        ),
        onsite_project_templates(project_title)
      `);

    // Apply filters
    if (filters.scheduleId) {
      query = query.eq('schedule_id', filters.scheduleId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    query = query.order('submitted_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching onsite registrations:', error);
    return { data: null, error };
  }
};

/**
 * Update registration status (Admin only)
 */
export const updateRegistrationStatus = async (registrationId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('onsite_registrations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        ...(updateData.status === 'approved' && { approved_at: new Date().toISOString() })
      })
      .eq('id', registrationId)
      .select(`
        *,
        onsite_course_schedules(
          batch_name,
          courses(title)
        )
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating registration status:', error);
    return { data: null, error };
  }
};

/**
 * Create course schedule (Admin only)
 */
export const createCourseSchedule = async (scheduleData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('onsite_course_schedules')
      .insert([{
        ...scheduleData,
        created_by: user.id
      }])
      .select(`
        *,
        courses(title)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating course schedule:', error);
    return { data: null, error };
  }
};

/**
 * Create project template (Admin only)
 */
export const createProjectTemplate = async (templateData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('onsite_project_templates')
      .insert([{
        ...templateData,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating project template:', error);
    return { data: null, error };
  }
};

/**
 * Update project template (Admin only)
 */
export const updateProjectTemplate = async (templateId, templateData) => {
  try {
    const { data, error } = await supabase
      .from('onsite_project_templates')
      .update({
        ...templateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating project template:', error);
    return { data: null, error };
  }
};

/**
 * Assign project to student (Admin only)
 */
export const assignProject = async (assignmentData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('onsite_project_assignments')
      .insert([{
        ...assignmentData,
        assigned_by: user.id
      }])
      .select(`
        *,
        onsite_registrations(applicant_name, applicant_email),
        onsite_project_templates(project_title, project_description)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error assigning project:', error);
    return { data: null, error };
  }
};

// ==========================================
// STATISTICS
// ==========================================

/**
 * Get onsite registration statistics
 */
export const getOnsiteRegistrationStats = async () => {
  try {
    const { data, error } = await supabase
      .from('onsite_registration_stats')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching onsite registration stats:', error);
    return { data: null, error };
  }
};

/**
 * Get project statistics
 */
export const getOnsiteProjectStats = async () => {
  try {
    const { data, error } = await supabase
      .from('onsite_project_stats')
      .select('*')
      .order('times_assigned', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching onsite project stats:', error);
    return { data: null, error };
  }
};

/**
 * Get attendance records
 */
export const getAttendanceRecords = async (scheduleId) => {
  try {
    const { data, error } = await supabase
      .from('onsite_attendance')
      .select(`
        *,
        onsite_registrations(applicant_name, applicant_email)
      `)
      .eq('schedule_id', scheduleId)
      .order('attendance_date', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return { data: null, error };
  }
};

/**
 * Record attendance (Admin only)
 */
export const recordAttendance = async (attendanceData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('onsite_attendance')
      .upsert([{
        ...attendanceData,
        checked_by: user.id
      }])
      .select(`
        *,
        onsite_registrations(applicant_name)
      `);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error recording attendance:', error);
    return { data: null, error };
  }
};