import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
)

async function debugInstructors() {
  console.log('🔍 DEBUG: ตรวจสอบระบบผู้สอน\n')

  try {
    // 1. ตรวจสอบ user_profiles ทั้งหมด
    console.log('1️⃣ ตรวจสอบ user_profiles ทั้งหมด:')
    const { data: allProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')

    if (profileError) {
      console.error('❌ Error loading profiles:', profileError)
    } else {
      console.log(`พบ ${allProfiles.length} profiles ทั้งหมด`)
      
      // แสดงแต่ละ role
      const roleCount = {}
      allProfiles.forEach(p => {
        roleCount[p.role || 'null'] = (roleCount[p.role || 'null'] || 0) + 1
      })
      console.log('แยกตาม role:', roleCount)
      
      // แสดงทุกคน
      console.log('\nรายชื่อทั้งหมด:')
      allProfiles.forEach((p, i) => {
        console.log(`${i+1}. ${p.full_name || p.email || 'No name'} - Role: ${p.role} - ID: ${p.user_id}`)
      })
    }

    // 2. ตรวจสอบ auth.users
    console.log('\n' + '='.repeat(60))
    console.log('2️⃣ ตรวจสอบ teaching_courses:')
    const { data: courses, error: courseError } = await supabase
      .from('teaching_courses')
      .select('*')

    if (courseError) {
      console.error('❌ Error loading courses:', courseError)
    } else {
      console.log(`พบ ${courses.length} courses`)
      courses.forEach((c, i) => {
        console.log(`${i+1}. ${c.name} - Created by: ${c.created_by}`)
      })
    }

    // 3. ตรวจสอบว่าการ query ด้วย .neq('role', 'student') ทำงานหรือไม่
    console.log('\n' + '='.repeat(60))
    console.log('3️⃣ ทดสอบ query .neq("role", "student"):')
    const { data: nonStudents, error: nsError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .neq('role', 'student')

    if (nsError) {
      console.error('❌ Error:', nsError)
    } else {
      console.log(`พบ ${nonStudents.length} คนที่ไม่ใช่ student`)
      nonStudents.forEach((p, i) => {
        console.log(`${i+1}. ${p.full_name || p.email} - Role: ${p.role}`)
      })
    }

    // 4. ทดสอบ query แบบอื่น
    console.log('\n' + '='.repeat(60))
    console.log('4️⃣ ทดสอบ query แบบ in("role", ["instructor", "admin"]):')
    const { data: instructorsAndAdmins, error: iaError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .in('role', ['instructor', 'admin', 'super_admin'])

    if (iaError) {
      console.error('❌ Error:', iaError)
    } else {
      console.log(`พบ ${instructorsAndAdmins.length} instructors/admins`)
      instructorsAndAdmins.forEach((p, i) => {
        console.log(`${i+1}. ${p.full_name || p.email} - Role: ${p.role}`)
      })
    }

    // 5. ตรวจสอบว่ามี null role หรือไม่
    console.log('\n' + '='.repeat(60))
    console.log('5️⃣ ตรวจสอบ null roles:')
    const { data: nullRoles, error: nrError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .is('role', null)

    if (nrError) {
      console.error('❌ Error:', nrError)
    } else {
      console.log(`พบ ${nullRoles.length} คนที่ role เป็น null`)
      nullRoles.forEach((p, i) => {
        console.log(`${i+1}. ${p.full_name || p.email} - Role: ${p.role}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugInstructors()