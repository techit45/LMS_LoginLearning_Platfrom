# Google Drive Integration Setup Guide

## ปัญหาปัจจุบัน
การเชื่อมต่อ Google Drive ไม่สามารถใช้งานได้เนื่องจาก:
- Service Account ยังไม่ได้ enable Google Drive API
- ไม่ได้ share folder target กับ service account
- ไม่ได้ตั้งค่า OAuth consent screen

## วิธีแก้ไข

### 1. Enable Google Drive API
```bash
# ใน Google Cloud Console
1. ไปที่ https://console.cloud.google.com/
2. เลือก project "platformlogin"
3. ไปที่ APIs & Services > Library
4. ค้นหา "Google Drive API"
5. คลิก Enable
```

### 2. แชร์ Google Drive Folder
```bash
# Service Account Email: login-learning-drive@platformlogin.iam.gserviceaccount.com
1. เปิด Google Drive
2. ไปที่ folder ID: 134qcR1t2BQqRUJCHexjLEoDZjU9MWPLY
3. คลิกขวา > Share
4. เพิ่ม login-learning-drive@platformlogin.iam.gserviceaccount.com
5. ให้สิทธิ์ Editor
```

### 3. ทดสอบการเชื่อมต่อ
```bash
# ใน terminal
npm run server
curl http://127.0.0.1:3001/health
curl "http://127.0.0.1:3001/api/drive/list?folderId=root"
```

## ทางเลือกอื่น: ใช้ Personal Access Token
หากต้องการใช้งานได้ทันที สามารถใช้ Google API Key แทน Service Account:

1. ไปที่ Google Cloud Console
2. APIs & Services > Credentials
3. Create Credentials > API Key
4. เพิ่มใน .env: `GOOGLE_API_KEY=your_api_key_here`

## สถานะปัจจุบัน
- ✅ Server code พร้อมใช้งาน
- ✅ Frontend components พร้อมใช้งาน  
- ✅ Credentials file มีอยู่
- ❌ Google Drive API ยังไม่ได้ enable
- ❌ Service Account ยังไม่ได้ share folder

## การทดสอบ
เมื่อแก้ไขแล้ว ให้ทดสอบที่:
- http://localhost:5174/test-drive (หน้าทดสอบ Google Drive)
- หรือเรียกใช้ API โดยตרงที่ http://127.0.0.1:3001/api/drive/