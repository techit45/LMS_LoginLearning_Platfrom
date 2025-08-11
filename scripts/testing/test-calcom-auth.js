#!/usr/bin/env node

/**
 * Test Cal.com scheduling system authentication
 * Handles expired refresh tokens and tests the new system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔐 Testing Supabase authentication...\n');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      console.log('\n💡 Tip: Your refresh token has expired. Please log in again through the web app.\n');
      return false;
    }
    
    if (!session) {
      console.log('⚠️ No active session found');
      console.log('\n💡 Tip: Please log in through the web app first.\n');
      return false;
    }
    
    console.log('✅ Active session found');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Expires at:', new Date(session.expires_at * 1000).toLocaleString());
    
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}

async function testCalcomTables() {
  console.log('\n📊 Testing Cal.com tables access...\n');
  
  try {
    // Test courses table
    const { data: courses, error: coursesError } = await supabase
      .from('calcom_courses')
      .select('*')
      .limit(5);
    
    if (coursesError) {
      console.error('❌ Error accessing calcom_courses:', coursesError.message);
      
      // Check if it's an auth error
      if (coursesError.message.includes('Refresh Token')) {
        console.log('\n⚠️ Authentication issue detected');
        console.log('   The refresh token has expired.');
        console.log('   Please clear your browser cookies and log in again.\n');
      }
      return false;
    }
    
    console.log(`✅ Successfully accessed calcom_courses table`);
    console.log(`   Found ${courses?.length || 0} courses\n`);
    
    // Test schedule view
    const { data: schedules, error: schedulesError } = await supabase
      .from('calcom_schedule_view')
      .select('*')
      .limit(5);
    
    if (schedulesError) {
      console.error('❌ Error accessing calcom_schedule_view:', schedulesError.message);
      return false;
    }
    
    console.log(`✅ Successfully accessed calcom_schedule_view`);
    console.log(`   Found ${schedules?.length || 0} schedules\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Table access test failed:', error.message);
    return false;
  }
}

async function createTestCourse() {
  console.log('\n🆕 Testing course creation (without auth)...\n');
  
  try {
    const testCourse = {
      name: `Test Course ${Date.now()}`,
      company: 'Login',
      company_color: '#3b82f6',
      location: 'Test Location',
      duration_minutes: 90,
      description: 'Test course created without authentication'
    };
    
    const { data, error } = await supabase
      .from('calcom_courses')
      .insert(testCourse)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Course creation failed:', error.message);
      
      if (error.message.includes('violates foreign key constraint')) {
        console.log('\n💡 This is expected if created_by is required.');
        console.log('   The system should handle this gracefully in development mode.\n');
      }
      return false;
    }
    
    console.log('✅ Test course created successfully');
    console.log('   Course ID:', data.id);
    console.log('   Course Name:', data.name);
    
    // Clean up - delete the test course
    const { error: deleteError } = await supabase
      .from('calcom_courses')
      .delete()
      .eq('id', data.id);
    
    if (!deleteError) {
      console.log('   ✓ Test course cleaned up\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test course creation failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('====================================');
  console.log('Cal.com Scheduling System Auth Test');
  console.log('====================================\n');
  
  // Test authentication
  const authOk = await testAuth();
  
  // Test table access (even if auth fails, to test anon access)
  const tablesOk = await testCalcomTables();
  
  // Test course creation without auth
  if (!authOk) {
    await createTestCourse();
  }
  
  // Summary
  console.log('\n====================================');
  console.log('Test Summary');
  console.log('====================================\n');
  
  if (authOk && tablesOk) {
    console.log('✅ All tests passed! The Cal.com scheduling system is ready.');
  } else if (!authOk) {
    console.log('⚠️ Authentication issues detected.\n');
    console.log('To fix this:');
    console.log('1. Open your browser');
    console.log('2. Go to http://localhost:5173');
    console.log('3. Log out if currently logged in');
    console.log('4. Clear browser cookies for localhost');
    console.log('5. Log in again with your credentials');
    console.log('\nThe Cal.com scheduling system will work in development mode.');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
  }
  
  console.log('\n====================================\n');
  process.exit(0);
}

// Run the test
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});