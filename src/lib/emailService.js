import { supabase } from './supabaseClient.js';

/**
 * Complete Email Service for Login Learning Platform
 * Handles email sending, templating, and logging
 */
class EmailService {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  // Load email templates from database
  async loadTemplates() {
    try {
      const { data: templates, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      templates?.forEach(template => {
        this.templates.set(template.template_key, template);
      });
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  }

  // Send email using Supabase Edge Functions
  async sendEmail({ to, subject, content, template = null, variables = {} }) {
    try {
      // Log email attempt
      const emailLog = await this.logEmail({
        recipient: to,
        subject,
        template,
        variables,
        status: 'sending'
      });

      // If template provided, use template
      if (template && this.templates.has(template)) {
        const templateData = this.templates.get(template);
        subject = this.replaceVariables(templateData.subject, variables);
        content = this.replaceVariables(templateData.content, variables);
      }

      // Send via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          content,
          from: process.env.VITE_EMAIL_FROM || 'noreply@login-learning.com'
        }
      });

      if (error) throw error;

      // Update log with success
      await this.updateEmailLog(emailLog.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_response: data
      });

      return { success: true, data };
    } catch (error) {
      // Update log with failure
      if (emailLog?.id) {
        await this.updateEmailLog(emailLog.id, {
          status: 'failed',
          error_message: error.message
        });
      }

      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Replace variables in templates
  replaceVariables(text, variables) {
    let result = text;
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    return result;
  }

  // Log email to database
  async logEmail(emailData) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .insert({
          recipient: emailData.recipient,
          subject: emailData.subject,
          template_key: emailData.template,
          variables: emailData.variables,
          status: emailData.status,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to log email:', error);
      return null;
    }
  }

  // Update email log
  async updateEmailLog(logId, updates) {
    try {
      const { error } = await supabase
        .from('email_logs')
        .update(updates)
        .eq('id', logId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update email log:', error);
    }
  }

  // Pre-defined email methods for common use cases
  async sendWelcomeEmail(userEmail, userName) {
    return await this.sendEmail({
      to: userEmail,
      template: 'welcome',
      variables: {
        user_name: userName,
        platform_name: 'Login Learning',
        login_url: `${window.location.origin}/login`
      }
    });
  }

  async sendCourseEnrollmentEmail(userEmail, userName, courseName) {
    return await this.sendEmail({
      to: userEmail,
      template: 'course_enrollment',
      variables: {
        user_name: userName,
        course_name: courseName,
        dashboard_url: `${window.location.origin}/dashboard`
      }
    });
  }

  async sendAssignmentGradedEmail(userEmail, userName, assignmentName, score, maxScore) {
    return await this.sendEmail({
      to: userEmail,
      template: 'assignment_graded',
      variables: {
        user_name: userName,
        assignment_name: assignmentName,
        score: score,
        max_score: maxScore,
        percentage: Math.round((score / maxScore) * 100),
        view_url: `${window.location.origin}/progress`
      }
    });
  }

  async sendPasswordResetEmail(userEmail, resetLink) {
    return await this.sendEmail({
      to: userEmail,
      template: 'password_reset',
      variables: {
        reset_link: resetLink,
        expires_in: '24 ชั่วโมง'
      }
    });
  }

  async sendCourseCompletionEmail(userEmail, userName, courseName) {
    return await this.sendEmail({
      to: userEmail,
      template: 'course_completion',
      variables: {
        user_name: userName,
        course_name: courseName,
        certificate_url: `${window.location.origin}/certificates`
      }
    });
  }

  // Bulk email sending
  async sendBulkEmail(recipients, subject, content, template = null) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: recipient.email,
        subject,
        content,
        template,
        variables: recipient.variables || {}
      });
      
      results.push({
        email: recipient.email,
        success: result.success,
        error: result.error
      });
      
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  // Get email statistics
  async getEmailStats(dateFrom = null, dateTo = null) {
    try {
      let query = supabase
        .from('email_logs')
        .select('status, created_at');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data.length,
        sent: data.filter(log => log.status === 'sent').length,
        failed: data.filter(log => log.status === 'failed').length,
        pending: data.filter(log => log.status === 'sending').length
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;