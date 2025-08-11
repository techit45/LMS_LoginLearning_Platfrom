// แก้ไขปัญหา legacy IDs ที่ทำให้เกิด UUID parsing error
// Copy และรันใน browser console

async function fixLegacyIDs() {
  console.log('🔧 แก้ไขปัญหา legacy IDs...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // 1. ตรวจสอบข้อมูลที่มีปัญหา
    console.log('🔍 ตรวจสอบข้อมูลที่มี ID เป็นตัวเลข...');
    
    const { data: allSchedules, error: fetchError } = await supabase
      .from('teaching_schedules')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching schedules:', fetchError);
      throw fetchError;
    }
    
    console.log(`📊 พบข้อมูลทั้งหมด: ${allSchedules?.length || 0} รายการ`);
    
    // หา records ที่มี ID เป็นตัวเลข
    const legacyRecords = allSchedules?.filter(s => {
      const id = s.id?.toString();
      return id && /^\d+$/.test(id); // เช็คว่าเป็นตัวเลขอย่างเดียว
    }) || [];
    
    console.log(`🎯 พบข้อมูลที่ต้องลบ: ${legacyRecords.length} รายการ`);
    legacyRecords.forEach(record => {
      console.log(`  - ID: ${record.id} (${record.course_title})`);
    });
    
    // 2. ลบข้อมูลที่มี ID เป็นตัวเลข
    for (const record of legacyRecords) {
      console.log(`🗑️ กำลังลบ ID: ${record.id}...`);
      
      try {
        // ใช้ raw SQL เพื่อลบ
        const { error: deleteError } = await supabase
          .from('teaching_schedules')
          .delete()
          .eq('id', record.id);
        
        if (deleteError) {
          console.error(`❌ ไม่สามารถลบ ID ${record.id}:`, deleteError.message);
          
          // ลองใช้ RPC แทน
          console.log('🔄 ลองใช้ RPC function...');
          const { error: rpcError } = await supabase.rpc('exec_sql', {
            sql: `DELETE FROM teaching_schedules WHERE id::text = '${record.id}';`
          });
          
          if (rpcError) {
            console.error('❌ RPC ก็ใช้ไม่ได้:', rpcError.message);
          } else {
            console.log('✅ ลบด้วย RPC สำเร็จ');
          }
        } else {
          console.log('✅ ลบสำเร็จ');
        }
      } catch (error) {
        console.error(`💥 Error deleting ID ${record.id}:`, error);
      }
    }
    
    // 3. อัปเดต week_start_date
    console.log('\n📅 อัปเดต week_start_date...');
    const targetDate = '2025-08-04';
    
    const { error: updateError } = await supabase
      .from('teaching_schedules')
      .update({ week_start_date: targetDate })
      .neq('week_start_date', targetDate);
    
    if (updateError) {
      console.error('❌ Error updating week_start_date:', updateError);
    } else {
      console.log('✅ อัปเดต week_start_date สำเร็จ');
    }
    
    // 4. ตรวจสอบผลลัพธ์
    console.log('\n📊 ตรวจสอบข้อมูลหลังแก้ไข...');
    
    const { data: finalSchedules, error: finalError } = await supabase
      .from('teaching_schedules')
      .select('*')
      .eq('week_start_date', targetDate)
      .order('day_of_week')
      .order('time_slot_index');
    
    if (finalError) {
      console.error('❌ Error checking final data:', finalError);
    } else {
      console.log(`✅ ข้อมูลสำหรับสัปดาห์ ${targetDate}: ${finalSchedules?.length || 0} รายการ`);
      finalSchedules?.forEach(s => {
        console.log(`  - ${s.course_title} (วัน ${s.day_of_week}, ช่วง ${s.time_slot_index}) ID: ${s.id}`);
      });
    }
    
    // 5. รีเฟรชหน้า
    console.log('\n🔄 รีเฟรชหน้าใน 2 วินาที...');
    console.log('🎉 หลังจากรีเฟรช drag & drop จะทำงานได้แล้ว!');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    
    // แสดง Manual SQL fix
    console.log('\n📋 หากไม่สำเร็จ ให้รัน SQL นี้ใน Supabase Dashboard:');
    
    const manualSQL = `-- ลบข้อมูลเก่าที่มี ID เป็นตัวเลข
DELETE FROM teaching_schedules WHERE id::text ~ '^[0-9]+$';

-- อัปเดต week_start_date
UPDATE teaching_schedules 
SET week_start_date = '2025-08-04'
WHERE week_start_date != '2025-08-04';

-- ตรวจสอบผลลัพธ์
SELECT id, course_title, day_of_week, time_slot_index, week_start_date 
FROM teaching_schedules 
WHERE week_start_date = '2025-08-04'
ORDER BY day_of_week, time_slot_index;`;
    
    console.log(manualSQL);
    
    try {
      await navigator.clipboard.writeText(manualSQL);
      console.log('📋 SQL copied to clipboard!');
    } catch (e) {
      console.log('⚠️ Manual copy required');
    }
    
    window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
  }
}

// รัน function
fixLegacyIDs();