import { supabase } from './supabaseClient.js';

/**
 * Comprehensive Notification Service for Login Learning Platform
 * Handles creation, retrieval, and management of real-time notifications
 */
class NotificationService {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  // Load notification templates from database
  async loadTemplates() {
    try {
      const { data: templates, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      templates?.forEach(template => {
        this.templates.set(template.template_key, template);
      });
    } catch (error) {
      console.error('Error loading notification templates:', error);
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type = null,
        unreadOnly = false,
        company = 'login'
      } = options;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('company', company)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { data: [], error: error.message };
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count', {
          target_user_id: userId
        });

      if (error) throw error;
      return { count: data || 0, error: null };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { count: 0, error: error.message };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('recipient_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { data: null, error: error.message };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .rpc('mark_all_notifications_read', {
          target_user_id: userId
        });

      if (error) throw error;
      return { count: data || 0, error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { count: 0, error: error.message };
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      // First verify the notification exists and belongs to the user
      const { data: existing, error: fetchError } = await supabase
        .from('notifications')
        .select('id, recipient_id')
        .eq('id', notificationId)
        .eq('recipient_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Notification doesn't exist or doesn't belong to user
          console.log('🚫 Notification not found or access denied:', notificationId);
          return { error: 'Notification not found or access denied' };
        }
        throw fetchError;
      }

      if (!existing) {
        console.log('🚫 No notification found with ID:', notificationId);
        return { error: 'Notification not found' };
      }

      // Delete the notification
      const { data: deleted, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', userId)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Database delete error:', error);
        throw error;
      }

      if (deleted && deleted.id) {
        console.log('✅ Notification successfully deleted from database:', deleted.id);
        return { error: null, deletedId: deleted.id };
      } else {
        console.error('⚠️ Delete operation completed but no data returned');
        return { error: 'Delete operation may have failed - no confirmation received' };
      }
    } catch (error) {
      console.error('💥 Error deleting notification:', error);
      return { error: error.message };
    }
  }

  // Create a notification using template
  async createNotificationFromTemplate(templateKey, recipientId, variables = {}, options = {}) {
    try {
      const template = this.templates.get(templateKey);
      if (!template) {
        // Try to load templates again
        await this.loadTemplates();
        const retryTemplate = this.templates.get(templateKey);
        if (!retryTemplate) {
          throw new Error(`Template '${templateKey}' not found`);
        }
        return this.createNotificationFromTemplate(templateKey, recipientId, variables, options);
      }

      // Replace variables in template
      const title = this.replaceVariables(template.title_template, variables);
      const message = this.replaceVariables(template.message_template, variables);
      const actionUrl = template.action_url_template 
        ? this.replaceVariables(template.action_url_template, variables)
        : null;

      const notification = {
        recipient_id: recipientId,
        sender_id: options.senderId || null,
        title,
        message,
        type: template.type,
        priority: options.priority || template.priority,
        related_entity_type: options.entityType || null,
        related_entity_id: options.entityId || null,
        related_entity_metadata: options.metadata || null,
        action_url: actionUrl,
        icon: template.icon,
        color: template.color,
        expires_at: options.expiresAt || null,
        company: options.company || 'login'
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Error creating notification from template:', error);
      return { data: null, error: error.message };
    }
  }

  // Create a custom notification
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { data: null, error: error.message };
    }
  }

  // Bulk create notifications (for announcements)
  async createBulkNotifications(notifications) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      return { data: [], error: error.message };
    }
  }

  // Helper function to replace variables in templates
  replaceVariables(template, variables) {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    return result;
  }

  // Get user notification preferences
  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Create default preferences if none exist
      if (!data) {
        return await this.createDefaultPreferences(userId);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return { data: null, error: error.message };
    }
  }

  // Create default notification preferences for user
  async createDefaultPreferences(userId) {
    try {
      const defaultPreferences = {
        user_id: userId,
        // All notifications enabled by default
        email_course_updates: true,
        email_assignments: true,
        email_grades: true,
        email_achievements: true,
        email_forum_replies: true,
        email_announcements: true,
        app_course_updates: true,
        app_assignments: true,
        app_grades: true,
        app_achievements: true,
        app_forum_replies: true,
        app_announcements: true,
        email_digest_frequency: 'daily',
        digest_time: '09:00:00'
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert([defaultPreferences])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return { data: null, error: error.message };
    }
  }

  // Update user notification preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { data: null, error: error.message };
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId, callback) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          callback('new_notification', payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          callback('notification_updated', payload.new);
        }
      )
      .subscribe();

    return subscription;
  }

  // Unsubscribe from notifications
  unsubscribeFromNotifications(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_notifications');

      if (error) throw error;
      return { deletedCount: data || 0, error: null };
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return { deletedCount: 0, error: error.message };
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();

// Convenience functions for common notification types
export const NotificationHelpers = {
  // Course-related notifications
  async notifyCourseEnrollment(userId, courseData) {
    return await notificationService.createNotificationFromTemplate(
      'course_enrollment',
      userId,
      {
        course_name: courseData.title,
        course_id: courseData.id
      },
      {
        entityType: 'course',
        entityId: courseData.id,
        metadata: { courseTitle: courseData.title }
      }
    );
  },

  async notifyNewCourseContent(userId, courseData, contentData) {
    return await notificationService.createNotificationFromTemplate(
      'course_new_content',
      userId,
      {
        course_name: courseData.title,
        content_title: contentData.title,
        course_id: courseData.id
      },
      {
        entityType: 'course_content',
        entityId: contentData.id,
        metadata: { courseTitle: courseData.title, contentTitle: contentData.title }
      }
    );
  },

  async notifyCourseCompletion(userId, courseData) {
    return await notificationService.createNotificationFromTemplate(
      'course_completed',
      userId,
      {
        course_name: courseData.title,
        course_id: courseData.id
      },
      {
        priority: 'high',
        entityType: 'course',
        entityId: courseData.id,
        metadata: { courseTitle: courseData.title }
      }
    );
  },

  // Assignment-related notifications
  async notifyNewAssignment(userId, assignmentData, courseData) {
    return await notificationService.createNotificationFromTemplate(
      'assignment_new',
      userId,
      {
        assignment_title: assignmentData.title,
        course_name: courseData.title,
        due_date: new Date(assignmentData.due_date).toLocaleDateString('th-TH'),
        assignment_id: assignmentData.id
      },
      {
        priority: 'high',
        entityType: 'assignment',
        entityId: assignmentData.id,
        metadata: { assignmentTitle: assignmentData.title, courseTitle: courseData.title }
      }
    );
  },

  async notifyAssignmentReminder(userId, assignmentData, daysLeft) {
    return await notificationService.createNotificationFromTemplate(
      'assignment_reminder',
      userId,
      {
        assignment_title: assignmentData.title,
        days_left: daysLeft,
        assignment_id: assignmentData.id
      },
      {
        priority: 'urgent',
        entityType: 'assignment',
        entityId: assignmentData.id,
        metadata: { assignmentTitle: assignmentData.title, daysLeft }
      }
    );
  },

  async notifyAssignmentGraded(userId, assignmentData, score, maxScore) {
    return await notificationService.createNotificationFromTemplate(
      'assignment_graded',
      userId,
      {
        assignment_title: assignmentData.title,
        score: score,
        max_score: maxScore,
        assignment_id: assignmentData.id
      },
      {
        entityType: 'assignment',
        entityId: assignmentData.id,
        metadata: { assignmentTitle: assignmentData.title, score, maxScore }
      }
    );
  },

  // Forum-related notifications
  async notifyForumReply(userId, topicData, senderData) {
    return await notificationService.createNotificationFromTemplate(
      'forum_reply',
      userId,
      {
        sender_name: senderData.full_name || senderData.email,
        topic_title: topicData.title,
        topic_id: topicData.id
      },
      {
        senderId: senderData.id,
        entityType: 'forum_topic',
        entityId: topicData.id,
        metadata: { topicTitle: topicData.title, senderName: senderData.full_name }
      }
    );
  },

  // Achievement notifications
  async notifyAchievement(userId, badgeName, description) {
    return await notificationService.createNotificationFromTemplate(
      'achievement_badge',
      userId,
      {
        badge_name: badgeName,
        achievement_description: description
      },
      {
        priority: 'normal',
        entityType: 'achievement',
        metadata: { badgeName, description }
      }
    );
  },

  // System notifications
  async notifyWelcome(userId) {
    return await notificationService.createNotificationFromTemplate(
      'user_welcome',
      userId,
      {},
      {
        priority: 'normal'
      }
    );
  },

  async notifyAnnouncement(userIds, message, url = null) {
    const notifications = userIds.map(userId => ({
      recipient_id: userId,
      title: 'ประกาศจากระบบ',
      message: message,
      type: 'announcement',
      priority: 'normal',
      action_url: url,
      icon: 'Megaphone',
      color: 'indigo',
      company: 'login'
    }));

    return await notificationService.createBulkNotifications(notifications);
  },

  // Instructor notifications
  async notifyNewStudentEnrolled(instructorId, studentData, courseData) {
    return await notificationService.createNotificationFromTemplate(
      'new_student_enrolled',
      instructorId,
      {
        student_name: studentData.full_name || studentData.email,
        course_name: courseData.title,
        course_id: courseData.id
      },
      {
        entityType: 'enrollment',
        entityId: courseData.id,
        metadata: { studentName: studentData.full_name, courseTitle: courseData.title }
      }
    );
  },

  async notifyAssignmentSubmitted(instructorId, studentData, assignmentData) {
    return await notificationService.createNotificationFromTemplate(
      'assignment_submitted',
      instructorId,
      {
        student_name: studentData.full_name || studentData.email,
        assignment_title: assignmentData.title,
        assignment_id: assignmentData.id
      },
      {
        entityType: 'assignment_submission',
        entityId: assignmentData.id,
        metadata: { studentName: studentData.full_name, assignmentTitle: assignmentData.title }
      }
    );
  }
};

export default notificationService;