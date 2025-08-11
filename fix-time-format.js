/**
 * Script to fix time format issues in weekly_schedules table
 * Records ID 79, 83 have incorrect time format ("8:00" instead of "08:00")
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (from your project)
const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseKey);

const fixTimeFormatRecords = async () => {
  console.log('🔧 Starting time format fix...');
  
  try {
    // First, check the current data
    console.log('📋 Checking current records...');
    const { data: beforeData, error: selectError } = await supabase
      .from('weekly_schedules')
      .select('id, time_slot, start_time, end_time')
      .in('id', [79, 83]);
    
    if (selectError) {
      console.error('❌ Error selecting records:', selectError);
      return;
    }
    
    console.log('📊 Records before fix:', beforeData);
    
    // Fix record ID 79
    console.log('🔧 Fixing record ID 79...');
    const { data: fix79, error: error79 } = await supabase
      .from('weekly_schedules')
      .update({
        time_slot: '08:00',
        start_time: '08:00',
        end_time: '09:00',
        updated_at: new Date().toISOString()
      })
      .eq('id', 79)
      .select();
    
    if (error79) {
      console.error('❌ Error fixing record 79:', error79);
    } else {
      console.log('✅ Record 79 fixed:', fix79);
    }
    
    // Fix record ID 83
    console.log('🔧 Fixing record ID 83...');
    const { data: fix83, error: error83 } = await supabase
      .from('weekly_schedules')
      .update({
        time_slot: '08:00',
        start_time: '08:00',
        end_time: '12:00', // Keep the same end time
        updated_at: new Date().toISOString()
      })
      .eq('id', 83)
      .select();
    
    if (error83) {
      console.error('❌ Error fixing record 83:', error83);
    } else {
      console.log('✅ Record 83 fixed:', fix83);
    }
    
    // Verify the fix
    console.log('🔍 Verifying fixes...');
    const { data: afterData, error: verifyError } = await supabase
      .from('weekly_schedules')
      .select('id, time_slot, start_time, end_time')
      .in('id', [79, 83]);
    
    if (verifyError) {
      console.error('❌ Error verifying records:', verifyError);
      return;
    }
    
    console.log('✅ Records after fix:', afterData);
    
    // Check if any other records have similar issues
    console.log('🔍 Checking for other time format issues...');
    const { data: otherIssues, error: checkError } = await supabase
      .from('weekly_schedules')
      .select('id, time_slot, start_time, end_time')
      .or('time_slot.like.%:00,start_time.like.%:00')
      .not('time_slot', 'like', '__:__')
      .limit(10);
    
    if (checkError) {
      console.error('❌ Error checking other issues:', checkError);
    } else if (otherIssues && otherIssues.length > 0) {
      console.warn('⚠️ Found other records with potential time format issues:', otherIssues);
    } else {
      console.log('✅ No other time format issues found');
    }
    
    console.log('🎉 Time format fix completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
};

// Run the fix
fixTimeFormatRecords().catch(console.error);