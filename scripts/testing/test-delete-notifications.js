// Test script to debug notification deletion issues
// Paste this in browser console to test delete functionality

console.log('🔍 Testing Notification Deletion...');

async function testNotificationDeletion() {
  try {
    // Import supabase directly
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
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
    
    // Step 1: List current notifications
    console.log('\n📋 Step 1: Listing current notifications...');
    const { data: currentNotifications, error: listError } = await supabase
      .from('notifications')
      .select('id, title, recipient_id, created_at')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });
    
    if (listError) {
      console.error('❌ Error listing notifications:', listError);
      return;
    }
    
    console.log(`📊 Found ${currentNotifications?.length || 0} notifications:`);
    currentNotifications?.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.title} (ID: ${notif.id})`);
    });
    
    if (!currentNotifications || currentNotifications.length === 0) {
      console.log('ℹ️ No notifications to delete. Create some first using createTestNotifications()');
      return;
    }
    
    // Step 2: Try to delete the first notification
    const targetNotification = currentNotifications[0];
    console.log(`\n🗑️ Step 2: Attempting to delete: "${targetNotification.title}" (ID: ${targetNotification.id})`);
    
    // Method 1: Direct delete with verification
    console.log('🔄 Method 1: Direct delete with select verification...');
    const { data: deleted, error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', targetNotification.id)
      .eq('recipient_id', user.id)
      .select('id')
      .single();
    
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
    } else if (deleted && deleted.id) {
      console.log('✅ Successfully deleted notification:', deleted.id);
    } else {
      console.log('⚠️ Delete completed but no data returned');
    }
    
    // Step 3: Verify deletion
    console.log('\n🔍 Step 3: Verifying deletion...');
    const { data: afterDelete, error: verifyError } = await supabase
      .from('notifications')
      .select('id, title')
      .eq('id', targetNotification.id);
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else if (!afterDelete || afterDelete.length === 0) {
      console.log('✅ Confirmed: Notification successfully deleted from database');
    } else {
      console.log('❌ Problem: Notification still exists in database:', afterDelete[0]);
    }
    
    // Step 4: List remaining notifications
    console.log('\n📋 Step 4: Listing remaining notifications...');
    const { data: remainingNotifications, error: remainingError } = await supabase
      .from('notifications')
      .select('id, title, recipient_id')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });
    
    if (remainingError) {
      console.error('❌ Error listing remaining notifications:', remainingError);
    } else {
      console.log(`📊 Remaining notifications: ${remainingNotifications?.length || 0}`);
      remainingNotifications?.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title} (ID: ${notif.id})`);
      });
    }
    
    // Summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log(`✅ Initial count: ${currentNotifications.length}`);
    console.log(`✅ Remaining count: ${remainingNotifications?.length || 0}`);
    console.log(`✅ Expected change: -1`);
    console.log(`✅ Actual change: ${(currentNotifications.length) - (remainingNotifications?.length || 0)}`);
    
    if ((currentNotifications.length - (remainingNotifications?.length || 0)) === 1) {
      console.log('🎉 DELETE TEST PASSED!');
    } else {
      console.log('❌ DELETE TEST FAILED - notification may not have been deleted properly');
    }
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
  }
}

// Function to delete all test notifications (cleanup)
async function deleteAllTestNotifications() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
    const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }
    
    console.log('🗑️ Deleting all test notifications...');
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', user.id);
    
    if (error) {
      console.error('❌ Error deleting all notifications:', error);
    } else {
      console.log('✅ All notifications deleted successfully');
    }
    
  } catch (error) {
    console.error('💥 Exception deleting all notifications:', error);
  }
}

// Auto-run the test
console.log('🚀 Running notification deletion test...');
testNotificationDeletion();

// Export functions for manual use
window.testNotificationDeletion = testNotificationDeletion;
window.deleteAllTestNotifications = deleteAllTestNotifications;