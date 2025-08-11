import notificationService, { NotificationHelpers } from './notificationService.js';

/**
 * Integration helpers to connect notification system with all platform systems
 * This file handles automatic notification triggers from various platform activities
 */

class NotificationIntegrations {
  
  // Course enrollment notifications
  static async handleCourseEnrollment(userId, courseData) {
    try {
      // Notify student about successful enrollment
      await NotificationHelpers.notifyCourseEnrollment(userId, courseData);
      
      // Notify instructor about new student (if instructor exists)
      if (courseData.instructor_id) {
        const studentData = await this.getUserProfile(userId);
        await NotificationHelpers.notifyNewStudentEnrolled(
          courseData.instructor_id,
          studentData,
          courseData
        );
      }
      
      console.log('Course enrollment notifications sent');
    } catch (error) {
      console.error('Error sending course enrollment notifications:', error);
    }
  }

  // Assignment submission notifications
  static async handleAssignmentSubmission(userId, assignmentData, courseData) {
    try {
      // Notify instructor about new submission
      if (courseData.instructor_id) {
        const studentData = await this.getUserProfile(userId);
        await NotificationHelpers.notifyAssignmentSubmitted(
          courseData.instructor_id,
          studentData,
          assignmentData
        );
      }
      
      console.log('Assignment submission notification sent');
    } catch (error) {
      console.error('Error sending assignment submission notification:', error);
    }
  }

  // Assignment grading notifications
  static async handleAssignmentGraded(userId, assignmentData, score, maxScore) {
    try {
      await NotificationHelpers.notifyAssignmentGraded(
        userId,
        assignmentData,
        score,
        maxScore
      );
      
      console.log('Assignment graded notification sent');
    } catch (error) {
      console.error('Error sending assignment graded notification:', error);
    }
  }

  // New course content notifications
  static async handleNewCourseContent(courseData, contentData, enrolledStudentIds = []) {
    try {
      if (enrolledStudentIds.length === 0) {
        // Get enrolled students if not provided
        enrolledStudentIds = await this.getEnrolledStudents(courseData.id);
      }

      // Notify all enrolled students about new content
      const notificationPromises = enrolledStudentIds.map(studentId => 
        NotificationHelpers.notifyNewCourseContent(studentId, courseData, contentData)
      );

      await Promise.all(notificationPromises);
      console.log(`New content notifications sent to ${enrolledStudentIds.length} students`);
    } catch (error) {
      console.error('Error sending new course content notifications:', error);
    }
  }

  // Forum reply notifications
  static async handleForumReply(topicData, replyData, senderData) {
    try {
      // Get topic creator ID (exclude sender)
      if (topicData.created_by && topicData.created_by !== senderData.id) {
        await NotificationHelpers.notifyForumReply(
          topicData.created_by,
          topicData,
          senderData
        );
      }

      // Notify other participants in the topic (if any tracking system exists)
      // This would require a participants tracking system
      
      console.log('Forum reply notification sent');
    } catch (error) {
      console.error('Error sending forum reply notification:', error);
    }
  }

  // Achievement notifications
  static async handleAchievement(userId, badgeName, description) {
    try {
      await NotificationHelpers.notifyAchievement(userId, badgeName, description);
      console.log('Achievement notification sent');
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  // Course completion notifications
  static async handleCourseCompletion(userId, courseData) {
    try {
      await NotificationHelpers.notifyCourseCompletion(userId, courseData);
      console.log('Course completion notification sent');
    } catch (error) {
      console.error('Error sending course completion notification:', error);
    }
  }

  // Assignment reminder notifications
  static async handleAssignmentReminder(userId, assignmentData, daysLeft) {
    try {
      await NotificationHelpers.notifyAssignmentReminder(userId, assignmentData, daysLeft);
      console.log('Assignment reminder notification sent');
    } catch (error) {
      console.error('Error sending assignment reminder notification:', error);
    }
  }

  // Welcome notification for new users
  static async handleUserWelcome(userId) {
    try {
      await NotificationHelpers.notifyWelcome(userId);
      console.log('Welcome notification sent');
    } catch (error) {
      console.error('Error sending welcome notification:', error);
    }
  }

  // System announcements
  static async handleSystemAnnouncement(message, url = null, targetUserIds = []) {
    try {
      if (targetUserIds.length === 0) {
        // Get all active users if no specific targets
        targetUserIds = await this.getAllActiveUsers();
      }

      await NotificationHelpers.notifyAnnouncement(targetUserIds, message, url);
      console.log(`System announcement sent to ${targetUserIds.length} users`);
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  }

  // Helper methods for data retrieval
  static async getUserProfile(userId) {
    try {
      const { supabase } = await import('./supabaseClient.js');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, email')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return {
          id: userId,
          full_name: 'ผู้ใช้งาน',
          email: 'user@example.com'
        };
      }

      return {
        id: data.user_id,
        full_name: data.full_name || 'ผู้ใช้งาน',
        email: data.email || 'user@example.com'
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { id: userId, full_name: 'ผู้ใช้งาน', email: 'user@example.com' };
    }
  }

  static async getEnrolledStudents(courseId) {
    try {
      const { supabase } = await import('./supabaseClient.js');
      const { data, error } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('course_id', courseId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching enrolled students:', error);
        return [];
      }

      return data ? data.map(enrollment => enrollment.user_id) : [];
    } catch (error) {
      console.error('Error getting enrolled students:', error);
      return [];
    }
  }

  static async getAllActiveUsers() {
    try {
      const { supabase } = await import('./supabaseClient.js');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching active users:', error);
        return [];
      }

      return data ? data.map(profile => profile.user_id) : [];
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  // Integration points for existing services
  static integratWithServices() {
    return {
      // Course service integration
      course: {
        onEnrollment: this.handleCourseEnrollment.bind(this),
        onNewContent: this.handleNewCourseContent.bind(this),
        onCompletion: this.handleCourseCompletion.bind(this)
      },

      // Assignment service integration
      assignment: {
        onSubmission: this.handleAssignmentSubmission.bind(this),
        onGraded: this.handleAssignmentGraded.bind(this),
        onReminder: this.handleAssignmentReminder.bind(this)
      },

      // Forum service integration
      forum: {
        onReply: this.handleForumReply.bind(this)
      },

      // Achievement service integration
      achievement: {
        onEarned: this.handleAchievement.bind(this)
      },

      // User service integration
      user: {
        onWelcome: this.handleUserWelcome.bind(this)
      },

      // System integration
      system: {
        onAnnouncement: this.handleSystemAnnouncement.bind(this)
      }
    };
  }
}

// Export singleton instance
export default NotificationIntegrations;

// Export individual handlers for direct use
export const {
  handleCourseEnrollment,
  handleAssignmentSubmission,
  handleAssignmentGraded,
  handleNewCourseContent,
  handleForumReply,
  handleAchievement,
  handleCourseCompletion,
  handleAssignmentReminder,
  handleUserWelcome,
  handleSystemAnnouncement
} = NotificationIntegrations;