# Login Learning Platform - Claude Sub Agents

Sub agents เฉพาะสำหรับโครงการ Login Learning Platform เพื่อช่วยให้การพัฒนาและบำรุงรักษาระบบมีประสิทธิภาพมากขึ้น

## 📋 Sub Agents ที่พร้อมใช้งาน

### 1. `/login-debug` - ระบบ Debug และแก้ไขปัญหา
**คำสั่ง**: `/login-debug [problem-description]`
**วัตถุประสงค์**: แก้ไขปัญหาเฉพาะของ Login Learning Platform
**ความสามารถ**:
- วิเคราะห์ log files (frontend.log, server.log, dev.log)
- ตรวจสอบ Supabase connection และ RLS policies
- Debug Google Drive API integration
- แก้ไข React/Vite development issues
- ตรวจสอบ authentication และ authorization

### 2. `/login-database` - การจัดการฐานข้อมูล
**คำสั่ง**: `/login-database [task-description]`
**วัตถุประสงค์**: จัดการ database schema และ migrations
**ความสามารถ**:
- สร้างและอัปเดต SQL migrations
- ตรวจสอบ RLS policies และ permissions
- จัดการ sample data และ test data
- แก้ไข database connectivity issues
- ปรับปรุง performance queries

### 3. `/login-ui` - User Interface และ UX
**คำสั่ง**: `/login-ui [component-or-page]`
**วัตถุประสงค์**: พัฒนาและปรับปรุง UI components
**ความสามารถ**:
- สร้างและแก้ไข React components
- ปรับปรุง responsive design
- แก้ไข Tailwind CSS styling
- ปรับปรุง accessibility
- ทำ UI testing และ optimization

### 4. `/login-features` - Feature Development
**คำสั่ง**: `/login-features [feature-name]`
**วัตถุประสงค์**: พัฒนา features ใหม่และปรับปรุงที่มีอยู่
**ความสามารถ**:
- สร้าง course management features
- พัฒนา project showcase system
- ปรับปรุง admin panel functionality
- สร้าง multi-company architecture
- Integration กับ Google Drive

### 5. `/login-deploy` - Deployment และ Production
**คำสั่ง**: `/login-deploy [environment]`
**วัตถุประสงค์**: จัดการ deployment และ production issues
**ความสามารถ**:
- ตรวจสอบ Netlify deployment
- จัดการ environment variables
- ปรับปรุง build configuration
- ตรวจสอบ production performance
- แก้ไข deployment errors

### 6. `/login-google-drive` - Google Drive Integration
**คำสั่ง**: `/login-google-drive [operation]`
**วัตถุประสงค์**: จัดการ Google Drive API และ file management
**ความสามารถ**:
- ตรวจสอบ Service Account configuration
- แก้ไข shared drive permissions
- จัดการ folder structure automation
- Debug file upload/download issues
- ปรับปรุง Drive API performance

## 🎯 การใช้งาน Sub Agents

### ตัวอย่างการใช้งาน:

```bash
# Debug authentication issues
/login-debug "Users can't login, getting 401 errors"

# Add new database table
/login-database "Create announcements table with RLS policies"

# Fix responsive design
/login-ui "Fix mobile layout for AdminProjectsPage"

# Add new feature
/login-features "Create announcement system for admin"

# Fix deployment issue
/login-deploy "Build failing on Netlify with module errors"

# Fix Google Drive folder creation
/login-google-drive "Projects not creating folders automatically"
```

### ข้อมูลที่ Sub Agents จะใช้:
- **CLAUDE.md**: Knowledge base และ project documentation
- **Project structure**: ไฟล์และโฟลเดอร์ในโครงการ
- **Log files**: frontend.log, server.log, dev.log
- **Configuration files**: package.json, vite.config.js, netlify.toml
- **Database files**: SQL scripts และ migrations
- **Environment setup**: .env และ credentials

## 📚 Sub Agent Workflows

### 1. Bug Fix Workflow (`/login-debug`)
1. วิเคราะห์ error description
2. ตรวจสอบ relevant log files
3. ระบุ root cause
4. เสนอ solution พร้อม code fix
5. Update documentation ถ้าจำเป็น

### 2. Feature Development Workflow (`/login-features`)
1. วิเคราะห์ feature requirements
2. ตรวจสอบ existing codebase
3. สร้าง implementation plan
4. เขียน code และ tests
5. Update CLAUDE.md documentation

### 3. Database Migration Workflow (`/login-database`)
1. วิเคราะห์ schema changes
2. สร้าง migration scripts
3. ทดสอบ migration safety
4. Update RLS policies
5. สร้าง sample data ถ้าจำเป็น

## 🔧 การบำรุงรักษา Sub Agents

Sub agents เหล่านี้จะได้รับการอัปเดตตาม:
- การเปลี่ยนแปลงใน project structure
- ปัญหาใหม่ที่พบในการพัฒนา
- Feedback จากการใช้งานจริง
- Technology stack updates

## 📝 Contributing

เมื่อใช้ sub agents:
1. ระบุปัญหาหรือ requirement ให้ชัดเจน
2. แจ้ง context เพิ่มเติมถ้าจำเป็น
3. รายงาน results กลับมาเพื่อปรับปรุง
4. อัปเดต documentation หลังแก้ไข

---
Last Updated: July 30, 2025
Login Learning Platform Version: 2.3.0