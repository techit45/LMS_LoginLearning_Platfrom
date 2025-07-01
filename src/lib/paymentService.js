import { supabase } from './supabaseClient';

// ==========================================
// PAYMENT SERVICE
// Handle all payment-related operations
// ==========================================

/**
 * Get all active payment methods
 */
export const getPaymentMethods = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('method_name');

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return { data: [], error };
  }
};

/**
 * Create a new payment record
 */
export const createPayment = async (paymentData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const paymentRecord = {
      user_id: user.id,
      payment_method_id: paymentData.payment_method_id,
      order_type: paymentData.order_type,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency || 'THB',
      fees: paymentData.fees || 0,
      net_amount: paymentData.amount - (paymentData.fees || 0),
      status: 'pending',
      provider_name: paymentData.provider_name,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      payment_metadata: paymentData.metadata || {}
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([paymentRecord])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { data: null, error };
  }
};

/**
 * Generate PromptPay QR Code data
 */
export const generatePromptPayQR = async (paymentId, amount) => {
  try {
    // Get payment method config for PromptPay
    const { data: method } = await supabase
      .from('payment_methods')
      .select('config')
      .eq('method_name', 'promptpay')
      .single();

    if (!method) {
      throw new Error('PromptPay payment method not configured');
    }

    const promptpayId = method.config.promptpay_id || '0000000000000';
    
    // Generate PromptPay QR Code data (simplified)
    // In production, use proper PromptPay QR library
    const qrData = generatePromptPayQRData(promptpayId, amount, paymentId);
    
    // Update payment record with QR data
    const { data, error } = await supabase
      .from('payments')
      .update({
        qr_code_data: qrData,
        qr_code_url: `data:text/plain;base64,${btoa(qrData)}`,
        qr_expires_at: new Date(Date.now() + 15 * 60 * 1000),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error generating PromptPay QR:', error);
    return { data: null, error };
  }
};

/**
 * Helper function to generate PromptPay QR data
 * This is a simplified version - use proper PromptPay library in production
 */
function generatePromptPayQRData(promptpayId, amount, reference) {
  // This is a mock implementation
  // In production, use @bank-of-thailand/promptpay-qr or similar library
  
  const qrData = {
    promptpayId: promptpayId,
    amount: parseFloat(amount).toFixed(2),
    reference: reference,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(qrData);
}

/**
 * Check payment status
 */
export const checkPaymentStatus = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return { data: null, error };
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, status, metadata = {}) => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      payment_metadata: metadata
    };

    // Add paid_at timestamp if status is completed
    if (status === 'completed') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { data: null, error };
  }
};

/**
 * Get user payment history
 */
export const getUserPayments = async (userId = null) => {
  try {
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_methods (
          display_name,
          method_name
        )
      `)
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user payments:', error);
    return { data: [], error };
  }
};

/**
 * Process course enrollment payment
 */
export const processEnrollmentPayment = async (courseId, paymentMethodId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new Error('Course not found');
    }

    if (course.price <= 0) {
      throw new Error('This course is free');
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      throw new Error('Already enrolled in this course');
    }

    // Create enrollment record with pending payment status
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert([{
        user_id: user.id,
        course_id: courseId,
        payment_status: 'pending',
        status: 'pending'
      }])
      .select()
      .single();

    if (enrollError) throw enrollError;

    // Create payment record
    const paymentData = {
      payment_method_id: paymentMethodId,
      order_type: 'course_enrollment',
      order_id: enrollment.id,
      amount: course.price,
      provider_name: 'promptpay', // Default to PromptPay for now
      metadata: {
        course_id: courseId,
        course_title: course.title,
        enrollment_id: enrollment.id
      }
    };

    const { data: payment, error: paymentError } = await createPayment(paymentData);

    if (paymentError) {
      // Rollback enrollment if payment creation failed
      await supabase.from('enrollments').delete().eq('id', enrollment.id);
      throw paymentError;
    }

    return { 
      data: { 
        payment, 
        enrollment,
        course 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error processing enrollment payment:', error);
    return { data: null, error };
  }
};

/**
 * Get payment analytics (admin only)
 */
export const getPaymentAnalytics = async (dateFrom, dateTo) => {
  try {
    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Get payment statistics
    const { data, error } = await supabase
      .from('payments')
      .select('status, amount, currency, created_at, order_type')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate analytics
    const analytics = {
      total_transactions: data.length,
      total_revenue: data
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      pending_payments: data.filter(p => p.status === 'pending').length,
      failed_payments: data.filter(p => p.status === 'failed').length,
      completed_payments: data.filter(p => p.status === 'completed').length,
      course_enrollments: data.filter(p => p.order_type === 'course_enrollment').length,
      kit_purchases: data.filter(p => p.order_type === 'kit_purchase').length
    };

    return { data: { analytics, transactions: data }, error: null };
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    return { data: null, error };
  }
};