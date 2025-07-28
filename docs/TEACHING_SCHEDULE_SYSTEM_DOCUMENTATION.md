# 📚 Teaching Schedule System - Complete Documentation

## 🎯 ภาพรวมระบบ

ระบบตารางสอน (Teaching Schedule System) เป็นส่วนหนึ่งของ Login Learning Platform ที่ใช้สำหรับจัดการตารางสอนของอาจารย์ในศูนย์เรียนต่างๆ

## 🏗️ สถาปัตยกรรมระบบ

### 1. **Frontend Components**
- **หน้าหลัก**: `TeachingSchedulePage.jsx` (1,900+ บรรทัด)
- **การนำทาง**: Integration ใน AdminLayout, AdminPage, App.jsx
- **Route**: `/admin/teaching-schedule`

### 2. **Database Schema**
- **ไฟล์**: `database/teaching_schedule_schema.sql` (258 บรรทัด)
- **Tables**: 6 ตารางหลัก + Indexes + RLS Policies
- **SQL Creation**: `create_teaching_tables.sql`

### 3. **Data Storage Strategy**
- **หลัก**: localStorage (week-based keys)
- **รอง**: Supabase database (ยังไม่ได้ deploy)

## 📊 โครงสร้างข้อมูล

### Database Tables
1. **`teaching_subjects`** - วิชาที่สอน
   - subject_code, subject_name, color, grade_level
   - เชื่อมโยงกับ courses table เดิม

2. **`learning_centers`** - ศูนย์เรียน
   - center_code, center_name, capacity, facilities
   - operating_hours (JSONB)

3. **`teaching_time_slots`** - ช่วงเวลาสอน
   - start_time, end_time, duration_minutes
   - slot_type (regular, extra, makeup, special)

4. **`teaching_schedules`** - ตารางสอนหลัก
   - subject_id, instructor_id, center_id, time_slot_id
   - day_of_week (0-6), start_date, end_date
   - enrolled_students, max_students

5. **`teaching_schedule_enrollments`** - การลงทะเบียน
   - schedule_id, student_id, status

6. **`teaching_attendance`** - การเข้าเรียน
   - schedule_id, student_id, attendance_date, status

### localStorage Data Structure
```javascript
// Key patterns (ISO week-based)
"teachingSchedules_weekdays_2025_W30": [],
"teachingSchedules_weekends_2025_W30": [],
"createdCourses_weekdays_2025_W30": [],
"createdCourses_weekends_2025_W30": [],
"createdInstructors_weekdays_2025_W30": [],
"createdInstructors_weekends_2025_W30": [],
"dayInstructors_weekdays_2025_W30": {},
"dayInstructors_weekends_2025_W30": {}
```

## 🔧 ฟีเจอร์หลัก

### 1. **การจัดการตาราง**
- แสดงตารางแบบ Grid (เวลา x วัน)
- แยกโหมด weekdays (จ-ศ) และ weekends (ส-อา)
- Navigation ระหว่างสัปดาห์

### 2. **การสร้างรายการ**
- สร้างวิชา (Courses) พร้อมสี
- สร้างอาจารย์ (Instructors)
- จัดการศูนย์เรียน (Centers)

### 3. **Drag & Drop System**
- ลากอาจารย์/วิชาไปวางในตาราง
- Resize ตารางเรียน (ขยายเวลา)
- ลากไปถังขยะเพื่อลบ

### 4. **Permission System**
- **SUPER_ADMIN**: จัดการได้ทั้งหมด
- **INSTRUCTOR**: แก้ไขได้
- **BRANCH_MANAGER**: ดูได้ทั้งหมด
- **STUDENT**: ห้ามเข้า

### 5. **Data Migration System**
- Auto-migration จาก date-based เป็น ISO week-based
- Backward compatibility
- Force migration tools

## 🎨 UI/UX Design

### Layout Structure
```
Header (gradient blue)
├── Title + Status indicators
├── Edit mode toggle
└── User permissions display

Navigation Bar
├── Schedule type toggle (weekdays/weekends)
├── Week navigation (prev/next)
├── Current week display
└── Quick actions (create course/instructor)

Main Content
├── Centers legend
├── Time slots grid
├── Days columns
└── Schedule items (drag & drop)

Modals
├── Create Course Modal
├── Edit Course Modal
├── Create Instructor Modal
├── Edit Instructor Modal
└── Select Instructor Modal
```

### Visual Elements
- **Colors**: Gradient backgrounds, status indicators
- **Animation**: Framer Motion transitions
- **Icons**: Lucide React icons
- **Loading**: Custom spinners with animations

## 💾 Data Flow Architecture

### 1. **State Management**
```javascript
// Main states
const [schedules, setSchedules] = useState([]);
const [currentWeek, setCurrentWeek] = useState(new Date());
const [selectedScheduleType, setSelectedScheduleType] = useState('weekdays');
const [isTransitioning, setIsTransitioning] = useState(false);

// Dynamic data
const [createdCourses, setCreatedCourses] = useState([]);
const [createdInstructors, setCreatedInstructors] = useState([]);
const [dayInstructors, setDayInstructors] = useState({});
```

### 2. **localStorage Persistence**
- **Save**: useEffect หลังจาก state เปลี่ยน
- **Load**: loadDataWithBackwardCompatibility()
- **Migration**: runComprehensiveMigration()

### 3. **Week-based Key Generation**
```javascript
// ISO week calculation
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Key generation
const getWeekKey = (date, type) => {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${type}_${year}_W${week.toString().padStart(2, '0')}`;
};
```

## 🔄 Migration System

### Problem Solved
- **เก่า**: Sunday-based week calculation → data mixing
- **ใหม่**: ISO week calculation → consistent keys

### Migration Functions
1. **`runComprehensiveMigration()`** - รัน migration ทั้งหมด
2. **`migrateOldData()`** - migration สำหรับ week เฉพาะ
3. **`forceMigration()`** - บังคับ migration ใหม่

### Auto-Migration Flow
```javascript
React.useEffect(() => {
  const hasMigrated = localStorage.getItem('teaching_schedule_migrated');
  if (!hasMigrated) {
    const migrated = runComprehensiveMigration();
    if (migrated > 0) {
      // บันทึก migration status
      // Force reload data
      // Refresh หน้า
    }
  }
}, []);
```

## 🛠️ Debug Tools & Testing

### Debug Files Created
1. **`comprehensive_data_recovery.js`** - เครื่องมือกู้คืนข้อมูล
2. **`localStorage_inspector.js`** - ตรวจสอบ localStorage
3. **`debug_week_keys.js`** - ทดสอบ week key generation
4. **`debug_localStorage.cjs`** - Node.js debug script
5. **`DATA_RECOVERY_INSTRUCTIONS.md`** - คำแนะนำการใช้งาน

### Browser Console Tools
```javascript
// Available in browser
window.TeachingScheduleMigration = {
  runMigration: () => {},
  forceMigration: () => {},
  checkData: () => {}
};
```

## 🔒 Security & RLS

### Row Level Security Policies
- **View Permission**: authenticated users only
- **Manage Permission**: instructor, admin, branch_manager
- **Student Restriction**: students ห้ามดูตารางสอน

### Role-based Access
```sql
CREATE POLICY "Teaching schedules viewable by non-students only" ON teaching_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('instructor', 'admin', 'branch_manager')
    )
  );
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Stack layout, simplified grid
- **Tablet**: Compressed time slots
- **Desktop**: Full grid layout

### Mobile Optimizations
- Touch-friendly drag & drop
- Swipe navigation
- Condensed time display

## 🧩 Integration Points

### Router Integration
```javascript
// App.jsx
<Route path="teaching-schedule" element={<TeachingSchedulePage />} />

// AdminLayout.jsx
{
  title: 'ตารางสอน',
  icon: Calendar,
  path: '/admin/teaching-schedule',
  description: 'จัดการตารางเรียนอาจารย์'
}
```

### Auth Context Usage
```javascript
const { user, userRole, hasRole, ROLES } = useAuth();
const canEdit = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.INSTRUCTOR);
```

## 📈 Performance Considerations

### Optimization Strategies
1. **React.lazy()** - Code splitting
2. **useCallback()** - Memoized functions
3. **Conditional rendering** - Reduce DOM nodes
4. **localStorage caching** - Avoid database calls

### Memory Management
- Cleanup event listeners
- Clear timeouts
- Reset states on unmount

## 🚫 ปัญหาที่เคยเกิดขึ้น

### 1. **Data Mixing Between Weeks**
- **สาเหตุ**: Sunday-based week calculation
- **ผลกระทบ**: เสาร์/อาทิตย์ได้ key คนละตัว
- **แก้ไข**: เปลี่ยนเป็น ISO week + migration system

### 2. **Data Loss When Navigating**
- **สาเหตุ**: Migration system ไม่ครอบคลุม
- **ผลกระทบ**: ข้อมูลเก่าหาย
- **แก้ไข**: Comprehensive migration + auto-migration

### 3. **Performance Issues**
- **สาเหตุ**: Large component, complex state
- **ผลกระทบ**: ช้าในการ render
- **แก้ไข**: Code splitting + memoization

## 🎯 สรุปคอนเซปหลัก

### Core Concepts
1. **Week-based Data Isolation** - แยกข้อมูลตามสัปดาห์
2. **Type-based Separation** - แยก weekdays/weekends
3. **Permission-based Access** - ควบคุมสิทธิ์ตาม role
4. **Drag & Drop Interface** - UI สำหรับจัดการตาราง
5. **Auto-Migration System** - รักษา backward compatibility

### Key Technologies
- **React** + **useState/useEffect** - State management
- **Framer Motion** - Animations
- **localStorage** - Client-side persistence
- **Supabase** - Database backend (planned)
- **ISO Week Standard** - Consistent week calculation

---

**📝 หมายเหตุ**: เอกสารนี้สร้างขึ้นก่อนการลบระบบออก เพื่อเก็บความรู้และคอนเซปสำหรับการพัฒนาในอนาคต