// Cleanup Company Locations Script
// ลบสถานที่ทั้งหมดยกเว้น ศูนย์บางพลัด

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupLocations() {
  try {
    console.log('🧹 Starting cleanup of company locations...');
    
    // 1. ดูข้อมูลปัจจุบันก่อน
    const { data: currentLocations, error: fetchError } = await supabase
      .from('company_locations')
      .select('id, location_name, company, is_active');
    
    if (fetchError) {
      console.error('❌ Error fetching locations:', fetchError);
      return;
    }
    
    console.log('📍 Current locations:', currentLocations.length);
    currentLocations.forEach(loc => {
      console.log(`  - ${loc.location_name} (${loc.company}) - Active: ${loc.is_active}`);
    });
    
    // 2. หา ID ของ ศูนย์บางพลัด
    const bangPladLocation = currentLocations.find(loc => 
      loc.location_name === 'ศูนย์บางพลัด'
    );
    
    if (!bangPladLocation) {
      console.error('❌ ไม่พบ ศูนย์บางพลัด');
      return;
    }
    
    console.log('✅ Found ศูนย์บางพลัด:', bangPladLocation.id);
    
    // 3. อัพเดท ศูนย์บางพลัด ให้เป็น main office
    const { error: updateError } = await supabase
      .from('company_locations')
      .update({
        is_main_office: true,
        is_active: true,
        company: 'login',
        description: 'ศูนย์หลักสำหรับการลงเวลา Login Learning Platform',
        updated_at: new Date().toISOString()
      })
      .eq('id', bangPladLocation.id);
    
    if (updateError) {
      console.error('❌ Error updating ศูนย์บางพลัด:', updateError);
      return;
    }
    
    console.log('✅ Updated ศูนย์บางพลัด to main office');
    
    // 4. ปิดการใช้งานสถานที่อื่น ๆ (เนื่องจาก RLS ไม่อนุญาตให้ลบ)
    const locationsToDeactivate = currentLocations
      .filter(loc => loc.location_name !== 'ศูนย์บางพลัด')
      .map(loc => loc.id);
    
    if (locationsToDeactivate.length > 0) {
      for (const locationId of locationsToDeactivate) {
        const { error: deactivateError } = await supabase
          .from('company_locations')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', locationId);
        
        if (deactivateError) {
          console.error(`❌ Error deactivating location ${locationId}:`, deactivateError);
        } else {
          console.log(`✅ Deactivated location ${locationId}`);
        }
      }
    }
    
    // 5. ตรวจสอบผลลัพธ์
    const { data: finalLocations, error: finalError } = await supabase
      .from('company_locations')
      .select('*')
      .eq('is_active', true);
    
    if (finalError) {
      console.error('❌ Error checking final result:', finalError);
      return;
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('📍 Remaining active locations:', finalLocations.length);
    
    finalLocations.forEach(loc => {
      console.log(`  ✅ ${loc.location_name} (${loc.company})`);
      console.log(`     Address: ${loc.address}`);
      console.log(`     Main Office: ${loc.is_main_office}`);
      console.log(`     Radius: ${loc.radius_meters}m\n`);
    });
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the cleanup
cleanupLocations();