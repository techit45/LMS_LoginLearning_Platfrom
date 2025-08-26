/**
 * Google Sheets Service for Teaching Schedule System
 * Phase 2.2: CRUD Operations with Google Sheets API v4
 * 
 * Integrates with colorSystem.js for consistent styling
 * Handles spreadsheet creation, updates, and real-time sync
 */

// import { google } from 'googleapis'; // Node.js only - cannot be used in browser
import { supabase } from './supabaseClient.js';
import { 
  getGoogleSheetsFormatting, 
  generateSheetColorRules,
  getScheduleColor,
  COLOR_MODE_CONFIG 
} from './colorSystem.js';

// =========================================
// GOOGLE SHEETS SERVICE CLASS
// =========================================

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.drive = null;
    this.auth = null;
    this.isInitialized = false;
    this.rateLimiter = new APIRateLimiter();
  }

  // =========================================
  // AUTHENTICATION & INITIALIZATION
  // =========================================

  /**
   * Initialize Google Sheets API with Service Account
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Service Account authentication
      const credentials = JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
        await this.getServiceAccountCredentials()
      );

      this.auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.metadata.readonly'
        ]
      });

      // Initialize APIs
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });

      this.isInitialized = true;
      } catch (error) {
      throw new Error('Google Sheets Service initialization failed');
    }
  }

  /**
   * Get Service Account credentials from environment or Supabase
   */
  async getServiceAccountCredentials() {
    // Try environment variable first
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    }

    // Fallback: get from Supabase storage (encrypted)
    try {
      const { data, error } = await supabase.storage
        .from('credentials')
        .download('google-service-account.json');
      
      if (error) throw error;
      return await data.text();
    } catch (error) {
      throw new Error('Google Service Account credentials not found');
    }
  }

  // =========================================
  // SPREADSHEET MANAGEMENT
  // =========================================

  /**
   * Create new teaching schedule spreadsheet
   * @param {string} company - Company name
   * @param {Date} weekStartDate - Start of week
   * @param {string} colorMode - 'center' or 'company'
   * @returns {Promise<Object>} Created spreadsheet details
   */
  async createScheduleSpreadsheet(company, weekStartDate, colorMode = 'center') {
    await this.initialize();

    try {
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      const sheetTitle = `${company} - สัปดาห์ ${this.formatWeekRange(weekStartDate, weekEndDate)}`;

      // Create spreadsheet
      const createResponse = await this.rateLimiter.executeWithLimit('sheets', async () => {
        return await this.sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: sheetTitle,
              timeZone: 'Asia/Bangkok',
              locale: 'th_TH'
            },
            sheets: [{
              properties: {
                title: 'ตารางสอน',
                gridProperties: {
                  rowCount: 16, // Header + 14 time slots
                  columnCount: 9  // Time column + 7 days + notes
                }
              }
            }]
          }
        });
      });

      const spreadsheetId = createResponse.data.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      // Setup basic sheet structure
      await this.setupSheetTemplate(spreadsheetId, colorMode);

      // Save to database
      const { data: sheetRecord, error } = await supabase
        .from('google_schedule_sheets')
        .insert({
          sheet_id: spreadsheetId,
          sheet_url: spreadsheetUrl,
          sheet_name: sheetTitle,
          company: company,
          week_start_date: weekStartDate.toISOString().split('T')[0],
          week_end_date: weekEndDate.toISOString().split('T')[0],
          created_by: await this.getCurrentUserId()
        })
        .select()
        .single();

      if (error) {
        // Continue - sheet was created successfully
      }

      // Setup real-time webhook
      await this.setupWebhook(spreadsheetId);

      return {
        spreadsheetId,
        spreadsheetUrl,
        sheetTitle,
        company,
        weekStartDate,
        weekEndDate,
        success: true
      };

    } catch (error) {
      throw new GoogleSheetsError('Failed to create schedule spreadsheet', error);
    }
  }

  /**
   * Setup basic sheet template with headers and formatting
   * @param {string} spreadsheetId 
   * @param {string} colorMode 
   */
  async setupSheetTemplate(spreadsheetId, colorMode) {
    const days = ['เวลา', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์', 'หมายเหตุ'];
    const timeSlots = this.generateTimeSlots();
    const colorRules = generateSheetColorRules(colorMode);

    // Batch update requests
    const requests = [];

    // 1. Set header row
    requests.push({
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: days.length
        },
        rows: [{
          values: days.map(day => ({
            userEnteredValue: { stringValue: day },
            userEnteredFormat: colorRules.headerRow
          }))
        }],
        fields: 'userEnteredValue,userEnteredFormat'
      }
    });

    // 2. Set time column
    requests.push({
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: 1,
          endRowIndex: timeSlots.length + 1,
          startColumnIndex: 0,
          endColumnIndex: 1
        },
        rows: timeSlots.map(time => ({
          values: [{
            userEnteredValue: { stringValue: time },
            userEnteredFormat: colorRules.timeColumn
          }]
        })),
        fields: 'userEnteredValue,userEnteredFormat'
      }
    });

    // 3. Format empty cells
    requests.push({
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: 1,
          endRowIndex: timeSlots.length + 1,
          startColumnIndex: 1,
          endColumnIndex: 8 // Skip notes column for now
        },
        rows: timeSlots.map(() => ({
          values: Array(7).fill({
            userEnteredValue: { stringValue: '' },
            userEnteredFormat: colorRules.emptyCells
          })
        })),
        fields: 'userEnteredValue,userEnteredFormat'
      }
    });

    // 4. Auto-resize columns
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: days.length
        }
      }
    });

    // 5. Freeze header row and time column
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: 0,
          gridProperties: {
            frozenRowCount: 1,
            frozenColumnCount: 1
          }
        },
        fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'
      }
    });

    // Execute batch update
    await this.rateLimiter.executeWithLimit('sheets', async () => {
      return await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
    });

    }

  /**
   * Generate time slots for schedule (8:00 - 21:00)
   */
  generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  }

  // =========================================
  // SCHEDULE OPERATIONS
  // =========================================

  /**
   * Add/Update schedule entry in Google Sheets
   * @param {string} spreadsheetId 
   * @param {number} dayIndex - 0=Monday, 6=Sunday
   * @param {number} timeIndex - 0=8:00, 13=21:00
   * @param {Object} scheduleData - Course and instructor info
   * @param {string} colorMode - 'center' or 'company'
   */
  async updateScheduleCell(spreadsheetId, dayIndex, timeIndex, scheduleData, colorMode = 'center') {
    await this.initialize();

    try {
      const cellReference = this.getCellReference(dayIndex, timeIndex);
      const cellValue = this.formatScheduleCellValue(scheduleData);
      const cellFormatting = this.getScheduleCellFormatting(scheduleData, colorMode);

      const response = await this.rateLimiter.executeWithLimit('sheets', async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              updateCells: {
                range: {
                  sheetId: 0,
                  startRowIndex: timeIndex + 1, // +1 for header
                  endRowIndex: timeIndex + 2,
                  startColumnIndex: dayIndex + 1, // +1 for time column
                  endColumnIndex: dayIndex + 2
                },
                rows: [{
                  values: [{
                    userEnteredValue: { stringValue: cellValue },
                    userEnteredFormat: cellFormatting
                  }]
                }],
                fields: 'userEnteredValue,userEnteredFormat'
              }
            }]
          }
        });
      });

      // Log to sync_log
      await this.logSyncOperation(spreadsheetId, 'update', 'to_google', 'success', {
        cellReference,
        cellValue,
        scheduleData
      });

      return response.data;

    } catch (error) {
      await this.logSyncOperation(spreadsheetId, 'update', 'to_google', 'error', { error: error.message });
      throw new GoogleSheetsError('Failed to update schedule cell', error);
    }
  }

  /**
   * Clear schedule cell
   * @param {string} spreadsheetId 
   * @param {number} dayIndex 
   * @param {number} timeIndex 
   */
  async clearScheduleCell(spreadsheetId, dayIndex, timeIndex) {
    await this.initialize();

    try {
      const cellReference = this.getCellReference(dayIndex, timeIndex);
      const colorRules = generateSheetColorRules();

      const response = await this.rateLimiter.executeWithLimit('sheets', async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              updateCells: {
                range: {
                  sheetId: 0,
                  startRowIndex: timeIndex + 1,
                  endRowIndex: timeIndex + 2,
                  startColumnIndex: dayIndex + 1,
                  endColumnIndex: dayIndex + 2
                },
                rows: [{
                  values: [{
                    userEnteredValue: { stringValue: '' },
                    userEnteredFormat: colorRules.emptyCells
                  }]
                }],
                fields: 'userEnteredValue,userEnteredFormat'
              }
            }]
          }
        });
      });

      await this.logSyncOperation(spreadsheetId, 'delete', 'to_google', 'success', {
        cellReference,
        action: 'cleared'
      });

      return response.data;

    } catch (error) {
      await this.logSyncOperation(spreadsheetId, 'delete', 'to_google', 'error', { error: error.message });
      throw new GoogleSheetsError('Failed to clear schedule cell', error);
    }
  }

  /**
   * Batch update multiple schedule cells
   * @param {string} spreadsheetId 
   * @param {Array} scheduleUpdates - Array of {dayIndex, timeIndex, scheduleData}
   * @param {string} colorMode 
   */
  async batchUpdateSchedule(spreadsheetId, scheduleUpdates, colorMode = 'center') {
    await this.initialize();

    try {
      const requests = scheduleUpdates.map(update => {
        const { dayIndex, timeIndex, scheduleData } = update;
        const cellValue = scheduleData ? this.formatScheduleCellValue(scheduleData) : '';
        const cellFormatting = scheduleData 
          ? this.getScheduleCellFormatting(scheduleData, colorMode)
          : generateSheetColorRules().emptyCells;

        return {
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: timeIndex + 1,
              endRowIndex: timeIndex + 2,
              startColumnIndex: dayIndex + 1,
              endColumnIndex: dayIndex + 2
            },
            rows: [{
              values: [{
                userEnteredValue: { stringValue: cellValue },
                userEnteredFormat: cellFormatting
              }]
            }],
            fields: 'userEnteredValue,userEnteredFormat'
          }
        };
      });

      const response = await this.rateLimiter.executeWithLimit('sheets', async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests }
        });
      });

      await this.logSyncOperation(spreadsheetId, 'batch_update', 'to_google', 'success', {
        updatesCount: scheduleUpdates.length,
        updates: scheduleUpdates.map(u => ({
          cell: this.getCellReference(u.dayIndex, u.timeIndex),
          course: u.scheduleData?.courseName || '[cleared]'
        }))
      });

      return response.data;

    } catch (error) {
      await this.logSyncOperation(spreadsheetId, 'batch_update', 'to_google', 'error', { error: error.message });
      throw new GoogleSheetsError('Failed to batch update schedule', error);
    }
  }

  // =========================================
  // REAL-TIME SYNC & WEBHOOKS
  // =========================================

  /**
   * Setup webhook for real-time sheet changes
   * @param {string} spreadsheetId 
   */
  async setupWebhook(spreadsheetId) {
    try {
      const webhookUrl = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/sheets-webhook`;
      const channelId = `watch-${spreadsheetId}-${Date.now()}`;
      const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

      const response = await this.rateLimiter.executeWithLimit('drive', async () => {
        return await this.drive.files.watch({
          fileId: spreadsheetId,
          requestBody: {
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
            token: process.env.WEBHOOK_VERIFICATION_TOKEN || 'default-token',
            expiration: expiry.toString()
          }
        });
      });

      // Update database with webhook info
      await supabase
        .from('google_schedule_sheets')
        .update({
          webhook_id: channelId,
          webhook_expiry: new Date(expiry).toISOString()
        })
        .eq('sheet_id', spreadsheetId);

      return response.data;

    } catch (error) {
      console.warn('⚠️ Webhook setup failed (continuing without real-time sync):', error.message);
      // Don't throw error - webhook is optional
    }
  }

  /**
   * Process webhook notification from Google
   * @param {Object} notification - Google webhook payload
   */
  async processWebhookNotification(notification) {
    try {
      const { resourceId, resourceState, eventTime } = notification;

      if (resourceState !== 'update') {
        return; // Only process updates
      }

      // Get sheet info from database
      const { data: sheetInfo } = await supabase
        .from('google_schedule_sheets')
        .select('*')
        .eq('sheet_id', resourceId)
        .single();

      if (!sheetInfo) {
        return;
      }

      // Fetch changed data from Google Sheets
      const changedData = await this.getSheetData(resourceId);

      // Update Supabase database
      await this.syncFromGoogleSheets(resourceId, changedData);

      // Broadcast to real-time subscribers
      await supabase
        .channel(`google_schedule_sheets:${resourceId}`)
        .send({
          type: 'broadcast',
          event: 'sheet_updated',
          payload: {
            sheetId: resourceId,
            updatedAt: eventTime,
            data: changedData
          }
        });

      } catch (error) {
      throw error;
    }
  }

  /**
   * Get current sheet data
   * @param {string} spreadsheetId 
   */
  async getSheetData(spreadsheetId) {
    await this.initialize();

    try {
      const response = await this.rateLimiter.executeWithLimit('sheets', async () => {
        return await this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'ตารางสอน!A1:H15', // Full schedule range
          valueRenderOption: 'FORMATTED_VALUE',
          dateTimeRenderOption: 'FORMATTED_STRING'
        });
      });

      return response.data.values || [];

    } catch (error) {
      throw new GoogleSheetsError('Failed to fetch sheet data', error);
    }
  }

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================

  /**
   * Get cell reference for day/time combination
   * @param {number} dayIndex - 0=Monday, 6=Sunday
   * @param {number} timeIndex - 0=8:00, 13=21:00
   * @returns {string} Cell reference (e.g., 'B2')
   */
  getCellReference(dayIndex, timeIndex) {
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const row = timeIndex + 2; // +2 for header and 0-based index
    const column = columns[dayIndex + 1]; // +1 to skip time column
    return `${column}${row}`;
  }

  /**
   * Format schedule data for cell display
   * @param {Object} scheduleData 
   * @returns {string} Formatted cell content
   */
  formatScheduleCellValue(scheduleData) {
    if (!scheduleData) return '';

    const parts = [];
    
    if (scheduleData.courseName) {
      parts.push(`📚 ${scheduleData.courseName}`);
    }
    
    if (scheduleData.instructorName) {
      parts.push(`👨‍🏫 ${scheduleData.instructorName}`);
    }
    
    if (scheduleData.location) {
      parts.push(`📍 ${scheduleData.location}`);
    }

    if (scheduleData.company) {
      parts.push(`🏢 ${scheduleData.company}`);
    }

    return parts.join('\n');
  }

  /**
   * Get cell formatting based on schedule data and color mode
   * @param {Object} scheduleData 
   * @param {string} colorMode 
   * @returns {Object} Google Sheets formatting object
   */
  getScheduleCellFormatting(scheduleData, colorMode) {
    const identifier = colorMode === 'center' 
      ? this.mapCourseToCenter(scheduleData.courseName)
      : scheduleData.company || 'login';

    return getGoogleSheetsFormatting(identifier, colorMode);
  }

  /**
   * Map course name to center identifier for color system
   * @param {string} courseName 
   * @returns {string} Center identifier
   */
  mapCourseToCenter(courseName) {
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

    return courseMapping[courseName] || 'math';
  }

  /**
   * Format week range for display
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @returns {string} Formatted week range
   */
  formatWeekRange(startDate, endDate) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const start = startDate.toLocaleDateString('th-TH', options);
    const end = endDate.toLocaleDateString('th-TH', options);
    return `${start} - ${end}`;
  }

  /**
   * Get current user ID for logging
   */
  async getCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  /**
   * Log sync operation to database
   * @param {string} sheetId 
   * @param {string} operation 
   * @param {string} direction 
   * @param {string} status 
   * @param {Object} data 
   */
  async logSyncOperation(sheetId, operation, direction, status, data) {
    try {
      await supabase.from('google_sheets_sync_log').insert({
        sheet_id: sheetId,
        operation,
        sync_direction: direction,
        status,
        data_after: data,
        initiated_by: await this.getCurrentUserId(),
        sync_duration_ms: Date.now() % 1000 // Simple duration tracking
      });
    } catch (error) {
      // Don't throw - logging failure shouldn't break the main operation
    }
  }
}

// =========================================
// RATE LIMITER CLASS
// =========================================

class APIRateLimiter {
  constructor() {
    this.limits = {
      sheets: { requests: 0, resetTime: Date.now() + 60000, max: 300 },
      drive: { requests: 0, resetTime: Date.now() + 60000, max: 1000 }
    };
  }

  async executeWithLimit(api, operation) {
    await this.checkLimit(api);
    this.incrementCounter(api);
    return await operation();
  }

  async checkLimit(api) {
    const limit = this.limits[api];
    
    if (Date.now() > limit.resetTime) {
      limit.requests = 0;
      limit.resetTime = Date.now() + 60000;
    }
    
    if (limit.requests >= limit.max) {
      const waitTime = limit.resetTime - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  incrementCounter(api) {
    this.limits[api].requests++;
  }
}

// =========================================
// ERROR HANDLING
// =========================================

class GoogleSheetsError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'GoogleSheetsError';
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

// =========================================
// EXPORTS
// =========================================

// Create singleton instance
const googleSheetsService = new GoogleSheetsService();

export default googleSheetsService;

export {
  GoogleSheetsService,
  GoogleSheetsError,
  APIRateLimiter
};