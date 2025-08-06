# Location Management System - Setup Guide

## 🎯 ระบบจัดการตำแหน่งบริษัท และการลงทะเบียน GPS

คู่มือการติดตั้งระบบจัดการตำแหน่งบริษัทและการลงทะเบียน GPS สำหรับการเช็คอิน

## ✅ สิ่งที่เสร็จสมบูรณ์แล้ว

### 1. Frontend Components
- ✅ **LocationRegistration.jsx** - หน้าลงทะเบียนตำแหน่งสำหรับพนักงาน
- ✅ **AdminLocationManagement.jsx** - หน้าจัดการตำแหน่งสำหรับผู้ดูแลระบบ
- ✅ **locationService.js** - Service functions สำหรับจัดการตำแหน่ง
- ✅ **Routing** - เพิ่มเส้นทางใน App.jsx
- ✅ **Navigation** - เพิ่มเมนูใน Navbar และ AdminLayout

### 2. Database Schema
- ✅ **SQL Script** - `sql_scripts/create_company_locations_table.sql`

## 🔧 การติดตั้ง

### Step 1: รัน SQL Script ในฐานข้อมูล

เข้าไปใน Supabase Dashboard → SQL Editor และรันไฟล์นี้:

```bash
sql_scripts/create_company_locations_table.sql
```

หรือเข้าไปคัดลอก SQL และรันในฐานข้อมูล:

```sql
-- สร้างตารางสำหรับจัดเก็บตำแหน่งบริษัท
CREATE TABLE IF NOT EXISTS company_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    location_name VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    is_main_office BOOLEAN DEFAULT false,
    address TEXT,
    working_hours JSONB DEFAULT '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    allowed_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- ตาราง user_registered_locations สำหรับเก็บข้อมูลการลงทะเบียนตำแหน่งของพนักงาน
CREATE TABLE IF NOT EXISTS user_registered_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES company_locations(id) ON DELETE CASCADE,
    registration_date DATE DEFAULT CURRENT_DATE,
    registration_time TIMESTAMPTZ DEFAULT now(),
    user_latitude DECIMAL(10, 8) NOT NULL,
    user_longitude DECIMAL(11, 8) NOT NULL,
    distance_from_center DECIMAL(8, 2),
    device_info JSONB,
    ip_address INET,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- ป้องกันการลงทะเบียนซ้ำในวันเดียวกัน
    UNIQUE(user_id, location_id, registration_date)
);
```

### Step 2: รันแอปพลิเคชัน

```bash
npm run dev
```

## 🎯 การใช้งาน

### สำหรับผู้ดูแลระบบ (Admin)

1. **เข้าสู่ระบบ** ด้วยบัญชี Admin
2. **ไปที่เมนู** "จัดการตำแหน่งบริษัท" ใน Admin Panel
3. **เพิ่มตำแหน่งใหม่** โดยระบุ:
   - ชื่อตำแหน่ง
   - พิกัด GPS (Latitude, Longitude)
   - รัศมีที่อนุญาต (เมตร)
   - เวลาทำงาน
   - ที่อยู่

4. **อนุมัติการลงทะเบียน** ของพนักงานใน tab "การลงทะเบียน"

### สำหรับพนักงาน (Employee)

1. **เข้าสู่ระบบ** ด้วยบัญชีพนักงาน
2. **ไปที่เมนู** "ลงทะเบียนตำแหน่ง" ใน Navbar
3. **ขอตำแหน่ง GPS** ปัจจุบัน
4. **เดินทางไปยังสถานที่ทำงาน** ที่ต้องการลงทะเบียน
5. **ลงทะเบียน** เมื่ออยู่ในรัศมีที่อนุญาต
6. **รอการอนุมัติ** จากผู้ดูแลระบบ

## 🔍 คุณสมบัติหลัก

### การจัดการตำแหน่งบริษัท
- ✅ สร้าง แก้ไข ลบ ตำแหน่งบริษัท
- ✅ กำหนดพิกัด GPS และรัศมีที่อนุญาต
- ✅ ตั้งค่าเวลาทำงานและวันที่อนุญาต
- ✅ ระบุสำนักงานใหญ่

### การลงทะเบียนตำแหน่ง
- ✅ ระบบ GPS อัตโนมัติ
- ✅ ตรวจสอบระยะห่างแบบเรียลไทม์
- ✅ ป้องกันการลงทะเบียนซ้ำในวันเดียวกัน
- ✅ ระบบอนุมัติจากผู้ดูแล

### ความปลอดภัย
- ✅ Row Level Security (RLS) policies
- ✅ การยืนยันตัวตน
- ✅ การบันทึก device info และ IP address
- ✅ ระบบการอนุมัติแบบ 2 ขั้นตอน

## 🔄 การเชื่อมต่อกับระบบเช็คอิน

การอัปเดตระบบเช็คอินให้ใช้ตำแหน่งที่ลงทะเบียนจะต้องแก้ไขในไฟล์:
- `TimeClockWidget.jsx`
- `timeTrackingService.js`

เพิ่มการตรวจสอบว่าผู้ใช้ได้ลงทะเบียนตำแหน่งในวันนั้นแล้วหรือไม่ก่อนอนุญาตให้เช็คอิน

## 🐛 การแก้ไขปัญหา

### ปัญหาที่อาจพบ
1. **ไม่สามารถเข้าถึง GPS ได้** - ตรวจสอบการอนุญาตในเบราว์เซอร์
2. **ระยะห่างไม่ถูกต้อง** - ตรวจสอบความแม่นยำของ GPS
3. **ไม่สามารถลงทะเบียนได้** - ตรวจสอบว่าอยู่ในรัศมีที่อนุญาต

### การตรวจสอบ
```sql
-- ตรวจสอบตำแหน่งที่สร้างแล้ว
SELECT * FROM company_locations;

-- ตรวจสอบการลงทะเบียน
SELECT * FROM user_registered_locations;
```

## 📋 Next Steps

1. รัน SQL script ในฐานข้อมูล
2. ทดสอบการทำงานของระบบ
3. เชื่อมต่อกับระบบเช็คอินที่มีอยู่
4. ปรับแต่งการตั้งค่าตามความต้องการ

---

**หมายเหตุ**: ระบบนี้พร้อมใช้งานแล้ว เพียงแค่รัน SQL script และเริ่มแอปพลิเคชัน!