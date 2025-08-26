/**
 * Secure Environment Variable Configuration
 * Centralizes environment variable handling with validation and security
 */

class EnvironmentConfig {
  constructor() {
    this.requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    this.sensitiveVars = [
      'GOOGLE_SERVICE_ACCOUNT_JSON',
      'GOOGLE_DRIVE_FOLDER_ID'
    ];

    this.config = this.validateAndLoad();
  }

  /**
   * Validate required environment variables and load configuration
   */
  validateAndLoad() {
    const config = {};
    const missing = [];
    const errors = [];

    // Check required frontend variables
    for (const varName of this.requiredVars) {
      const value = import.meta.env[varName];
      if (!value) {
        missing.push(varName);
      } else {
        config[varName] = value;
      }
    }

    // Validate URLs
    if (config.VITE_SUPABASE_URL && !this.isValidUrl(config.VITE_SUPABASE_URL)) {
      errors.push('VITE_SUPABASE_URL is not a valid URL');
    }

    // Validate JWT token format (basic check)
    if (config.VITE_SUPABASE_ANON_KEY && !this.isValidJWT(config.VITE_SUPABASE_ANON_KEY)) {
      errors.push('VITE_SUPABASE_ANON_KEY is not a valid JWT token');
    }

    // Report validation results
    if (missing.length > 0) {
      const missingList = missing.join(', ');
      throw new Error(`Missing required environment variables: ${missingList}`);
    }

    if (errors.length > 0) {
      throw new Error(`Environment variable validation errors: ${errors.join(', ')}`);
    }

    // Load optional variables with defaults
    config.NODE_ENV = import.meta.env.NODE_ENV || 'development';
    config.VITE_APP_NAME = import.meta.env.VITE_APP_NAME || 'Learning Management System';
    config.VITE_APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

    return config;
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @returns {string} Configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDevelopment() {
    return this.config.NODE_ENV === 'development';
  }

  /**
   * Check if running in production mode
   * @returns {boolean}
   */
  isProduction() {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * Get Supabase configuration
   * @returns {Object} Supabase config
   */
  getSupabaseConfig() {
    return {
      url: this.get('VITE_SUPABASE_URL'),
      anonKey: this.get('VITE_SUPABASE_ANON_KEY')
    };
  }

  /**
   * Get application metadata
   * @returns {Object} App metadata
   */
  getAppMetadata() {
    return {
      name: this.get('VITE_APP_NAME'),
      version: this.get('VITE_APP_VERSION'),
      environment: this.get('NODE_ENV')
    };
  }

  /**
   * Validate URL format
   * @param {string} url 
   * @returns {boolean}
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith('https://') || this.isDevelopment();
    } catch {
      return false;
    }
  }

  /**
   * Basic JWT token validation
   * @param {string} token 
   * @returns {boolean}
   */
  isValidJWT(token) {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Log configuration status (without sensitive data)
   */
  logStatus() {
    if (this.isDevelopment()) {
      const safeConfig = {
        NODE_ENV: this.config.NODE_ENV,
        VITE_APP_NAME: this.config.VITE_APP_NAME,
        VITE_APP_VERSION: this.config.VITE_APP_VERSION,
        VITE_SUPABASE_URL: this.config.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: `${this.config.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...`
      };
      
      console.log('🔧 Environment Configuration:', safeConfig);
    }
  }

  /**
   * Get environment-specific Google Drive configuration
   * Note: This is for server-side use only, not exposed to frontend
   * @returns {Object|null} Google Drive config or null if not available
   */
  static getGoogleDriveConfig() {
    // This method should only be used in server-side contexts (Edge Functions)
    if (typeof process !== 'undefined' && process.env) {
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      if (serviceAccountJson && folderId) {
        try {
          const credentials = JSON.parse(serviceAccountJson);
          return {
            credentials,
            folderId,
            isSharedDrive: true
          };
        } catch (error) {
          console.error('Failed to parse Google Service Account JSON:', error.message);
          return null;
        }
      }
    }
    
    return null;
  }
}

// Export singleton instance
const environmentConfig = new EnvironmentConfig();

// Log status in development
environmentConfig.logStatus();

export default environmentConfig;

// Export configuration getter functions for convenience
export const {
  get: getConfig,
  isDevelopment,
  isProduction,
  getSupabaseConfig,
  getAppMetadata
} = environmentConfig;