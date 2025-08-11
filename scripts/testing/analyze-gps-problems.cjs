const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function analyzeProblems() {
  console.log('🔍 วิเคราะห์ปัญหาระบบ GPS อย่างละเอียด');
  console.log('==========================================');
  
  // 1. Test Foreign Key Relationships
  console.log('\n1️⃣ ตรวจสอบ Foreign Key Relationships:');
  
  // Test user_registered_locations -> company_locations
  console.log('\n📋 ทดสอบ user_registered_locations -> company_locations:');
  const { data: regData, error: regError } = await supabase
    .from('user_registered_locations')
    .select('*, location:company_locations(*)')
    .limit(1);
    
  if (regError) {
    console.log('❌ ปัญหาการ join company_locations:');
    console.log('   Error:', regError.message);
    console.log('   Code:', regError.code);
    console.log('   Details:', regError.details);
    console.log('   Hint:', regError.hint);
  } else {
    console.log('✅ การ join กับ company_locations ทำงานได้');
  }
  
  // Test user_registered_locations -> user_profiles  
  console.log('\n👤 ทดสอบ user_registered_locations -> user_profiles:');
  const { data: userData, error: userError } = await supabase
    .from('user_registered_locations')
    .select('*, user:user_profiles(*)')
    .limit(1);
    
  if (userError) {
    console.log('❌ ปัญหาการ join user_profiles:');
    console.log('   Error:', userError.message);
    console.log('   Code:', userError.code);
    console.log('   Details:', userError.details);
    console.log('   Hint:', userError.hint);
  } else {
    console.log('✅ การ join กับ user_profiles ทำงานได้');
  }
  
  // 2. Check RLS Policies
  console.log('\n2️⃣ ตรวจสอบ Row Level Security (RLS):');
  
  const tables = ['user_registered_locations', 'time_entries', 'company_locations'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ตาราง ${table}:`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      } else {
        console.log(`✅ ตาราง ${table}: เข้าถึงได้`);
      }
    } catch (err) {
      console.log(`❌ ตาราง ${table}: ${err.message}`);
    }
  }
  
  // 3. Test Authentication Requirements
  console.log('\n3️⃣ ตรวจสอบ Authentication Requirements:');
  
  const { data: currentUser, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.log('❌ Authentication Error:');
    console.log('   Error:', authError.message);
    console.log('   💡 หมายเหตุ: การทดสอบจาก Node.js ไม่มี user session');
  } else if (!currentUser.user) {
    console.log('⚠️ ไม่มี user session (ปกติสำหรับการทดสอบจาก server)');
    console.log('   💡 ต้องการ authenticated user เพื่อเข้าถึงข้อมูลบางส่วน');
  } else {
    console.log('✅ User authenticated:', currentUser.user.email);
  }
  
  // 4. Test GPS Service Functions
  console.log('\n4️⃣ ทดสอบ GPS Functions (จำลอง):');
  
  // Test distance calculation
  const centerLat = 13.79115977;
  const centerLng = 100.49675596;
  const userLat = 13.79205977;
  const userLng = 100.49675596;
  
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
  
  console.log(`📐 ทดสอบการคำนวณระยะทาง:`);
  console.log(`   ศูนย์บางพลัด: ${centerLat}, ${centerLng}`);
  console.log(`   ตำแหน่งผู้ใช้: ${userLat}, ${userLng}`);
  console.log(`   ระยะห่าง: ${Math.round(distance)} เมตร`);
  console.log(`   ${distance <= 100 ? '✅ อยู่ในรัศมีอนุญาต' : '❌ อยู่นอกรัศมี'} (รัศมี: 100m)`);
  
  // 5. Check for Missing Data
  console.log('\n5️⃣ ตรวจสอบข้อมูลที่ขาดหาย:');
  
  const counts = {};
  const tables2 = ['user_profiles', 'user_registered_locations', 'time_entries', 'company_locations'];
  
  for (const table of tables2) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (!error) {
        counts[table] = count;
        console.log(`📊 ${table}: ${count} รายการ ${count === 0 ? '⚠️' : '✅'}`);
      } else {
        console.log(`❌ ${table}: Error - ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  // 6. Analyze Critical Issues
  console.log('\n6️⃣ สรุปปัญหาวิกฤต:');
  
  const issues = [];
  
  if (counts['user_profiles'] === 0) {
    issues.push('❌ ไม่มีข้อมูลผู้ใช้ในระบบ - ต้องสร้าง user profiles');
  }
  
  if (counts['user_registered_locations'] === 0) {
    issues.push('⚠️ ไม่มีการลงทะเบียนตำแหน่งใดๆ - ต้องทดสอบการลงทะเบียน');
  }
  
  if (counts['time_entries'] === 0) {
    issues.push('⚠️ ไม่มีบันทึกการลงเวลา - ต้องทดสอบการใช้งานจริง');
  }
  
  if (userError && userError.message.includes('relationship')) {
    issues.push('❌ Foreign key relationship มีปัญหา - ต้องแก้ไข schema');
  }
  
  if (issues.length === 0) {
    console.log('✅ ไม่พบปัญหาวิกฤต - ระบบพร้อมใช้งาน');
  } else {
    console.log('⚠️ พบปัญหาที่ต้องแก้ไข:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n💡 คำแนะนำขั้นตอนถัดไป:');
  console.log('   1. สร้างข้อมูลผู้ใช้ทดสอบ');
  console.log('   2. ทดสอบการลงทะเบียนตำแหน่งจริงในบราวเซอร์');
  console.log('   3. ทดสอบการลงเวลาเข้า-ออกงาน');
  console.log('   4. ตรวจสอบและปรับปรุง RLS policies');
}

analyzeProblems().catch(console.error);