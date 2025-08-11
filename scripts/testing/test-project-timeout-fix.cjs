const { createClient } = require('@supabase/supabase-js');

// สร้าง supabase client
const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function testTimeoutFix() {
  console.log('🔧 ทดสอบการแก้ไข Database Query Timeout');
  console.log('===============================================');

  try {
    // ทดสอบ query แบบเดิม (ไม่มี retry)
    console.log('\n1️⃣ ทดสอบ Query แบบเดิม:');
    const start1 = Date.now();
    
    const simpleQueryPromise = supabase
      .from('projects')
      .select('id, title, is_approved, is_featured')
      .eq('is_approved', true)
      .eq('is_featured', true)
      .limit(3);
    
    const timeoutPromise1 = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
    );
    
    try {
      const { data: simpleData, error: simpleError } = await Promise.race([simpleQueryPromise, timeoutPromise1]);
      const duration1 = Date.now() - start1;
      
      console.log(`⚡ Query time: ${duration1}ms`);
      console.log(`📊 Results: ${simpleData?.length || 0} projects`);
      
      if (simpleError) {
        console.log(`❌ Error: ${simpleError.message}`);
      } else {
        console.log('✅ Query สำเร็จ');
      }
    } catch (timeoutError) {
      const duration1 = Date.now() - start1;
      console.log(`⏰ Timeout after ${duration1}ms: ${timeoutError.message}`);
    }

    // ทดสอบ retry mechanism
    console.log('\n2️⃣ ทดสอบ Retry Mechanism:');
    
    const start2 = Date.now();
    let queryAttempt = 0;
    let lastError = null;
    let data = null;
    
    while (queryAttempt < 3 && !data) {
      queryAttempt++;
      console.log(`🔄 Attempt ${queryAttempt}/3`);
      
      try {
        const queryPromise = supabase
          .from('projects')
          .select(`
            id,
            title,
            short_description,
            category,
            difficulty_level,
            technology,
            demo_url,
            thumbnail_url,
            created_at,
            view_count,
            like_count
          `)
          .eq('is_approved', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(6);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 20000)
        );
        
        const { data: queryData, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          lastError = error;
          console.warn(`⚠️ Attempt ${queryAttempt} failed: ${error.message}`);
          
          if (error.message.includes('timeout') || error.message.includes('network') || queryAttempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * queryAttempt));
            continue;
          }
          throw error;
        }

        if (queryData) {
          data = queryData;
          console.log(`✅ Query succeeded on attempt ${queryAttempt}`);
          lastError = null;
          break;
        }

      } catch (attemptError) {
        lastError = attemptError;
        console.warn(`⚠️ Attempt ${queryAttempt} failed: ${attemptError.message}`);
        
        if (queryAttempt >= 3 || (!attemptError.message.includes('timeout') && !attemptError.message.includes('network'))) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * queryAttempt));
      }
    }

    const duration2 = Date.now() - start2;
    console.log(`⚡ Total time with retries: ${duration2}ms`);

    if (data && data.length > 0) {
      console.log(`✅ Final result: ${data.length} featured projects`);
      console.log(`🎯 Sample: "${data[0].title}"`);
    } else if (lastError) {
      console.log(`❌ All attempts failed: ${lastError.message}`);
    }

    // ทดสอบ mock data fallback
    console.log('\n3️⃣ Mock Data Fallback:');
    
    const mockProjects = [
      {
        id: 'mock-proj-1',
        title: 'ระบบรดน้ำต้นไม้อัตโนมัติด้วย IoT',
        short_description: 'โครงงานระบบรดน้ำต้นไม้อัตโนมัติที่ใช้เซ็นเซอร์ความชื้นในดิน',
        category: 'IoT/Hardware',
        difficulty_level: 'intermediate',
        technology: ['Arduino', 'ESP32', 'React Native'],
        demo_url: '#',
        thumbnail_url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400',
        created_at: new Date().toISOString(),
        view_count: 234,
        like_count: 18
      }
    ];

    console.log(`🎭 Mock projects available: ${mockProjects.length}`);
    console.log(`📝 Sample mock: "${mockProjects[0].title}"`);

    // สรุปผลการทดสอบ
    console.log('\n4️⃣ สรุปผลการทดสอบ:');
    
    console.log('✅ Improvements ที่ทำ:');
    console.log('   - เพิ่ม timeout เป็น 20-30 วินาที (จาก 10 วินาที)');
    console.log('   - เพิ่ม retry mechanism 3 ครั้ง');
    console.log('   - เพิ่ม delay ระหว่าง retry (1s, 2s, 3s)');
    console.log('   - ปรับปรุง error logging');
    console.log('   - ลด log spam สำหรับ mock data');
    
    console.log('\n🎯 ผลลัพธ์:');
    if (data && data.length > 0) {
      console.log('   ✅ Database query ทำงานได้ดี');
      console.log('   ✅ ไม่ต้องพึ่ง mock data');
    } else {
      console.log('   🎭 ใช้ mock data เป็น fallback');
      console.log('   💡 Homepage จะแสดงเนื้อหาได้เสมอ');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testTimeoutFix().catch(console.error);