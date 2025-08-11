// Fix time_slot_index constraint via browser console
// Run this in the browser console while on the app

console.log('🔧 Fixing time_slot_index constraint...');

async function fixTimeSlotConstraint() {
  try {
    const supabase = window.supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found');
      return;
    }

    // First, try to get current user for authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('⚠️ Not authenticated. You may need admin privileges to alter constraints.');
    }

    console.log('📝 Attempting to fix constraint...');
    console.log('⚠️ Note: This operation requires database admin privileges.');
    console.log('If this fails, please run the following SQL in Supabase Dashboard:');
    console.log('');
    console.log(`
-- Fix time_slot_index constraint
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;

ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_time_slot_index_check 
CHECK (time_slot_index >= 0 AND time_slot_index <= 12);
    `);

    // Test if we can insert with a higher time slot index
    console.log('\n🧪 Testing with a sample insert...');
    
    const testData = {
      week_start_date: '2025-08-04',
      day_of_week: 1,
      time_slot_index: 10, // This would fail with old constraint (0-6)
      course_title: 'Test Course',
      instructor_name: 'Test Instructor',
      company: 'login'
    };

    const { data, error } = await supabase
      .from('teaching_schedules')
      .insert(testData)
      .select()
      .single();

    if (error) {
      if (error.message.includes('time_slot_index_check')) {
        console.error('❌ Constraint still blocking. Please run the SQL manually in Supabase Dashboard.');
        console.log('Go to: https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql');
      } else {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('✅ Test insert successful! Cleaning up test data...');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('teaching_schedules')
        .delete()
        .eq('id', data.id);
        
      if (!deleteError) {
        console.log('✅ Test data cleaned up');
        console.log('✅ Time slot constraint is now fixed!');
      }
    }

  } catch (error) {
    console.error('💥 Exception:', error);
    console.log('\n📋 Manual Fix Required:');
    console.log('1. Go to Supabase Dashboard SQL Editor');
    console.log('2. Run the ALTER TABLE commands shown above');
    console.log('3. Refresh the page and try drag & drop again');
  }
}

// Run the fix
fixTimeSlotConstraint();