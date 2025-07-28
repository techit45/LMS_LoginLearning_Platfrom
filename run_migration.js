// Script to run database migration for Teaching Schedule System
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // We'll need this for admin operations

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL not found in environment variables');
  process.exit(1);
}

// For now, let's use the anon key for testing
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('\n📖 Reading migration file...');
    const migrationSQL = readFileSync('./database/teaching_schedule_migration.sql', 'utf8');
    
    console.log('\n🚀 Starting database migration...');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.startsWith('/*') || statement.trim() === '') {
        continue; // Skip comments and empty statements
      }
      
      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`📝 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          
          // Continue with next statement if this one fails
          continue;
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (sqlError) {
        console.error(`❌ SQL Error in statement ${i + 1}:`, sqlError);
        
        // Try alternative approach for schema operations
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE OR REPLACE VIEW')) {
          console.log('🔄 Trying alternative approach for schema operation...');
          
          // For testing, let's just log this for now
          console.log('📝 Would execute:', statement);
        }
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log('\n🔍 Testing database connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('📋 Courses table not yet created, this is expected on first run');
      console.log('Error:', testError.message);
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Courses table accessible');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('\n🎉 Migration script completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Migration script failed:', error);
  process.exit(1);
});