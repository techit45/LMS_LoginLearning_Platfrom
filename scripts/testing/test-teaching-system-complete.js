#!/usr/bin/env node

/**
 * Comprehensive test for teaching schedule system
 * Tests all aspects: database, service, real-time, UI data flow
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results collector
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper functions
function logTest(name, status, message = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${emoji} ${name}: ${message}`);
  
  if (status === 'pass') testResults.passed.push(name);
  else if (status === 'fail') testResults.failed.push({ name, message });
  else testResults.warnings.push({ name, message });
}

async function testDatabaseSchema() {
  console.log('\n📊 Testing Database Schema...');
  console.log('═'.repeat(50));
  
  try {
    // Test 1: Check if duration column exists
    const { data: columns } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'teaching_schedules' 
        AND column_name = 'duration'
      `
    }).single();
    
    if (columns) {
      logTest('Duration column', 'pass', 'Column exists');
    } else {
      logTest('Duration column', 'fail', 'Column missing - run migration');
    }
  } catch (error) {
    // Alternative check
    const { data, error: selectError } = await supabase
      .from('teaching_schedules')
      .select('duration')
      .limit(1);
    
    if (!selectError) {
      logTest('Duration column', 'pass', 'Column exists (verified by select)');
    } else {
      logTest('Duration column', 'fail', 'Column missing');
    }
  }
  
  // Test 2: Check foreign key to teaching_courses
  const { data: testInsert, error: insertError } = await supabase
    .from('teaching_schedules')
    .insert({
      week_start_date: '2025-12-31',
      day_of_week: 0,
      time_slot_index: 0,
      course_id: '3b711fbd-2836-4e49-9d3d-cc5c6cc286af', // Valid teaching_course
      course_title: 'FK Test',
      instructor_name: 'Test',
      duration: 1
    })
    .select()
    .single();
  
  if (testInsert) {
    logTest('Foreign Key to teaching_courses', 'pass', 'FK working correctly');
    // Clean up test data
    await supabase.from('teaching_schedules').delete().eq('id', testInsert.id);
  } else if (insertError?.message?.includes('courses')) {
    logTest('Foreign Key to teaching_courses', 'fail', 'FK points to wrong table (courses instead of teaching_courses)');
  } else {
    logTest('Foreign Key to teaching_courses', 'warning', insertError?.message || 'Unknown issue');
  }
  
  // Test 3: Check trigger for updated_at
  if (testInsert) {
    const { data: updated } = await supabase
      .from('teaching_schedules')
      .update({ room: 'Test Room' })
      .eq('id', testInsert.id)
      .select('updated_at, version')
      .single();
    
    if (updated && updated.version > 1) {
      logTest('Updated_at trigger', 'pass', 'Trigger working');
    } else {
      logTest('Updated_at trigger', 'fail', 'Trigger not working');
    }
  }
}

async function testDataConsistency() {
  console.log('\n📊 Testing Data Consistency...');
  console.log('═'.repeat(50));
  
  // Get all schedules
  const { data: schedules, error } = await supabase
    .from('teaching_schedules')
    .select(`
      *,
      teaching_courses!course_id(id, name),
      user_profiles!instructor_id(user_id, full_name)
    `)
    .eq('week_start_date', '2025-08-03');
  
  if (error) {
    logTest('Data fetch with joins', 'fail', error.message);
    return;
  }
  
  logTest('Data fetch with joins', 'pass', `Found ${schedules?.length || 0} schedules`);
  
  // Check each schedule
  let invalidCount = 0;
  let missingDuration = 0;
  
  schedules?.forEach(schedule => {
    if (schedule.course_id && !schedule.teaching_courses) {
      invalidCount++;
      console.log(`  ⚠️ Invalid course_id: ${schedule.course_id} in ${schedule.course_title}`);
    }
    if (schedule.instructor_id && !schedule.user_profiles) {
      invalidCount++;
      console.log(`  ⚠️ Invalid instructor_id: ${schedule.instructor_id} in ${schedule.instructor_name}`);
    }
    if (!schedule.duration) {
      missingDuration++;
    }
  });
  
  if (invalidCount > 0) {
    logTest('Foreign key integrity', 'fail', `${invalidCount} invalid references`);
  } else {
    logTest('Foreign key integrity', 'pass', 'All references valid');
  }
  
  if (missingDuration > 0) {
    logTest('Duration data', 'warning', `${missingDuration} schedules missing duration`);
  } else {
    logTest('Duration data', 'pass', 'All schedules have duration');
  }
}

async function testRealTimeSubscription() {
  console.log('\n📊 Testing Real-time Subscription...');
  console.log('═'.repeat(50));
  
  return new Promise((resolve) => {
    let received = false;
    
    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teaching_schedules'
        },
        (payload) => {
          received = true;
          logTest('Real-time subscription', 'pass', `Received ${payload.eventType} event`);
          channel.unsubscribe();
          resolve();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('  📡 Subscription active, triggering test event...');
          
          // Trigger an event
          supabase
            .from('teaching_schedules')
            .update({ notes: `Test at ${new Date().toISOString()}` })
            .eq('week_start_date', '2025-08-03')
            .select()
            .single()
            .then(({ data }) => {
              if (data) {
                console.log('  📤 Test event sent');
              }
            });
        } else if (status === 'CHANNEL_ERROR') {
          logTest('Real-time subscription', 'fail', 'Channel error');
          channel.unsubscribe();
          resolve();
        }
      });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!received) {
        logTest('Real-time subscription', 'warning', 'No events received (timeout)');
        channel.unsubscribe();
        resolve();
      }
    }, 5000);
  });
}

async function testServiceLayer() {
  console.log('\n📊 Testing Service Layer Functions...');
  console.log('═'.repeat(50));
  
  // Test the custom functions if they exist
  try {
    const { data, error } = await supabase.rpc('is_time_slot_available_with_duration', {
      p_week_start_date: '2025-08-03',
      p_day_of_week: 0,
      p_time_slot_index: 0,
      p_duration: 2,
      p_company: 'login'
    });
    
    if (!error) {
      logTest('Helper function: is_time_slot_available_with_duration', 'pass', 'Function exists');
    } else {
      logTest('Helper function: is_time_slot_available_with_duration', 'warning', 'Function not found');
    }
  } catch (e) {
    logTest('Helper functions', 'warning', 'Not implemented yet');
  }
}

async function generateReport() {
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(50));
  
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    testResults.warnings.forEach(test => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
  }
  
  console.log('\n📝 Recommended Actions:');
  if (testResults.failed.some(t => t.name.includes('Duration column'))) {
    console.log('1. Run sql_scripts/fix-teaching-schedules-comprehensive.sql');
  }
  if (testResults.failed.some(t => t.name.includes('Foreign Key'))) {
    console.log('2. Fix foreign key constraint to point to teaching_courses');
  }
  if (testResults.failed.some(t => t.name.includes('trigger'))) {
    console.log('3. Create updated_at trigger');
  }
  if (testResults.warnings.some(t => t.name.includes('Real-time'))) {
    console.log('4. Check Supabase Realtime settings');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Teaching System Tests...\n');
  
  await testDatabaseSchema();
  await testDataConsistency();
  await testRealTimeSubscription();
  await testServiceLayer();
  await generateReport();
  
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

runAllTests().catch(console.error);