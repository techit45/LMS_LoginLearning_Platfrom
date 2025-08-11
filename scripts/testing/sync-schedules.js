// Sync schedules ระหว่าง real-time system และ legacy data
// รันใน browser console

async function syncSchedules() {
  console.log('🔄 กำลัง sync ข้อมูลตาราง...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // 1. ดูข้อมูลปัจจุบัน
    console.log('📊 ตรวจสอบข้อมูลปัจจุบัน...');
    
    const { data: allSchedules, error: fetchError } = await supabase
      .from('teaching_schedules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching schedules:', fetchError);
      return;
    }
    
    console.log(`📅 พบข้อมูล ${allSchedules?.length || 0} รายการ:`);
    allSchedules?.forEach(s => {
      console.log(`  - ${s.course_title} (วัน ${s.day_of_week}, ช่วง ${s.time_slot_index}) วันที่ ${s.week_start_date}`);
    });
    
    // 2. อัปเดต week_start_date ให้ตรงกับสัปดาห์ปัจจุบัน
    const currentWeekStart = '2025-08-04'; // Monday ของสัปดาห์ที่ระบบกำลังดู
    console.log(`\n🗓️ กำลังอัปเดต week_start_date เป็น ${currentWeekStart}...`);
    
    let updated = 0;
    for (const schedule of allSchedules || []) {
      if (schedule.week_start_date !== currentWeekStart) {
        console.log(`🔄 อัปเดต ${schedule.course_title} จาก ${schedule.week_start_date} เป็น ${currentWeekStart}`);
        
        const { error: updateError } = await supabase
          .from('teaching_schedules')
          .update({ week_start_date: currentWeekStart })
          .eq('id', schedule.id);
        
        if (updateError) {
          console.error('❌ Error updating:', updateError.message);
        } else {
          updated++;
          console.log('✅ อัปเดตสำเร็จ');
        }
      }
    }
    
    console.log(`\n📊 อัปเดตทั้งหมด ${updated} รายการ`);
    
    // 3. ตรวจสอบข้อมูลหลังอัปเดต
    console.log('\n🔍 ตรวจสอบข้อมูลหลังอัปเดต...');
    
    const { data: updatedSchedules, error: checkError } = await supabase
      .from('teaching_schedules')
      .select('*')
      .eq('week_start_date', currentWeekStart)
      .eq('company', 'login')
      .order('day_of_week')
      .order('time_slot_index');
    
    if (checkError) {
      console.error('❌ Error checking updated schedules:', checkError);
      return;
    }
    
    console.log(`✅ ข้อมูลสำหรับสัปดาห์ ${currentWeekStart}:`);
    updatedSchedules?.forEach(s => {
      console.log(`  - ${s.course_title} (วัน ${s.day_of_week}, ช่วง ${s.time_slot_index})`);
    });
    
    // 4. ลบข้อมูลเก่าที่ไม่ใช้
    console.log('\n🗑️ ลบข้อมูลเก่าที่ไม่ตรงสัปดาห์ปัจจุบัน...');
    
    const { data: oldSchedules, error: oldError } = await supabase
      .from('teaching_schedules')
      .delete()
      .neq('week_start_date', currentWeekStart)
      .select();
    
    if (!oldError) {
      console.log(`🗑️ ลบข้อมูลเก่า ${oldSchedules?.length || 0} รายการ`);
    }
    
    // 5. รีเฟรชหน้าเว็บ
    console.log('\n🔄 รีเฟรชหน้าเว็บใน 2 วินาที...');
    console.log('🎉 หลังจากรีเฟรช real-time system จะแสดงข้อมูลถูกต้อง!');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    
    // Manual fix
    console.log('\n📋 วิธีแก้แบบ manual:');
    console.log('รัน SQL นี้ใน Supabase Dashboard:');
    
    const sql = `-- อัปเดต week_start_date ให้ตรงกับสัปดาห์ปัจจุบัน
UPDATE teaching_schedules 
SET week_start_date = '2025-08-04'
WHERE week_start_date != '2025-08-04';

-- ลบข้อมูลเก่าที่ไม่ใช่สัปดาห์ปัจจุบัน
-- DELETE FROM teaching_schedules WHERE week_start_date != '2025-08-04';

-- ตรวจสอบผลลัพธ์
SELECT course_title, day_of_week, time_slot_index, week_start_date 
FROM teaching_schedules 
WHERE week_start_date = '2025-08-04'
ORDER BY day_of_week, time_slot_index;`;
    
    console.log(sql);
    
    await navigator.clipboard.writeText(sql);
    console.log('📋 SQL copied to clipboard!');
    
    window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
  }
}

// รัน function
syncSchedules();