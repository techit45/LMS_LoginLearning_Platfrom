// Debug การ insert และ UI update
// รันใน browser console

async function debugInsertAndUI() {
  console.log('🔍 Debug Insert และ UI Update...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // 1. ตรวจสอบข้อมูลปัจจุบันใน teaching_schedules
    console.log('📊 ข้อมูลปัจจุบันใน teaching_schedules:');
    const { data: currentSchedules } = await supabase
      .from('teaching_schedules')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.table(currentSchedules);
    console.log(`📈 Total schedules: ${currentSchedules?.length || 0}`);
    
    // 2. ทดสอบ drag & drop แบบ manual
    console.log('🧪 ทดสอบ manual insert...');
    
    // ข้อมูล courses และ instructors ที่มี
    const { data: courses } = await supabase.from('teaching_courses').select('*');
    const { data: userProfiles } = await supabase.from('user_profiles').select('*').eq('role', 'instructor');
    
    if (courses?.length > 0 && userProfiles?.length > 0) {
      console.log('📚 Using course:', courses[0].name);
      console.log('👤 Using instructor:', userProfiles[0].full_name || userProfiles[0].email);
      
      // ข้อมูลที่จะ insert (จำลอง drag & drop)
      const scheduleData = {
        week_start_date: '2025-08-04',
        day_of_week: 6, // เสาร์
        time_slot_index: 1, // 09:00 (ไม่ใช่ 0 เพราะอาจมีข้อมูลซ้ำ)
        course_id: courses[0].id,
        course_title: courses[0].name,
        course_code: courses[0].code || null,
        instructor_id: userProfiles[0].user_id, // ใช้ user_id ไม่ใช่ id
        instructor_name: userProfiles[0].full_name || userProfiles[0].email,
        room: 'Test Room',
        notes: 'Debug test',
        color: 'bg-blue-500',
        company: 'login'
      };
      
      console.log('📝 Schedule data to insert:', scheduleData);
      
      // ทดสอบ insert
      const { data: insertResult, error: insertError } = await supabase
        .from('teaching_schedules')
        .insert(scheduleData)
        .select('*')
        .single();
      
      if (insertError) {
        console.error('❌ Insert failed:', insertError);
        
        // แสดงปัญหาที่เป็นไปได้
        console.log('🔧 Possible issues:');
        console.log('1. Foreign key constraint ยังไม่แก้ไข');
        console.log('2. RLS policy บล็อกการ insert');
        console.log('3. Missing required fields');
        console.log('4. Duplicate unique constraint');
        
        // ตรวจสอบ RLS policies
        console.log('🔒 Check RLS policies with this SQL:');
        console.log(`
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'teaching_schedules';
        `);
        
      } else {
        console.log('✅ Insert successful!', insertResult);
        
        // ตรวจสอบว่า real-time system detect ไหม
        console.log('🔔 Check if real-time system detects the change...');
        
        // รอสักครู่แล้วเช็คอีกครั้ง
        setTimeout(async () => {
          const { data: updatedSchedules } = await supabase
            .from('teaching_schedules')
            .select('*')
            .order('created_at', { ascending: false });
          
          console.log('📊 Updated schedules after insert:');
          console.table(updatedSchedules);
          
          // ลองลบ test data
          if (insertResult?.id) {
            await supabase
              .from('teaching_schedules')
              .delete()
              .eq('id', insertResult.id);
            console.log('🧹 Test data cleaned up');
          }
        }, 2000);
      }
      
    } else {
      console.error('❌ No courses or instructors available');
    }
    
    // 3. ตรวจสอบ real-time subscription
    console.log('🔔 Check real-time subscription status...');
    console.log('Look for these logs in console:');
    console.log('- "Successfully subscribed to real-time updates"');
    console.log('- "Loaded X schedules"');
    
    // 4. ตรวจสอบ UI state
    console.log('🖥️ Check UI state...');
    console.log('React DevTools → Components → TeachingSchedulePageNew');
    console.log('Check schedules state in useRealtimeSchedule hook');
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// รัน debug
debugInsertAndUI();