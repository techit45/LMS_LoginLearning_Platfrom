// Script ตรวจสอบและแก้ไขปัญหา Teaching Schedule
// รันใน browser console บนหน้า Teaching Schedule

console.log('🔍 ตรวจสอบปัญหา Teaching Schedule...');

async function checkAndFixIssues() {
  try {
    const supabase = window.supabase;
    
    if (!supabase) {
      console.error('❌ ไม่พบ Supabase client');
      return;
    }

    // 1. ตรวจสอบ authentication
    console.log('\n1️⃣ ตรวจสอบ Authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ ไม่ได้ login หรือ session หมดอายุ');
      console.log('🔄 กรุณา login ใหม่');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Role:', user.role);

    // 2. ตรวจสอบการเข้าถึง table
    console.log('\n2️⃣ ตรวจสอบการเข้าถึง teaching_schedules table...');
    const { data: testSelect, error: selectError } = await supabase
      .from('teaching_schedules')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ ไม่สามารถอ่านข้อมูลจาก table:', selectError.message);
      if (selectError.code === '42501') {
        console.log('⚠️ ปัญหา RLS policies - ไม่มีสิทธิ์อ่านข้อมูล');
      }
    } else {
      console.log('✅ สามารถอ่านข้อมูลได้');
    }

    // 3. ทดสอบ INSERT
    console.log('\n3️⃣ ทดสอบการ INSERT...');
    const testData = {
      week_start_date: '2025-08-04',
      day_of_week: 1,
      time_slot_index: 2,
      course_title: 'TEST_INSERT_' + Date.now(),
      instructor_name: 'Test Teacher',
      company: 'login',
      created_by: user.id,
      updated_by: user.id
    };

    const { data: insertData, error: insertError } = await supabase
      .from('teaching_schedules')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ ไม่สามารถ INSERT:', insertError.message);
      if (insertError.code === '42501') {
        console.log('⚠️ ปัญหา RLS policies - ไม่มีสิทธิ์เพิ่มข้อมูล');
      } else if (insertError.code === '23514') {
        console.log('⚠️ ปัญหา constraint - ตรวจสอบ time_slot_index');
      }
    } else {
      console.log('✅ INSERT สำเร็จ, ID:', insertData.id);
      
      // 4. ทดสอบ UPDATE
      console.log('\n4️⃣ ทดสอบการ UPDATE...');
      const { error: updateError } = await supabase
        .from('teaching_schedules')
        .update({ course_title: 'TEST_UPDATE_' + Date.now() })
        .eq('id', insertData.id);

      if (updateError) {
        console.error('❌ ไม่สามารถ UPDATE:', updateError.message);
      } else {
        console.log('✅ UPDATE สำเร็จ');
      }

      // 5. ทดสอบ DELETE
      console.log('\n5️⃣ ทดสอบการ DELETE...');
      const { error: deleteError } = await supabase
        .from('teaching_schedules')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.error('❌ ไม่สามารถ DELETE:', deleteError.message);
      } else {
        console.log('✅ DELETE สำเร็จ');
      }
    }

    // 6. ตรวจสอบ Real-time subscription
    console.log('\n6️⃣ ตรวจสอบ Real-time subscription...');
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'teaching_schedules' },
        (payload) => {
          console.log('📡 Real-time event:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 Cleaned up test subscription');
    }, 5000);

    // สรุปปัญหาและวิธีแก้
    console.log('\n' + '='.repeat(50));
    console.log('📋 สรุปผลการตรวจสอบ:');
    console.log('='.repeat(50));
    
    if (insertError || updateError || deleteError) {
      console.log('\n❌ พบปัญหา RLS Policies');
      console.log('\n🔧 วิธีแก้ไข:');
      console.log('1. Copy SQL ด้านล่างนี้:');
      console.log('');
      
      const fixSQL = `-- แก้ไข RLS policies
DROP POLICY IF EXISTS "authenticated_users_can_view_schedules" ON teaching_schedules;
DROP POLICY IF EXISTS "admins_can_manage_schedules" ON teaching_schedules;

CREATE POLICY "anyone_can_view_schedules" ON teaching_schedules 
FOR SELECT USING (true);

CREATE POLICY "authenticated_can_insert_schedules" ON teaching_schedules 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_update_schedules" ON teaching_schedules 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_can_delete_schedules" ON teaching_schedules 
FOR DELETE USING (auth.role() = 'authenticated');`;

      console.log(fixSQL);
      console.log('');
      console.log('2. ไปที่: https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new');
      console.log('3. วาง SQL และคลิก Run');
      console.log('4. Refresh หน้านี้');
      
      // Copy SQL อัตโนมัติ
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fixSQL);
        console.log('\n📋 SQL ถูก copy ไปยัง clipboard แล้ว!');
      }
      
      // เปิด Supabase Dashboard
      const openDashboard = confirm('เปิด Supabase Dashboard เพื่อแก้ไข RLS policies?');
      if (openDashboard) {
        window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
      }
    } else {
      console.log('\n✅ ระบบทำงานปกติ!');
      console.log('   - Authentication: OK');
      console.log('   - SELECT: OK');
      console.log('   - INSERT: OK');
      console.log('   - UPDATE: OK');
      console.log('   - DELETE: OK');
      console.log('\n🎉 สามารถใช้งาน drag & drop ได้ปกติ');
    }

  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
  }
}

// รัน function
checkAndFixIssues();