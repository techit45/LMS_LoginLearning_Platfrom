import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
)

async function checkAllInstructors() {
  console.log('🔍 ตรวจสอบผู้สอนทั้งหมดในระบบ...\n')

  try {
    // 1. ดูทุกคนในระบบ (ไม่รวม student)
    const { data: allUsers, error: allError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role, is_active')
      .neq('role', 'student')
      .order('full_name')

    if (allError) throw allError

    console.log('📊 ผู้ใช้ทั้งหมดที่ไม่ใช่ student:', allUsers.length, 'คน')
    console.log('=' .repeat(60))
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || user.email || 'ไม่ระบุ'}`)
      console.log(`   ID: ${user.user_id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)
      console.log('')
    })

    // 2. ตรวจสอบการกรองแบบเดียวกับใน ScheduleGrid
    const instructorMap = new Map()
    const nameSet = new Set()
    
    allUsers.forEach(instructor => {
      const instructorId = instructor.user_id
      const instructorName = instructor.full_name || instructor.email || 'ไม่ระบุ'
      
      // Check for both ID and name duplicates
      if (!instructorMap.has(instructorId) && !nameSet.has(instructorName)) {
        instructorMap.set(instructorId, {
          id: instructorId,
          name: instructorName,
          is_active: instructor.is_active
        })
        nameSet.add(instructorName)
      }
    })

    const instructorList = Array.from(instructorMap.values())
    
    console.log('=' .repeat(60))
    console.log('📋 หลังกรองซ้ำ:', instructorList.length, 'คน')
    console.log('รายชื่อที่จะแสดงในตาราง:')
    instructorList.forEach((inst, index) => {
      console.log(`${index + 1}. ${inst.name} (${inst.id})`)
    })

    // 3. ตรวจสอบ teaching_courses
    const { data: teachingCourses, error: tcError } = await supabase
      .from('teaching_courses')
      .select('id, name, created_by')
      .order('name')

    if (!tcError) {
      console.log('\n' + '=' .repeat(60))
      console.log('📚 Teaching Courses:', teachingCourses.length, 'วิชา')
      
      // หา unique instructors จาก courses
      const uniqueInstructorIds = [...new Set(teachingCourses.map(c => c.created_by).filter(Boolean))]
      console.log('Unique instructor IDs ใน courses:', uniqueInstructorIds.length, 'คน')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkAllInstructors()