#!/usr/bin/env node

/**
 * Complete fix for teaching schedule system
 * Fixes all data inconsistencies and resets to clean state
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTeachingSystem() {
  console.log('🔧 Starting complete teaching system fix...\n');

  try {
    // Step 1: Add duration column if not exists
    console.log('📊 Step 1: Adding duration column to teaching_schedules...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE teaching_schedules 
        ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 1 
        CHECK (duration >= 1 AND duration <= 6);
      `
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Error adding duration column:', alterError);
    } else {
      console.log('✅ Duration column added/verified');
    }

    // Step 2: Clean up old demo data without proper foreign keys
    console.log('\n📊 Step 2: Cleaning up old demo data...');
    const { data: oldData, error: fetchError } = await supabase
      .from('teaching_schedules')
      .select('id, course_title, instructor_name')
      .is('course_id', null)
      .is('instructor_id', null);

    if (!fetchError && oldData && oldData.length > 0) {
      console.log(`Found ${oldData.length} old demo records to clean up:`);
      oldData.forEach(record => {
        console.log(`  - ${record.course_title} by ${record.instructor_name}`);
      });

      const { error: deleteError } = await supabase
        .from('teaching_schedules')
        .delete()
        .is('course_id', null)
        .is('instructor_id', null);

      if (deleteError) {
        console.error('❌ Error deleting old data:', deleteError);
      } else {
        console.log(`✅ Deleted ${oldData.length} old demo records`);
      }
    } else {
      console.log('✅ No old demo data to clean up');
    }

    // Step 3: Update existing schedules with proper duration
    console.log('\n📊 Step 3: Updating schedule durations...');
    
    // Update the resized schedules
    const updates = [
      { id: 'f614b2af-cb2e-4903-b00f-08f5f9b7669e', duration: 3 },
      { id: '38488f9f-0120-425c-b5b2-93e49169d8ae', duration: 4 }
    ];

    for (const update of updates) {
      const { data: existing } = await supabase
        .from('teaching_schedules')
        .select('id, course_title')
        .eq('id', update.id)
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from('teaching_schedules')
          .update({ duration: update.duration })
          .eq('id', update.id);

        if (updateError) {
          console.error(`❌ Error updating ${existing.course_title}:`, updateError);
        } else {
          console.log(`✅ Updated ${existing.course_title} to ${update.duration} hours`);
        }
      }
    }

    // Step 4: Verify data integrity
    console.log('\n📊 Step 4: Verifying data integrity...');
    const { data: currentSchedules, error: verifyError } = await supabase
      .from('teaching_schedules')
      .select(`
        id,
        course_title,
        instructor_name,
        duration,
        course_id,
        instructor_id
      `)
      .eq('week_start_date', '2025-08-03')
      .order('day_of_week')
      .order('time_slot_index');

    if (!verifyError && currentSchedules) {
      console.log(`\n📅 Current schedules for week 2025-08-03:`);
      console.log('═'.repeat(80));
      
      currentSchedules.forEach(schedule => {
        const hasFK = schedule.course_id && schedule.instructor_id;
        const status = hasFK ? '✅' : '⚠️';
        console.log(`${status} ${schedule.course_title} - ${schedule.instructor_name} (${schedule.duration || 1}h)`);
        if (!hasFK) {
          console.log(`   ⚠️ Missing: ${!schedule.course_id ? 'course_id' : ''} ${!schedule.instructor_id ? 'instructor_id' : ''}`);
        }
      });
    }

    // Step 5: Display summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY:');
    console.log('═'.repeat(80));
    
    const { count: totalCount } = await supabase
      .from('teaching_schedules')
      .select('*', { count: 'exact', head: true });
      
    const { count: validCount } = await supabase
      .from('teaching_schedules')
      .select('*', { count: 'exact', head: true })
      .not('course_id', 'is', null)
      .not('instructor_id', 'is', null);

    console.log(`Total schedules: ${totalCount || 0}`);
    console.log(`Valid schedules (with FKs): ${validCount || 0}`);
    console.log(`Invalid schedules: ${(totalCount || 0) - (validCount || 0)}`);

    console.log('\n✅ Teaching system fix completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Run the SQL migration in Supabase Dashboard:');
    console.log('   sql_scripts/fix-teaching-schedules-duration.sql');
    console.log('2. Restart the development server');
    console.log('3. Test the schedule system with drag & drop and resize');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the fix
fixTeachingSystem().catch(console.error);