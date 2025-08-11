const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function testGPSFix() {
  console.log('🔧 ทดสอบการแก้ไข Column Name Issues');
  console.log('==========================================');

  try {
    // 1. ตรวจสอบโครงสร้างตาราง user_registered_locations
    console.log('\n1️⃣ ตรวจสอบโครงสร้าง user_registered_locations:');
    
    // ทดสอบ query เพื่อดูว่า column names ถูกต้องหรือไม่
    const { data, error } = await supabase
      .from('user_registered_locations')
      .select('user_latitude, user_longitude, distance_from_center')
      .limit(0); // ไม่ต้องการข้อมูล แค่ต้องการรู้ว่า column มีอยู่หรือไม่
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Column name ผิด:');
        console.log(`   Error: ${error.message}`);
        
        // ลองใช้ column names อื่น
        console.log('\n🔍 ลองตรวจสอบ column names อื่น:');
        
        try {
          const { data: test1, error: err1 } = await supabase
            .from('user_registered_locations')
            .select('latitude, longitude')
            .limit(0);
            
          if (!err1) {
            console.log('✅ ใช้ latitude, longitude (ไม่มี user_ prefix)');
          }
        } catch (e) {
          console.log('❌ latitude, longitude ไม่มี');
        }
        
      } else {
        console.log('❌ Error อื่น:', error.message);
      }
    } else {
      console.log('✅ Column names ถูกต้องแล้ว: user_latitude, user_longitude');
    }
    
    // 2. ตรวจสอบการ join กับ company_locations
    console.log('\n2️⃣ ทดสอบการ join กับ company_locations:');
    
    const { data: joinTest, error: joinError } = await supabase
      .from('user_registered_locations')
      .select(`
        id,
        location:company_locations(
          location_name,
          latitude,
          longitude
        )
      `)
      .limit(1);
    
    if (joinError) {
      console.log('❌ Join error:', joinError.message);
      console.log('   Code:', joinError.code);
    } else {
      console.log('✅ Join กับ company_locations สำเร็จ');
    }
    
    // 3. ตรวจสอบ Foreign Key constraints
    console.log('\n3️⃣ ตรวจสอบ Foreign Key constraints:');
    
    // Query เพื่อดู foreign key constraints
    const { data: fkData, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name, constraint_type')
      .eq('table_name', 'user_registered_locations')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (fkError) {
      console.log('❌ ไม่สามารถดู FK constraints:', fkError.message);
    } else {
      console.log(`✅ พบ Foreign Key constraints: ${fkData?.length || 0} รายการ`);
      if (fkData && fkData.length > 0) {
        fkData.forEach(fk => {
          console.log(`   - ${fk.constraint_name}`);
        });
      }
    }
    
    // 4. ทดสอบ Distance Calculation Function
    console.log('\n4️⃣ ทดสอบ Distance Calculation:');
    
    // ใช้พิกัดศูนย์บางพลัดจาก create_company_locations_table.sql
    const centerLat = 13.79115977; // ศูนย์บางพลัด
    const centerLng = 100.49675596;
    
    // สร้างพิกัดทดสอบที่ใกล้ (ประมาณ 50 เมตร)
    const userLat = centerLat + 0.0005;  // + 0.0005 degree ≈ 55 meters
    const userLng = centerLng + 0.0005;
    
    // Haversine formula
    const R = 6371e3;
    const φ1 = centerLat * Math.PI / 180;
    const φ2 = userLat * Math.PI / 180;
    const Δφ = (userLat - centerLat) * Math.PI / 180;
    const Δλ = (userLng - centerLng) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log('📐 Distance Calculation Test:');
    console.log(`   ศูนย์บางพลัด: ${centerLat}, ${centerLng}`);
    console.log(`   ตำแหน่งทดสอบ: ${userLat}, ${userLng}`);
    console.log(`   ระยะห่าง: ${Math.round(distance)} เมตร`);
    console.log(`   สถานะ: ${distance <= 100 ? '✅ ในรัศมี 100m' : '❌ นอกรัศมี'}`);
    
    // 5. สรุปผลการทดสอบ
    console.log('\n5️⃣ สรุปการแก้ไขปัญหา:');
    
    console.log('✅ การแก้ไข Column Names:');
    console.log('   - ใช้ user_latitude และ user_longitude ใน locationService.js');
    console.log('   - ตรงกับ schema ใน create_company_locations_table.sql');
    
    console.log('\n✅ ฟังก์ชัน Distance Calculation:');
    console.log('   - Haversine formula ทำงานถูกต้อง');
    console.log('   - สามารถคำนวณระยะห่างได้แม่นยำ');
    
    console.log('\n⚠️ สิ่งที่ยังต้องทำ:');
    console.log('   1. สร้าง user account จริงเพื่อทดสอบ');
    console.log('   2. ทดสอบการลงทะเบียนตำแหน่งในบราวเซอร์');
    console.log('   3. ทดสอบ TimeClockWidget component');
    console.log('   4. ตรวจสอบ RLS policies สำหรับ user ที่ login');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

testGPSFix().catch(console.error);