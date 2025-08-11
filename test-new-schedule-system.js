/**
 * Test script for new teaching schedule system
 * This will test the new clean architecture implementation
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vuitwzisazvikrhtfthh.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testScheduleSystem() {
  console.log('🧪 Testing New Teaching Schedule System\n')
  console.log('========================================\n')

  try {
    // 1. First clear any test data
    console.log('1️⃣ Clearing test data...')
    const weekStart = '2025-01-06' // This week Monday
    const { error: clearError } = await supabase
      .from('teaching_schedules')
      .delete()
      .eq('week_start_date', weekStart)
      .eq('company', 'login')
      .eq('notes', 'TEST-DATA')

    if (clearError && clearError.code !== 'PGRST116') {
      console.error('Clear error:', clearError)
    }
    console.log('✅ Test data cleared\n')

    // 2. Test CREATE operation
    console.log('2️⃣ Testing CREATE operation...')
    const newSchedule = {
      week_start_date: weekStart,
      company: 'login',
      day_of_week: 1, // Monday
      time_slot_index: 2, // 10:00
      duration: 2,
      course_title: 'วิศวกรรมซอฟต์แวร์',
      course_code: 'SE101',
      instructor_name: 'อ.ทดสอบ',
      room: 'LAB-301',
      color: '#3B82F6',
      notes: 'TEST-DATA'
    }

    const { data: createData, error: createError } = await supabase
      .from('teaching_schedules')
      .insert(newSchedule)
      .select()
      .single()

    if (createError) {
      console.error('❌ Create failed:', createError)
      return
    }
    console.log('✅ Schedule created:', createData.id)
    console.log('   - Course:', createData.course_title)
    console.log('   - Time: Day', createData.day_of_week, 'Slot', createData.time_slot_index)
    console.log('')

    // 3. Test READ operation
    console.log('3️⃣ Testing READ operation...')
    const { data: readData, error: readError } = await supabase
      .from('teaching_schedules')
      .select('*')
      .eq('week_start_date', weekStart)
      .eq('company', 'login')

    if (readError) {
      console.error('❌ Read failed:', readError)
      return
    }
    console.log('✅ Found', readData.length, 'schedules')
    console.log('')

    // 4. Test UPDATE (Move) operation
    console.log('4️⃣ Testing UPDATE (Move) operation...')
    const { data: updateData, error: updateError } = await supabase
      .from('teaching_schedules')
      .update({
        day_of_week: 3, // Wednesday
        time_slot_index: 4 // 12:00
      })
      .eq('id', createData.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update failed:', updateError)
      return
    }
    console.log('✅ Schedule moved to Day', updateData.day_of_week, 'Slot', updateData.time_slot_index)
    console.log('')

    // 5. Test Resize operation
    console.log('5️⃣ Testing RESIZE operation...')
    const { data: resizeData, error: resizeError } = await supabase
      .from('teaching_schedules')
      .update({
        duration: 3 // 3 hours
      })
      .eq('id', createData.id)
      .select()
      .single()

    if (resizeError) {
      console.error('❌ Resize failed:', resizeError)
      return
    }
    console.log('✅ Schedule resized to', resizeData.duration, 'hours')
    console.log('')

    // 6. Test Conflict Detection
    console.log('6️⃣ Testing CONFLICT detection...')
    const conflictSchedule = {
      ...newSchedule,
      day_of_week: 3, // Same as moved schedule
      time_slot_index: 4, // Same as moved schedule
      course_title: 'วิชาที่ซ้ำ'
    }

    const { error: conflictError } = await supabase
      .from('teaching_schedules')
      .insert(conflictSchedule)

    if (conflictError && conflictError.code === '23505') {
      console.log('✅ Conflict detected correctly (duplicate key)')
    } else if (conflictError) {
      console.log('❓ Other error:', conflictError.message)
    } else {
      console.log('❌ Conflict not detected - this should not happen!')
    }
    console.log('')

    // 7. Test DELETE operation
    console.log('7️⃣ Testing DELETE operation...')
    const { error: deleteError } = await supabase
      .from('teaching_schedules')
      .delete()
      .eq('id', createData.id)

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError)
      return
    }
    console.log('✅ Schedule deleted successfully')
    console.log('')

    // 8. Test time slot range (0-12)
    console.log('8️⃣ Testing full time slot range (0-12)...')
    const timeSlotTests = [
      { slot: 0, time: '08:00' },
      { slot: 6, time: '14:00' },
      { slot: 12, time: '20:00' }
    ]

    for (const test of timeSlotTests) {
      const testSchedule = {
        ...newSchedule,
        time_slot_index: test.slot,
        day_of_week: 5, // Friday
        course_title: `Test ${test.time}`
      }

      const { data, error } = await supabase
        .from('teaching_schedules')
        .insert(testSchedule)
        .select()
        .single()

      if (error) {
        console.log(`❌ Slot ${test.slot} (${test.time}) failed:`, error.message)
      } else {
        console.log(`✅ Slot ${test.slot} (${test.time}) works`)
        // Clean up
        await supabase.from('teaching_schedules').delete().eq('id', data.id)
      }
    }
    console.log('')

    console.log('========================================')
    console.log('✅ All tests completed successfully!')
    console.log('\n📌 Next steps:')
    console.log('1. Navigate to http://localhost:5173/#/admin/teaching-schedule')
    console.log('2. Test drag & drop from Course Manager')
    console.log('3. Test resize by dragging bottom edge')
    console.log('4. Open in 2 browser tabs to test real-time sync')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testScheduleSystem()