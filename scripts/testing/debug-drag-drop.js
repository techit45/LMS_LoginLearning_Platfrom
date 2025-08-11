// Debug drag & drop problem
// รันใน browser console

async function debugDragDrop() {
  console.log('🔍 Debug drag & drop issue...');
  
  try {
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // 1. ตรวจสอบ foreign key constraint
    console.log('🔗 ตรวจสอบ Foreign Key Constraints:');
    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE 
          tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'teaching_schedules';
      `
    });
    
    if (!constraintError && constraints) {
      console.table(constraints);
    } else {
      console.log('⚠️ ไม่สามารถเช็ค constraints ได้');
    }
    
    // 2. ตรวจสอบข้อมูลใน teaching_courses
    console.log('📚 Teaching courses available:');
    const { data: courses } = await supabase
      .from('teaching_courses')
      .select('id, name, company');
    console.table(courses);
    
    // 3. ตรวจสอบข้อมูลใน instructors
    console.log('👥 Instructors available:');
    const { data: instructors } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('role', 'instructor');
    console.table(instructors);
    
    // 4. ทดสอบ insert ข้อมูลโดยตรง
    console.log('🧪 ทดสอบ insert ข้อมูลโดยตรง...');
    
    if (courses?.length > 0 && instructors?.length > 0) {
      const testData = {
        week_start_date: '2025-08-04',
        day_of_week: 6, // Saturday
        time_slot_index: 0, // 08:00
        course_id: courses[0].id,
        course_title: courses[0].name,
        course_code: null,
        instructor_id: instructors[0].id,
        instructor_name: instructors[0].full_name || instructors[0].email,
        room: 'Test Room',
        notes: 'Test insert',
        color: 'bg-blue-500',
        company: 'login'
      };
      
      console.log('📝 Test data:', testData);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('teaching_schedules')
        .insert(testData)
        .select('*')
        .single();
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
        console.log('🔧 Possible issues:');
        console.log('- Foreign key constraint still wrong');
        console.log('- Missing required fields');
        console.log('- RLS policy blocking insert');
      } else {
        console.log('✅ Insert test successful!', insertResult);
        
        // Clean up test data
        await supabase
          .from('teaching_schedules')
          .delete()
          .eq('id', insertResult.id);
        console.log('🧹 Test data cleaned up');
      }
    } else {
      console.error('❌ No courses or instructors available for test');
    }
    
    // 5. ตรวจสอบ RLS policies
    console.log('🔒 ตรวจสอบ RLS policies...');
    console.log('Run this SQL in Supabase to check:');
    console.log(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'teaching_schedules';
    `);
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// รัน debug
debugDragDrop();