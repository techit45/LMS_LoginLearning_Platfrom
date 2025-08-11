// Auto-fix script - รันใน browser console
// Script นี้จะเปิด Supabase Dashboard และ copy SQL ให้อัตโนมัติ

console.log('🚀 กำลังเตรียมแก้ไข constraint...');

// SQL ที่ต้องรัน
const SQL_FIX = `-- แก้ไข time_slot_index constraint ให้รองรับ 0-12
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;

ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_time_slot_index_check 
CHECK (time_slot_index >= 0 AND time_slot_index <= 12);`;

// Copy SQL to clipboard
async function autoFix() {
  try {
    // Copy SQL อัตโนมัติ
    await navigator.clipboard.writeText(SQL_FIX);
    console.log('✅ SQL ถูก copy ไปยัง clipboard แล้ว!');
    console.log('');
    console.log('📋 ขั้นตอนต่อไป:');
    console.log('1. รอให้ Supabase Dashboard เปิดขึ้นมา');
    console.log('2. วาง (Ctrl+V หรือ Cmd+V) ใน SQL editor');
    console.log('3. คลิกปุ่ม "Run" (สีเขียว)');
    console.log('4. กลับมา refresh หน้านี้');
    console.log('');
    
    // เปิด Supabase Dashboard SQL Editor
    console.log('🔗 กำลังเปิด Supabase Dashboard...');
    window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
    
    // แสดงคำแนะนำ
    setTimeout(() => {
      console.log('');
      console.log('⏰ เตือนความจำ:');
      console.log('   - SQL ถูก copy แล้ว แค่วาง (Ctrl+V) ใน SQL Editor');
      console.log('   - คลิก Run แล้วกลับมา refresh หน้านี้');
      console.log('   - Drag & Drop จะใช้งานได้ทันที!');
    }, 3000);
    
  } catch (err) {
    console.log('⚠️ Copy ไม่สำเร็จ - กรุณา copy SQL ด้านล่างนี้:');
    console.log('');
    console.log(SQL_FIX);
    console.log('');
    window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
  }
}

// รัน auto fix
autoFix();