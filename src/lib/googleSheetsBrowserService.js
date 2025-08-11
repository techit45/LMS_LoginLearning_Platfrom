/**
 * Browser-compatible Google Sheets Service
 * Uses server endpoint to communicate with Google APIs
 */

class GoogleSheetsBrowserService {
  constructor() {
    this.initialized = false;
    this.serverEndpoint = 'http://127.0.0.1:3001'; // Google Drive server endpoint
  }

  /**
   * Initialize service by checking server health
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      console.log('🔧 Initializing Google Sheets Browser Service...');
      
      // Test connection to our Google Drive server
      const response = await fetch(`${this.serverEndpoint}/health`);
      if (!response.ok) {
        throw new Error('Google Drive server not available');
      }
      
      const health = await response.json();
      console.log('📡 Server health check:', health);
      
      this.initialized = true;
      console.log('✅ Google Sheets Browser Service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets Browser Service:', error);
      return false;
    }
  }

  /**
   * Create a new Google Sheets spreadsheet for teaching schedule
   */
  async createScheduleSpreadsheet(company, weekStartDate, colorMode = 'company', scheduleData = null) {
    await this.initialize();
    
    try {
      const weekRange = this.getWeekRange(weekStartDate);
      const title = `${company} - ตารางสอน ${weekRange}`;
      
      console.log(`📊 Creating spreadsheet: ${title}`);
      
      // For now, return a mock response since we need to implement the server endpoint
      // In production, this would call our server endpoint
      const mockResponse = {
        success: true,
        spreadsheetId: `mock_id_${Date.now()}`,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/mock_id_${Date.now()}/edit`,
        title
      };
      
      console.log('✅ Mock spreadsheet created:', mockResponse);
      return mockResponse;
      
    } catch (error) {
      console.error('❌ Failed to create spreadsheet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update schedule data in existing spreadsheet
   */
  async updateScheduleCell(spreadsheetId, row, col, data, colorMode = 'company') {
    await this.initialize();
    
    try {
      console.log(`📝 Updating cell [${row}, ${col}] in ${spreadsheetId}`);
      
      // Mock implementation
      return {
        success: true,
        updated: true
      };
      
    } catch (error) {
      console.error('❌ Failed to update cell:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync schedule data from Google Sheets back to Supabase
   */
  async syncFromGoogleSheets(spreadsheetId) {
    await this.initialize();
    
    try {
      console.log(`📥 Syncing from Google Sheets: ${spreadsheetId}`);
      
      // Mock implementation
      return {
        success: true,
        synced: true,
        changes: []
      };
      
    } catch (error) {
      console.error('❌ Failed to sync from Google Sheets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get week range string for display
   */
  getWeekRange(weekStartDate) {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const formatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString('th-TH', formatOptions)} - ${end.toLocaleDateString('th-TH', formatOptions)}`;
  }
}

// Create singleton instance
const googleSheetsBrowserService = new GoogleSheetsBrowserService();

export default googleSheetsBrowserService;
export { GoogleSheetsBrowserService };