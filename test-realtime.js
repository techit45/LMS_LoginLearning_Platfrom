/**
 * Test Real-time Subscription for Teaching Schedules
 * ทดสอบระบบ Real-time Collaboration
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
)

// Test data
const weekStartDate = getWeekStartDate(new Date())

async function testRealtimeSubscription() {
  console.log('🔔 ทดสอบ Real-time Subscription...\n')

  try {
    // Setup subscription
    const channel = supabase
      .channel(`test-schedules-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teaching_schedules',
          filter: `company=eq.login`
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload
          
          console.log('📡 Real-time Event:', {
            type: eventType,
            courseTitle: newRecord?.course_title || oldRecord?.course_title,
            dayOfWeek: newRecord?.day_of_week || oldRecord?.day_of_week,
            timeSlot: newRecord?.time_slot_index || oldRecord?.time_slot_index,
            id: newRecord?.id || oldRecord?.id
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription Status:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active!')
          
          // Test insert after subscription is ready
          setTimeout(() => testInsert(), 2000)
        }
      })

    console.log('⏳ Waiting for subscription to be ready...')
    
  } catch (error) {
    console.error('❌ Subscription error:', error)
  }
}

async function testInsert() {
  console.log('\n🆕 ทดสอบการ Insert (ควรเห็น real-time event)...')

  try {
    const testSchedule = {
      week_start_date: weekStartDate,
      company: 'login',
      day_of_week: 0, // อาทิตย์
      time_slot_index: 12, // 20:00
      duration: 1,
      course_title: `Real-time Test ${Date.now()}`,
      instructor_name: 'Test Instructor',
      room: 'Test Room',
      color: '#10b981'
    }

    const { data, error } = await supabase
      .from('teaching_schedules')
      .insert(testSchedule)
      .select()

    if (error) {
      console.log('⚠️ Insert failed (expected due to RLS):', error.message)
    } else {
      console.log('✅ Insert successful:', data[0])
      
      // Test update after 3 seconds
      setTimeout(() => testUpdate(data[0].id), 3000)
    }

  } catch (error) {
    console.error('❌ Insert test error:', error)
  }
}

async function testUpdate(scheduleId) {
  console.log('\n✏️ ทดสอบการ Update (ควรเห็น real-time event)...')

  try {
    const { data, error } = await supabase
      .from('teaching_schedules')
      .update({
        day_of_week: 1, // ย้ายไปจันทร์
        time_slot_index: 10, // ย้ายไป 18:00
        course_title: `Real-time Test Updated ${Date.now()}`
      })
      .eq('id', scheduleId)
      .select()

    if (error) {
      console.log('⚠️ Update failed:', error.message)
    } else {
      console.log('✅ Update successful:', data[0])
      
      // Test delete after 3 seconds
      setTimeout(() => testDelete(scheduleId), 3000)
    }

  } catch (error) {
    console.error('❌ Update test error:', error)
  }
}

async function testDelete(scheduleId) {
  console.log('\n🗑️ ทดสอบการ Delete (ควรเห็น real-time event)...')

  try {
    const { error } = await supabase
      .from('teaching_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      console.log('⚠️ Delete failed:', error.message)
    } else {
      console.log('✅ Delete successful')
    }

    console.log('\n🎉 การทดสอบ Real-time เสร็จสิ้น!')
    console.log('📝 หมายเหตุ: หากเห็น real-time events ข้างบน แสดงว่าระบบทำงานได้ถูกต้อง')
    
  } catch (error) {
    console.error('❌ Delete test error:', error)
  }
}

function getWeekStartDate(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

// Start the test
testRealtimeSubscription()