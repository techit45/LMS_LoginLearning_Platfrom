// แก้ไขฟังก์ชัน getWeekKey สำหรับ TeachingSchedulePage.jsx

// ⚠️  ฟังก์ชันเดิมที่มีปัญหา:
const getWeekKeyOld = (date, type) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
  const weekId = startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `${type}_${weekId}`;
};

// ✅ ฟังก์ชันใหม่ที่แก้ไขแล้ว - วิธีที่ 1: ใช้วันจันทร์เป็นต้นสัปดาห์
const getWeekKeyFixed = (date, type) => {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // คำนวณวันจันทร์ของสัปดาห์นั้น
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // ถ้าเป็นวันอาทิตย์ (-6), อื่นๆ (1 - dayOfWeek)
  startOfWeek.setDate(date.getDate() + mondayOffset);
  
  const weekId = startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `${type}_${weekId}`;
};

// ✅ ฟังก์ชันใหม่ที่แก้ไขแล้ว - วิธีที่ 2: รองรับการแยก weekdays/weekends ชัดเจน
const getWeekKeyV2 = (date, type) => {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // สำหรับ weekends: ใช้เสาร์เป็นจุดเริ่มต้น
  if (type.includes('weekends')) {
    // หาวันเสาร์ของสัปดาห์นั้น
    const saturdayOffset = dayOfWeek === 0 ? -1 : 6 - dayOfWeek; // วันอาทิตย์ไปเสาร์ก่อนหน้า, อื่นๆไปเสาร์หน้า
    startOfWeek.setDate(date.getDate() + saturdayOffset);
  } else {
    // สำหรับ weekdays: ใช้วันจันทร์เป็นจุดเริ่มต้น
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // ถ้าเป็นวันอาทิตย์ (-6), อื่นๆ (1 - dayOfWeek)
    startOfWeek.setDate(date.getDate() + mondayOffset);
  }
  
  const weekId = startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `${type}_${weekId}`;
};

// ✅ ฟังก์ชันที่แนะนำ - วิธีที่ 3: ใช้ ISO Week (ง่ายที่สุด)
const getWeekKeyRecommended = (date, type) => {
  // ใช้ ISO week number แทน date string
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${type}_${year}_W${week.toString().padStart(2, '0')}`;
};

// Helper function สำหรับ ISO Week
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// 🧪 ทดสอบการแก้ไข
console.log('🧪 ทดสอบการแก้ไขปัญหา week key:');

const testDates = [
  new Date('2024-01-19'), // Friday
  new Date('2024-01-20'), // Saturday  
  new Date('2024-01-21'), // Sunday
  new Date('2024-01-22'), // Monday
];

console.log('\n📊 เปรียบเทียบผลลัพธ์:');
testDates.forEach(date => {
  const old = getWeekKeyOld(date, 'teachingSchedules_weekends');
  const fixed = getWeekKeyFixed(date, 'teachingSchedules_weekends');
  const v2 = getWeekKeyV2(date, 'teachingSchedules_weekends');
  const recommended = getWeekKeyRecommended(date, 'teachingSchedules_weekends');
  
  console.log(`${date.toDateString()}:`);
  console.log(`  เดิม: ${old}`);
  console.log(`  แก้ไข: ${fixed}`);
  console.log(`  V2: ${v2}`);
  console.log(`  แนะนำ: ${recommended}`);
  console.log('  ---');
});

console.log('\n✅ สรุปการแก้ไข:');
console.log('1. วิธีที่ 1: ใช้วันจันทร์เป็นต้นสัปดาห์ (เหมาะกับ weekdays)');
console.log('2. วิธีที่ 2: แยก logic สำหรับ weekdays/weekends');
console.log('3. วิธีที่ 3: ใช้ ISO Week Number (แนะนำ - เสถียรที่สุด)');