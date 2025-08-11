// แก้ไข Week Date Sync ระหว่าง real-time system และ database
// รันใน browser console

async function fixWeekSync() {
  console.log('📅 แก้ไข Week Date Sync...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // 1. ตรวจสอบ distribution ปัจจุบัน
    console.log('📊 Week distribution ปัจจุบัน:');
    const { data: weekDist } = await supabase
      .from('teaching_schedules')
      .select('week_start_date, course_title')
      .order('week_start_date');
    
    const groupedByWeek = weekDist?.reduce((acc, item) => {
      const week = item.week_start_date;
      if (!acc[week]) acc[week] = [];
      acc[week].push(item.course_title);
      return acc;
    }, {});
    
    console.log('📅 Week groups:');
    Object.entries(groupedByWeek || {}).forEach(([week, courses]) => {
      console.log(`  ${week}: ${courses.length} courses - ${courses.slice(0, 3).join(', ')}${courses.length > 3 ? '...' : ''}`);
    });
    
    // 2. แสดงตัวเลือก
    console.log('\n🔧 แก้ไขได้ 2 วิธี:');
    console.log('1. อัปเดตข้อมูลเก่าจาก 2025-08-04 เป็น 2025-08-03 (แนะนำ)');
    console.log('2. อัปเดตข้อมูลใหม่จาก 2025-08-03 เป็น 2025-08-04');
    
    // 3. วิธีที่ 1: อัปเดตข้อมูลเก่า (2025-08-04 → 2025-08-03)
    console.log('\n🎯 วิธีที่ 1: ให้ทุกอย่างใช้ 2025-08-03');
    
    const updateToOld = await supabase
      .from('teaching_schedules')
      .update({ week_start_date: '2025-08-03' })
      .eq('week_start_date', '2025-08-04');
    
    if (updateToOld.error) {
      console.error('❌ Update failed:', updateToOld.error);
    } else {
      console.log(`✅ Updated ${updateToOld.count || 'some'} records to 2025-08-03`);
    }
    
    // 4. ตรวจสอบผลลัพธ์
    console.log('\n📊 ตรวจสอบหลังอัปเดต:');
    const { data: afterUpdate } = await supabase
      .from('teaching_schedules')
      .select('week_start_date, count(*)')
      .group('week_start_date');
      
    console.table(afterUpdate);
    
    // 5. ทดสอบ real-time load
    console.log('\n🔄 ทดสอบ real-time load...');
    const { data: realtimeTest } = await supabase
      .from('teaching_schedules')
      .select('*')
      .eq('week_start_date', '2025-08-03')
      .eq('company', 'login');
    
    console.log(`🎉 Real-time จะโหลด: ${realtimeTest?.length || 0} schedules`);
    
    if (realtimeTest?.length > 2) {
      console.log('✅ UI จะแสดงข้อมูลครบแล้ว!');
      console.log('🔄 รีเฟรชหน้าเพื่อดูผลลัพธ์');
      
      // Auto refresh
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    
    // Manual SQL
    console.log('📋 หรือรัน SQL นี้ใน Supabase:');
    const sql = `UPDATE teaching_schedules 
SET week_start_date = '2025-08-03' 
WHERE week_start_date = '2025-08-04';`;
    
    console.log(sql);
    
    try {
      await navigator.clipboard.writeText(sql);
      console.log('📋 SQL copied to clipboard!');
    } catch (e) {
      console.log('⚠️ Manual copy required');
    }
  }
}

// รัน function
fixWeekSync();