# 🛠️ แก้ไขปัญหา Storage ผ่าน Supabase Dashboard

## ❌ ปัญหา: ERROR: 42501: must be owner of table objects

SQL Editor ไม่มีสิทธิ์จัดการ `storage.objects` โดยตรง ต้องใช้ Dashboard แทน

---

## ✅ วิธีแก้ไขผ่าน Dashboard

### 🗄️ ขั้นตอนที่ 1: ตั้งค่า Storage Bucket

1. **ไปที่ Supabase Dashboard** → **Storage**
2. **คลิกที่ bucket "course-files"** (ถ้ามี) หรือ **สร้างใหม่**
3. **คลิก Settings (เฟือง)** ตรงมุมขวาบน
4. **ตั้งค่าดังนี้:**
   ```
   ✅ Public bucket: ON
   📏 File size limit: 52428800 (50MB)
   📄 Allowed MIME types: (ว่างเปล่า - อนุญาตทุกประเภท)
   ```
5. **คลิก "Update bucket"**

### 🔐 ขั้นตอนที่ 2: ตั้งค่า Storage Policies

1. **ไปที่ Storage** → **Policies** (แท็บถัดจาก Buckets)
2. **ลบ policies เก่าทั้งหมด** ที่เกี่ยวกับ `course-files`
3. **สร้าง policies ใหม่** โดยคลิก **"New policy"**

#### Policy 1: อนุญาตให้ทุกคนดูไฟล์
```
Policy name: Anyone can view course files
Allowed operation: SELECT
Target roles: public
USING expression: bucket_id = 'course-files'
```

#### Policy 2: อนุญาตให้ user ที่ login แล้วอัปโหลด
```
Policy name: Authenticated users can upload
Allowed operation: INSERT  
Target roles: authenticated
WITH CHECK expression: bucket_id = 'course-files'
```

#### Policy 3: อนุญาตให้ user ที่ login แล้วอัปเดต
```
Policy name: Authenticated users can update
Allowed operation: UPDATE
Target roles: authenticated  
USING expression: bucket_id = 'course-files'
```

#### Policy 4: อนุญาตให้ user ที่ login แล้วลบ
```
Policy name: Authenticated users can delete
Allowed operation: DELETE
Target roles: authenticated
USING expression: bucket_id = 'course-files'
```

### 🧪 ขั้นตอนที่ 3: ทดสอบการอัปโหลด

1. **กลับไปที่ระบบ** (รีเฟรชหน้า F5)
2. **ไปที่หน้าจัดการเนื้อหา** → แก้ไขเนื้อหา → แท็บ "ไฟล์แนบ"
3. **คลิก "ตรวจสอบระบบ"** - ควรเป็นสีเขียวทั้งหมด
4. **ลองอัปโหลดไฟล์ทดสอบ**

---

## 🚀 วิธีแก้ไขแบบง่าย (หากขั้นตอนข้างบนยุ่งยาก)

### วิธีที่ 1: ใช้ Policy Templates
1. ไปที่ **Storage** → **Policies**
2. คลิก **"Use template"** 
3. เลือก **"Allow public read access"**
4. เลือก **"Allow authenticated uploads"**

### วิธีที่ 2: รัน SQL แบบง่าย (ถ้าทำได้)
รันแค่ SQL นี้ใน SQL Editor:
```sql
-- สร้าง/อัปเดต bucket ให้เป็น public
UPDATE storage.buckets 
SET public = true, file_size_limit = 52428800
WHERE name = 'course-files';

-- หรือสร้างใหม่ถ้ายังไม่มี
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-files', 'course-files', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;
```

---

## 📋 Checklist การตั้งค่า

- [ ] **Bucket "course-files" มีอยู่**
- [ ] **Public bucket = ON**
- [ ] **File size limit = 50MB+**
- [ ] **มี Policy สำหรับ SELECT (ดูไฟล์)**
- [ ] **มี Policy สำหรับ INSERT (อัปโหลด)**
- [ ] **ทดสอบ "ตรวจสอบระบบ" ผ่าน**
- [ ] **อัปโหลดไฟล์ทดสอบสำเร็จ**

---

## 🆘 หากยังไม่ได้

### วิธีสุดท้าย: สร้าง Bucket ใหม่
1. **ลบ bucket "course-files" เก่า**
2. **สร้าง bucket ใหม่:**
   - ชื่อ: `course-files`
   - ✅ Public: ON
   - ขนาด: 50MB
3. **ใช้ Policy Templates**
4. **ทดสอบอีกครั้ง**

---

*หลังจากทำตามขั้นตอนแล้ว กลับมาทดสอบการอัปโหลดไฟล์ใหม่นะครับ!* 🎯