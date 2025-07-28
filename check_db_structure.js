// Check existing database structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStructure() {
  try {
    console.log('🔍 Checking existing database structure...\n');
    
    // Check courses table structure
    const { data: coursesInfo, error: coursesError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'courses' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (coursesError) {
      console.log('❌ Error checking courses table:', coursesError.message);
    } else if (coursesInfo) {
      console.log('📋 Courses Table Structure:');
      console.table(coursesInfo);
    }
    
    // Also check what exists in courses table
    const { data: sampleCourse, error: sampleError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)
      .single();
      
    if (!sampleError && sampleCourse) {
      console.log('\n📄 Sample course data:');
      console.log('ID type:', typeof sampleCourse.id);
      console.log('ID value:', sampleCourse.id);
      console.log('Sample record:', sampleCourse);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Fallback - try direct query
    console.log('\n🔄 Trying alternative approach...');
    
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
      
    if (fallbackData && fallbackData.length > 0) {
      console.log('✅ Courses table exists');
      console.log('Sample data:', fallbackData[0]);
      console.log('ID type:', typeof fallbackData[0].id);
    } else if (fallbackError) {
      console.log('❌ Error accessing courses:', fallbackError.message);
    }
  }
}

checkStructure();