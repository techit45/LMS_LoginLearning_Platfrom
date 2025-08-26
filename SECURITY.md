# Security Guidelines

## Environment Variables Management

### Critical Security Issues Resolved
- ✅ Moved sensitive credentials out of committed files
- ✅ Created `.env.example` template with placeholder values
- ✅ Added security documentation and best practices
- ✅ Implemented proper environment variable structure

### Production Deployment

#### Vercel Environment Variables
Add these variables in Vercel Dashboard > Settings > Environment Variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://vuitwzisazvikrhtfthh.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Google Drive API (Single line JSON)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_DRIVE_FOLDER_ID=your_folder_id

# Application Settings
NODE_ENV=production
```

#### Netlify Environment Variables
Add these variables in Netlify Dashboard > Site Settings > Environment Variables:
- Same as Vercel configuration above

### Development Setup

1. Copy `.env.example` to `.env`
2. Fill in actual values (never commit `.env`)
3. Use separate service accounts for development
4. Store credentials in `./credentials/` directory (gitignored)

### Service Account Security

#### Current Service Account Permissions
- Google Drive API access
- Google Sheets API access
- Limited to specific shared drive

#### Recommended Security Measures
1. **Rotate Keys Regularly**: Change service account keys every 90 days
2. **Minimal Permissions**: Use least privilege principle
3. **Environment Separation**: Different accounts for dev/staging/prod
4. **Monitoring**: Enable API usage monitoring and alerts
5. **Access Review**: Regularly review and audit service account access

#### Key Rotation Process
1. Generate new service account key in Google Cloud Console
2. Update environment variables in deployment platforms
3. Test functionality with new keys
4. Delete old keys from Google Cloud Console
5. Update local `.env` files

### Additional Security Measures

#### Database Security
- ✅ Row Level Security (RLS) policies implemented
- ✅ Service role keys not exposed to frontend
- ⏳ Foreign key constraints (migration ready)

#### API Security
- ⚠️ Rate limiting needed for Google APIs
- ⚠️ API usage monitoring needed
- ⚠️ Request logging for security events

#### Frontend Security
- ✅ Environment variables properly prefixed with `VITE_`
- ✅ No sensitive data exposed to client-side
- ⚠️ Content Security Policy (CSP) headers needed

### Emergency Response

#### In Case of Key Compromise
1. **Immediately** disable compromised service account in Google Cloud Console
2. Generate new service account with different email
3. Update all environment variables
4. Redeploy applications
5. Monitor for unauthorized usage
6. Document the incident

#### Monitoring and Alerting
- Set up Google Cloud Console monitoring for unusual API usage
- Enable Supabase auth logging and monitoring
- Configure deployment platform monitoring (Vercel/Netlify)

### Compliance Checklist

- [ ] Service account keys rotated within 90 days
- [ ] Production and development use separate service accounts
- [ ] All sensitive data removed from version control
- [ ] Environment variables properly configured in deployment platforms
- [ ] API usage monitoring enabled
- [ ] Security incident response plan documented
- [ ] Team members trained on security best practices

---

**Last Updated**: August 2025
**Review Schedule**: Monthly
**Next Security Audit**: September 2025