// Schedule utility functions

export const getWeekRange = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(start.setDate(diff));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    dates.push(currentDate);
  }
  return dates;
};

export const formatDate = (date) => {
  return date.toLocaleDateString('th-TH', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatShortDate = (date) => {
  return date.toLocaleDateString('th-TH', { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short'
  });
};

export const getISOWeek = (date) => {
  const tempDate = new Date(date.valueOf());
  const dayn = (date.getDay() + 6) % 7;
  tempDate.setDate(tempDate.getDate() - dayn + 3);
  const firstThursday = tempDate.valueOf();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) {
    tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - tempDate) / 604800000);
};

export const timeSlots = [
  { start: '08:00', end: '09:30', label: '08:00 - 09:30' },
  { start: '09:45', end: '11:15', label: '09:45 - 11:15' },
  { start: '11:30', end: '13:00', label: '11:30 - 13:00' },
  { start: '14:00', end: '15:30', label: '14:00 - 15:30' },
  { start: '15:45', end: '17:15', label: '15:45 - 17:15' },
  { start: '18:00', end: '19:30', label: '18:00 - 19:30' },
  { start: '19:45', end: '21:15', label: '19:45 - 21:15' }
];

// Mock data - ในอนาคตจะเชื่อมต่อกับ API จริง
export const mockCourses = [
  { id: 1, title: 'React Fundamentals', code: 'CS101', color: 'bg-blue-500', instructor: 'อาจารย์สมชาย' },
  { id: 2, title: 'Database Design', code: 'CS201', color: 'bg-green-500', instructor: 'อาจารย์สุนีย์' },
  { id: 3, title: 'Web Development', code: 'CS301', color: 'bg-purple-500', instructor: 'อาจารย์วิทยา' },
  { id: 4, title: 'Mobile App Dev', code: 'CS401', color: 'bg-orange-500', instructor: 'อาจารย์มนต์ชัย' },
  { id: 5, title: 'Data Science', code: 'CS501', color: 'bg-red-500', instructor: 'อาจารย์วิชญ์' },
  { id: 6, title: 'AI & ML', code: 'CS601', color: 'bg-indigo-500', instructor: 'อาจารย์สุรชัย' },
];

export const mockInstructors = [
  { id: 1, name: 'อาจารย์สมชาย', email: 'somchai@university.ac.th', expertise: ['React', 'JavaScript', 'Web Development'] },
  { id: 2, name: 'อาจารย์สุนีย์', email: 'sunee@university.ac.th', expertise: ['Database', 'SQL', 'Data Analysis'] },
  { id: 3, name: 'อาจารย์วิทยา', email: 'witthaya@university.ac.th', expertise: ['Web Dev', 'HTML/CSS', 'UI/UX'] },
  { id: 4, name: 'อาจารย์มนต์ชัย', email: 'montchai@university.ac.th', expertise: ['Mobile', 'React Native', 'Flutter'] },
  { id: 5, name: 'อาจารย์วิชญ์', email: 'wich@university.ac.th', expertise: ['Data Science', 'Python', 'Statistics'] },
  { id: 6, name: 'อาจารย์สุรชัย', email: 'surachai@university.ac.th', expertise: ['AI', 'Machine Learning', 'Deep Learning'] },
];

// Schedule management functions
export const generateScheduleKey = (dayIndex, timeSlotIndex) => {
  return `${dayIndex}-${timeSlotIndex}`;
};

export const isTimeSlotConflict = (schedules, dayIndex, timeSlotIndex) => {
  const key = generateScheduleKey(dayIndex, timeSlotIndex);
  return schedules.hasOwnProperty(key);
};

export const getInstructorSchedule = (schedules, instructorId) => {
  return Object.entries(schedules).filter(([key, schedule]) => 
    schedule.instructor && schedule.instructor.id === instructorId
  );
};

export const exportScheduleToPDF = (schedules, weekDates) => {
  // Future implementation for PDF export
  };

export const saveScheduleToDatabase = async (schedules) => {
  // Future implementation for database save
  return new Promise(resolve => setTimeout(resolve, 1000));
};