/**
 * Test Script for Notification System
 * Tests the complete notification system integration
 */

import notificationService, { NotificationHelpers } from './src/lib/notificationService.js';
import NotificationIntegrations from './src/lib/notificationIntegrations.js';
import { supabase } from './src/lib/supabaseClient.js';

// Test configuration
const TEST_CONFIG = {
  testUserId: null, // Will be set after getting current user
  testCourseId: 'test-course-123',
  testAssignmentId: 'test-assignment-456'
};

// Test functions
async function testNotificationSystemHealth() {
  console.log('\n🔍 Testing Notification System Health...\n');
  
  try {
    // Test 1: Check if tables exist
    console.log('1. Checking notification tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['notifications', 'notification_preferences', 'notification_templates'])
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return false;
    }
    
    const tableNames = tables.map(t => t.table_name);
    console.log('✅ Tables found:', tableNames);
    
    // Test 2: Check notification templates
    console.log('\n2. Checking notification templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('notification_templates')
      .select('template_key, title_template')
      .eq('is_active', true)
      .limit(5);
    
    if (templatesError) {
      console.error('❌ Error loading templates:', templatesError);
    } else {
      console.log('✅ Templates loaded:', templates?.length || 0);
      templates?.forEach(t => console.log(`   - ${t.template_key}: ${t.title_template}`));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

async function testBasicNotificationOperations() {
  console.log('\n📝 Testing Basic Notification Operations...\n');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      return false;
    }
    
    TEST_CONFIG.testUserId = user.id;
    console.log('✅ Test user ID:', user.id);
    
    // Test 3: Create a test notification
    console.log('\n3. Creating test notification...');
    const testNotification = {
      recipient_id: user.id,
      title: '🧪 Test Notification',
      message: 'This is a test notification created by the testing system',
      type: 'system',
      priority: 'normal',
      icon: 'TestTube',
      color: 'purple',
      company: 'login'
    };
    
    const { data: createdNotification, error: createError } = await notificationService.createNotification(testNotification);
    
    if (createError) {
      console.error('❌ Error creating notification:', createError);
      return false;
    }
    
    console.log('✅ Test notification created:', createdNotification?.id);
    
    // Test 4: Retrieve notifications
    console.log('\n4. Retrieving user notifications...');
    const { data: notifications, error: retrieveError } = await notificationService.getUserNotifications(user.id);
    
    if (retrieveError) {
      console.error('❌ Error retrieving notifications:', retrieveError);
      return false;
    }
    
    console.log('✅ Notifications retrieved:', notifications?.length || 0);
    
    // Test 5: Get unread count
    console.log('\n5. Getting unread count...');
    const { count: unreadCount, error: countError } = await notificationService.getUnreadCount(user.id);
    
    if (countError) {
      console.error('❌ Error getting unread count:', countError);
      return false;
    }
    
    console.log('✅ Unread count:', unreadCount);
    
    // Test 6: Mark as read
    if (createdNotification?.id) {
      console.log('\n6. Testing mark as read...');
      const { error: readError } = await notificationService.markAsRead(createdNotification.id, user.id);
      
      if (readError) {
        console.error('❌ Error marking as read:', readError);
        return false;
      }
      
      console.log('✅ Notification marked as read');
      
      // Test 7: Clean up - delete test notification
      console.log('\n7. Cleaning up test notification...');
      const { error: deleteError } = await notificationService.deleteNotification(createdNotification.id, user.id);
      
      if (deleteError) {
        console.error('❌ Error deleting notification:', deleteError);
      } else {
        console.log('✅ Test notification deleted');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Basic operations test failed:', error);
    return false;
  }
}

async function testTemplateNotifications() {
  console.log('\n🎨 Testing Template-based Notifications...\n');
  
  try {
    if (!TEST_CONFIG.testUserId) {
      console.error('❌ No test user ID available');
      return false;
    }
    
    // Test 8: Welcome notification
    console.log('8. Testing welcome notification...');
    const { data: welcomeNotif, error: welcomeError } = await NotificationHelpers.notifyWelcome(TEST_CONFIG.testUserId);
    
    if (welcomeError) {
      console.error('❌ Error creating welcome notification:', welcomeError);
      return false;
    }
    
    console.log('✅ Welcome notification created:', welcomeNotif?.id);
    
    // Test 9: Course enrollment notification
    console.log('\n9. Testing course enrollment notification...');
    const testCourse = {
      id: TEST_CONFIG.testCourseId,
      title: 'ทดสอบระบบ Notification'
    };
    
    const { data: enrollNotif, error: enrollError } = await NotificationHelpers.notifyCourseEnrollment(
      TEST_CONFIG.testUserId,
      testCourse
    );
    
    if (enrollError) {
      console.error('❌ Error creating enrollment notification:', enrollError);
      return false;
    }
    
    console.log('✅ Enrollment notification created:', enrollNotif?.id);
    
    // Test 10: Achievement notification
    console.log('\n10. Testing achievement notification...');
    const { data: achievementNotif, error: achievementError } = await NotificationHelpers.notifyAchievement(
      TEST_CONFIG.testUserId,
      'นักทดสอบระบบ',
      'สำเร็จการทดสอบระบบการแจ้งเตือน'
    );
    
    if (achievementError) {
      console.error('❌ Error creating achievement notification:', achievementError);
      return false;
    }
    
    console.log('✅ Achievement notification created:', achievementNotif?.id);
    
    // Retrieve all notifications to verify
    console.log('\n✨ Final verification - retrieving all notifications...');
    const { data: allNotifications, error: finalError } = await notificationService.getUserNotifications(
      TEST_CONFIG.testUserId,
      { limit: 10 }
    );
    
    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return false;
    }
    
    console.log('✅ Total notifications found:', allNotifications?.length || 0);
    allNotifications?.slice(0, 3).forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.type})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Template notifications test failed:', error);
    return false;
  }
}

async function testIntegrationHelpers() {
  console.log('\n🔗 Testing Integration Helpers...\n');
  
  try {
    // Test 11: Integration points
    console.log('11. Testing integration points...');
    const integrations = NotificationIntegrations.integratWithServices();
    
    console.log('✅ Integration points available:');
    console.log('   - Course:', Object.keys(integrations.course));
    console.log('   - Assignment:', Object.keys(integrations.assignment));
    console.log('   - Forum:', Object.keys(integrations.forum));
    console.log('   - User:', Object.keys(integrations.user));
    console.log('   - System:', Object.keys(integrations.system));
    
    return true;
  } catch (error) {
    console.error('❌ Integration helpers test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Notification System Integration Tests\n');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Health Check', fn: testNotificationSystemHealth },
    { name: 'Basic Operations', fn: testBasicNotificationOperations },
    { name: 'Template Notifications', fn: testTemplateNotifications },
    { name: 'Integration Helpers', fn: testIntegrationHelpers }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(20)} ${test.name} ${'='.repeat(20)}`);
    
    try {
      const success = await test.fn();
      if (success) {
        console.log(`\n✅ ${test.name} PASSED`);
        passed++;
      } else {
        console.log(`\n❌ ${test.name} FAILED`);
        failed++;
      }
    } catch (error) {
      console.error(`\n💥 ${test.name} CRASHED:`, error);
      failed++;
    }
  }
  
  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Notification system is working correctly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please check the errors above.`);
  }
  
  console.log('\n📱 You can now test the UI by:');
  console.log('1. Opening http://localhost:5174');
  console.log('2. Logging in');  
  console.log('3. Going to Dashboard');
  console.log('4. Clicking the notification bell icon');
  console.log('\n🔔 The NotificationCenter should show your test notifications!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };