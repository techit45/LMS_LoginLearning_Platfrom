import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  BookOpen, 
  Users, 
  Award, 
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  Settings,
  Filter,
  Search,
  ClipboardList,
  Star,
  Megaphone,
  Heart,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../lib/notificationService';

const NotificationCenter = ({ onClose, isOpen = false }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef(null);

  // Load notifications from database
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: notificationsData, error } = await notificationService.getUserNotifications(user.id, {
        limit: 50
      });

      if (error) {
        console.error('Error loading notifications:', error);
        // Show empty state instead of fallback data
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      if (notificationsData && notificationsData.length > 0) {
        // Transform database notifications to match UI format
        const transformedNotifications = notificationsData.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          time: formatRelativeTime(notification.created_at),
          isRead: notification.is_read,
          priority: notification.priority,
          icon: getIconComponent(notification.icon),
          color: notification.color || getColorForType(notification.type),
          actionUrl: notification.action_url,
          createdAt: notification.created_at
        }));

        setNotifications(transformedNotifications);

        // Load unread count
        try {
          const { count } = await notificationService.getUnreadCount(user.id);
          setUnreadCount(count || 0);
        } catch (countError) {
          console.error('Error loading unread count:', countError);
          setUnreadCount(transformedNotifications.filter(n => !n.isRead).length);
        }
      } else {
        // No notifications found - show empty state
        console.log('No notifications found');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Show empty state on any error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get icon component from string
  const getIconComponent = (iconName) => {
    const iconMap = {
      BookOpen,
      AlertCircle,
      Award,
      MessageSquare,
      Users,
      TrendingUp,
      FileText,
      ClipboardList,
      Star,
      Megaphone,
      Heart,
      Upload,
      Settings,
      Bell,
      Info
    };
    return iconMap[iconName] || Bell;
  };

  // Helper function to get color for notification type
  const getColorForType = (type) => {
    const colorMap = {
      course: 'blue',
      assignment: 'orange',
      achievement: 'yellow',
      forum: 'purple',
      admin: 'green',
      system: 'indigo',
      grade: 'emerald',
      announcement: 'pink'
    };
    return colorMap[type] || 'gray';
  };

  // Helper function to format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} นาทีที่ผ่านมา`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ชั่วโมงที่ผ่านมา`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} วันที่ผ่านมา`;
    }
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications();
    }
  }, [isOpen, user]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter;
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Mark as read
  const markAsRead = async (id) => {
    if (!user?.id) return;

    // Find the notification
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return;

    // Check if this is a sample notification (not from database)
    if (typeof id === 'string' && id.startsWith('sample-')) {
      console.log('🧪 Sample notification clicked, only updating UI');
      // Only update UI for sample data
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    // Optimistic update
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Update in database (only for real notifications)
    try {
      await notificationService.markAsRead(id, user.id);
      console.log('✅ Notification marked as read:', id);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: false } : notif
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    const currentUnreadCount = unreadCount;
    setUnreadCount(0);

    // Update in database
    try {
      await notificationService.markAllAsRead(user.id);
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => prev.map(notif => 
        unreadNotifications.some(un => un.id === notif.id) 
          ? { ...notif, isRead: false } 
          : notif
      ));
      setUnreadCount(currentUnreadCount);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    if (!user?.id) return;

    // Find notification to check if it's unread
    const notification = notifications.find(n => n.id === id);
    if (!notification) {
      console.log('❌ Notification not found in UI state:', id);
      return;
    }
    
    console.log('🗑️ Attempting to delete notification:', { id, title: notification.title });
    
    const wasUnread = !notification.isRead;

    // Optimistic update
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Delete from database
    try {
      console.log('🔍 Calling notificationService.deleteNotification with:', { id, userId: user.id });
      const result = await notificationService.deleteNotification(id, user.id);
      
      if (result.error) {
        console.error('❌ Database delete failed:', result.error);
        // Revert optimistic update on error
        setNotifications(prev => [...prev, notification].sort(
          (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
        ));
        if (wasUnread) {
          setUnreadCount(prev => prev + 1);
        }
      } else {
        console.log('✅ Notification successfully deleted from database:', result.deletedId || id);
      }
    } catch (error) {
      console.error('💥 Exception during delete:', error);
      // Revert optimistic update on error
      setNotifications(prev => [...prev, notification].sort(
        (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
      ));
      if (wasUnread) {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!user?.id) return;
    if (notifications.length === 0) return;

    // Confirm deletion
    if (!window.confirm(`คุณต้องการลบการแจ้งเตือนทั้งหมด ${notifications.length} รายการ?\n\n⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    // Store current state for rollback
    const currentNotifications = notifications;
    const currentUnreadCount = unreadCount;

    // Optimistic update - clear all
    setNotifications([]);
    setUnreadCount(0);

    // Delete all from database
    try {
      // Delete each notification individually (since we don't have bulk delete)
      const deletePromises = notifications.map(notif => 
        notificationService.deleteNotification(notif.id, user.id)
      );
      
      await Promise.all(deletePromises);
      console.log('✅ All notifications deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting all notifications:', error);
      // Revert optimistic update on error
      setNotifications(currentNotifications);
      setUnreadCount(currentUnreadCount);
    }
  };

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'ทั้งหมด', count: notifications.length },
    { id: 'course', label: 'คอร์สเรียน', count: notifications.filter(n => n.type === 'course').length },
    { id: 'assignment', label: 'งานที่ได้รับมอบหมาย', count: notifications.filter(n => n.type === 'assignment').length },
    { id: 'achievement', label: 'ความสำเร็จ', count: notifications.filter(n => n.type === 'achievement').length },
    { id: 'forum', label: 'ฟอรัม', count: notifications.filter(n => n.type === 'forum').length }
  ];

  if (user?.user_metadata?.role === 'instructor' || user?.user_metadata?.role === 'admin') {
    filterOptions.push(
      { id: 'admin', label: 'การจัดการ', count: notifications.filter(n => n.type === 'admin').length },
      { id: 'system', label: 'ระบบ', count: notifications.filter(n => n.type === 'system').length }
    );
  }

  const displayUnreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Notification Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">การแจ้งเตือน</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} รายการใหม่
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {displayUnreadCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    อ่านทั้งหมด
                  </motion.button>
                )}
                {notifications.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={deleteAllNotifications}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    title="ลบการแจ้งเตือนทั้งหมด"
                  >
                    ลบทั้งหมด
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาการแจ้งเตือน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 overflow-x-auto">
                {filterOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilter(option.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      filter === option.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label} ({option.count})
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
                  />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mb-4 opacity-50" />
                  <div className="text-center space-y-2">
                    <p className="font-medium">
                      {searchQuery ? 'ไม่พบการแจ้งเตือนที่ค้นหา' : 'ยังไม่มีการแจ้งเตือน'}
                    </p>
                    {!searchQuery && notifications.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        การแจ้งเตือนจะปรากฏที่นี่เมื่อมีกิจกรรมใหม่
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence>
                    {filteredNotifications.map((notification, index) => {
                      const IconComponent = notification.icon;
                      const colorClasses = {
                        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
                        red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
                        yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
                        green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
                        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
                        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                      };

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                          transition={{ delay: index * 0.05 }}
                          className={`relative p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 transition-colors cursor-pointer group ${
                            notification.priority === 'high' 
                              ? 'border-red-400 bg-red-50/50 dark:bg-red-900/20' 
                              : notification.isRead 
                              ? 'border-gray-200 dark:border-gray-600' 
                              : 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${colorClasses[notification.color]}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className={`text-sm font-medium ${
                                  notification.isRead 
                                    ? 'text-gray-600 dark:text-gray-300' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {notification.title}
                                </h3>
                                
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                                )}
                              </div>
                              
                              <p className={`text-sm mt-1 ${
                                notification.isRead 
                                  ? 'text-gray-500 dark:text-gray-400' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.message}
                              </p>
                              
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                              title="ลบการแจ้งเตือนนี้"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>ตั้งค่าการแจ้งเตือน</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


export default NotificationCenter;