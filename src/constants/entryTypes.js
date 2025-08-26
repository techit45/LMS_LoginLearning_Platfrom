// Entry Types Constants - มาตรฐานประเภทงานสำหรับระบบทั้งหมด
// ใช้ร่วมกันใน TimeClockWidget และ WorkHoursManagement

export const ENTRY_TYPES = {
  TEACHING: 'teaching',
  MEETING: 'meeting',
  PREP: 'prep',
  ADMIN: 'admin',
  BREAK: 'break',
  OTHER: 'other'
};

export const ENTRY_TYPE_CONFIG = {
  [ENTRY_TYPES.TEACHING]: {
    label: 'การสอน',
    color: '#EF4444',
    lightColor: '#FEE2E2',
    defaultRate: 750,
    icon: 'BookOpen',
    description: 'การสอนนักเรียน'
  },
  [ENTRY_TYPES.MEETING]: {
    label: 'ประชุม',
    color: '#3B82F6',
    lightColor: '#DBEAFE',
    defaultRate: 500,
    icon: 'Users',
    description: 'การประชุมงาน'
  },
  [ENTRY_TYPES.PREP]: {
    label: 'เตรียมการสอน',
    color: '#8B5CF6',
    lightColor: '#EDE9FE',
    defaultRate: 400,
    icon: 'Edit3',
    description: 'เตรียมเนื้อหาและอุปกรณ์การสอน'
  },
  [ENTRY_TYPES.ADMIN]: {
    label: 'งานธุรการ',
    color: '#10B981',
    lightColor: '#D1FAE5',
    defaultRate: 500,
    icon: 'Settings',
    description: 'งานเอกสารและธุรการ'
  },
  [ENTRY_TYPES.BREAK]: {
    label: 'พักเบรก',
    color: '#6B7280',
    lightColor: '#F3F4F6',
    defaultRate: 0,
    icon: 'Coffee',
    description: 'เวลาพักผ่อน'
  },
  [ENTRY_TYPES.OTHER]: {
    label: 'อื่นๆ',
    color: '#06B6D4',
    lightColor: '#CFFAFE',
    defaultRate: 500,
    icon: 'Clock',
    description: 'งานอื่นๆ'
  }
};

// Work Location Constants
export const WORK_LOCATIONS = {
  ONSITE: 'onsite',
  REMOTE: 'remote', 
  ONLINE: 'online'
};

export const WORK_LOCATION_CONFIG = {
  [WORK_LOCATIONS.ONSITE]: {
    label: 'ที่ศูนย์/สำนักงาน',
    icon: 'Building',
    description: 'ทำงานที่สถานที่ปฏิบัติงาน'
  },
  [WORK_LOCATIONS.REMOTE]: {
    label: 'ทำงานนอกสถานที่',
    icon: 'MapPin', 
    description: 'ทำงานที่บ้านหรือสถานที่อื่น'
  },
  [WORK_LOCATIONS.ONLINE]: {
    label: 'การสอนออนไลน์',
    icon: 'Monitor',
    description: 'สอนผ่านแพลตฟอร์มออนไลน์'
  }
};

// Helper functions
export const getEntryTypeConfig = (entryType) => {
  return ENTRY_TYPE_CONFIG[entryType] || ENTRY_TYPE_CONFIG[ENTRY_TYPES.OTHER];
};

export const getWorkLocationConfig = (workLocation) => {
  return WORK_LOCATION_CONFIG[workLocation] || WORK_LOCATION_CONFIG[WORK_LOCATIONS.ONSITE];
};

export const getDefaultHourlyRate = (entryType) => {
  return getEntryTypeConfig(entryType).defaultRate;
};

export const getAllEntryTypes = () => {
  return Object.values(ENTRY_TYPES);
};

export const getAllWorkLocations = () => {
  return Object.values(WORK_LOCATIONS);
};