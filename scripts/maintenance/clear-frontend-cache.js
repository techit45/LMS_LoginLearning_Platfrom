// Clear frontend cache และ local state ที่เก็บข้อมูลเก่า
// รันใน browser console

async function clearFrontendCache() {
  console.log('🧹 ล้างข้อมูล cache ใน frontend...');
  
  try {
    // 1. Clear localStorage
    console.log('🗑️ ล้าง localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('schedule') || 
        key.includes('teaching') || 
        key.includes('course') ||
        key.includes('supabase')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      console.log(`  - ลบ localStorage: ${key}`);
      localStorage.removeItem(key);
    });
    
    // 2. Clear sessionStorage
    console.log('🗑️ ล้าง sessionStorage...');
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('schedule') || 
        key.includes('teaching') || 
        key.includes('course')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      console.log(`  - ลบ sessionStorage: ${key}`);
      sessionStorage.removeItem(key);
    });
    
    // 3. Clear browser cache
    console.log('🗑️ ล้าง browser cache...');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          console.log(`  - ลบ cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }
    
    // 4. Force clear component state
    console.log('🔄 ล้าง component state...');
    
    // ตรวจสอบว่ามี React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('  - พบ React DevTools');
    }
    
    // Clear any cached Supabase data
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    // Force refresh Supabase auth
    await supabase.auth.refreshSession();
    console.log('  - รีเฟรช Supabase session');
    
    // 5. ตรวจสอบข้อมูลปัจจุบันในฐานข้อมูล
    console.log('📊 ตรวจสอบข้อมูลจริงในฐานข้อมูล...');
    const { data: actualSchedules, error } = await supabase
      .from('teaching_schedules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error checking database:', error);
    } else {
      console.log(`✅ ข้อมูลจริงในฐานข้อมูล: ${actualSchedules?.length || 0} รายการ`);
      actualSchedules?.forEach(s => {
        console.log(`  - ${s.course_title} (ID: ${s.id.substring(0, 8)}...)`);
      });
    }
    
    // 6. Hard reload หน้าเว็บ
    console.log('🔄 Hard reload หน้าเว็บใน 2 วินาที...');
    console.log('💡 หลังจาก reload จะใช้ข้อมูลจากฐานข้อมูลจริงเท่านั้น');
    
    setTimeout(() => {
      // Hard reload with cache bypass
      window.location.reload(true);
    }, 2000);
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    
    // Force reload anyway
    console.log('🔄 Force reload...');
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  }
}

// รัน function
clearFrontendCache();