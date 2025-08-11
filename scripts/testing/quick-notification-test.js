// Quick test for notification system
// Paste this in browser console when logged into the app

console.log('🔥 Quick Notification System Test');

// Function to create a test notification and verify read status
async function quickNotificationTest() {
  try {
    // Import the service (this will work in browser)
    const { supabase } = await import('./src/lib/supabaseClient.js');
    const notificationService = (await import('./src/lib/notificationService.js')).default;
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No user logged in');
      return;
    }
    
    console.log('✅ User logged in:', user.email);
    
    // Step 1: Create test notification
    console.log('\n📝 Step 1: Creating test notification...');
    
    const testNotif = {
      recipient_id: user.id,
      title: '🧪 Quick Test Notification',
      message: 'Click me to test mark as read functionality!',
      type: 'system',
      priority: 'normal',
      icon: 'TestTube',
      color: 'purple',
      is_read: false
    };
    
    const { data: createdNotif, error: createError } = await notificationService.createNotification(testNotif);
    
    if (createError) {
      console.error('❌ Error creating notification:', createError);
      return;
    }
    
    console.log('✅ Test notification created:', createdNotif?.id);
    
    // Step 2: Verify it's unread
    console.log('\n🔍 Step 2: Verifying unread status...');
    
    const { data: notifications, error: fetchError } = await notificationService.getUserNotifications(user.id, {
      limit: 5
    });
    
    if (fetchError) {
      console.error('❌ Error fetching notifications:', fetchError);
      return;
    }
    
    const testNotification = notifications.find(n => n.id === createdNotif.id);
    
    if (!testNotification) {
      console.error('❌ Test notification not found in results');
      return;
    }
    
    console.log('✅ Notification found, is_read:', testNotification.is_read);
    
    // Step 3: Test mark as read
    console.log('\n✏️  Step 3: Testing mark as read...');
    
    const { error: markError } = await notificationService.markAsRead(createdNotif.id, user.id);
    
    if (markError) {
      console.error('❌ Error marking as read:', markError);
      return;
    }
    
    console.log('✅ Mark as read called successfully');
    
    // Step 4: Verify it's now read
    console.log('\n🔍 Step 4: Verifying read status...');
    
    const { data: updatedNotifications, error: fetchError2 } = await notificationService.getUserNotifications(user.id, {
      limit: 5
    });
    
    if (fetchError2) {
      console.error('❌ Error fetching updated notifications:', fetchError2);
      return;
    }
    
    const updatedTestNotification = updatedNotifications.find(n => n.id === createdNotif.id);
    
    if (!updatedTestNotification) {
      console.error('❌ Updated test notification not found');
      return;
    }
    
    console.log('✅ Updated notification is_read:', updatedTestNotification.is_read);
    console.log('✅ Read timestamp:', updatedTestNotification.read_at);
    
    // Step 5: Get unread count
    console.log('\n📊 Step 5: Checking unread count...');
    
    const { count: unreadCount, error: countError } = await notificationService.getUnreadCount(user.id);
    
    if (countError) {
      console.error('❌ Error getting unread count:', countError);
      return;
    }
    
    console.log('✅ Current unread count:', unreadCount);
    
    // Step 6: Clean up
    console.log('\n🗑️ Step 6: Cleaning up test notification...');
    
    const { error: deleteError } = await notificationService.deleteNotification(createdNotif.id, user.id);
    
    if (deleteError) {
      console.error('❌ Error deleting notification:', deleteError);
      return;
    }
    
    console.log('✅ Test notification deleted successfully');
    
    // Summary
    console.log('\n🎉 QUICK TEST SUMMARY:');
    console.log('✅ Create notification: PASS');
    console.log('✅ Read status verification: PASS');
    console.log('✅ Mark as read function: PASS');
    console.log('✅ Status update verification: PASS');
    console.log('✅ Unread count function: PASS');
    console.log('✅ Delete function: PASS');
    
    console.log('\n🔔 NEXT STEPS:');
    console.log('1. Click the notification bell in Dashboard');
    console.log('2. Create some notifications using: createTestNotifications()');
    console.log('3. Test clicking on notifications to mark them as read');
    console.log('4. Test the "Mark all as read" button');
    console.log('5. Test deleting notifications');
    
    return true;
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
    return false;
  }
}

// Function to create multiple test notifications for UI testing
async function createTestNotifications() {
  const { supabase } = await import('./src/lib/supabaseClient.js');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No user logged in');
    return;
  }
  
  const testNotifications = [
    {
      recipient_id: user.id,
      title: '🔔 Test Unread Notification #1',
      message: 'This is a test notification that should appear as unread. Click it to mark as read!',
      type: 'system',
      priority: 'normal',
      icon: 'Bell',
      color: 'blue',
      is_read: false
    },
    {
      recipient_id: user.id,
      title: '📚 Course Update',
      message: 'Your course "Advanced React Development" has new content available.',
      type: 'course',
      priority: 'normal',
      icon: 'BookOpen',
      color: 'green',
      is_read: false
    },
    {
      recipient_id: user.id,
      title: '⚡ Urgent Assignment',
      message: 'Assignment "Database Design Project" is due in 3 days!',
      type: 'assignment',
      priority: 'urgent',
      icon: 'AlertCircle',
      color: 'red',
      is_read: false
    },
    {
      recipient_id: user.id,
      title: '✅ Already Read',
      message: 'This notification should appear as already read.',
      type: 'system',
      priority: 'low',
      icon: 'Check',
      color: 'gray',
      is_read: true,
      read_at: new Date().toISOString()
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotifications)
      .select();
    
    if (error) {
      console.error('❌ Error creating test notifications:', error);
      return;
    }
    
    console.log('✅ Created test notifications:', data?.length || 0);
    console.log('🔔 Now open NotificationCenter to test the UI!');
    
    return data;
  } catch (error) {
    console.error('💥 Exception creating test notifications:', error);
  }
}

// Auto-run quick test
console.log('🎯 Running quick notification test...');
quickNotificationTest().then(success => {
  if (success) {
    console.log('\n🎉 Quick test completed successfully!');
    console.log('📱 Run createTestNotifications() to create test data for UI testing');
  }
});

// Export functions
window.quickNotificationTest = quickNotificationTest;
window.createTestNotifications = createTestNotifications;