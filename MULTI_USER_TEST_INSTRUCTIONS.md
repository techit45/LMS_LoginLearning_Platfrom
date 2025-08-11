# 🔄 การทดสอบ Multi-User Collaboration

## วิธีทดสอบแบบ Manual

### 1. **เตรียมพร้อม**
- ✅ Development server รันอยู่ที่ `http://localhost:5174/`
- ✅ Database tables พร้อม: `teaching_schedules`, `teaching_courses`
- ✅ Real-time subscriptions implemented

### 2. **เปิด 2 Browser Tabs/Windows**

**Tab A (User 1):**
```
http://localhost:5174/#/admin/teaching-schedule
```

**Tab B (User 2):**
```  
http://localhost:5174/#/admin/teaching-schedule
```

### 3. **ขั้นตอนการทดสอบ**

#### **Test 1: Course Creation Sync**
1. **Tab A**: สร้างคอร์สใหม่ผ่าน CourseManager
2. **Tab B**: ตรวจสอบว่าคอร์สปรากฏใน course list ทันที
3. **ผลที่คาดหวัง**: คอร์สใหม่ปรากฏใน Tab B โดยไม่ต้อง refresh

#### **Test 2: Schedule Creation Sync**  
1. **Tab A**: ลาก course ไปวางในตาราง
2. **Tab B**: ตรวจสอบว่าตารางใหม่ปรากฏทันที
3. **ผลที่คาดหวัง**: ตารางใหม่ปรากฏใน Tab B พร้อม animation

#### **Test 3: Move Schedule Sync**
1. **Tab A**: ลากตารางไปตำแหน่งใหม่
2. **Tab B**: ตรวจสอบการเคลื่อนที่ของตาราง
3. **ผลที่คาดหวัง**: ตารางใน Tab B เคลื่อนที่ไปตำแหน่งใหม่

#### **Test 4: Resize Schedule Sync**
1. **Tab A**: ลากขอบตารางเพื่อปรับขนาด
2. **Tab B**: ตรวจสอบการเปลี่ยนขนาด
3. **ผลที่คาดหวัง**: ขนาดตารางใน Tab B เปลี่ยนตาม

#### **Test 5: Delete Schedule Sync**
1. **Tab A**: ลบตารางผ่านปุ่ม delete
2. **Tab B**: ตรวจสอบว่าตารางหายไป
3. **ผลที่คาดหวัง**: ตารางหายไปจาก Tab B ทันที

#### **Test 6: Connection Status**
1. **ตรวจสอบ**: Connection indicator ใน header
2. **ผลที่คาดหวัง**: แสดง "เชื่อมต่อแล้ว" 🟢 เมื่อ real-time ทำงาน

### 4. **การตรวจสอบ Technical**

#### **Browser Console ใน Tab A:**
```javascript
// ตรวจสอบ real-time subscription
console.log('Subscription status:', window.realtimeStatus)

// ส่ง test event
supabase
  .from('teaching_schedules')
  .insert({
    week_start_date: '2025-08-04',
    company: 'login', 
    day_of_week: 0,
    time_slot_index: 0,
    course_title: 'Test Sync',
    instructor_name: 'Test',
    duration: 1
  })
```

#### **Browser Console ใน Tab B:**
```javascript
// ตรวจสอบว่าได้รับ event หรือไม่
// ควรเห็น log: "📡 Real-time Event: INSERT"
```

### 5. **ผลการทดสอบที่คาดหวัง**

#### ✅ **การทำงานที่ถูกต้อง:**
- Real-time events ส่งผ่านระหว่าง tabs
- UI อัปเดตโดยไม่ต้อง refresh
- Connection status แสดงสถานะถูกต้อง
- ไม่มี console errors
- Animations smooth และ responsive

#### ❌ **ปัญหาที่อาจเกิด:**
- **"Transport is closed"**: ปัญหาใน Supabase real-time (ปกติใน 2024-2025)
- **"RLS policy"**: ต้อง authenticated user
- **Delay ใน sync**: Network latency ปกติ
- **Missing updates**: Subscription filter หรือ channel ไม่ถูกต้อง

### 6. **แก้ไขปัญหา**

#### **หาก Real-time ไม่ทำงาน:**
```javascript
// ใน browser console
localStorage.setItem('supabase.auth.debug', 'true')

// Restart subscription
window.location.reload()
```

#### **หาก Authentication จำเป็น:**
1. เปิด `http://localhost:5174/#/login`
2. ลงชื่อเข้าใช้ก่อนทดสอบ
3. กลับไป teaching schedule page

### 7. **การบันทึกผล**

**สร้างรายงาน:**
- ✅ Multi-user sync: ทำงาน/ไม่ทำงาน
- ✅ Real-time latency: < 1 second/> 1 second
- ✅ UI responsiveness: Smooth/Jerky
- ✅ Error handling: แสดงข้อผิดพลาดชัดเจน/ไม่ชัดเจน
- ✅ Connection recovery: Auto-reconnect/Manual refresh required

### 8. **Next Steps**

หลังจากทดสอบเสร็จ:
- บันทึกปัญหาที่พบ
- แก้ไข bugs ที่สำคัญ
- ปรับปรุง UX ให้ดีขึ้น
- เตรียม production deployment

---

## 🎯 เป้าหมายการทดสอบ

การทดสอบนี้จะยืนยันว่า:
1. **ระบบใหม่ทำงานได้ตามที่ออกแบบ** ✅
2. **Multi-user collaboration ทำงานได้จริง** 🔄
3. **Performance ดีกว่าระบบเก่า** 📈
4. **UX ใช้งานง่าย ไม่ซับซ้อน** 🎨
5. **พร้อมสำหรับ production** 🚀

**หมายเหตุ**: หากมีปัญหาใดๆ ให้บันทึกไว้และแจ้งทีมพัฒนาเพื่อแก้ไขต่อไป