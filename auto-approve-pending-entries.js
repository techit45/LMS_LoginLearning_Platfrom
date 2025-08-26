import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function autoApprovePendingEntries() {
  try {
    console.log('🔍 กำลังค้นหารายการที่รอการอนุมัติ...');
    
    // Get all pending entries
    const { data: pendingEntries, error: fetchError } = await supabase
      .from('time_entries')
      .select('id, user_id, entry_date, check_in_time, check_out_time, status')
      .eq('status', 'pending');

    if (fetchError) {
      console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล:', fetchError);
      return;
    }

    if (!pendingEntries || pendingEntries.length === 0) {
      console.log('✅ ไม่มีรายการที่รอการอนุมัติ');
      return;
    }

    console.log(`📝 พบรายการที่รอการอนุมัติ ${pendingEntries.length} รายการ`);
    
    // Auto-approve each entry
    const approvalPromises = pendingEntries.map(entry => 
      supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: entry.user_id, // Self-approve
          approved_at: new Date().toISOString()
        })
        .eq('id', entry.id)
    );

    const results = await Promise.all(approvalPromises);
    
    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      if (result.error) {
        console.error(`❌ ไม่สามารถอนุมัติรายการ ID ${pendingEntries[index].id}:`, result.error);
        errorCount++;
      } else {
        console.log(`✅ อนุมัติรายการ ID ${pendingEntries[index].id} สำเร็จ`);
        successCount++;
      }
    });

    console.log(`\n📊 สรุปผลการดำเนินการ:`);
    console.log(`✅ สำเร็จ: ${successCount} รายการ`);
    console.log(`❌ ล้มเหลว: ${errorCount} รายการ`);
    
    if (successCount > 0) {
      console.log('\n🎉 ระบบได้อนุมัติรายการที่รอการอนุมัติทั้งหมดแล้ว');
      console.log('🔧 การเช็คอิน-เช็คเอาท์ใหม่จะได้รับการอนุมัติอัตโนมัติ');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดำเนินการ:', error);
  }
}

// Run the function
autoApprovePendingEntries();