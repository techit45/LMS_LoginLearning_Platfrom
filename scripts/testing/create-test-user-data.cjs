const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function createTestData() {
  console.log('🧪 สร้างข้อมูลทดสอบระบบ GPS');
  console.log('===================================');

  try {
    // 1. สร้าง test user profile ใน auth.users table ด้วย service role key
    // (ปกติต้องใช้ service role key แต่ที่นี่จะทดสอบด้วย anon key ก่อน)
    
    console.log('\n1️⃣ ตรวจสอบตาราง user_profiles ที่มีอยู่:');
    
    // เช็คว่ามี users อยู่แล้วหรือไม่
    const { data: existingUsers, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (userError) {
      console.log('❌ Error:', userError.message);
      return;
    }
    
    console.log(`✅ พบ user profiles: ${existingUsers.length} รายการ`);
    
    if (existingUsers.length > 0) {
      console.log('📋 Users ที่มีอยู่:');
      existingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name || user.email} (${user.role}) - ID: ${user.user_id}`);
      });
      
      // ใช้ user คนแรกสำหรับทดสอบ
      const testUserId = existingUsers[0].user_id;
      
      console.log(`\n2️⃣ ใช้ user ID: ${testUserId} สำหรับทดสอบ`);
      
      // 3. ดึงข้อมูลศูนย์บางพลัด (เป็นศูนย์ทดสอบหลัก)
      console.log('\n3️⃣ ค้นหาศูนย์บางพลัด:');
      const { data: locations, error: locError } = await supabase
        .from('company_locations')
        .select('*')
        .ilike('location_name', '%บางพลัด%')
        .limit(1);
      
      if (locError) {
        console.log('❌ Error:', locError.message);
        return;
      }
      
      if (locations.length === 0) {
        console.log('❌ ไม่พบศูนย์บางพลัด');
        return;
      }
      
      const testLocation = locations[0];
      console.log(`✅ พบศูนย์: ${testLocation.location_name}`);
      console.log(`   GPS: ${testLocation.latitude}, ${testLocation.longitude}`);
      console.log(`   รัศมี: ${testLocation.radius_meters} เมตร`);
      
      // 4. จำลองการลงทะเบียนตำแหน่งใกล้กับศูนย์
      console.log('\n4️⃣ จำลองการลงทะเบียนตำแหน่ง:');
      
      // จำลอง GPS ใกล้ศูนย์ (เพิ่ม/ลด 0.0001 degree ≈ 11 เมตร)
      const userLat = testLocation.latitude + 0.0005; // ประมาณ 55 เมตร
      const userLng = testLocation.longitude + 0.0005;
      
      // คำนวณระยะทาง
      const R = 6371e3;
      const φ1 = testLocation.latitude * Math.PI / 180;
      const φ2 = userLat * Math.PI / 180;
      const Δφ = (userLat - testLocation.latitude) * Math.PI / 180;
      const Δλ = (userLng - testLocation.longitude) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      console.log(`📍 จำลอง GPS: ${userLat}, ${userLng}`);
      console.log(`📐 ระยะห่างจากศูนย์: ${Math.round(distance)} เมตร`);
      console.log(`${distance <= testLocation.radius_meters ? '✅ อยู่ในรัศมี' : '❌ นอกรัศมี'}`);
      
      // 5. ลองบันทึกข้อมูลการลงทะเบียน
      console.log('\n5️⃣ ทดสอบการบันทึกการลงทะเบียน:');
      
      const registrationData = {
        user_id: testUserId,
        location_id: testLocation.id,
        user_latitude: userLat,
        user_longitude: userLng,
        distance_from_center: distance,
        device_info: {
          userAgent: 'Test Node.js Script',
          platform: 'Test Platform',
          language: 'th-TH',
          timestamp: new Date().toISOString()
        },
        notes: 'ข้อมูลทดสอบจาก Node.js script'
      };
      
      const { data: regData, error: regError } = await supabase
        .from('user_registered_locations')
        .upsert(registrationData, {
          onConflict: 'user_id,location_id,registration_date'
        })
        .select()
        .single();
      
      if (regError) {
        console.log('❌ Error การลงทะเบียน:', regError.message);
        console.log('   Code:', regError.code);
        console.log('   Details:', regError.details);
        console.log('   Hint:', regError.hint);
      } else {
        console.log('✅ ลงทะเบียนสำเร็จ!');
        console.log(`   Registration ID: ${regData.id}`);
        console.log(`   วันที่: ${regData.registration_date}`);
        console.log(`   ระยะห่าง: ${Math.round(regData.distance_from_center)} เมตร`);
      }
      
      // 6. ตรวจสอบการดึงข้อมูลพร้อม join
      console.log('\n6️⃣ ทดสอบการดึงข้อมูลพร้อม join:');
      
      const { data: joinData, error: joinError } = await supabase
        .from('user_registered_locations')
        .select(`
          *,
          location:company_locations(location_name, address)
        `)
        .eq('user_id', testUserId)
        .limit(1);
      
      if (joinError) {
        console.log('❌ Error การ join:', joinError.message);
      } else {
        console.log('✅ การ join สำเร็จ!');
        if (joinData.length > 0) {
          console.log(`   พบข้อมูล: ${joinData.length} รายการ`);
          console.log(`   ศูนย์: ${joinData[0].location?.location_name || 'ไม่ระบุ'}`);
        }
      }
      
    } else {
      console.log('\n⚠️ ไม่พบ user profiles - ต้องสร้าง user ก่อน');
      console.log('💡 วิธีสร้าง user:');
      console.log('   1. ไปที่หน้า Sign up ในแอป');
      console.log('   2. สร้าง account ใหม่');
      console.log('   3. รันสคริปต์นี้อีกครั้ง');
    }
    
    console.log('\n✅ การทดสอบเสร็จสิ้น');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

createTestData().catch(console.error);