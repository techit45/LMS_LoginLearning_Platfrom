// Environment Variables Validation
export const validateEnvVariables = () => {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missing = [];
  const invalid = [];

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    } else {
      // Validate format
      if (key === 'VITE_SUPABASE_URL') {
        try {
          new URL(value);
          if (!value.includes('supabase.co')) {
            invalid.push(`${key}: ไม่ใช่ Supabase URL ที่ถูกต้อง`);
          }
        } catch {
          invalid.push(`${key}: รูปแบบ URL ไม่ถูกต้อง`);
        }
      }
      
      if (key === 'VITE_SUPABASE_ANON_KEY') {
        if (!value.startsWith('eyJ')) {
          invalid.push(`${key}: ไม่ใช่ JWT token ที่ถูกต้อง`);
        }
      }
    }
  });

  if (missing.length > 0 || invalid.length > 0) {
    const errors = [];
    
    if (missing.length > 0) {
      errors.push(`Environment variables ที่ขาดหายไป: ${missing.join(', ')}`);
    }
    
    if (invalid.length > 0) {
      errors.push(`Environment variables ที่ไม่ถูกต้อง: ${invalid.join(', ')}`);
    }
    
    throw new Error(`Environment Configuration Error:\n${errors.join('\n')}`);
  }

  return true;
};

// Security check for production
export const validateProductionSecurity = () => {
  if (import.meta.env.PROD) {
    const warnings = [];
    
    // Check if using localhost URLs in production
    if (import.meta.env.VITE_SUPABASE_URL?.includes('localhost')) {
      warnings.push('❌ กำลังใช้ localhost URL ใน production');
    }
    
    // Check for dev keys
    if (import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('dev') || 
        import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('test')) {
      warnings.push('❌ อาจกำลังใช้ development keys ใน production');
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
    console.log('✅ Environment validation passed');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    
    // In development, show alert
    if (import.meta.env.DEV) {
      alert(`Configuration Error:\n${error.message}\n\nกรุณาตรวจสอบไฟล์ .env`);
      return false;
    }
    
    // In production, show warning but allow app to continue with fallback
    // This prevents the error page from showing when env vars aren't set on Netlify yet
    console.warn('🚨 Production: Using fallback configuration. Please set environment variables in Netlify.');
    console.warn('📋 Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    console.warn('🔗 Setup guide: Check NETLIFY_ENV_SETUP.md');
    
    // Return true to allow app to load (will show connection errors in UI instead)
    return true;
  }
};