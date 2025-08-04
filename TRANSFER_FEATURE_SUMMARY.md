# ฟีเจอร์การย้ายโครงงานและคอร์สเรียน (Transfer Feature)

## 🎯 วัตถุประสงค์

เพิ่มความสามารถในการย้ายโครงงานและคอร์สเรียนระหว่างบริษัทต่างๆ พร้อมการย้ายโฟลเดอร์ Google Drive ที่เกี่ยวข้อง เพื่อรองรับการจัดการข้อมูลในระบบ Multi-Company

## 🚀 ฟีเจอร์ที่เพิ่มเข้ามา

### 1. **TransferItemModal Component**
**ไฟล์**: `src/components/TransferItemModal.jsx`

**คุณสมบัติหลัก**:
- Modal สวยงามสำหรับการย้ายโครงงาน/คอร์สเรียน
- การเลือกบริษัทปลายทาง (6 บริษัท: login, meta, med, edtech, innotech, w2d)
- การยืนยันด้วยการพิมพ์ข้อความ `MOVE [ชื่อโครงงาน/คอร์สเรียน]`
- แสดงตัวอย่างการย้าย (จาก A ไป B)
- ข้อควรระวังและคำเตือน
- รองรับการย้ายทั้งโครงงานและคอร์สเรียน

**UI Features**:
- 🎨 สีส้ม-แดง gradient header ที่โดดเด่น
- 🔄 แสดงสถานะการย้าย (ปัจจุบัน → ปลายทาง)
- ⚠️ Warning panel พร้อมข้อควรระวัง
- 🔒 Confirmation input เพื่อป้องกันการผิดพลาด
- 📱 Responsive design รองรับทุกขนาดหน้าจอ

### 2. **Backend Transfer Functions**

#### **ProjectService Transfer Function**
**ไฟล์**: `src/lib/projectService.js`
**ฟังก์ชัน**: `transferItemToCompany(projectId, targetCompany, options)`

**คุณสมบัติ**:
- ตรวจสอบความถูกต้องของ company ปลายทาง
- สร้างโฟลเดอร์ Google Drive ใหม่ในบริษัทปลายทาง
- อัปเดตข้อมูลในฐานข้อมูล
- ล้าง cache เพื่อให้ข้อมูลใหม่
- ส่งกลับรายละเอียดการย้าย

#### **CourseService Transfer Function**
**ไฟล์**: `src/lib/courseService.js`
**ฟังก์ชัน**: `transferItemToCompany(courseId, targetCompany, options)`

**คุณสมบัติ**:
- เหมือนกับ ProjectService แต่สำหรับคอร์สเรียน
- รองรับการย้าย course content และ folder structure
- จัดการ cache ที่เกี่ยวข้องกับคอร์สเรียน

### 3. **Admin Panel Integration**

#### **AdminProjectsPage Updates**
**ไฟล์**: `src/pages/AdminProjectsPage.jsx`

**การเปลี่ยนแปลง**:
- ➕ เพิ่ม `ArrowRight` icon จาก lucide-react
- ➕ Import `TransferItemModal` component
- ➕ State management: `showTransferModal`, `transferringProject`
- ➕ Handler functions: `handleTransferProject`, `handleTransferComplete`, `handleTransferClose`
- ➕ ปุ่มย้าย (สีม่วง) ในรายการ action buttons
- ➕ TransferItemModal component ในตอนท้าย

#### **AdminCoursesPage Updates**
**ไฟล์**: `src/pages/AdminCoursesPage.jsx`

**การเปลี่ยนแปลง**:
- เหมือนกับ AdminProjectsPage แต่สำหรับคอร์สเรียน
- ปุ่มย้ายอยู่ระหว่างปุ่มแก้ไขและปุ่มเปิด/ปิด

## 🎨 User Experience

### **การใช้งาน**:
1. **เข้าสู่หน้า Admin** (Projects หรือ Courses)
2. **คลิกปุ่มลูกศรสีม่วง** (ArrowRight) ในรายการโครงงาน/คอร์สเรียน
3. **เลือกบริษัทปลายทาง** จาก 6 ตัวเลือก
4. **ดูตัวอย่างการย้าย** (จาก → ไป)
5. **พิมพ์ข้อความยืนยัน**: `MOVE [ชื่อรายการ]`
6. **คลิกย้าย** และรอให้ระบบดำเนินการ

### **ข้อควรระวัง**:
- ⚠️ การย้ายจะย้ายทั้งข้อมูลและโฟลเดอร์ Google Drive
- ⚠️ ลิงก์เก่าอาจไม่สามารถเข้าถึงได้
- ⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้
- ⚠️ ผู้ดูแลระบบเท่านั้นที่สามารถย้ายได้

## 🔧 Technical Implementation

### **Google Drive Integration**:
1. **สร้างโฟลเดอร์ใหม่** ในบริษัทปลายทาง
2. **อัปเดต google_drive_folder_id** ในฐานข้อมูล
3. **เก็บ old folder ID** สำหรับการติดตาม
4. **Log การดำเนินการ** ทั้งหมดเพื่อ debugging

### **Database Updates**:
```sql
UPDATE projects/courses SET 
  company = 'target_company',
  google_drive_folder_id = 'new_folder_id',
  updated_at = NOW()
WHERE id = 'item_id';
```

### **Cache Management**:
- ล้าง project/course cache ทั้งหมด
- ล้าง company-specific cache
- ล้าง stats cache เพื่อให้ข้อมูลถูกต้อง

## 📊 Return Data Structure

```javascript
{
  data: {
    ...updatedItem,
    transfer_details: {
      from_company: 'login',
      to_company: 'meta', 
      drive_folder_transferred: true,
      old_drive_folder_id: 'old_id',
      new_drive_folder_id: 'new_id',
      transferred_at: '2025-07-31T...'
    }
  },
  error: null
}
```

## 🎯 Benefits

### **สำหรับ Admin**:
- 🔄 ย้ายข้อมูลได้ง่ายและรวดเร็ว
- 🛡️ ป้องกันการผิดพลาดด้วย confirmation
- 📊 ติดตามการย้ายได้ชัดเจน
- 🗂️ จัดการโฟลเดอร์ Google Drive อัตโนมัติ

### **สำหรับระบบ**:
- 🏗️ รองรับ Multi-Company Architecture
- 📈 จัดการข้อมูลได้มีประสิทธิภาพ
- 🔍 Audit trail สำหรับการย้าย
- 🚀 Performance optimization ด้วย cache management

## 🚨 Limitations & Future Improvements

### **ปัจจุบัน**:
- ❌ ไม่มีการคัดลอกไฟล์จริงใน Google Drive (สร้างโฟลเดอร์ใหม่เท่านั้น)
- ❌ ไม่สามารถ undo การย้ายได้
- ❌ ไม่มี batch transfer (ย้ายทีละรายการ)

### **แผนการพัฒนา**:
- ✅ เพิ่มการคัดลอกไฟล์จริงใน Google Drive
- ✅ Bulk transfer สำหรับย้ายหลายรายการพร้อมกัน
- ✅ History log สำหรับติดตามการย้าย
- ✅ Rollback function สำหรับการย้ายกลับ
- ✅ Permission management หลังการย้าย

## 🔐 Security Considerations

- ✅ ตรวจสอบสิทธิ์ Admin เท่านั้น
- ✅ Validation company ปลายทาง
- ✅ Confirmation text เพื่อป้องกันการผิดพลาด
- ✅ Error handling ที่ครอบคลุม
- ✅ Audit logging สำหรับการติดตาม

---

## 📋 Installation & Usage

### **การติดตั้ง**:
ฟีเจอร์นี้พร้อมใช้งานแล้วใน:
- Admin Projects Page (`/admin/projects`)
- Admin Courses Page (`/admin/courses`)

### **การทดสอบ**:
1. สร้างโครงงาน/คอร์สเรียนใหม่
2. ทดสอบปุ่มย้าย (ArrowRight สีม่วง)
3. ทดสอบการเลือกบริษัทต่างๆ
4. ทดสอบ confirmation process
5. ตรวจสอบการสร้างโฟลเดอร์ Google Drive

---

**สร้างเมื่อ**: 31 กรกฎาคม 2568  
**เวอร์ชัน**: 1.0.0  
**สถานะ**: ✅ พร้อมใช้งาน