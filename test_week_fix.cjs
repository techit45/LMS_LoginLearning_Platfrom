// Test the week key fix
console.log('🧪 Testing the new week key system...');

// New getWeekKey function (ISO week)
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

const getWeekKey = (date, type) => {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${type}_${year}_W${week.toString().padStart(2, '0')}`;
};

// Test dates from screenshot period (July 2025)
const testDates = [
  new Date('2025-07-26'), // Saturday
  new Date('2025-07-27'), // Sunday  
  new Date('2025-07-28'), // Monday (from screenshot)
  new Date('2025-08-02'), // Saturday next week
  new Date('2025-08-03'), // Sunday next week
];

console.log('\n📅 Week key consistency test:');
testDates.forEach(date => {
  const weekdaysKey = getWeekKey(date, 'teachingSchedules_weekdays');
  const weekendsKey = getWeekKey(date, 'teachingSchedules_weekends');
  
  console.log(`${date.toDateString()}:`);
  console.log(`  Weekdays: ${weekdaysKey}`);
  console.log(`  Weekends: ${weekendsKey}`);
  console.log('  ---');
});

console.log('\n✅ Expected behavior:');
console.log('- Saturday and Sunday in same week = SAME weekend key');
console.log('- All weekdays in same week = SAME weekdays key');
console.log('- Different weeks = DIFFERENT keys');
console.log('- No data mixing between weeks');

console.log('\n🔧 Fix Summary:');
console.log('1. ✅ Fixed getWeekKey() to use ISO week');
console.log('2. ✅ Added isTransitioning state');
console.log('3. ✅ Prevented saves during transitions');
console.log('4. ✅ Clear data immediately on week change');
console.log('5. ✅ Load new week data after clearing');