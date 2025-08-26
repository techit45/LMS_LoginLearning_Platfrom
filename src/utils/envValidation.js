import environmentConfig from '../lib/environmentConfig.js';

// Environment Variables Validation (now uses secure config)
export const validateEnvVariables = () => {
  try {
    // The environmentConfig constructor already validates required variables
    // and throws detailed error messages, so we just need to ensure it initialized
    const supabaseConfig = environmentConfig.getSupabaseConfig();
    
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      throw new Error('Supabase configuration is incomplete');
    }
    
    return true;
  } catch (error) {
    // Re-throw with localized message
    throw new Error(`Environment Configuration Error: ${error.message}`);
  }
};

// Security check for production
export const validateProductionSecurity = () => {
  if (environmentConfig.isProduction()) {
    const warnings = [];
    const supabaseConfig = environmentConfig.getSupabaseConfig();
    
    // Check if using localhost URLs in production
    if (supabaseConfig.url?.includes('localhost')) {
      warnings.push('❌ กำลังใช้ localhost URL ใน production');
    }
    
    // Check for dev keys
    if (supabaseConfig.anonKey?.includes('dev') || 
        supabaseConfig.anonKey?.includes('test')) {
      warnings.push('❌ อาจกำลังใช้ development keys ใน production');
    }
    
    // Check for secure HTTPS
    if (!supabaseConfig.url?.startsWith('https://')) {
      warnings.push('❌ Supabase URL ไม่ใช้ HTTPS');
    }
    
    if (warnings.length > 0) {
      console.warn('🚨 Production Security Warnings:');
      warnings.forEach(warning => console.warn(warning));
    }
  }
};

// Initialize validation
export const initializeApp = () => {
  try {
    validateEnvVariables();
    validateProductionSecurity();
    
    if (environmentConfig.isDevelopment()) {
      console.log('✅ Environment validation passed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    
    // In development, show alert
    if (environmentConfig.isDevelopment()) {
      alert(`Configuration Error:\n${error.message}\n\nกรุณาตรวจสอบไฟล์ .env`);
      return false;
    }
    
    // In production, show warning but allow app to continue with fallback
    // This prevents the error page from showing when env vars aren't set on deployment platform
    console.warn('🚨 Production: Environment configuration error detected.');
    console.warn('📋 Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    console.warn('🔗 Setup guide: Check SECURITY.md and .env.example');
    
    // Return true to allow app to load (will show connection errors in UI instead)
    return true;
  }
};