# 🚨 Google Drive Storage Quota Solution

## 📋 สถานะปัจจุบัน
- ✅ **ดูไฟล์**: ใช้งานได้ปกติ
- ✅ **สร้างโฟลเดอร์**: ใช้งานได้ปกติ
- ✅ **ลบไฟล์/โฟลเดอร์**: ใช้งานได้ปกติ  
- ✅ **เปลี่ยนชื่อ**: ใช้งานได้ปกติ
- ❌ **อัพโหลดไฟล์**: ไม่สามารถใช้งานได้

## ⚠️ ปัญหาที่พบ
```
Service Accounts do not have storage quota. 
Leverage shared drives or use OAuth delegation instead.
```

**สาเหตุ**: Service Account ไม่มี Google Drive storage quota สำหรับการอัพโหลดไฟล์

## 💡 วิธีแก้ไข

### 🎯 Option 1: ใช้ Shared Drive (แนะนำ - ง่ายที่สุด)

#### ขั้นตอนที่ 1: สร้าง Shared Drive
1. เปิด https://drive.google.com
2. คลิก **"New"** > **"Shared drive"**
3. ตั้งชื่อ: **"Login Learning Platform"**
4. คลิก **"Create"**

#### ขั้นตอนที่ 2: เพิ่ม Service Account
1. คลิกขวาที่ Shared Drive ที่สร้าง
2. เลือก **"Share"**
3. เพิ่ม email: `login-learning-drive@platformlogin.iam.gserviceaccount.com`
4. ให้สิทธิ์: **"Manager"** หรือ **"Content manager"**
5. คลิก **"Send"**

#### ขั้นตอนที่ 3: อัพเดท Code
1. Copy **Shared Drive ID** จาก URL
2. อัพเดท `.env`:
   ```env
   VITE_GOOGLE_DRIVE_DEFAULT_FOLDER=<SHARED_DRIVE_ID>
   ```

### 🔧 Option 2: OAuth Delegation (ซับซ้อนกว่า)
1. ตั้งค่า **Domain-wide delegation** ใน Google Cloud Console
2. ใช้ **Google Workspace admin**
3. **Delegate authority** ให้ service account
4. เปลี่ยนการ authentication เป็น OAuth flow

### Option 2: ใช้ OAuth Delegation (ซับซ้อนกว่า)
1. ตั้งค่า Domain-wide delegation
2. ใช้ Google Workspace admin
3. Delegate authority ให้ service account

## การทดสอบปัจจุบัน

### ✅ สิ่งที่ทำงานได้:
- List files in shared folder: ✅
- Create folders: ✅ (สร้าง "Test Folder - 1753793369" สำเร็จ)
- API connectivity: ✅
- Authentication: ✅

### ❌ สิ่งที่ยังไม่ได้:
- Upload files: ❌ (Storage quota issue)

## Immediate Solution
ให้ owner ของ Google Drive ไปสร้าง Shared Drive และเพิ่ม service account เข้าไป

## ผลการทดสอบ
```json
{
    "files": [
        {
            "parents": ["134qcR1t2BQqRUJCHexjLEoDZjU9MWPLY"],
            "id": "1uwxV-JR_xWHq3V1YbUs0nknsCsFoegTH",
            "name": "Test Folder - 1753793369",
            "mimeType": "application/vnd.google-apps.folder",
            "webViewLink": "https://drive.google.com/drive/folders/1uwxV-JR_xWHq3V1YbUs0nknsCsFoegTH",
            "createdTime": "2025-07-29T12:49:29.846Z",
            "modifiedTime": "2025-07-29T12:49:29.846Z"
        }
    ]
}
```

## สรุป
- ✅ ระบบทำงานใน folder ID ที่ถูกต้อง: `134qcR1t2BQqRUJCHexjLEoDZjU9MWPLY`
- ✅ สร้าง folder ได้
- ❌ อัพโหลดไฟล์ต้องใช้ Shared Drive