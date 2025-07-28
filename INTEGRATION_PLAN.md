# 🔗 Teaching Schedule Integration Plan
## Next.js Table_teaching + Original Concepts

## 📊 Current State Analysis

### Table_teaching Project (Target)
- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Custom hooks (useState-based)
- **Drag & Drop**: react-dnd
- **Data Storage**: In-memory (useState only)
- **Focus**: Weekend schedules only

### Original System (Source Concepts)
- **Framework**: React + Vite + JavaScript
- **Data Storage**: localStorage + Supabase schema
- **Week Management**: ISO week-based keys
- **Schedule Types**: weekdays + weekends separation
- **Migration System**: Comprehensive backward compatibility
- **Features**: Complex drag & drop, resize, permissions

## 🎯 Integration Strategy

### Phase 1: Core Foundation
1. **Week-based Data Management**
   ```typescript
   // Add to lib/utils.ts
   export function getISOWeek(date: Date): number
   export function getWeekKey(date: Date, type: string): string
   ```

2. **localStorage Enhancement**
   ```typescript
   // Replace in-memory state with localStorage
   // Pattern: "{type}_{year}_W{week}"
   // Example: "schedules_weekends_2025_W30"
   ```

3. **Schedule Type Separation**
   ```typescript
   type ScheduleType = 'weekdays' | 'weekends';
   // Extend existing hooks to support both types
   ```

### Phase 2: Advanced Features
1. **Week Navigation**
   - Previous/Next week buttons
   - Week range display
   - Current week indicator

2. **Data Persistence**
   - localStorage with JSON.parse/stringify
   - Auto-save on state changes
   - Migration system for old data

3. **Enhanced UI**
   - Week selector component
   - Schedule type toggle
   - Status indicators

### Phase 3: Database Integration
1. **Supabase Schema**
   - Implement original 6-table schema
   - TypeScript types generation
   - RLS policies

2. **Sync Strategy**
   - localStorage as cache
   - Supabase as source of truth
   - Offline-first approach

## 🛠️ Implementation Plan

### 1. Enhance Existing Hooks

#### use-schedule.ts Enhancement
```typescript
// Current: In-memory array
const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

// Enhanced: Week-based localStorage
const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
const [scheduleType, setScheduleType] = useState<'weekdays' | 'weekends'>('weekends');

// Auto-load from localStorage based on week + type
useEffect(() => {
  const key = getWeekKey(currentWeek, `schedules_${scheduleType}`);
  const saved = localStorage.getItem(key);
  if (saved) {
    setScheduleItems(JSON.parse(saved));
  } else {
    // Try migration from old format
    const migrated = migrateOldData(currentWeek, `schedules_${scheduleType}`);
    setScheduleItems(migrated || []);
  }
}, [currentWeek, scheduleType]);

// Auto-save to localStorage
useEffect(() => {
  const key = getWeekKey(currentWeek, `schedules_${scheduleType}`);
  localStorage.setItem(key, JSON.stringify(scheduleItems));
}, [scheduleItems, currentWeek, scheduleType]);
```

#### use-courses.ts Enhancement
```typescript
// Add week-based storage
const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
const [scheduleType, setScheduleType] = useState<'weekdays' | 'weekends'>('weekends');

// Load/save courses per week + type
useEffect(() => {
  const key = getWeekKey(currentWeek, `courses_${scheduleType}`);
  const saved = localStorage.getItem(key);
  if (saved) {
    setCourses(JSON.parse(saved));
  }
}, [currentWeek, scheduleType]);
```

### 2. New Components to Create

#### WeekNavigation.tsx
```typescript
interface WeekNavigationProps {
  currentWeek: Date;
  onWeekChange: (week: Date) => void;
  scheduleType: 'weekdays' | 'weekends';
  onScheduleTypeChange: (type: 'weekdays' | 'weekends') => void;
}

export function WeekNavigation({ ... }) {
  // Previous/Next week buttons
  // Week range display (Mon-Fri or Sat-Sun)
  // Schedule type toggle
}
```

#### MigrationProvider.tsx
```typescript
export function MigrationProvider({ children }) {
  useEffect(() => {
    // Run comprehensive migration on first load
    const hasMigrated = localStorage.getItem('teaching_schedule_migrated');
    if (!hasMigrated) {
      runComprehensiveMigration();
      localStorage.setItem('teaching_schedule_migrated', new Date().toISOString());
    }
  }, []);
  
  return children;
}
```

### 3. Enhanced ScheduleGrid

#### Day Column Logic
```typescript
// Current: Static weekend days
const weekendDays = ['เสาร์', 'อาทิตย์'];

// Enhanced: Dynamic based on schedule type
const getCurrentDays = (scheduleType: 'weekdays' | 'weekends') => {
  if (scheduleType === 'weekdays') {
    return ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
  } else {
    return ['เสาร์', 'อาทิตย์'];
  }
};
```

#### Time Slots Enhancement
```typescript
// Current: 08:00-20:00
// Enhanced: Configurable per schedule type
const getTimeSlots = (scheduleType: 'weekdays' | 'weekends') => {
  const baseSlots = ['08:00', '09:00', '10:00', ...];
  
  if (scheduleType === 'weekends') {
    return baseSlots; // Keep current
  } else {
    return baseSlots.slice(0, 11); // 08:00-18:00 for weekdays
  }
};
```

### 4. TypeScript Types Enhancement

#### Base Types
```typescript
// Extend existing types
export interface ScheduleItem {
  id: string;
  courseId: string;
  instructorId: string;
  day: string;
  time: string;
  duration: number;
  week?: number; // Add week number
  year?: number; // Add year
}

export interface Course {
  id: string;
  name: string;
  color: string;
  center?: string; // Add center concept
  category?: string; // Add category
}

export interface Instructor {
  id: string;
  name: string;
  specialties?: string[]; // Add specialties
  availability?: {
    weekdays: boolean;
    weekends: boolean;
  };
}
```

### 5. Migration System

#### lib/migration.ts
```typescript
// Copy from original system
export function runComprehensiveMigration(): number
export function migrateOldData(currentWeek: Date, type: string): any[]
export function convertOldKeyToNew(oldKey: string): string | null

// Add to existing project
export function getISOWeek(date: Date): number
export function getWeekKey(date: Date, type: string): string
```

## 🎨 UI/UX Enhancements

### 1. Header Enhancement
```tsx
// Add to existing page.tsx
<div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 rounded-lg mb-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">ตารางสอน</h1>
      <p className="text-blue-200">จัดการตารางเรียนอาจารย์</p>
    </div>
    <WeekNavigation {...props} />
  </div>
</div>
```

### 2. Enhanced Sidebar
```tsx
// Extend app-sidebar.tsx
<div className="space-y-4">
  <ScheduleTypeToggle />
  <WeekDisplay />
  <CourseManager />
  <InstructorManager />
  <MigrationTools /> {/* Development only */}
</div>
```

## 🔄 Data Flow Architecture

### Current Flow
```
User Action → Hook State → Component Re-render
```

### Enhanced Flow
```
User Action → Hook State → localStorage → Component Re-render
                     ↓
            Week/Type Change → Load Different Data
                     ↓
            Migration Check → Convert Old Data
```

## 📅 Implementation Timeline

### Week 1: Foundation
- [x] Analyze existing project
- [ ] Implement ISO week utilities
- [ ] Add localStorage to hooks
- [ ] Create WeekNavigation component

### Week 2: Features
- [ ] Add weekdays/weekends separation
- [ ] Implement migration system
- [ ] Enhanced drag & drop
- [ ] Week navigation

### Week 3: Polish
- [ ] UI/UX improvements
- [ ] TypeScript refinements
- [ ] Testing and debugging
- [ ] Documentation

### Week 4: Database
- [ ] Supabase integration
- [ ] Schema implementation
- [ ] Sync functionality
- [ ] Deployment

## 🎯 Success Criteria

### Core Features
- ✅ Week-based data separation
- ✅ Weekdays/weekends toggle
- ✅ Data persistence across sessions
- ✅ Migration from old formats
- ✅ Intuitive drag & drop

### Technical Excellence
- ✅ TypeScript throughout
- ✅ Performance optimization
- ✅ Responsive design
- ✅ Error handling
- ✅ Code maintainability

## 🔧 Development Commands

```bash
# Clone and setup
git clone https://github.com/techit45/Table_teaching.git
cd Table_teaching
npm install

# Development
npm run dev
npm run build
npm run lint

# Add new packages
npm install date-fns  # For date utilities
npm install @supabase/supabase-js  # For database
```

## 📝 Notes

1. **Preserve Existing**: Keep current weekend functionality working
2. **Gradual Enhancement**: Add features incrementally
3. **Backward Compatibility**: Support old data formats
4. **TypeScript First**: Maintain type safety
5. **Performance**: Optimize localStorage operations

---

**🎯 Goal**: Transform Table_teaching into a comprehensive week-based teaching schedule system while preserving existing functionality and adding advanced features from the original system.