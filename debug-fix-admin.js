import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
)

async function fixLoginAdmin() {
  console.log('🔧 แก้ไข Login-Learning Admin...\n')

  try {
    // ตรวจสอบสถานะปัจจุบัน
    console.log('1️⃣ สถานะปัจจุบัน:')
    const { data: before, error: beforeError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, role, is_active')
      .eq('email', 'techit.y@login-learning.com')

    if (beforeError) throw beforeError

    if (before.length > 0) {
      console.log(`   Email: ${before[0].email}`)
      console.log(`   Name: ${before[0].full_name}`)
      console.log(`   Role: ${before[0].role}`)
      console.log(`   Active: ${before[0].is_active}`)
    } else {
      console.log('   ❌ ไม่พบข้อมูล')
      return
    }

    // แก้ไข
    console.log('\n2️⃣ กำลังแก้ไข...')
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: 'Login-Learning Admin',
        is_active: true
      })
      .eq('email', 'techit.y@login-learning.com')
      .select()

    if (updateError) {
      console.error('❌ Error updating:', updateError)
      return
    }

    console.log('✅ แก้ไขสำเร็จ!')

    // ตรวจสอบหลังแก้ไข
    console.log('\n3️⃣ สถานะหลังแก้ไข:')
    const { data: after, error: afterError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, role, is_active')
      .eq('email', 'techit.y@login-learning.com')

    if (afterError) throw afterError

    if (after.length > 0) {
      console.log(`   Email: ${after[0].email}`)
      console.log(`   Name: ${after[0].full_name}`)
      console.log(`   Role: ${after[0].role}`)
      console.log(`   Active: ${after[0].is_active}`)
    }

    // ตรวจสอบผู้สอนทั้งหมดที่แสดงได้
    console.log('\n4️⃣ ผู้สอนทั้งหมดที่จะแสดงในตาราง:')
    const { data: allInstructors, error: allError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role, is_active')
      .neq('role', 'student')
      .order('full_name')

    if (allError) throw allError

    console.log(`พบ ${allInstructors.length} คน:`)
    allInstructors.forEach((inst, i) => {
      console.log(`${i+1}. ${inst.full_name || inst.email} - ${inst.role} - Active: ${inst.is_active}`)
    })

    console.log('\n🎉 เสร็จสิ้น! กลับไปหน้าตารางสอนและรีเฟรช จะเห็น Login-Learning Admin แล้ว!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixLoginAdmin()