/**
 * Color System for Teaching Schedule
 * ระบบสีสำหรับตารางสอน - รองรับการเลือกใช้สีตามศูนย์หรือบริษัท
 */

// =========================================
// COLOR PALETTES
// =========================================

/**
 * สีประจำศูนย์การเรียน (Learning Centers)
 * อิงจากวิชาและสาขาการเรียน
 */
export const CENTER_COLORS = {
  // วิทยาศาสตร์และคณิตศาสตร์
  math: {
    name: 'คณิตศาสตร์',
    primary: '#1a73e8',      // Blue
    light: '#e3f2fd',        // Light Blue
    dark: '#1565c0',         // Dark Blue
    text: '#ffffff',
    googleSheetsColor: { red: 0.1, green: 0.45, blue: 0.91 }
  },
  
  physics: {
    name: 'ฟิสิกส์',
    primary: '#ea4335',      // Red
    light: '#ffebee',        // Light Red
    dark: '#c62828',         // Dark Red
    text: '#ffffff',
    googleSheetsColor: { red: 0.92, green: 0.26, blue: 0.21 }
  },
  
  chemistry: {
    name: 'เคมี',
    primary: '#fbbc04',      // Yellow/Orange
    light: '#fff8e1',        // Light Yellow
    dark: '#f57c00',         // Dark Orange
    text: '#000000',
    googleSheetsColor: { red: 0.98, green: 0.74, blue: 0.02 }
  },
  
  biology: {
    name: 'ชีววิทยา',
    primary: '#34a853',      // Green
    light: '#e8f5e9',        // Light Green
    dark: '#2e7d32',         // Dark Green
    text: '#ffffff',
    googleSheetsColor: { red: 0.2, green: 0.66, blue: 0.33 }
  },
  
  // วิศวกรรมศาสตร์
  computerEngineering: {
    name: 'วิศวกรรมคอมพิวเตอร์',
    primary: '#673ab7',      // Deep Purple
    light: '#ede7f6',        // Light Purple
    dark: '#4527a0',         // Dark Purple
    text: '#ffffff',
    googleSheetsColor: { red: 0.4, green: 0.23, blue: 0.72 }
  },
  
  mechanicalEngineering: {
    name: 'วิศวกรรมเครื่องกล',
    primary: '#607d8b',      // Blue Grey
    light: '#eceff1',        // Light Blue Grey
    dark: '#37474f',         // Dark Blue Grey
    text: '#ffffff',
    googleSheetsColor: { red: 0.38, green: 0.49, blue: 0.55 }
  },
  
  electricalEngineering: {
    name: 'วิศวกรรมไฟฟ้า',
    primary: '#ff9800',      // Orange
    light: '#fff3e0',        // Light Orange
    dark: '#e65100',         // Dark Orange
    text: '#000000',
    googleSheetsColor: { red: 1.0, green: 0.6, blue: 0.0 }
  },
  
  civilEngineering: {
    name: 'วิศวกรรมโยธา',
    primary: '#795548',      // Brown
    light: '#efebe9',        // Light Brown
    dark: '#4e342e',         // Dark Brown
    text: '#ffffff',
    googleSheetsColor: { red: 0.47, green: 0.33, blue: 0.28 }
  },
  
  // ภาษาและสังคม
  english: {
    name: 'ภาษาอังกฤษ',
    primary: '#009688',      // Teal
    light: '#e0f2f1',        // Light Teal
    dark: '#00695c',         // Dark Teal
    text: '#ffffff',
    googleSheetsColor: { red: 0.0, green: 0.59, blue: 0.53 }
  },
  
  thai: {
    name: 'ภาษาไทย',
    primary: '#e91e63',      // Pink
    light: '#fce4ec',        // Light Pink
    dark: '#ad1457',         // Dark Pink
    text: '#ffffff',
    googleSheetsColor: { red: 0.91, green: 0.12, blue: 0.39 }
  },
  
  social: {
    name: 'สังคมศึกษา',
    primary: '#9c27b0',      // Purple
    light: '#f3e5f5',        // Light Purple
    dark: '#6a1b9a',         // Dark Purple
    text: '#ffffff',
    googleSheetsColor: { red: 0.61, green: 0.15, blue: 0.69 }
  }
};

/**
 * สีประจำบริษัท (Companies)
 * อิงจาก brand identity ของแต่ละบริษัท
 */
export const COMPANY_COLORS = {
  login: {
    name: 'Login Learning',
    primary: '#1a73e8',      // Google Blue
    light: '#e3f2fd',
    dark: '#1565c0',
    text: '#ffffff',
    googleSheetsColor: { red: 0.1, green: 0.45, blue: 0.91 }
  },
  
  meta: {
    name: 'Meta Tech Academy',
    primary: '#0084ff',      // Facebook Blue
    light: '#e3f2fd',
    dark: '#0066cc',
    text: '#ffffff',
    googleSheetsColor: { red: 0.0, green: 0.52, blue: 1.0 }
  },
  
  med: {
    name: 'Med Solutions',
    primary: '#00c853',      // Medical Green
    light: '#e8f5e9',
    dark: '#00962e',
    text: '#ffffff',
    googleSheetsColor: { red: 0.0, green: 0.78, blue: 0.33 }
  },
  
  edtech: {
    name: 'EdTech Innovation',
    primary: '#7c4dff',      // Purple
    light: '#ede7f6',
    dark: '#651fff',
    text: '#ffffff',
    googleSheetsColor: { red: 0.49, green: 0.3, blue: 1.0 }
  },
  
  w2d: {
    name: 'W2D Studio',
    primary: '#d50000',      // Red
    light: '#ffebee',
    dark: '#b71c1c',
    text: '#ffffff',
    googleSheetsColor: { red: 0.84, green: 0.0, blue: 0.0 }
  }
};

// =========================================
// COLOR UTILITY FUNCTIONS
// =========================================

/**
 * Get color based on selection mode
 * @param {string} identifier - Course/Center ID or Company ID
 * @param {string} mode - 'center' or 'company'
 * @returns {object} Color configuration
 */
export const getScheduleColor = (identifier, mode = 'center') => {
  if (mode === 'center') {
    return CENTER_COLORS[identifier] || CENTER_COLORS.math;
  } else if (mode === 'company') {
    return COMPANY_COLORS[identifier] || COMPANY_COLORS.login;
  }
  return CENTER_COLORS.math; // Default fallback
};

/**
 * Get Google Sheets cell formatting
 * @param {string} identifier - Course/Center ID or Company ID
 * @param {string} mode - 'center' or 'company'
 * @returns {object} Google Sheets API formatting object
 */
export const getGoogleSheetsFormatting = (identifier, mode = 'center') => {
  const color = getScheduleColor(identifier, mode);
  
  return {
    backgroundColor: color.googleSheetsColor,
    textFormat: {
      foregroundColor: {
        red: color.text === '#ffffff' ? 1.0 : 0.0,
        green: color.text === '#ffffff' ? 1.0 : 0.0,
        blue: color.text === '#ffffff' ? 1.0 : 0.0
      },
      fontSize: 10,
      bold: true
    },
    horizontalAlignment: 'CENTER',
    verticalAlignment: 'MIDDLE',
    wrapStrategy: 'WRAP',
    borders: {
      top: { style: 'SOLID', width: 1 },
      bottom: { style: 'SOLID', width: 1 },
      left: { style: 'SOLID', width: 1 },
      right: { style: 'SOLID', width: 1 }
    }
  };
};

/**
 * Get color for schedule item in web UI
 * @param {object} schedule - Schedule object with course and company info
 * @param {string} colorMode - 'center' or 'company'
 * @returns {object} CSS styles for the schedule item
 */
export const getScheduleItemStyles = (schedule, colorMode = 'center') => {
  let identifier;
  
  if (colorMode === 'center') {
    // Map course to center color
    const courseMapping = {
      'วิศวกรรมคอมพิวเตอร์': 'computerEngineering',
      'วิศวกรรมเครื่องกล': 'mechanicalEngineering',
      'วิศวกรรมไฟฟ้า': 'electricalEngineering',
      'วิศวกรรมโยธา': 'civilEngineering',
      'วิศวกรรมเคมี': 'chemistry',
      'คณิตศาสตร์': 'math',
      'ฟิสิกส์': 'physics',
      'เคมี': 'chemistry',
      'ชีววิทยา': 'biology',
      'ภาษาอังกฤษ': 'english',
      'ภาษาไทย': 'thai',
      'สังคมศึกษา': 'social'
    };
    identifier = courseMapping[schedule.courseName] || 'math';
  } else {
    identifier = schedule.company || 'login';
  }
  
  const color = getScheduleColor(identifier, colorMode);
  
  return {
    backgroundColor: color.primary,
    color: color.text,
    borderColor: color.dark,
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '8px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '--hover-bg': color.dark,
    '--light-bg': color.light
  };
};

/**
 * Generate gradient background for schedule headers
 * @param {string} identifier
 * @param {string} mode
 * @returns {string} CSS gradient
 */
export const getHeaderGradient = (identifier, mode = 'center') => {
  const color = getScheduleColor(identifier, mode);
  return `linear-gradient(135deg, ${color.primary} 0%, ${color.dark} 100%)`;
};

/**
 * Get contrasting text color
 * @param {string} hexColor - Background color in hex
 * @returns {string} '#000000' or '#ffffff'
 */
export const getContrastingTextColor = (hexColor) => {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// =========================================
// COLOR MODE MANAGEMENT
// =========================================

/**
 * Color mode configuration
 */
export const COLOR_MODE_CONFIG = {
  CENTER: {
    id: 'center',
    name: 'สีตามศูนย์การเรียน',
    description: 'ใช้สีตามประเภทวิชาและสาขาการเรียน',
    icon: '🎓'
  },
  COMPANY: {
    id: 'company',
    name: 'สีตามบริษัท',
    description: 'ใช้สีตาม brand identity ของบริษัท',
    icon: '🏢'
  }
};

/**
 * Get available color palettes for UI selector
 * @param {string} mode
 * @returns {array} Array of color options
 */
export const getColorPalette = (mode = 'center') => {
  const colors = mode === 'center' ? CENTER_COLORS : COMPANY_COLORS;
  
  return Object.entries(colors).map(([key, value]) => ({
    id: key,
    name: value.name,
    primary: value.primary,
    light: value.light,
    dark: value.dark,
    preview: {
      background: value.primary,
      color: value.text
    }
  }));
};

// =========================================
// GOOGLE SHEETS TEMPLATE COLORS
// =========================================

/**
 * Generate color palette for Google Sheets template
 * @param {string} mode
 * @returns {object} Color rules for sheet formatting
 */
export const generateSheetColorRules = (mode = 'center') => {
  const palette = mode === 'center' ? CENTER_COLORS : COMPANY_COLORS;
  
  return {
    headerRow: {
      backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
      textFormat: {
        foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
        fontSize: 12,
        bold: true
      }
    },
    timeColumn: {
      backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
      textFormat: {
        foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
        fontSize: 11,
        bold: true
      }
    },
    emptyCells: {
      backgroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
      borders: {
        top: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
        bottom: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
        left: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
        right: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } }
      }
    },
    colorPalette: Object.entries(palette).reduce((acc, [key, value]) => {
      acc[key] = {
        backgroundColor: value.googleSheetsColor,
        textFormat: {
          foregroundColor: value.text === '#ffffff' 
            ? { red: 1.0, green: 1.0, blue: 1.0 }
            : { red: 0.0, green: 0.0, blue: 0.0 }
        }
      };
      return acc;
    }, {})
  };
};

// Export default color system
export default {
  CENTER_COLORS,
  COMPANY_COLORS,
  getScheduleColor,
  getGoogleSheetsFormatting,
  getScheduleItemStyles,
  getHeaderGradient,
  getContrastingTextColor,
  COLOR_MODE_CONFIG,
  getColorPalette,
  generateSheetColorRules
};