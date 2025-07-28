// TypeScript Type Definitions for Teaching Schedule System

export interface Course {
  id: string;
  name: string;
  description: string;
  company: string;
  companyColor: string;
  location: string;
  colorSource: 'company' | 'location';
}

export interface Instructor {
  id: string;
  name: string;
  shortName: string;
  color: string;
  email?: string;
  specialties?: string[];
}

export interface ScheduleItem {
  id: string;
  course: Course;
  dayId: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  instructor?: Instructor;
  location?: string;
  slotKey: string;
  duration: number;
  instructorId?: string;
}

export interface Day {
  id: string;
  name: string;
  shortName: string;
  date?: string;
}

export interface Company {
  id: string;
  name: string;
  color: string;
}

export interface Location {
  id: string;
  name: string;
  color: string;
}

export interface DragItem {
  type: string;
  course?: Course;
  instructor?: Instructor;
  instructors?: Instructor[];
  schedule?: ScheduleItem;
  dayId?: string;
}

export interface DropResult {
  item: DragItem;
  dayId: string;
  timeSlot: string;
  instructor?: Instructor;
}

export type ScheduleType = 'weekly' | 'monthly';
export type ViewMode = 'instructor' | 'course';

export interface ScheduleState {
  courses: Course[];
  instructors: Instructor[];
  dayInstructors: Record<string, Instructor[]>;
  instructorSchedules: Record<string, ScheduleItem>;
  schedules: Record<string, ScheduleItem>;
  currentWeek: Date;
  scheduleType: ScheduleType;
  isLoading: boolean;
}

// Form Data Types
export interface CourseFormData {
  name: string;
  description: string;
  company: string;
  location: string;
  colorSource: 'company' | 'location';
  companyColor?: string;
}

export interface InstructorFormData {
  name: string;
  shortName: string;
  color: string;
  email?: string;
  specialties?: string[];
}

// Toast Types
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

// Drag and Drop Item Types
export const ItemTypes = {
  COURSE: 'course',
  SCHEDULE_ITEM: 'schedule_item',
  INSTRUCTOR: 'instructor',
  INSTRUCTOR_ASSIGNMENT: 'instructor_assignment'
} as const;

export type ItemType = typeof ItemTypes[keyof typeof ItemTypes];