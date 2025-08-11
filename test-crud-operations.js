/**
 * Test Script: CRUD Operations for Teaching Schedule System
 * ทดสอบระบบ CRUD ใหม่ทั้งหมด
 */

// Environment setup for Node.js
const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'

// Test data
const testCourseData = {
  name: 'ทดสอบระบบใหม่',
  company: 'Login Learning',
  location: 'ศรีราชา',
  company_color: '#6366f1',
  duration_hours: 2,
  description: 'คอร์สทดสอบระบบ CRUD แบบใหม่ - สร้างจาก test script'
}

const testScheduleData = {
  day_of_week: 1, // จันทร์
  time_slot_index: 8, // 16:00
  duration: 2,
  course_title: 'ทดสอบระบบใหม่',
  instructor_name: 'ครูทดสอบ',
  room: 'ห้อง A1',
  color: '#6366f1'
}

async function testCRUDOperations() {
  console.log('🚀 เริ่มทดสอบ CRUD Operations...\n')
  
  try {
    // Test 1: CREATE Course
    console.log('1️⃣ ทดสอบการสร้างคอร์สใหม่...')
    
    const createCourseResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testCourseData)
    })
    
    if (!createCourseResponse.ok) {
      const error = await createCourseResponse.text()
      console.log('❌ CREATE Course failed:', error)
      return
    }
    
    const newCourse = await createCourseResponse.json()
    console.log('✅ CREATE Course สำเร็จ:', newCourse[0])
    const courseId = newCourse[0].id
    
    // Test 2: READ Course
    console.log('\n2️⃣ ทดสอบการอ่านข้อมูลคอร์ส...')
    
    const readCourseResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_courses?id=eq.${courseId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (!readCourseResponse.ok) {
      console.log('❌ READ Course failed')
      return
    }
    
    const courses = await readCourseResponse.json()
    console.log('✅ READ Course สำเร็จ:', courses[0])
    
    // Test 3: UPDATE Course
    console.log('\n3️⃣ ทดสอบการแก้ไขคอร์ส...')
    
    const updateCourseResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_courses?id=eq.${courseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'ทดสอบระบบใหม่ (แก้ไขแล้ว)',
        duration_hours: 3
      })
    })
    
    if (!updateCourseResponse.ok) {
      console.log('❌ UPDATE Course failed')
      return
    }
    
    const updatedCourse = await updateCourseResponse.json()
    console.log('✅ UPDATE Course สำเร็จ:', updatedCourse[0])
    
    // Test 4: CREATE Schedule
    console.log('\n4️⃣ ทดสอบการสร้างตารางสอน...')
    
    const weekStartDate = getWeekStartDate(new Date())
    const scheduleWithCourse = {
      ...testScheduleData,
      course_id: courseId,
      week_start_date: weekStartDate,
      company: 'login'
    }
    
    const createScheduleResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(scheduleWithCourse)
    })
    
    if (!createScheduleResponse.ok) {
      const error = await createScheduleResponse.text()
      console.log('❌ CREATE Schedule failed:', error)
      return
    }
    
    const newSchedule = await createScheduleResponse.json()
    console.log('✅ CREATE Schedule สำเร็จ:', newSchedule[0])
    const scheduleId = newSchedule[0].id
    
    // Test 5: READ Schedule with JOIN
    console.log('\n5️⃣ ทดสอบการอ่านตารางพร้อม JOIN...')
    
    const readScheduleResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/teaching_schedules?id=eq.${scheduleId}&select=*,teaching_courses(id,name,company_color)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    
    if (!readScheduleResponse.ok) {
      console.log('❌ READ Schedule with JOIN failed')
      return
    }
    
    const schedules = await readScheduleResponse.json()
    console.log('✅ READ Schedule with JOIN สำเร็จ:', schedules[0])
    
    // Test 6: UPDATE Schedule (Move)
    console.log('\n6️⃣ ทดสอบการย้ายตาราง...')
    
    const updateScheduleResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_schedules?id=eq.${scheduleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        day_of_week: 2, // ย้ายไปอังคาร
        time_slot_index: 9 // ย้ายไป 17:00
      })
    })
    
    if (!updateScheduleResponse.ok) {
      console.log('❌ UPDATE Schedule failed')
      return
    }
    
    const updatedSchedule = await updateScheduleResponse.json()
    console.log('✅ UPDATE Schedule (Move) สำเร็จ:', updatedSchedule[0])
    
    // Test 7: UPDATE Schedule (Resize)
    console.log('\n7️⃣ ทดสอบการปรับขนาดตาราง...')
    
    const resizeScheduleResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_schedules?id=eq.${scheduleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        duration: 3 // เพิ่มเป็น 3 ชั่วโมง
      })
    })
    
    if (!resizeScheduleResponse.ok) {
      console.log('❌ UPDATE Schedule (Resize) failed')
      return
    }
    
    const resizedSchedule = await resizeScheduleResponse.json()
    console.log('✅ UPDATE Schedule (Resize) สำเร็จ:', resizedSchedule[0])
    
    // Test 8: DELETE Schedule
    console.log('\n8️⃣ ทดสอบการลบตารางสอน...')
    
    const deleteScheduleResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_schedules?id=eq.${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (!deleteScheduleResponse.ok) {
      console.log('❌ DELETE Schedule failed')
      return
    }
    
    console.log('✅ DELETE Schedule สำเร็จ')
    
    // Test 9: DELETE Course
    console.log('\n9️⃣ ทดสอบการลบคอร์ส...')
    
    const deleteCourseResponse = await fetch(`${SUPABASE_URL}/rest/v1/teaching_courses?id=eq.${courseId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (!deleteCourseResponse.ok) {
      console.log('❌ DELETE Course failed')
      return
    }
    
    console.log('✅ DELETE Course สำเร็จ')
    
    // Summary
    console.log('\n🎉 สรุปผลการทดสอบ:')
    console.log('✅ CREATE Course - สำเร็จ')
    console.log('✅ READ Course - สำเร็จ')  
    console.log('✅ UPDATE Course - สำเร็จ')
    console.log('✅ CREATE Schedule - สำเร็จ')
    console.log('✅ READ Schedule with JOIN - สำเร็จ')
    console.log('✅ UPDATE Schedule (Move) - สำเร็จ')
    console.log('✅ UPDATE Schedule (Resize) - สำเร็จ')
    console.log('✅ DELETE Schedule - สำเร็จ')
    console.log('✅ DELETE Course - สำเร็จ')
    console.log('\n🏆 CRUD Operations ทั้งหมดทำงานได้ปกติ!')
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

// Utility function
function getWeekStartDate(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

// Run the test
testCRUDOperations()