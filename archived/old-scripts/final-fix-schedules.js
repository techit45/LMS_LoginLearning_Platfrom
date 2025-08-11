// Final fix สำหรับปัญหา teaching schedules
// Copy และ run ใน browser console

async function finalFix() {
  console.log('🔧 แก้ไขปัญหาสุดท้าย...');
  
  const sql = `-- ลบข้อมูลเก่าที่มี ID เป็นตัวเลข
DELETE FROM teaching_schedules WHERE id IN ('75', '76');

-- อัปเดต week_start_date ให้ตรงกับ real-time system
UPDATE teaching_schedules 
SET week_start_date = '2025-08-04'
WHERE week_start_date != '2025-08-04';

-- ตรวจสอบข้อมูลที่เหลือ
SELECT id, course_title, day_of_week, time_slot_index, week_start_date 
FROM teaching_schedules 
WHERE week_start_date = '2025-08-04'
ORDER BY day_of_week, time_slot_index;`;

  try {
    await navigator.clipboard.writeText(sql);
    console.log('📋 SQL copied to clipboard!');
  } catch (e) {
    console.log('⚠️ Manual copy required');
  }
  
  console.log('🔧 SQL to run:');
  console.log(sql);
  
  // เปิด Supabase Dashboard
  window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
  
  console.log('👉 Steps:');
  console.log('1. Paste SQL in Supabase Dashboard');  
  console.log('2. Click Run');
  console.log('3. Refresh Teaching Schedule page');
  console.log('4. Drag & drop will work perfectly! 🎉');
}

finalFix();