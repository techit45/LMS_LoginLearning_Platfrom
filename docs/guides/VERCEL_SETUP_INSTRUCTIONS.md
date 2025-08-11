# Vercel Environment Variables Setup Instructions

## Required Environment Variables

### 1. Google Drive Folder ID
```
GOOGLE_DRIVE_FOLDER_ID=0AAMvBF62LaLyUk9PVA
```

### 2. Google Service Account JSON
Variable name: `GOOGLE_SERVICE_ACCOUNT_JSON`

**Value**: Use the JSON content from the local file:
```bash
# Copy the content from the local credentials file
cat ./credentials/google-drive-service-account.json | jq -c .
```

## Setup Instructions

1. Go to Vercel Dashboard: https://vercel.com/techity-3442s-projects/login-learning-platform
2. Navigate to Settings → Environment Variables
3. Add both variables above
4. **Important**: The JSON must be a single line (no line breaks)
5. Deploy or wait for automatic deployment after GitHub push

## Verification

After setting up environment variables:
1. Check deployment logs for any JSON parsing errors
2. Test Google Drive functionality at: https://login-learning-platform.vercel.app/#/admin/google-drive
3. Verify API endpoints: https://login-learning-platform.vercel.app/api/drive/health

## Troubleshooting

- If you see JSON parsing errors, ensure the JSON is properly formatted as a single line
- If 500 errors persist, check Vercel function logs for detailed error messages
- Check browser console for URL detection logs: should show `/api/drive` for production