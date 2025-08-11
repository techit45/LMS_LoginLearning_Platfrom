# Google APIs Analysis for Teaching Schedule System

## 🎯 Overview
Analysis of required Google APIs for implementing a comprehensive teaching schedule system integrated with Google Workspace.

## 📋 Required APIs

### 1. Google Sheets API v4
**Purpose**: Real-time collaborative schedule management
**Documentation**: https://developers.google.com/sheets/api

#### Scopes Required:
```javascript
const SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',           // Read/Write sheets
  'https://www.googleapis.com/auth/drive.file',            // Access sheets we create
  'https://www.googleapis.com/auth/drive.metadata.readonly' // Read sheet metadata
];
```

#### Quota Limits:
- **Read requests**: 300 requests/minute/user
- **Write requests**: 300 requests/minute/user  
- **Daily quota**: 1,000,000,000 requests/day

#### Key Methods We'll Use:
```javascript
// Create new spreadsheet
sheets.spreadsheets.create()

// Read values from range
sheets.spreadsheets.values.get()

// Update cell values (single)
sheets.spreadsheets.values.update()

// Batch update multiple cells
sheets.spreadsheets.values.batchUpdate()

// Format cells and styling
sheets.spreadsheets.batchUpdate()

// Listen for changes (via Drive API)
drive.files.watch()
```

### 2. Google Calendar API v3  
**Purpose**: Automatic calendar event creation for teaching sessions
**Documentation**: https://developers.google.com/calendar/api

#### Scopes Required:
```javascript
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',        // Full calendar access
  'https://www.googleapis.com/auth/calendar.events' // Events only (alternative)
];
```

#### Quota Limits:
- **API calls**: 1,000,000 requests/day
- **Queries per minute**: 60,000/minute

#### Key Methods We'll Use:
```javascript
// Create calendar event
calendar.events.insert()

// Update existing event
calendar.events.update()

// Delete event
calendar.events.delete()

// List events for date range
calendar.events.list()

// Get specific event
calendar.events.get()
```

#### Event Structure:
```javascript
const teachingEvent = {
  summary: "วิศวกรรมคอมพิวเตอร์ - อาจารย์สมชาย",
  description: "สถานที่: ห้อง A101\nบริษัท: Login Learning\nหมายเหตุ: เตรียมโปรเจคเตอร์",
  start: {
    dateTime: "2025-01-15T09:00:00+07:00",
    timeZone: "Asia/Bangkok"
  },
  end: {
    dateTime: "2025-01-15T10:30:00+07:00", 
    timeZone: "Asia/Bangkok"
  },
  attendees: [
    { email: "instructor@example.com", responseStatus: "accepted" },
    { email: "admin@loginlearning.com", responseStatus: "needsAction" }
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 1440 }, // 24 hours
      { method: "email", minutes: 60 },   // 1 hour
      { method: "popup", minutes: 15 }    // 15 minutes
    ]
  },
  colorId: "2", // Green for teaching events
  location: "ห้อง A101, อาคารเรียนรวม"
};
```

### 3. Gmail API v1
**Purpose**: Automated email notifications to teachers
**Documentation**: https://developers.google.com/gmail/api

#### Scopes Required:
```javascript
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',     // Send emails only
  'https://www.googleapis.com/auth/gmail.compose'  // Compose emails (alternative)
];
```

#### Quota Limits:
- **Daily quota**: 1,000,000,000 quota units/day
- **Send limit**: 2,000 emails/day (for Service Account)
- **Rate limit**: 250 quota units/user/second

#### Key Methods We'll Use:
```javascript
// Send email
gmail.users.messages.send()

// Create draft (optional)
gmail.users.drafts.create()

// Get send quota status
gmail.users.getProfile()
```

#### Email Message Format:
```javascript
const emailMessage = {
  to: "instructor@example.com",
  cc: "admin@loginlearning.com", 
  subject: "📅 ตารางสอนใหม่: วิศวกรรมคอมพิวเตอร์",
  html: `
    <div style="font-family: Tahoma, sans-serif; max-width: 600px;">
      <h2 style="color: #1a73e8;">📅 การมอบหมายตารางสอนใหม่</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3>วิศวกรรมคอมพิวเตอร์</h3>
        <p><strong>วันที่:</strong> วันจันทร์ที่ 15 มกราคม 2568</p>
        <p><strong>เวลา:</strong> 09:00 - 10:30 น.</p>
        <p><strong>ห้องเรียน:</strong> A101</p>
        <p><strong>บริษัท:</strong> Login Learning</p>
      </div>
      
      <p style="margin: 20px 0;">
        <a href="https://calendar.google.com/event?eid=..." 
           style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          📅 เพิ่มเข้า Google Calendar
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        หากมีข้อสงสัย กรุณาติดต่อ admin@loginlearning.com
      </p>
    </div>
  `
};
```

### 4. Google Drive API v3 (Already Implemented ✅)
**Purpose**: File management and webhook notifications
**Current Status**: ✅ Service Account configured, Shared Drive access available

#### Additional Usage for Sheets:
```javascript
// Watch for spreadsheet changes
drive.files.watch({
  fileId: sheetId,
  requestBody: {
    id: `watch-${sheetId}-${Date.now()}`,
    type: 'web_hook',
    address: 'https://our-domain.com/api/sheets-webhook',
    token: 'verification-token'
  }
});

// Get sheet metadata
drive.files.get({
  fileId: sheetId,
  fields: 'id,name,modifiedTime,lastModifyingUser'
});
```

## 🔧 Implementation Strategy

### Service Account Configuration
**Current Service Account**: `login-learning-drive@platformlogin.iam.gserviceaccount.com`

#### Required API Enablement:
```bash
# Enable required APIs (run in Google Cloud Console)
gcloud services enable sheets.googleapis.com
gcloud services enable calendar-json.googleapis.com  
gcloud services enable gmail.googleapis.com
gcloud services enable drive.googleapis.com # Already enabled ✅
```

#### Service Account Permissions:
```javascript
// Update existing Service Account with additional scopes
const REQUIRED_SCOPES = [
  // Existing (Drive) ✅
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  
  // New (Sheets)
  'https://www.googleapis.com/auth/spreadsheets',
  
  // New (Calendar) 
  'https://www.googleapis.com/auth/calendar',
  
  // New (Gmail)
  'https://www.googleapis.com/auth/gmail.send'
];
```

### Rate Limit Management Strategy
```javascript
class APIRateLimiter {
  constructor() {
    this.limits = {
      sheets: { requests: 0, resetTime: Date.now() + 60000, max: 300 },
      calendar: { requests: 0, resetTime: Date.now() + 60000, max: 1000 },
      gmail: { requests: 0, resetTime: Date.now() + 60000, max: 250 },
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
}
```

### Error Handling Strategy
```javascript
class GoogleAPIErrorHandler {
  static async handleError(error, api, operation, retryCount = 0) {
    const maxRetries = 3;
    
    switch (error.code) {
      case 429: // Rate limit exceeded
        const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        if (retryCount < maxRetries) {
          return await operation();
        }
        break;
        
      case 403: // Forbidden - check permissions
        throw new Error(`API permission denied for ${api}: ${error.message}`);
        
      case 404: // Not found
        if (api === 'sheets' && operation.includes('get')) {
          // Sheet might be deleted, create new one
          return await this.createNewSheet();
        }
        break;
        
      case 401: // Unauthorized - refresh token
        await this.refreshServiceAccountAuth();
        if (retryCount < maxRetries) {
          return await operation();
        }
        break;
        
      default:
        console.error(`${api} API Error:`, error);
        throw error;
    }
  }
}
```

## 📈 Usage Quotas & Cost Analysis

### Daily Usage Estimates
```javascript
const dailyUsageEstimate = {
  sheets: {
    reads: 500,      // Reading schedules
    writes: 200,     // Updating schedules  
    creates: 5,      // New weekly sheets
    total: 705       // Well under 1B limit
  },
  calendar: {
    creates: 50,     // New events
    updates: 30,     // Event modifications
    deletes: 20,     // Cancelled classes
    total: 100       // Minimal usage
  },
  gmail: {
    sends: 100,      // Teacher notifications
    total: 100       // Well under 2,000 limit
  },
  drive: {
    watches: 10,     // Webhook subscriptions
    gets: 100,       // File metadata
    total: 110       // Current usage + new
  }
};
```

### Cost Analysis
- **Google Workspace APIs**: ✅ **FREE** (within quotas)
- **Webhook endpoint**: Requires HTTPS endpoint (~$5/month VPS)
- **Total additional cost**: ~$5/month (vs Cal.com $12+/month)

## ✅ Implementation Readiness

### Already Available ✅
- Service Account: `login-learning-drive@platformlogin.iam.gserviceaccount.com`
- Google Drive API: Fully configured
- Shared Drive: `0AAMvBF62LaLyUk9PVA`
- Authentication: JWT-based auth working

### Needs Setup 🔧  
- Enable Sheets, Calendar, Gmail APIs
- Update Service Account scopes
- Create webhook endpoint for real-time updates
- Implement rate limiting and error handling

### Next Steps
1. Enable additional Google APIs
2. Update Service Account permissions
3. Create Database Schema (Phase 1.2)
4. Design Data Flow architecture (Phase 1.3)

## 🔍 Security Considerations

### Service Account Security
```javascript
const securityMeasures = {
  tokenStorage: "Environment variables only, never commit to code",
  scopeLimiting: "Request minimal required scopes only",  
  webhookSecurity: "Verify webhook signatures",
  errorLogging: "Log errors but never expose tokens",
  accessControl: "Restrict Service Account to specific Drive/Sheet IDs"
};
```

### Webhook Endpoint Security
```javascript
// Webhook verification
app.post('/api/sheets-webhook', (req, res) => {
  const receivedSignature = req.headers['x-goog-channel-token'];
  const expectedSignature = process.env.WEBHOOK_VERIFICATION_TOKEN;
  
  if (receivedSignature !== expectedSignature) {
    return res.status(401).json({ error: 'Unauthorized webhook' });
  }
  
  // Process valid webhook...
});
```

---

**Status**: ✅ Analysis Complete  
**Next**: Phase 1.2 - Database Schema Design