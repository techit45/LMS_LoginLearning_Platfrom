// แก้ไข Foreign Key Constraint ผ่าน browser console
// Copy และรันใน browser console

async function fixForeignKeyConstraint() {
  console.log('🔧 แก้ไข Foreign Key Constraint...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // ตรวจสอบข้อมูลก่อน
    console.log('📊 ตรวจสอบข้อมูลปัจจุบัน...');
    
    const { data: courses, error: coursesError } = await supabase
      .from('teaching_courses')
      .select('id, name, company');
    
    if (coursesError) {
      console.error('❌ Error fetching teaching_courses:', coursesError);
      return;
    }
    
    console.log('📚 Teaching courses available:');
    console.table(courses);
    
    // แสดง SQL ที่ต้องรัน
    const sql = `-- แก้ไข Foreign Key Constraint
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_course_id_fkey;

ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id) 
ON DELETE CASCADE;`;
    
    console.log('📋 SQL ที่ต้องรัน:');
    console.log(sql);
    
    // Copy ไปยัง clipboard
    try {
      await navigator.clipboard.writeText(sql);
      console.log('📋 SQL copied to clipboard!');
    } catch (e) {
      console.log('⚠️ Manual copy required');
    }
    
    // เปิด Supabase SQL Editor
    window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
    
    console.log('👉 Steps:');
    console.log('1. Paste SQL in Supabase SQL Editor');
    console.log('2. Click Run');
    console.log('3. หลังจากรัน SQL แล้ว ลอง drag & drop อีกครั้ง');
    console.log('4. Foreign key constraint จะ reference teaching_courses แล้ว! 🎉');
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
  }
}

// รัน function
fixForeignKeyConstraint();