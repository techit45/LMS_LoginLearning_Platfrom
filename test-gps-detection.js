// Test GPS detection with real coordinates
console.log('🧪 Testing GPS Detection with Real Coordinates\n');

// Your actual GPS coordinates from the screenshot
const currentGPS = {
  lat: 13.79115977,
  lng: 100.49675596
};

// Expected center coordinates  
const centerGPS = {
  lat: 13.791150,
  lng: 100.496780
};

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const distance = calculateDistance(
  currentGPS.lat, currentGPS.lng,
  centerGPS.lat, centerGPS.lng
);

console.log('📍 GPS Coordinates:');
console.log(`   Your location: ${currentGPS.lat}, ${currentGPS.lng}`);
console.log(`   Center location: ${centerGPS.lat}, ${centerGPS.lng}`);
console.log(`   Distance: ${Math.round(distance)} meters`);

console.log('\n🎯 Detection Results:');
if (distance <= 100) {
  console.log('   ✅ WITHIN RADIUS - Should detect center');
  console.log('   Expected: 🎯 ลงทะเบียนอัตโนมัติสำหรับ ศูนย์บางพลัด');
} else if (distance <= 120) {
  console.log('   ⚠️  CLOSE - With 20m buffer should detect');
  console.log('   Expected: 🎯 ลงทะเบียนอัตโนมัติสำหรับ ศูนย์บางพลัด');
} else {
  console.log('   ❌ TOO FAR - Will not detect');
  console.log('   Expected error: "ไม่พบศูนย์ในรัศมีที่อนุญาต"');
}

console.log('\n🔧 Debug Steps:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Click "ตรวจจับอัตโนมัติ" button');
console.log('4. Watch for these logs:');
console.log('   - "Auto-registered for..."');
console.log('   - GPS coordinates');
console.log('   - Distance calculations');
console.log('   - Registration results');

console.log('\n💡 If still not working:');
console.log('1. Make sure GPS permission is granted');
console.log('2. Check if company_locations table has data');
console.log('3. Verify user_registered_locations table exists');
console.log('4. Check locationService.registerUserLocation function');

console.log('\n🚀 System should work with coordinates only ~2.4m apart!');