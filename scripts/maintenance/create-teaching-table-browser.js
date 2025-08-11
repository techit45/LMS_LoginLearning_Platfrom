// Run this script in browser console while on the app page
// This will create the teaching_schedules table using browser's Supabase client

console.log('🗄️ Creating teaching_schedules table via browser...');

async function createTeachingSchedulesTable() {
  try {
    // Get the global supabase client from the app
    const supabaseClient = window.supabase;
    
    if (!supabaseClient) {
      console.error('❌ Supabase client not found. Make sure you are on the app page.');
      return;
    }
    
    console.log('✅ Found Supabase client');
    
    // SQL to create teaching_schedules table
    const createTableSQL = `
-- Create teaching_schedules table for real-time collaboration
CREATE TABLE IF NOT EXISTS teaching_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schedule positioning
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time_slot_index INTEGER NOT NULL CHECK (time_slot_index >= 0 AND time_slot_index <= 6),
    
    -- Course and instructor information
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    course_code TEXT,
    instructor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    instructor_name TEXT NOT NULL,
    
    -- Schedule details
    room TEXT DEFAULT 'TBD',
    notes TEXT,
    color TEXT DEFAULT 'bg-blue-500',
    
    -- Multi-tenancy support
    company TEXT DEFAULT 'login',
    
    -- Real-time collaboration metadata
    created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Unique constraint to prevent double booking
    CONSTRAINT unique_schedule_slot UNIQUE (week_start_date, day_of_week, time_slot_index, company)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_week ON teaching_schedules(week_start_date);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_course ON teaching_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_instructor ON teaching_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_company ON teaching_schedules(company);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_day_time ON teaching_schedules(day_of_week, time_slot_index);

-- Enable Row Level Security
ALTER TABLE teaching_schedules ENABLE ROW LEVEL SECURITY;
    `;
    
    // Execute the SQL
    console.log('📝 Executing SQL...');
    const { data, error } = await supabaseClient.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      
      // Try alternative approach - check if table exists
      const { data: existingData, error: checkError } = await supabaseClient
        .from('teaching_schedules')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.log('📋 Table does not exist yet. Please run the SQL manually in Supabase Dashboard.');
        console.log('SQL to run:');
        console.log(createTableSQL);
        return;
      }
      
      if (!checkError) {
        console.log('✅ Table already exists!');
        return;
      }
    }
    
    console.log('✅ Table created successfully!', data);
    
    // Test the table
    const { data: testData, error: testError } = await supabaseClient
      .from('teaching_schedules')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing table:', testError);
    } else {
      console.log('✅ Table is working! Current data:', testData);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
    console.log('');
    console.log('🔧 Alternative: Run this SQL manually in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql');
    console.log('');
    console.log('-- Copy and paste the following SQL:');
    
    const manualSQL = `
-- Create teaching_schedules table
DROP TABLE IF EXISTS teaching_schedules CASCADE;

CREATE TABLE teaching_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time_slot_index INTEGER NOT NULL CHECK (time_slot_index >= 0 AND time_slot_index <= 6),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    course_code TEXT,
    instructor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    instructor_name TEXT NOT NULL,
    room TEXT DEFAULT 'TBD',
    notes TEXT,
    color TEXT DEFAULT 'bg-blue-500',
    company TEXT DEFAULT 'login',
    created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CONSTRAINT unique_schedule_slot UNIQUE (week_start_date, day_of_week, time_slot_index, company)
);

CREATE INDEX idx_teaching_schedules_week ON teaching_schedules(week_start_date);
CREATE INDEX idx_teaching_schedules_course ON teaching_schedules(course_id);
CREATE INDEX idx_teaching_schedules_instructor ON teaching_schedules(instructor_id);
CREATE INDEX idx_teaching_schedules_company ON teaching_schedules(company);
CREATE INDEX idx_teaching_schedules_day_time ON teaching_schedules(day_of_week, time_slot_index);

ALTER TABLE teaching_schedules ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "authenticated_users_can_view_schedules" ON teaching_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_can_manage_schedules" ON teaching_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
    `;
    
    console.log(manualSQL);
  }
}

// Run the function
createTeachingSchedulesTable();