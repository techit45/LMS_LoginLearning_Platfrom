// Certificate Service
// ระบบจัดการใบประกาศนียบัตร

import { supabase } from './supabaseClient';

// ==========================================
// ERROR HANDLING
// ==========================================

const handleError = (error, context = '') => {
  console.error(`[Certificate Service] ${context}:`, error);

  const errorMessages = {
    '23505': 'คำขอนี้มีอยู่แล้ว',
    '23503': 'ไม่พบข้อมูลที่เกี่ยวข้อง',
    'PGRST116': 'ไม่พบข้อมูลที่ต้องการ',
  };

  if (error.code && errorMessages[error.code]) {
    return { error: errorMessages[error.code], data: null };
  }

  return { error: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ', data: null };
};

// ==========================================
// CERTIFICATE TEMPLATES
// ==========================================

/**
 * Create certificate template
 * @param {Object} templateData - Template data
 * @returns {Promise<{data, error}>}
 */
export const createCertificateTemplate = async (templateData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('กรุณาเข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('certificate_templates')
      .insert({
        name: templateData.name,
        description: templateData.description,
        background_url: templateData.backgroundUrl,
        layout_config: templateData.layoutConfig || {},
        course_id: templateData.courseId || null,
        company_id: templateData.companyId || null,
        is_active: templateData.isActive !== false,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Create Template');
  }
};

/**
 * Get all certificate templates
 * @param {Object} filters - Filter options
 * @returns {Promise<{data, error}>}
 */
export const getCertificateTemplates = async (filters = {}) => {
  try {
    let query = supabase
      .from('certificate_templates')
      .select(`
        *,
        course:courses(id, title),
        creator:user_profiles!certificate_templates_created_by_fkey(user_id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Templates');
  }
};

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise<{data, error}>}
 */
export const getTemplateById = async (templateId) => {
  try {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select(`
        *,
        course:courses(id, title, description)
      `)
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Template By ID');
  }
};

/**
 * Update certificate template
 * @param {string} templateId - Template ID
 * @param {Object} updates - Update data
 * @returns {Promise<{data, error}>}
 */
export const updateCertificateTemplate = async (templateId, updates) => {
  try {
    const { data, error } = await supabase
      .from('certificate_templates')
      .update({
        name: updates.name,
        description: updates.description,
        background_url: updates.backgroundUrl,
        layout_config: updates.layoutConfig,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Update Template');
  }
};

/**
 * Delete certificate template
 * @param {string} templateId - Template ID
 * @returns {Promise<{data, error}>}
 */
export const deleteCertificateTemplate = async (templateId) => {
  try {
    const { error } = await supabase
      .from('certificate_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return handleError(error, 'Delete Template');
  }
};

/**
 * Upload template background image
 * @param {File} file - Image file
 * @param {string} templateId - Template ID
 * @returns {Promise<{data: string, error}>}
 */
export const uploadTemplateBackground = async (file, templateId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${templateId}-${Date.now()}.${fileExt}`;
    const filePath = `certificate-backgrounds/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath);

    return { data: publicUrl, error: null };
  } catch (error) {
    return handleError(error, 'Upload Background');
  }
};

// ==========================================
// CERTIFICATE SUBMISSIONS
// ==========================================

/**
 * Request certificate
 * @param {Object} requestData - Certificate request data
 * @returns {Promise<{data, error}>}
 */
export const requestCertificate = async (requestData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('กรุณาเข้าสู่ระบบ');

    // Check if already requested
    const { data: existing } = await supabase
      .from('certificate_submissions')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', requestData.courseId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('คุณได้ส่งคำขอใบเซอร์สำหรับคอร์สนี้แล้ว กรุณารอการอนุมัติ');
      } else if (existing.status === 'approved' || existing.status === 'issued') {
        throw new Error('คุณได้รับใบเซอร์สำหรับคอร์สนี้แล้ว');
      }
    }

    // Create submission
    const { data, error } = await supabase
      .from('certificate_submissions')
      .insert({
        student_id: user.id,
        course_id: requestData.courseId,
        template_id: requestData.templateId,
        student_name: requestData.studentName,
        student_email: requestData.studentEmail,
        additional_info: requestData.additionalInfo || {},
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Request Certificate');
  }
};

/**
 * Get certificate submissions with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<{data, error}>}
 */
export const getCertificateSubmissions = async (filters = {}) => {
  try {
    let query = supabase
      .from('certificate_submissions')
      .select(`
        *,
        student:user_profiles!certificate_submissions_student_id_fkey(user_id, full_name, email),
        course:courses(id, title, category),
        template:certificate_templates(id, name),
        reviewer:user_profiles!certificate_submissions_reviewed_by_fkey(user_id, full_name)
      `)
      .order('submitted_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Certificate Submissions');
  }
};

/**
 * Get submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<{data, error}>}
 */
export const getSubmissionById = async (submissionId) => {
  try {
    const { data, error } = await supabase
      .from('certificate_submissions')
      .select(`
        *,
        student:user_profiles!certificate_submissions_student_id_fkey(user_id, full_name, email, phone),
        course:courses(id, title, description, category),
        template:certificate_templates(id, name, layout_config, background_url),
        reviewer:user_profiles!certificate_submissions_reviewed_by_fkey(user_id, full_name)
      `)
      .eq('id', submissionId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Submission By ID');
  }
};

/**
 * Approve certificate request
 * @param {string} submissionId - Submission ID
 * @param {Object} approvalData - Approval data
 * @returns {Promise<{data, error}>}
 */
export const approveCertificate = async (submissionId, approvalData = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('กรุณาเข้าสู่ระบบ');

    // Get submission details
    const { data: submission, error: fetchError } = await getSubmissionById(submissionId);
    if (fetchError) throw new Error(fetchError);

    // Generate certificate number
    const { data: certNumber } = await supabase.rpc('generate_certificate_number');

    // Generate certificate PDF
    const certificateUrl = await generateCertificatePDF({
      submission,
      certificateNumber: certNumber,
      ...approvalData
    });

    // Update submission
    const { data, error } = await supabase
      .from('certificate_submissions')
      .update({
        status: 'approved',
        certificate_url: certificateUrl,
        certificate_number: certNumber,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        issued_at: new Date().toISOString(),
        review_notes: approvalData.notes || null
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    // TODO: Send email notification to student
    // await sendCertificateEmail(submission.student_email, certificateUrl);

    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Approve Certificate');
  }
};

/**
 * Reject certificate request
 * @param {string} submissionId - Submission ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<{data, error}>}
 */
export const rejectCertificate = async (submissionId, reason) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('กรุณาเข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('certificate_submissions')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reason
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Reject Certificate');
  }
};

/**
 * Get student's certificates
 * @param {string} studentId - Student ID (optional, uses current user)
 * @returns {Promise<{data, error}>}
 */
export const getStudentCertificates = async (studentId = null) => {
  try {
    const uid = studentId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('กรุณาเข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('certificate_submissions')
      .select(`
        *,
        course:courses(id, title, category),
        template:certificate_templates(name)
      `)
      .eq('student_id', uid)
      .in('status', ['approved', 'issued'])
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleError(error, 'Get Student Certificates');
  }
};

// ==========================================
// CERTIFICATE GENERATION
// ==========================================

/**
 * Generate certificate PDF
 * @param {Object} data - Certificate data
 * @returns {Promise<string>} Certificate URL
 */
export const generateCertificatePDF = async (data) => {
  try {
    // This would typically call a backend service or Supabase Edge Function
    // For now, we'll create a placeholder implementation

    const { submission, certificateNumber } = data;
    const template = submission.template;
    const layout = template.layout_config || {};

    // In production, this would:
    // 1. Use a PDF generation library (like jsPDF, PDFKit, or Puppeteer)
    // 2. Apply the template layout configuration
    // 3. Generate the PDF with student info
    // 4. Upload to Supabase Storage
    // 5. Return the public URL

    // For now, return a placeholder
    console.log('Generating certificate PDF for:', {
      student: submission.student_name,
      course: submission.course.title,
      number: certificateNumber
    });

    // Placeholder URL - in production this would be the actual generated PDF URL
    const placeholderUrl = `https://storage.supabase.com/certificates/${certificateNumber}.pdf`;

    return placeholderUrl;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
};

/**
 * Preview certificate (without saving)
 * @param {string} templateId - Template ID
 * @param {Object} previewData - Preview data
 * @returns {Promise<{data: string, error}>}
 */
export const previewCertificate = async (templateId, previewData) => {
  try {
    const { data: template, error } = await getTemplateById(templateId);
    if (error) throw new Error(error);

    // Generate preview URL (in production, this would generate an actual preview)
    const previewUrl = await generateCertificatePDF({
      submission: {
        student_name: previewData.studentName || 'ตัวอย่าง ผู้เรียน',
        course: {
          title: previewData.courseName || 'ชื่อคอร์ส'
        },
        template
      },
      certificateNumber: 'PREVIEW-' + Date.now()
    });

    return { data: previewUrl, error: null };
  } catch (error) {
    return handleError(error, 'Preview Certificate');
  }
};

// ==========================================
// STATISTICS
// ==========================================

/**
 * Get certificate statistics
 * @param {Object} filters - Filter options
 * @returns {Promise<{data, error}>}
 */
export const getCertificateStatistics = async (filters = {}) => {
  try {
    let query = supabase
      .from('certificate_submissions')
      .select('status, course_id, submitted_at, issued_at');

    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: data.length,
      pending: data.filter(s => s.status === 'pending').length,
      approved: data.filter(s => s.status === 'approved' || s.status === 'issued').length,
      rejected: data.filter(s => s.status === 'rejected').length,
      averageProcessingTime: 0
    };

    // Calculate average processing time
    const processedSubmissions = data.filter(s =>
      s.status !== 'pending' && s.issued_at
    );

    if (processedSubmissions.length > 0) {
      const totalTime = processedSubmissions.reduce((acc, s) => {
        const submitted = new Date(s.submitted_at);
        const issued = new Date(s.issued_at);
        return acc + (issued - submitted);
      }, 0);

      stats.averageProcessingTime = Math.round(
        totalTime / processedSubmissions.length / (1000 * 60 * 60 * 24)
      ); // in days
    }

    return { data: stats, error: null };
  } catch (error) {
    return handleError(error, 'Get Statistics');
  }
};

// ==========================================
// VALIDATION
// ==========================================

/**
 * Validate certificate request data
 * @param {Object} data - Request data
 * @returns {Object} Validation result
 */
export const validateCertificateRequest = (data) => {
  const errors = {};

  if (!data.studentName || data.studentName.trim() === '') {
    errors.studentName = 'กรุณาระบุชื่อ-นามสกุล';
  }

  if (!data.studentEmail || !data.studentEmail.includes('@')) {
    errors.studentEmail = 'กรุณาระบุอีเมลที่ถูกต้อง';
  }

  if (!data.courseId) {
    errors.courseId = 'กรุณาเลือกคอร์ส';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  // Templates
  createCertificateTemplate,
  getCertificateTemplates,
  getTemplateById,
  updateCertificateTemplate,
  deleteCertificateTemplate,
  uploadTemplateBackground,

  // Submissions
  requestCertificate,
  getCertificateSubmissions,
  getSubmissionById,
  approveCertificate,
  rejectCertificate,
  getStudentCertificates,

  // Generation
  generateCertificatePDF,
  previewCertificate,

  // Statistics
  getCertificateStatistics,

  // Validation
  validateCertificateRequest
};
