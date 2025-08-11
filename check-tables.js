import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('Checking database tables...\n')
  
  // Check if teaching_courses table exists
  const { data: courses, error: coursesError } = await supabase
    .from('teaching_courses')
    .select('*')
    .limit(1)
  
  if (coursesError) {
    console.log('❌ teaching_courses table error:', coursesError.message)
    console.log('   This table might not exist')
  } else {
    console.log('✅ teaching_courses exists')
    if (courses && courses[0]) {
      console.log('   Columns:', Object.keys(courses[0]))
    }
  }

  console.log('')

  // Check teaching_schedules columns
  const { data: schedules, error: schedulesError } = await supabase
    .from('teaching_schedules')
    .select('*')
    .limit(1)
  
  if (schedulesError) {
    console.log('❌ teaching_schedules error:', schedulesError.message)
  } else {
    console.log('✅ teaching_schedules exists')
    if (schedules && schedules[0]) {
      console.log('   Columns:', Object.keys(schedules[0]))
    }
  }
}

checkTables()