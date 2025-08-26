// Teaching Schedule Week Utilities
// Based on ISO week standard for consistent week calculation

/**
 * Calculate ISO week number for a given date
 * This ensures consistent week calculation across different days of the week
 */
export function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Generate localStorage key for week-specific data
 * Format: {type}_{year}_W{week}
 * Example: "schedules_weekends_2025_W30"
 */
export function getWeekKey(date, type) {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${type}_${year}_W${week.toString().padStart(2, '0')}`;
}

/**
 * Get the start of ISO week (Monday) for a given date
 */
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get week range display string
 * Format: "27 ม.ค. - 2 ก.พ. 2025"
 */
export function getWeekRange(date, scheduleType) {
  const weekStart = getWeekStart(date);
  
  if (scheduleType === 'weekends') {
    // Saturday - Sunday
    const saturday = new Date(weekStart);
    saturday.setDate(weekStart.getDate() + 5);
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6);
    
    return `${saturday.toLocaleDateString('th-TH', { 
      day: 'numeric',
      month: 'short' 
    })} - ${sunday.toLocaleDateString('th-TH', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`;
  } else {
    // Monday - Friday
    const friday = new Date(weekStart);
    friday.setDate(weekStart.getDate() + 4);
    
    return `${weekStart.toLocaleDateString('th-TH', { 
      day: 'numeric',
      month: 'short' 
    })} - ${friday.toLocaleDateString('th-TH', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`;
  }
}

/**
 * Get days array based on schedule type
 */
export function getCurrentDays(scheduleType) {
  if (scheduleType === 'weekdays') {
    return [
      { id: 1, name: 'จันทร์', shortName: 'จ.' },
      { id: 2, name: 'อังคาร', shortName: 'อ.' },
      { id: 3, name: 'พุธ', shortName: 'พ.' },
      { id: 4, name: 'พฤหัสบดี', shortName: 'พฤ.' },
      { id: 5, name: 'ศุกร์', shortName: 'ศ.' }
    ];
  } else {
    return [
      { id: 6, name: 'เสาร์', shortName: 'ส.' },
      { id: 0, name: 'อาทิตย์', shortName: 'อา.' }
    ];
  }
}

/**
 * Get time slots based on schedule type
 * TEMPORARILY LIMITED due to database constraint (time_slot_index 0-6 only)
 * Database constraint updated to allow full range (0-12)
 */
export function getTimeSlots(scheduleType) {
  const allSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', 
    '18:00', '19:00', '20:00'
  ];
  
  // TEMPORARY FIX: Limit to 7 slots (0-6) due to database constraint
  // Original logic would be:
  // if (scheduleType === 'weekends') {
  //   return allSlots; // Full range for weekends  
  // } else {
  //   return allSlots.slice(0, 11); // 08:00-18:00 for weekdays
  // }
  
  // Current limited implementation:
  return allSlots.slice(0, 7); // 08:00-14:00 for all types (slots 0-6)
}