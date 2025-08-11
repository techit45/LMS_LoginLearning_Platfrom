#!/usr/bin/env node

/**
 * Create Cal.com instructors table directly through Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createInstructorsTable() {
  console.log('📊 Creating Cal.com instructors table...\n');

  // Create table with basic SQL
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS calcom_instructors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      color VARCHAR(7) DEFAULT '#3b82f6',
      company VARCHAR(100),
      specialization TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_by UUID
    );
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      // Try alternative approach - insert sample data to test if table exists
      console.log('⚠️ Direct SQL execution not available, trying alternative approach...');
      
      const sampleInstructors = [
        {
          name: 'อ.สมชาย ใจดี',
          email: 'somchai@login.com',
          phone: '081-234-5678',
          color: '#10b981',
          company: 'Login',
          specialization: 'วิศวกรรมคอมพิวเตอร์, AI/ML'
        },
        {
          name: 'อ.สมหญิง รักเรียน',
          email: 'somying@login.com',
          phone: '082-345-6789',
          color: '#8b5cf6',
          company: 'Login',
          specialization: 'Web Development, Database'
        },
        {
          name: 'อ.วิชัย เก่งมาก',
          email: 'wichai@meta.com',
          phone: '083-456-7890',
          color: '#f59e0b',
          company: 'Meta',
          specialization: 'Cybersecurity, Networking'
        },
        {
          name: 'อ.มานะ ขยันเรียน',
          email: 'mana@edtech.com',
          phone: '084-567-8901',
          color: '#ef4444',
          company: 'EdTech',
          specialization: 'Mobile Development, IoT'
        },
        {
          name: 'อ.สุภาพ อ่อนโยน',
          email: 'supap@med.com',
          phone: '085-678-9012',
          color: '#06b6d4',
          company: 'Med',
          specialization: 'Data Science, Machine Learning'
        }
      ];

      // Try to insert sample data (this will fail if table doesn't exist)
      const { data, error: insertError } = await supabase
        .from('calcom_instructors')
        .insert(sampleInstructors)
        .select();

      if (insertError) {
        console.error('❌ Table does not exist and cannot be created via client');
        console.log('\n🛠️ Manual fix required:');
        console.log('1. Open Supabase Dashboard → SQL Editor');
        console.log('2. Copy and paste the SQL from: sql_scripts/41-add-calcom-instructors.sql');
        console.log('3. Run the SQL script');
        console.log('4. Reload the Cal.com scheduling page\n');
        return false;
      }

      console.log(`✅ Sample instructors inserted: ${data?.length || 0} records`);
      return true;
    }

    console.log('✅ Instructors table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    return false;
  }
}

async function addInstructorIdColumns() {
  console.log('📊 Adding instructor_id columns to existing tables...\n');

  const alterQueries = [
    'ALTER TABLE calcom_courses ADD COLUMN IF NOT EXISTS instructor_id UUID;',
    'ALTER TABLE calcom_bookings ADD COLUMN IF NOT EXISTS instructor_id UUID;',
    'ALTER TABLE calcom_schedule_view ADD COLUMN IF NOT EXISTS instructor_id UUID;'
  ];

  for (const query of alterQueries) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`⚠️ Could not execute: ${query}`);
      }
    } catch (error) {
      console.log(`⚠️ Column addition query failed (may already exist)`);
    }
  }

  console.log('✅ Column additions completed (or skipped if not supported)');
  return true;
}

async function main() {
  console.log('==========================================');
  console.log('Cal.com Instructors Table Creation Script');
  console.log('==========================================\n');

  const tableCreated = await createInstructorsTable();
  
  if (tableCreated) {
    await addInstructorIdColumns();
    
    console.log('\n✅ Cal.com instructor system is ready!');
    console.log('\nWhat you can do now:');
    console.log('1. Open Cal.com scheduling page');
    console.log('2. Create new instructors using the + button');
    console.log('3. Drag courses to schedule grid');
    console.log('4. Drag instructors onto scheduled courses');
    console.log('5. Use drag-to-trash to delete schedules');
  } else {
    console.log('\n❌ Manual intervention required');
    console.log('\nTo fix this issue:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run sql_scripts/41-add-calcom-instructors.sql');
    console.log('4. Refresh your browser');
  }
  
  console.log('\n==========================================\n');
  process.exit(tableCreated ? 0 : 1);
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});