# Google Drive API Functions Removed

The `/api/drive/` Vercel serverless functions have been removed and replaced with an external Express.js server at:

**https://google-drive-api-server.onrender.com**

## Reason for Removal

Vercel Hobby plan has infrastructure limitations that cause "error:1E08010C:DECODER routines::unsupported" when using the googleapis library with Service Account authentication.

## New Architecture

- **Frontend**: Uses https://google-drive-api-server.onrender.com/api/drive
- **Backend**: Express.js server deployed on Render.com
- **Authentication**: Working googleapis library with Service Account
- **Benefits**: No decoder errors, full functionality

## Files Moved To

All API logic has been moved to:
- GitHub: https://github.com/techit45/Google-Drive-API
- Deployed: https://google-drive-api-server.onrender.com

This ensures Google Drive integration works properly without Vercel serverless function limitations.