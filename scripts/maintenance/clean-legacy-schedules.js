// Clean legacy schedules และโยกไปยัง teaching_schedules table
// รันใน browser console

async function cleanLegacySchedules() {
  console.log('🧹 เริ่มทำความสะอาดข้อมูลเก่า...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // 1. ดูข้อมูลที่มีอยู่ในระบบ
    console.log('📊 ตรวจสอบข้อมูลในตาราง...');
    
    // ดู teaching_schedules table
    const { data: currentSchedules, error: currentError } = await supabase
      .from('teaching_schedules')
      .select('*');
    
    if (currentError) {
      console.error('❌ Error reading teaching_schedules:', currentError);
      return;
    }
    
    console.log('📅 ข้อมูลใน teaching_schedules:', currentSchedules?.length || 0, 'รายการ');
    currentSchedules?.forEach(s => {
      console.log(`  - ${s.course_title} (${s.day_of_week}/${s.time_slot_index}) ID: ${s.id}`);
    });
    
    // 2. ลองดูว่ามี table อื่นที่เก็บข้อมูลเก่าไหม
    console.log('\n🔍 ตรวจหา legacy data...');
    
    // ดู schedules table (ถ้ามี)
    const { data: legacySchedules, error: legacyError } = await supabase
      .from('schedules')
      .select('*');
    
    if (!legacyError && legacySchedules?.length) {
      console.log('📊 พบข้อมูลใน schedules table:', legacySchedules.length, 'รายการ');
      
      // โยกข้อมูลจาก schedules ไป teaching_schedules
      for (const legacy of legacySchedules) {
        console.log(`🔄 กำลังโยกข้อมูล: ${legacy.course?.title || legacy.title || 'Unknown'}`);
        
        const newSchedule = {
          week_start_date: legacy.week_start_date || '2025-08-04',
          day_of_week: legacy.day_of_week || legacy.dayId || 0,
          time_slot_index: legacy.time_slot_index || legacy.timeIndex || 0,
          course_title: legacy.course?.title || legacy.title || legacy.course_title || 'Migrated Course',
          course_code: legacy.course?.code || legacy.code || null,
          instructor_name: legacy.instructor?.name || legacy.instructor_name || 'Unknown',
          room: legacy.room || 'TBD',
          company: legacy.company || 'login'
        };
        
        const { error: insertError } = await supabase
          .from('teaching_schedules')
          .insert(newSchedule);
        
        if (insertError) {
          console.error('❌ Error migrating:', insertError.message);
        } else {
          console.log('✅ Migrated successfully');
        }
      }
      
      // ลบข้อมูลเก่าจาก schedules table
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .neq('id', null);
      
      if (!deleteError) {
        console.log('🗑️ ลบข้อมูลเก่าจาก schedules table แล้ว');
      }
    } else {
      console.log('ℹ️ ไม่พบข้อมูลใน schedules table');
    }
    
    // 3. ลบข้อมูลที่มี ID เป็นตัวเลขธรรมดา (ไม่ใช่ UUID)
    console.log('\n🗑️ ลบข้อมูลที่มี ID ผิดรูปแบบ...');
    
    // หา record ที่มี ID ไม่ใช่ UUID format
    const invalidRecords = currentSchedules?.filter(s => 
      s.id && !s.id.includes('-') && !isNaN(parseInt(s.id))
    );
    
    console.log('🔍 พบข้อมูลที่มี ID ผิดรูปแบบ:', invalidRecords?.length || 0, 'รายการ');
    
    for (const invalid of invalidRecords || []) {
      console.log(`🗑️ ลบข้อมูล ID: ${invalid.id} (${invalid.course_title})`);
      
      // ใช้ RPC function เพื่อลบแบบ raw SQL
      const { error: deleteError } = await supabase.rpc('delete_invalid_schedule', {
        schedule_id: invalid.id.toString()
      });
      
      if (deleteError) {
        console.error('❌ ไม่สามารถลบได้:', deleteError.message);
      } else {
        console.log('✅ ลบสำเร็จ');
      }
    }
    
    // 4. รีเฟรชข้อมูลใหม่
    console.log('\n🔄 รีเฟรชหน้าเว็บ...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    console.log('\n🎉 ทำความสะอาดเสร็จแล้ว! กำลังรีเฟรชหน้า...');
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    
    // Manual cleanup แนะนำ
    console.log('\n📋 วิธีแก้ไขแบบ manual:');
    console.log('1. ไปที่ Supabase Dashboard SQL Editor');
    console.log('2. รัน SQL นี้:');
    console.log(`
-- ลบข้อมูลที่มี ID ไม่ใช่ UUID format
DELETE FROM teaching_schedules 
WHERE id::text ~ '^[0-9]+$';

-- ตรวจสอบข้อมูลที่เหลือ
SELECT * FROM teaching_schedules ORDER BY created_at DESC;
    `);
    
    const sql = `DELETE FROM teaching_schedules WHERE id::text ~ '^[0-9]+$';`;
    await navigator.clipboard.writeText(sql);
    console.log('📋 SQL ถูก copy แล้ว!');
    
    window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
  }
}

// รัน function
cleanLegacySchedules();