// Paste this in browser console to test notifications
// Make sure you're logged in and on the dashboard

console.log('🧪 Testing Notification System...');

// Function to create test notifications
async function createTestNotifications() {
  // Import supabase (will work in browser context)
  const { supabase } = await import('./src/lib/supabaseClient.js');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ No user logged in');
    return;
  }
  
  console.log('✅ User logged in:', user.email);
  
  // Test notifications to create
  const testNotifications = [
    {
      recipient_id: user.id,
      title: '🎉 ยินดีต้อนรับสู่ระบบการแจ้งเตือนใหม่!',
      message: 'ระบบการแจ้งเตือนของ Login Learning Platform ได้รับการอัปเกรดแล้ว พร้อมฟีเจอร์ใหม่ที่จะช่วยให้คุณไม่พลาดข่าวสารสำคัญ',
      type: 'system',
      priority: 'high',
      icon: 'Megaphone',
      color: 'indigo',
      action_url: '/dashboard',
      is_read: false
    },
    {
      recipient_id: user.id,
      title: '📚 คอร์สใหม่: วิศวกรรมคอมพิวเตอร์ขั้นสูง',
      message: 'มีคอร์สใหม่ที่น่าสนใจ "Advanced Computer Engineering" พร้อมเนื้อหา AI, Machine Learning และ IoT',
      type: 'course',
      priority: 'normal',
      icon: 'BookOpen',
      color: 'blue',
      action_url: '/courses',
      is_read: false
    },
    {
      recipient_id: user.id,
      title: '⚡ งานที่ได้รับมอบหมาย: Database Design',
      message: 'คุณได้รับมอบหมายให้ทำโครงงาน "ออกแบบระบบฐานข้อมูล" กำหนดส่ง 20 ส.ค. 2568',
      type: 'assignment',
      priority: 'urgent',
      icon: 'ClipboardList',
      color: 'orange',
      action_url: '/assignments',
      is_read: false
    },
    {
      recipient_id: user.id,
      title: '🏆 ได้รับเหรียญความสำเร็จใหม่!',
      message: 'ยินดีด้วย! คุณได้รับเหรียญ "นักพัฒนาดาวรุ่ง" จากการเรียนครบ 3 คอร์สแรกของคุณ',
      type: 'achievement',
      priority: 'high',
      icon: 'Award',
      color: 'yellow',
      action_url: '/profile/achievements',
      is_read: false
    },
    {
      recipient_id: user.id,
      title: '💬 มีตอบกลับในฟอรัม',
      message: 'อาจารย์ประยุทธ ตอบกลับในหัวข้อ "การเขียนโปรแกรม React ขั้นสูง" ที่คุณถาม',
      type: 'forum',
      priority: 'normal',
      icon: 'MessageSquare',
      color: 'purple',
      action_url: '/forum',
      is_read: true
    },
    {
      recipient_id: user.id,
      title: '✅ งานได้คะแนนแล้ว',
      message: 'งาน "สร้างเว็บแอปพลิเคชัน" ได้คะแนน 95/100 คะแนน ผลงานยอดเยี่ยม!',
      type: 'grade',
      priority: 'normal',
      icon: 'Star',
      color: 'green',
      action_url: '/grades',
      is_read: true
    }
  ];
  
  console.log(`📝 Creating ${testNotifications.length} test notifications...`);
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotifications)
      .select();
    
    if (error) {
      console.error('❌ Error creating notifications:', error);
      return;
    }
    
    console.log('✅ Test notifications created successfully!');
    console.log('📊 Created notifications:', data?.length || 0);
    
    // Show notification details
    data?.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} (${notif.type}, priority: ${notif.priority})`);
    });
    
    console.log('\n🔔 Now click the notification bell in the Dashboard to see them!');
    
  } catch (error) {
    console.error('💥 Exception creating notifications:', error);
  }
}

// Function to test notification retrieval
async function testNotificationRetrieval() {
  const { supabase } = await import('./src/lib/supabaseClient.js');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No user logged in');
    return;
  }
  
  console.log('🔍 Testing notification retrieval...');
  
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error retrieving notifications:', error);
      return;
    }
    
    console.log('✅ Notifications retrieved successfully!');
    console.log('📊 Total notifications:', notifications?.length || 0);
    
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif, index) => {
        const readStatus = notif.is_read ? '✅ Read' : '🔔 Unread';
        console.log(`${index + 1}. ${notif.title} (${notif.type}) - ${readStatus}`);
      });
      
      // Count unread notifications
      const unreadCount = notifications.filter(n => !n.is_read).length;
      console.log(`\n📊 Unread notifications: ${unreadCount}`);
      console.log(`📊 Total notifications: ${notifications.length}`);
    }
    
  } catch (error) {
    console.error('💥 Exception retrieving notifications:', error);
  }
}

// Function to test notification templates
async function testNotificationTemplates() {
  const { supabase } = await import('./src/lib/supabaseClient.js');
  
  console.log('🎨 Testing notification templates...');
  
  try {
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('template_key, title_template, type')
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ Error loading templates:', error);
      return;
    }
    
    console.log('✅ Templates loaded successfully!');
    console.log('📊 Available templates:', templates?.length || 0);
    
    templates?.forEach((template, index) => {
      console.log(`${index + 1}. ${template.template_key} (${template.type}): ${template.title_template}`);
    });
    
  } catch (error) {
    console.error('💥 Exception loading templates:', error);
  }
}

// Function to clear all test notifications
async function clearTestNotifications() {
  const { supabase } = await import('./src/lib/supabaseClient.js');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No user logged in');
    return;
  }
  
  console.log('🗑️ Clearing test notifications...');
  
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', user.id);
    
    if (error) {
      console.error('❌ Error clearing notifications:', error);
      return;
    }
    
    console.log('✅ All notifications cleared!');
    
  } catch (error) {
    console.error('💥 Exception clearing notifications:', error);
  }
}

// Main test function
async function runNotificationTests() {
  console.log('\n🚀 Starting Notification System Tests\n' + '='.repeat(50));
  
  // Step 1: Test templates
  await testNotificationTemplates();
  
  console.log('\n' + '-'.repeat(30));
  
  // Step 2: Create test notifications
  await createTestNotifications();
  
  console.log('\n' + '-'.repeat(30));
  
  // Step 3: Test retrieval
  await testNotificationRetrieval();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Notification Tests Complete!');
  console.log('\n📱 Next Steps:');
  console.log('1. Go to Dashboard in the app');
  console.log('2. Click the notification bell (🔔) icon');
  console.log('3. See your test notifications!');
  console.log('4. Try interacting: mark as read, delete, filter');
  console.log('\n🧪 Available console commands:');
  console.log('- createTestNotifications()    // Create sample notifications');
  console.log('- testNotificationRetrieval()  // Check notification retrieval');
  console.log('- testNotificationTemplates()  // View available templates');
  console.log('- clearTestNotifications()     // Clear all notifications');
  console.log('- runNotificationTests()       // Run all tests');
}

// Auto-run if this script is loaded
console.log('📋 Notification Test Console Loaded!');
console.log('🎯 Run: runNotificationTests() to start testing');

// Export functions for manual use
window.testNotifications = {
  runAll: runNotificationTests,
  create: createTestNotifications,
  retrieve: testNotificationRetrieval,
  templates: testNotificationTemplates,
  clear: clearTestNotifications
};