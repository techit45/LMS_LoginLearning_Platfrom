/**
 * Run this in browser console when logged into the app
 * This will create the notification system tables
 */

// Copy and paste this function into browser console, then call: createNotificationTables()
async function createNotificationTables() {
  console.log('🔧 Creating notification system tables...');
  
  // Get supabase client from window (assuming it's available)
  const supabase = window.supabase || (await import('./src/lib/supabaseClient.js')).supabase;
  
  if (!supabase) {
    console.error('❌ Supabase client not found');
    return;
  }
  
  const queries = [
    // 1. Create notifications table
    `CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        related_entity_type VARCHAR(50),
        related_entity_id UUID,
        related_entity_metadata JSONB,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMPTZ NULL,
        action_url TEXT,
        icon VARCHAR(50),
        color VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NULL,
        company VARCHAR(50) DEFAULT 'login'
    )`,
    
    // 2. Create notification preferences table
    `CREATE TABLE IF NOT EXISTS public.notification_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        email_course_updates BOOLEAN DEFAULT true,
        email_assignments BOOLEAN DEFAULT true,
        email_grades BOOLEAN DEFAULT true,
        email_achievements BOOLEAN DEFAULT true,
        email_forum_replies BOOLEAN DEFAULT true,
        email_announcements BOOLEAN DEFAULT true,
        app_course_updates BOOLEAN DEFAULT true,
        app_assignments BOOLEAN DEFAULT true,
        app_grades BOOLEAN DEFAULT true,
        app_achievements BOOLEAN DEFAULT true,
        app_forum_replies BOOLEAN DEFAULT true,
        app_announcements BOOLEAN DEFAULT true,
        push_enabled BOOLEAN DEFAULT false,
        email_digest_frequency VARCHAR(20) DEFAULT 'daily',
        digest_time TIME DEFAULT '09:00:00',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
    )`,
    
    // 3. Create notification templates table
    `CREATE TABLE IF NOT EXISTS public.notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_key VARCHAR(100) NOT NULL UNIQUE,
        title_template TEXT NOT NULL,
        message_template TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        icon VARCHAR(50),
        color VARCHAR(20),
        action_url_template TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // 4. Create indexes
    'CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_company ON public.notifications(company)',
    
    // 5. Enable RLS
    'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY', 
    'ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY'
  ];
  
  console.log(`📝 Executing ${queries.length} queries...`);
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`${i + 1}/${queries.length} Executing: ${query.substring(0, 50)}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        query: query.trim()
      });
      
      if (error) {
        console.error(`❌ Error in query ${i + 1}:`, error);
      } else {
        console.log(`✅ Query ${i + 1} executed successfully`);
      }
    } catch (error) {
      console.error(`💥 Exception in query ${i + 1}:`, error);
    }
  }
  
  // Create RLS policies
  console.log('🔐 Creating RLS policies...');
  
  const policies = [
    // Notifications policies
    `CREATE POLICY "Users can view their own notifications" ON public.notifications
        FOR SELECT USING (recipient_id = auth.uid())`,
        
    `CREATE POLICY "Users can update their own notifications" ON public.notifications
        FOR UPDATE USING (recipient_id = auth.uid())
        WITH CHECK (recipient_id = auth.uid())`,
        
    `CREATE POLICY "Authenticated users can create notifications" ON public.notifications
        FOR INSERT WITH CHECK (auth.role() = 'authenticated')`,
        
    // Notification preferences policies
    `CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences
        FOR ALL USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())`,
        
    // Notification templates policies
    `CREATE POLICY "Everyone can read active notification templates" ON public.notification_templates
        FOR SELECT USING (is_active = true)`
  ];
  
  for (let i = 0; i < policies.length; i++) {
    const policy = policies[i];
    console.log(`${i + 1}/${policies.length} Creating policy...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        query: policy.trim()
      });
      
      if (error) {
        console.log(`⚠️  Policy ${i + 1} may already exist:`, error);
      } else {
        console.log(`✅ Policy ${i + 1} created successfully`);
      }
    } catch (error) {
      console.error(`💥 Exception in policy ${i + 1}:`, error);
    }
  }
  
  // Insert default templates
  console.log('📋 Inserting default notification templates...');
  
  const templates = [
    {
      template_key: 'user_welcome',
      title_template: 'ยินดีต้อนรับสู่ Login Learning!',
      message_template: 'ยินดีต้อนรับเข้าสู่แพลตฟอร์มการเรียนรู้ของเรา เริ่มต้นการเรียนรู้ด้วยคอร์สแรกของคุณ',
      type: 'system',
      priority: 'normal',
      icon: 'Heart',
      color: 'pink',
      action_url_template: '/courses'
    },
    {
      template_key: 'course_enrollment',
      title_template: 'ลงทะเบียนเรียนสำเร็จ',
      message_template: 'คุณได้ลงทะเบียนเรียนคอร์ส "{{course_name}}" เรียบร้อยแล้ว',
      type: 'course',
      priority: 'normal',
      icon: 'BookOpen',
      color: 'blue',
      action_url_template: '/course/{{course_id}}'
    },
    {
      template_key: 'course_new_content',
      title_template: 'เนื้อหาใหม่ในคอร์ส',
      message_template: 'คอร์ส "{{course_name}}" มีเนื้อหาใหม่: {{content_title}}',
      type: 'course',
      priority: 'normal',
      icon: 'FileText',
      color: 'green',
      action_url_template: '/course/{{course_id}}/learn'
    },
    {
      template_key: 'achievement_badge',
      title_template: 'ได้รับความสำเร็จใหม่!',
      message_template: 'คุณได้รับเหรียญ "{{badge_name}}" จาก {{achievement_description}}',
      type: 'achievement',
      priority: 'normal',
      icon: 'Award',
      color: 'yellow',
      action_url_template: '/profile/achievements'
    }
  ];
  
  for (const template of templates) {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert([template]);
        
      if (error) {
        console.log(`⚠️  Template "${template.template_key}" may already exist:`, error);
      } else {
        console.log(`✅ Template "${template.template_key}" created`);
      }
    } catch (error) {
      console.error(`💥 Exception inserting template "${template.template_key}":`, error);
    }
  }
  
  console.log('🎉 Notification system setup complete!');
  console.log('📱 You can now test notifications in the app');
  
  // Test the tables
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('template_key')
      .limit(5);
      
    if (error) {
      console.error('❌ Test query failed:', error);
    } else {
      console.log('✅ Test successful! Templates found:', data?.length || 0);
      data?.forEach(t => console.log(`   - ${t.template_key}`));
    }
  } catch (error) {
    console.error('💥 Test exception:', error);
  }
}

// Also provide a simple test function
async function testNotifications() {
  console.log('🧪 Testing notification creation...');
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    console.error('❌ No user logged in');
    return;
  }
  
  const testNotification = {
    recipient_id: user.user.id,
    title: '🧪 Test Notification',
    message: 'This is a test notification created from browser console',
    type: 'system',
    priority: 'normal',
    icon: 'TestTube',
    color: 'purple',
    company: 'login'
  };
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating test notification:', error);
    } else {
      console.log('✅ Test notification created:', data.id);
      console.log('🔔 Check your notification center in the app!');
    }
  } catch (error) {
    console.error('💥 Exception creating test notification:', error);
  }
}

console.log(`
📋 Notification System Setup Instructions:

1. Make sure you're logged into the Login Learning app
2. Open browser console (F12)
3. Copy and paste the createNotificationTables() function above
4. Run: createNotificationTables()
5. Wait for setup to complete
6. Test with: testNotifications()
7. Check your notification center in the app!

Commands:
- createNotificationTables() // Set up the system
- testNotifications()        // Create a test notification
`);

// Auto-run if in browser context
if (typeof window !== 'undefined') {
  console.log('🔧 Auto-running notification system setup...');
  createNotificationTables();
}