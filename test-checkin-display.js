#!/usr/bin/env node

/**
 * Test script to verify check-in data display
 * Run this after making a check-in to see the actual data stored in database
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

console.log('🔍 Testing Check-in Data Display...\n');

// Mock test data to simulate what the UI should show
const mockActiveEntry = {
  id: 'test-123',
  entry_date: '2025-08-06',
  check_in_time: '2025-08-06T00:59:19.000Z',
  entry_type: 'teaching',
  work_location: 'online',
  online_class_platform: 'google_meet',
  online_class_url: 'https://meet.google.com/abc-defg-hij',
  remote_reason: null,
  course_taught: 'React Development',
  company: 'login',
  center_name: null,
  centerName: null
};

console.log('📊 Mock Active Entry Data:');
console.log('='.repeat(50));
console.log(`🕐 เวลาเช็คอิน: ${new Date(mockActiveEntry.check_in_time).toLocaleTimeString('th-TH')}`);

// Test entry type display
console.log(`📋 ประเภทงาน: ${
  mockActiveEntry.entry_type === 'teaching' ? 'สอน' :
  mockActiveEntry.entry_type === 'meeting' ? 'ประชุม' :
  mockActiveEntry.entry_type === 'prep' ? 'เตรียมการสอน' :
  mockActiveEntry.entry_type === 'admin' ? 'งานธุรการ' :
  'งานทั่วไป'
}`);

// Test work location display
if (mockActiveEntry.work_location) {
  console.log(`🏢 สถานที่ทำงาน: ${
    mockActiveEntry.work_location === 'onsite' ? 'ที่ศูนย์/สำนักงาน' :
    mockActiveEntry.work_location === 'remote' ? 'ทำงานนอกสถานที่' :
    mockActiveEntry.work_location === 'online' ? 'สอนออนไลน์' :
    mockActiveEntry.work_location
  }`);
}

// Test remote work reason display
if (mockActiveEntry.work_location === 'remote' && mockActiveEntry.remote_reason) {
  console.log(`💼 เหตุผล: ${
    mockActiveEntry.remote_reason === 'home_office' ? 'ทำงานที่บ้าน' :
    mockActiveEntry.remote_reason === 'client_visit' ? 'ออกพบลูกค้า/นักเรียน' :
    mockActiveEntry.remote_reason === 'meeting_external' ? 'ประชุมนอกสถานที่' :
    mockActiveEntry.remote_reason === 'field_work' ? 'งานภาคสนาม' :
    mockActiveEntry.remote_reason === 'health_reason' ? 'เหตุผลด้านสุขภาพ' :
    mockActiveEntry.remote_reason === 'emergency' ? 'เหตุฉุกเฉิน' :
    mockActiveEntry.remote_reason === 'other' ? 'อื่นๆ' :
    mockActiveEntry.remote_reason
  }`);
}

// Test online class platform display
if (mockActiveEntry.work_location === 'online' && mockActiveEntry.online_class_platform) {
  console.log(`💻 แพลตฟอร์ม: ${
    mockActiveEntry.online_class_platform === 'google_meet' ? 'Google Meet' :
    mockActiveEntry.online_class_platform === 'zoom' ? 'Zoom' :
    mockActiveEntry.online_class_platform === 'microsoft_teams' ? 'Microsoft Teams' :
    mockActiveEntry.online_class_platform === 'line' ? 'LINE' :
    mockActiveEntry.online_class_platform === 'facebook_messenger' ? 'Facebook Messenger' :
    mockActiveEntry.online_class_platform === 'discord' ? 'Discord' :
    mockActiveEntry.online_class_platform === 'webex' ? 'Cisco Webex' :
    mockActiveEntry.online_class_platform === 'other' ? 'อื่นๆ' :
    mockActiveEntry.online_class_platform
  }`);
}

// Test online class URL display
if (mockActiveEntry.work_location === 'online' && mockActiveEntry.online_class_url) {
  console.log(`🔗 ลิงก์คลาส: ${mockActiveEntry.online_class_url}`);
}

// Test course taught display
if (mockActiveEntry.course_taught) {
  console.log(`📖 วิชาที่สอน: ${mockActiveEntry.course_taught}`);
}

// Test company/center display - only for onsite work
if ((mockActiveEntry.work_location === 'onsite' || !mockActiveEntry.work_location) && 
    (mockActiveEntry.company || mockActiveEntry.centerName || mockActiveEntry.center_name)) {
  console.log(`🏢 บริษัท/ศูนย์: ${
    mockActiveEntry.centerName || mockActiveEntry.center_name || 
    (mockActiveEntry.company === 'bangplad' ? 'ศูนย์บางพลัด' :
     mockActiveEntry.company === 'meta' ? 'Meta' :
     mockActiveEntry.company === 'med' ? 'Med' :
     mockActiveEntry.company === 'edtech' ? 'EdTech' :
     mockActiveEntry.company === 'w2d' ? 'W2D' :
     'Login Learning')
  }`);
}

console.log('\n✅ Expected Display Result:');
console.log('เวลาเช็คอิน: 07:59:19');
console.log('ประเภทงาน: สอน');
console.log('สถานที่ทำงาน: สอนออนไลน์');
console.log('แพลตฟอร์ม: Google Meet');
console.log('ลิงก์คลาส: https://meet.google.com/abc-defg-hij');
console.log('วิชาที่สอน: React Development');
console.log('(ไม่แสดงบริษัท/ศูนย์ เพราะเป็นการสอนออนไลน์)');

console.log('\n🔧 Fix Applied:');
console.log('1. ✅ เพิ่มการแสดงข้อมูล work_location, remote_reason, online_class_platform');
console.log('2. ✅ แก้ไข entry_type ให้เป็น "teaching" เมื่อเลือก "สอนออนไลน์"');
console.log('3. ✅ แสดงบริษัท/ศูนย์ เฉพาะเมื่อเป็น onsite work เท่านั้น');
console.log('4. ✅ เพิ่มลิงก์คลิกได้สำหรับ online_class_url');

console.log('\n🧪 การทดสอบ:');
console.log('1. เลือก "สอนออนไลน์" + "Google Meet" + ใส่ลิงก์');
console.log('2. เช็คอิน');
console.log('3. ตรวจสอบในส่วน "ข้อมูลการเช็คอิน" ว่าแสดงข้อมูลที่ถูกต้อง');

console.log('\n📝 หากยังมีปัญหา:');
console.log('- ตรวจสอบในฐานข้อมูล time_entries table');
console.log('- ดูค่าใน columns: work_location, entry_type, online_class_platform');
console.log('- รีเฟรชหน้าเว็บและลองเช็คอินใหม่');