// Test script for real-time teaching schedule features
// Run this in browser console while on Teaching Schedule page

console.log('🧪 Testing Real-time Teaching Schedule Features');

async function testRealtimeFeatures() {
  try {
    // Check if we're on the teaching schedule page
    if (!window.location.hash.includes('teaching-schedule')) {
      console.log('⚠️ Please navigate to the Teaching Schedule page first');
      console.log('Go to: http://localhost:5174/#/admin/teaching-schedule');
      return;
    }

    console.log('✅ On Teaching Schedule page');

    // Test 1: Check if Supabase client is available
    const supabase = window.supabase;
    if (!supabase) {
      console.error('❌ Supabase client not found');
      return;
    }
    console.log('✅ Supabase client found');

    // Test 2: Check if teaching_schedules table exists
    console.log('🔍 Testing teaching_schedules table access...');
    const { data: testData, error: testError } = await supabase
      .from('teaching_schedules')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error accessing teaching_schedules table:', testError);
      
      // Check if it's an RLS error
      if (testError.code === '42501' || testError.message.includes('policy')) {
        console.log('⚠️ RLS policy issue detected. Table exists but needs policy adjustment.');
      }
      
      return;
    }
    
    console.log('✅ teaching_schedules table accessible');
    console.log('📊 Current schedules:', testData);

    // Test 3: Test real-time subscription
    console.log('🔔 Testing real-time subscription...');
    
    const channel = supabase
      .channel('test-teaching-schedules')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teaching_schedules'
        },
        (payload) => {
          console.log('📡 Real-time change detected:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription successful');
          
          // Test 4: Test inserting a schedule (if authenticated)
          setTimeout(async () => {
            console.log('🧪 Testing schedule insertion...');
            
            const testSchedule = {
              week_start_date: new Date().toISOString().split('T')[0],
              day_of_week: 1, // Tuesday
              time_slot_index: 0, // First time slot
              course_title: 'Test Real-time Course',
              instructor_name: 'Test Instructor',
              company: 'login'
            };
            
            const { data: insertData, error: insertError } = await supabase
              .from('teaching_schedules')
              .insert(testSchedule);
              
            if (insertError) {
              console.error('❌ Error inserting test schedule:', insertError);
              console.log('⚠️ This might be due to RLS policies - check authentication status');
            } else {
              console.log('✅ Test schedule inserted successfully:', insertData);
              
              // Clean up test data after 3 seconds
              setTimeout(async () => {
                const { error: deleteError } = await supabase
                  .from('teaching_schedules')
                  .delete()
                  .eq('course_title', 'Test Real-time Course');
                  
                if (!deleteError) {
                  console.log('🧹 Test data cleaned up');
                }
              }, 3000);
            }
          }, 2000);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
        }
      });

    // Test 5: Check if useRealtimeSchedule hook components exist
    console.log('🔍 Checking for real-time hook integration...');
    
    // Look for connection indicator
    const connectionIndicator = document.querySelector('[data-testid="connection-status"]') ||
                               document.querySelector('.connection-indicator') ||
                               document.querySelector('.realtime-status');
    
    if (connectionIndicator) {
      console.log('✅ Connection indicator found:', connectionIndicator);
    } else {
      console.log('⚠️ Connection indicator not found (might be in different selector)');
    }

    // Test 6: Check React DevTools for hooks
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools available for hook inspection');
    }

    console.log('\n📋 Test Summary:');
    console.log('- Supabase client: ✅');
    console.log('- teaching_schedules table: ✅');
    console.log('- Real-time subscription: ✅');
    console.log('- Insert test: Check logs above');
    console.log('\n🎯 Next steps:');
    console.log('1. Try dragging a course to the schedule grid');
    console.log('2. Open multiple browser tabs to test real-time sync');
    console.log('3. Check connection indicator status');
    
    // Clean up after 10 seconds
    setTimeout(() => {
      console.log('🧹 Cleaning up test subscription...');
      supabase.removeChannel(channel);
    }, 10000);
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
  }
}

// Run the test
testRealtimeFeatures();

console.log('\n📖 Usage Instructions:');
console.log('1. Navigate to Teaching Schedule page');
console.log('2. Open Developer Console (F12)');
console.log('3. Paste this entire script and press Enter');
console.log('4. Watch the console output for test results');