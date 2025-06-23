# 🏫 ระบบการเรียน Onsite Learning System

## 📋 สรุปโครงสร้างที่สร้างแล้ว

### 1. Database Schema (`onsite-learning-schema.sql`)
✅ **ตารางฐานข้อมูลครบชุด:**
- เพิ่ม columns ใน `courses` table สำหรับ Onsite
- `onsite_project_templates` - หัวข้อโครงงานที่ Admin สร้าง
- `onsite_course_schedules` - ตารางเวลาการเรียน
- `onsite_registrations` - การลงทะเบียนเรียน (ไม่ต้องล็อกอิน)
- `onsite_project_assignments` - การมอบหมายโครงงาน
- `onsite_attendance` - ระบบเช็คชื่อ
- `onsite_evaluations` - การประเมินและฟีดแบ็ค

### 2. Service Layer (`src/lib/onsiteService.js`)
✅ **API Functions:**
- การจัดการคอร์ส Onsite
- ระบบลงทะเบียน (แบบไม่ต้องล็อกอิน)
- การจัดการโครงงาน Templates
- ฟังก์ชัน Admin สำหรับจัดการ
- สถิติและรายงาน

### 3. UI Components
✅ **Components ที่สร้างแล้ว:**
- `OnsiteRegistrationForm.jsx` - ฟอร์มสมัครเรียน (4 ขั้นตอน)
- `OnsiteCoursesPage.jsx` - หน้าแสดงคอร์ส Onsite

## 🎯 ฟีเจอร์หลักที่รองรับ:

### 📚 ระบบคอร์ส Onsite
- **Online vs Onsite vs Hybrid** - รองรับ 3 รูปแบบการเรียน
- **โครงงานเดี่ยว** - นักเรียนเลือกหัวข้อเองได้หรือใช้ template
- **โครงงานกลุ่ม** - Admin อัปเดตหัวข้อตามช่วงเวลา
- **ตารางเวลา** - Admin กำหนดรอบเรียนได้

### 📝 ระบบลงทะเบียน
- **ไม่ต้องล็อกอิน** - สมัครได้เลย เหมือนฟอร์มติดต่อ
- **4 ขั้นตอน** - แบ่งฟอร์มให้ง่ายต่อการกรอก
- **ข้อมูลครบถ้วน** - ข้อมูลส่วนตัว, การศึกษา, ที่อยู่, ผู้ปกครอง
- **เลือกโครงงาน** - เลือกประเภทและหัวข้อโครงงาน

### 💰 ระบบการเงิน
- **ราคาแบบยืดหยุ่น** - Early Bird, ราคาปกติ
- **ค่าธรรมเนียมเพิ่ม** - วัสดุ, ใบประกาศนียบัตร
- **สถานะการชำระ** - ติดตามการชำระเงิน

### 📊 ระบบจัดการ (สำหรับ Admin)
- **อนุมัติใบสมัคร** - ตรวจสอบและอนุมัติ
- **มอบหมายโครงงาน** - จัดกลุ่ม, มอบหมายงาน
- **เช็คชื่อ** - บันทึกการเข้าเรียน
- **ประเมินผล** - ให้คะแนนและฟีดแบ็ค

## 🚀 แผนการพัฒนาต่อ

### Phase 1: Core Admin Features (สำคัญที่สุด)
#### 🔧 Admin Dashboard
- [ ] `AdminOnsiteManagement.jsx` - หน้าจัดการ Onsite
- [ ] `RegistrationManagement.jsx` - จัดการใบสมัคร
- [ ] `ScheduleEditor.jsx` - สร้าง/แก้ไขตารางเรียน
- [ ] `ProjectTemplateEditor.jsx` - จัดการ Templates โครงงาน

#### 👥 Student Management
- [ ] `StudentGrouping.jsx` - จัดกลุ่มนักเรียน
- [ ] `ProjectAssignment.jsx` - มอบหมายโครงงาน
- [ ] `AttendanceTracker.jsx` - ระบบเช็คชื่อ
- [ ] `GradingSystem.jsx` - ให้คะแนนและประเมิน

### Phase 2: Enhanced Features
#### 📱 Student Portal
- [ ] `StudentDashboard.jsx` - แดชบอร์ดนักเรียน
- [ ] `ProjectProgress.jsx` - ติดตามความคืบหน้า
- [ ] `ScheduleViewer.jsx` - ดูตารางเรียน
- [ ] `CertificateDownload.jsx` - ดาวน์โหลดใบประกาศ

#### 📧 Communication System
- [ ] `EmailNotifications.js` - ระบบแจ้งเตือนอีเมล
- [ ] `SMSService.js` - แจ้งเตือน SMS
- [ ] `AnnouncementSystem.jsx` - ระบบประกาศ
- [ ] `ParentPortal.jsx` - พอร์ทัลผู้ปกครอง

#### 💳 Payment Integration
- [ ] `PaymentGateway.js` - เชื่อมต่อระบบชำระเงิน
- [ ] `InstallmentPlan.jsx` - แผนผ่อนชำระ
- [ ] `ReceiptGeneration.jsx` - สร้างใบเสร็จ
- [ ] `RefundManagement.jsx` - จัดการเงินคืน

### Phase 3: Advanced Analytics
#### 📊 Reporting & Analytics
- [ ] `AttendanceReports.jsx` - รายงานการเข้าเรียน
- [ ] `ProjectAnalytics.jsx` - วิเคราะห์โครงงาน
- [ ] `StudentPerformance.jsx` - ผลการเรียนนักเรียน
- [ ] `RevenueTracking.jsx` - ติดตามรายได้

#### 🤖 Automation
- [ ] `AutoGrouping.js` - จัดกลุ่มอัตโนมัติ
- [ ] `ProgressReminders.js` - แจ้งเตือนความคืบหน้า
- [ ] `CertificateGeneration.js` - สร้างใบประกาศอัตโนมัติ
- [ ] `WaitlistManagement.js` - จัดการรายชื่อสำรอง

## 📂 File Structure Plan

```
src/
├── components/
│   ├── onsite/
│   │   ├── OnsiteRegistrationForm.jsx ✅
│   │   ├── StudentDashboard.jsx
│   │   ├── ProjectProgress.jsx
│   │   └── ScheduleViewer.jsx
│   ├── admin/
│   │   ├── onsite/
│   │   │   ├── RegistrationManagement.jsx
│   │   │   ├── ScheduleEditor.jsx
│   │   │   ├── ProjectTemplateEditor.jsx
│   │   │   ├── StudentGrouping.jsx
│   │   │   └── AttendanceTracker.jsx
│   │   └── reports/
│   │       ├── AttendanceReports.jsx
│   │       └── ProjectAnalytics.jsx
├── pages/
│   ├── OnsiteCoursesPage.jsx ✅
│   ├── StudentPortalPage.jsx
│   ├── AdminOnsitePage.jsx
│   └── ParentPortalPage.jsx
├── lib/
│   ├── onsiteService.js ✅
│   ├── paymentService.js
│   ├── notificationService.js
│   └── reportingService.js
├── hooks/
│   ├── useOnsiteRegistration.js
│   ├── useProjectManagement.js
│   └── useAttendance.js
└── contexts/
    ├── OnsiteContext.jsx
    └── StudentPortalContext.jsx
```

## 💾 Database Setup Instructions

1. **เรียกใช้ Schema:**
   ```sql
   -- Run in Supabase SQL Editor
   \i onsite-learning-schema.sql
   ```

2. **อัปเดตคอร์สที่มีอยู่:**
   ```sql
   -- เปลี่ยนคอร์สให้รองรับ Onsite
   UPDATE courses 
   SET delivery_type = 'onsite',
       onsite_duration_weeks = 8,
       project_type = 'both'
   WHERE id = 'your-course-id';
   ```

3. **ตั้งค่า RLS Policies:**
   - Already included in schema file

## 🔗 Integration Points

### กับระบบเดิม:
- **Courses**: ขยายให้รองรับ Online + Onsite
- **User System**: ไม่บังคับล็อกอินสำหรับสมัคร
- **Payment**: เชื่อมต่อกับระบบชำระเงิน
- **Notifications**: แจ้งเตือนผ่านอีเมล/SMS

### APIs ภายนอก:
- **Payment Gateway**: PromptPay, Credit Card
- **Email Service**: SendGrid, Mailgun
- **SMS Service**: Thailand SMS providers
- **Calendar**: Google Calendar integration

## 📱 การใช้งาน

### สำหรับนักเรียน:
1. **สมัครเรียน** - กรอกฟอร์ม 4 ขั้นตอน
2. **เลือกโครงงาน** - เดี่ยวหรือกลุ่ม
3. **รอการอนุมัติ** - Admin ตรวจสอบใบสมัคร
4. **เริ่มเรียน** - เข้าเรียนตามตารางที่กำหนด

### สำหรับ Admin:
1. **สร้างตารางเรียน** - กำหนดรอบเรียนใหม่
2. **จัดการใบสมัคร** - อนุมัติ/ปฏิเสธ
3. **มอบหมายโครงงาน** - จัดกลุ่มและมอบหมาย
4. **ติดตามผลการเรียน** - เช็คชื่อและให้คะแนน

## 🎯 Success Metrics

### KPIs ที่ควรติดตาม:
- Registration Conversion Rate
- Course Completion Rate
- Student Satisfaction Score
- Project Success Rate
- Revenue per Course
- Attendance Rate

## 🔄 Data Flow

```
1. Student Registration → Admin Approval → Payment → Group Assignment
2. Project Template Creation → Student Selection → Progress Tracking → Evaluation
3. Schedule Creation → Registration Opening → Class Management → Completion
```

---

**หมายเหตุ:** ระบบนี้ออกแบบให้รองรับการเติบโตและขยายตัวได้ พร้อมรองรับทั้งการเรียน Online และ Onsite ในระบบเดียวกัน 🚀

## 🔧 Next Steps สำหรับการพัฒนา:

1. **ตั้งค่าฐานข้อมูล** - รัน SQL schema
2. **Admin Dashboard** - เริ่มพัฒนาหน้าจัดการ (priority สูงสุด)
3. **Email Notifications** - ระบบแจ้งเตือนอีเมล
4. **Payment Integration** - เชื่อมต่อระบบชำระเงิน
5. **Student Portal** - แดชบอร์ดสำหรับนักเรียน