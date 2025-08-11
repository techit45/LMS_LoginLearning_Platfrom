// Quick UI Issue Checker
// วางใน browser console เพื่อตรวจสอบปัญหา UI

console.log('🔍 Starting UI Issue Check...');

// 1. Check schedules data
const checkSchedules = () => {
  const logs = [];
  const entries = performance.getEntriesByType('navigation');
  
  console.log('📊 1. SCHEDULES DATA CHECK:');
  console.log('   - กำลังตรวจสอบข้อมูล schedules...');
  console.log('   - ดู console logs สำหรับ "✅ Schedules loaded" และ "👥 Instructor profiles loaded"');
  
  return true;
};

// 2. Check UI elements
const checkUIElements = () => {
  console.log('🎨 2. UI ELEMENTS CHECK:');
  
  const scheduleTable = document.querySelector('table');
  const instructorRows = document.querySelectorAll('tr.group, [class*="group"]');
  const scheduleElements = document.querySelectorAll('[style*="background"], [class*="bg-"]').length;
  
  console.log(`   ✓ Schedule table: ${scheduleTable ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`   ✓ Instructor rows: ${instructorRows.length}`);
  console.log(`   ✓ Schedule elements: ${scheduleElements}`);
  
  return {
    hasTable: !!scheduleTable,
    instructorCount: instructorRows.length,
    scheduleCount: scheduleElements
  };
};

// 3. Check SessionStorage
const checkSessionStorage = () => {
  console.log('💾 3. SESSIONSTORAGE CHECK:');
  
  const removedInstructors = sessionStorage.getItem('removedInstructors');
  console.log(`   ✓ Removed instructors: ${removedInstructors || 'null'}`);
  
  return removedInstructors;
};

// 4. Check Network requests
const checkNetwork = () => {
  console.log('🌐 4. NETWORK CHECK:');
  
  const entries = performance.getEntriesByType('resource')
    .filter(entry => entry.name.includes('weekly_schedules'))
    .slice(-3);
    
  console.log(`   ✓ Recent API calls: ${entries.length}`);
  entries.forEach((entry, index) => {
    console.log(`     ${index + 1}. ${entry.name} (${Math.round(entry.duration)}ms)`);
  });
  
  return entries.length;
};

// 5. Check Console Errors
const checkConsoleErrors = () => {
  console.log('❌ 5. CONSOLE ERRORS CHECK:');
  console.log('   - ดูใน Console tab หาข้อความ error สีแดง');
  console.log('   - หาข้อความที่มี "404", "400", "500", หรือ "Failed"');
  
  return true;
};

// Run all checks
const runFullCheck = () => {
  console.log('🚀 FULL UI ISSUE CHECK STARTING...\n');
  
  checkSchedules();
  const uiResult = checkUIElements();
  const sessionResult = checkSessionStorage();
  const networkResult = checkNetwork();
  checkConsoleErrors();
  
  console.log('\n📋 SUMMARY:');
  console.log(`   📊 Schedules: Check logs above`);
  console.log(`   🎨 UI: ${uiResult.hasTable ? '✅' : '❌'} Table, ${uiResult.instructorCount} instructors`);
  console.log(`   💾 Session: ${sessionResult === 'null' || !sessionResult ? '✅ Clean' : '⚠️ Has removed instructors'}`);
  console.log(`   🌐 Network: ${networkResult > 0 ? '✅' : '⚠️'} API calls`);
  
  console.log('\n🎯 NEXT STEPS:');
  if (uiResult.instructorCount === 0) {
    console.log('   ❌ ไม่พบ instructor rows - ตรวจสอบ allInstructors state');
  }
  if (!uiResult.hasTable) {
    console.log('   ❌ ไม่พบตาราง - ตรวจสอบ component rendering');
  }
  if (networkResult === 0) {
    console.log('   ❌ ไม่พบ API calls - ตรวจสอบ network requests');
  }
  
  return {
    ui: uiResult,
    session: sessionResult,
    network: networkResult
  };
};

// Auto-run
runFullCheck();

// Export for manual use
window.checkUIIssue = runFullCheck;