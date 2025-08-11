// Debug UI sync issue - data saves but UI doesn't update
// รันใน browser console

async function debugUISync() {
  console.log('🔍 Debug UI Sync Issue...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // 1. ตรวจสอบข้อมูลล่าสุดใน database
    console.log('📊 ข้อมูลล่าสุดใน database:');
    const { data: dbSchedules } = await supabase
      .from('teaching_schedules')
      .select('*')
      .eq('week_start_date', '2025-08-03')
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log('📅 Latest 5 schedules:');
    console.table(dbSchedules);
    
    // 2. ตรวจสอบ React state ใน real-time hook
    console.log('🔄 ตรวจสอบ React state...');
    console.log('👉 เปิด React DevTools → Components → TeachingSchedulePageNew');
    console.log('👉 หา useRealtimeSchedule hook');
    console.log('👉 ดู schedules state');
    
    // 3. ตรวจสอบว่า real-time subscription ทำงานไหม
    console.log('🔔 ตรวจสอบ real-time subscription...');
    
    // จำลอง real-time event
    window.testRealtimeUpdate = function() {
      console.log('🧪 Testing manual real-time update...');
      
      // ส่ง custom event เพื่อ trigger UI update
      const event = new CustomEvent('teaching-schedule-updated', {
        detail: { schedules: dbSchedules }
      });
      window.dispatchEvent(event);
    };
    
    // 4. ตรวจสอบการแสดงผล
    console.log('🖥️ ตรวจสอบการแสดงผลใน UI...');
    
    // หา schedule cells ใน DOM
    const scheduleCells = document.querySelectorAll('[data-schedule-cell]');
    console.log(`📋 พบ schedule cells: ${scheduleCells.length}`);
    
    const occupiedCells = document.querySelectorAll('[data-schedule-cell] > div');
    console.log(`📊 Cells ที่มีข้อมูล: ${occupiedCells.length}`);
    
    // 5. แสดงการแมปข้อมูล
    console.log('🗺️ การแมปข้อมูล:');
    dbSchedules?.forEach(schedule => {
      const key = `${schedule.day_of_week}-${schedule.time_slot_index}`;
      console.log(`  ${schedule.course_title} → Position: ${key} (Day: ${schedule.day_of_week}, Time: ${schedule.time_slot_index})`);
      
      // หา DOM element ที่สอดคล้อง
      const cell = document.querySelector(`[data-day="${schedule.day_of_week}"][data-time="${schedule.time_slot_index}"]`);
      if (cell) {
        console.log(`    ✅ พบ DOM cell สำหรับ ${key}`);
        console.log(`    📝 Cell content:`, cell.innerHTML.length > 0 ? 'มีข้อมูล' : 'ว่าง');
      } else {
        console.log(`    ❌ ไม่พบ DOM cell สำหรับ ${key}`);
      }
    });
    
    // 6. แสดงวิธีแก้ไข
    console.log('\n🔧 Possible fixes:');
    console.log('1. React state ไม่อัปเดต → ตรวจสอบ useRealtimeSchedule hook');
    console.log('2. Component ไม่ re-render → ตรวจสอบ dependency array');
    console.log('3. Data mapping ผิด → ตรวจสอบ day/time index mapping');
    console.log('4. Real-time subscription หลุด → ตรวจสอบ WebSocket connection');
    
    // 7. Force refresh test
    console.log('\n🔄 Force refresh test...');
    console.log('รัน: testRealtimeUpdate() เพื่อทดสอบ manual update');
    console.log('หรือ: window.location.reload() เพื่อ refresh หน้า');
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// รัน debug
debugUISync();