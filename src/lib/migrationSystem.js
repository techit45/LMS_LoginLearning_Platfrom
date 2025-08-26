// Teaching Schedule Data Migration System
// Handles backward compatibility and data migration between different formats

import { getWeekKey, getISOWeek } from './weekUtils';

/**
 * Migration system for teaching schedule data
 * Converts old date-based keys to new ISO week-based format
 */

/**
 * Convert old localStorage key format to new ISO week format
 * Old: "schedules_2025-01-27" 
 * New: "schedules_weekends_2025_W04"
 */
export function convertOldKeyToNew(oldKey, scheduleType) {
  const parts = oldKey.split('_');
  const dateStr = parts[parts.length - 1];
  const type = parts.slice(0, -1).join('_');

  // Check if it's old date format
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return null;
  }

  try {
    const date = new Date(dateStr + 'T00:00:00');
    return getWeekKey(date, `${type}_${scheduleType}`);
  } catch (error) {
    return null;
  }
}

/**
 * Find old data for a specific week and type
 * Searches multiple possible dates within the same ISO week
 */
export function migrateOldData(currentWeek, type) {
  const getWeekKeyOld = (date, keyType) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday-based
    const weekId = startOfWeek.toISOString().split('T')[0];
    return `${keyType}_${weekId}`;
  };

  const newKey = getWeekKey(currentWeek, type);
  
  // Try multiple dates within the same week
  const possibleDates = [];
  for (let i = -6; i <= 6; i++) {
    const testDate = new Date(currentWeek);
    testDate.setDate(currentWeek.getDate() + i);
    possibleDates.push(testDate);
  }

  for (const testDate of possibleDates) {
    const oldKey = getWeekKeyOld(testDate, type);
    const oldData = localStorage.getItem(oldKey);
    
    if (oldData) {
      try {
        const parsed = JSON.parse(oldData);
        const newData = localStorage.getItem(newKey);
        
        if (!newData && Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(newKey, oldData);
          return parsed;
        }
      } catch (e) {
        }
    }
  }

  return null;
}

/**
 * Comprehensive migration that finds and converts all old teaching schedule data
 */
export function runComprehensiveMigration() {
  const allKeys = Object.keys(localStorage);
  const oldTeachingKeys = allKeys.filter(key => {
    // Find old format keys that haven't been migrated yet
    return (
      (key.includes('teachingSchedules') || 
       key.includes('createdCourses') || 
       key.includes('createdInstructors') ||
       key.includes('dayInstructors')) &&
      !key.includes('_W') && // Not new format yet
      key.match(/_\d{4}-\d{2}-\d{2}$/) // Ends with date format
    );
  });

  if (oldTeachingKeys.length === 0) {
    return 0;
  }

  let migratedCount = 0;
  const migrationLog = [];

  oldTeachingKeys.forEach(oldKey => {
    // Try both schedule types for each old key
    ['weekdays', 'weekends'].forEach(scheduleType => {
      const newKey = convertOldKeyToNew(oldKey, scheduleType);
      
      if (newKey) {
        const existingData = localStorage.getItem(newKey);
        const oldData = localStorage.getItem(oldKey);
        
        if (oldData && !existingData) {
          try {
            const parsed = JSON.parse(oldData);
            const itemCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
            
            if (itemCount > 0) {
              localStorage.setItem(newKey, oldData);
              console.log(`✅ Migrated: ${oldKey} → ${newKey} (${itemCount} items)`);
              migratedCount++;
              
              migrationLog.push({
                oldKey,
                newKey,
                itemCount
              });
            }
          } catch (e) {
            }
        }
      }
    });
  });

  if (migratedCount > 0) {
    migrationLog.forEach(log => {
      console.log(`  📋 ${log.oldKey} → ${log.newKey} (${log.itemCount} items)`);
    });
  }

  return migratedCount;
}

/**
 * Load data with automatic migration fallback
 * First tries to load new format, then falls back to migration
 */
export function loadDataWithBackwardCompatibility(currentWeek, type, defaultValue) {
  const newKey = getWeekKey(currentWeek, type);
  // Try new format first
  let saved = localStorage.getItem(newKey);
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      console.log(`✅ Found new format data:`, Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length, 'items');
      return parsed;
    } catch (e) {
      }
  }
  
  // Try migration from old format
  const migratedData = migrateOldData(currentWeek, type);
  if (migratedData) {
    return migratedData;
  }
  
  return defaultValue;
}

/**
 * Check if migration has been completed
 */
export function hasMigrationCompleted() {
  return localStorage.getItem('teaching_schedule_migrated') !== null;
}

/**
 * Mark migration as completed
 */
export function markMigrationCompleted() {
  localStorage.setItem('teaching_schedule_migrated', new Date().toISOString());
}