// Quick inline script to create test notifications
// Copy and paste this entire code in browser console

console.log('🔥 Creating Test Notifications...');

// Define the function inline
async function createTestNotifications() {
  try {
    // Import supabase directly from the global window object or module
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
    // Initialize Supabase client with environment variables
    const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No user logged in:', userError);
      return;
    }
    
    console.log('✅ User logged in:', user.email);
    
    // Test notifications to create
    const testNotifications = [
      {
        recipient_id: user.id,
        title: '🧪 Test Notification #1',
        message: 'This is a test notification - click to mark as read!',
        type: 'system',
        priority: 'normal',
        icon: 'Bell',
        color: 'blue',
        is_read: false
      },
      {
        recipient_id: user.id,
        title: '📚 New Course Available',
        message: 'Advanced React Development course is now available for enrollment.',
        type: 'course',
        priority: 'normal',
        icon: 'BookOpen',
        color: 'green',
        is_read: false
      },
      {
        recipient_id: user.id,
        title: '⚡ Urgent Assignment',
        message: 'Database Project assignment is due in 3 days!',
        type: 'assignment',
        priority: 'high',
        icon: 'AlertCircle',
        color: 'red',
        is_read: false
      },
      {
        recipient_id: user.id,
        title: '✅ Already Read Test',
        message: 'This notification should appear as already read.',
        type: 'system',
        priority: 'low',
        icon: 'Check',
        color: 'gray',
        is_read: true,
        read_at: new Date().toISOString()
      }
    ];
    
    console.log(`📝 Creating ${testNotifications.length} test notifications...`);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotifications)
      .select();
    
    if (error) {
      console.error('❌ Error creating notifications:', error);
      if (error.code === '42P01') {
        console.log('📋 Run this SQL first in Supabase:');
        console.log('CREATE TABLE notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recipient_id uuid NOT NULL, title text, message text, type varchar(50), priority varchar(20), icon varchar(50), color varchar(20), is_read boolean DEFAULT false, read_at timestamp, created_at timestamp DEFAULT now());');
      }
      return;
    }
    
    console.log('✅ Test notifications created successfully!');
    console.log('📊 Created:', data?.length || 0, 'notifications');
    
    data?.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} (${notif.type})`);
    });
    
    console.log('\n🔔 Now open NotificationCenter to see them!');
    
  } catch (error) {
    console.error('💥 Exception:', error);
    console.log('💡 Make sure you have internet connection for CDN import');
  }
}

// Run immediately
createTestNotifications();