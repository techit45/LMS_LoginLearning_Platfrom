// Simple in-memory cache for API responses
class SimpleCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Global cache instance
export const apiCache = new SimpleCache();

// Cache key generators
export const getCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

// Cached wrapper for API calls
export const withCache = async (key, fetchFn, ttl) => {
  // Check cache first
  const cached = apiCache.get(key);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  try {
    const result = await fetchFn();
    if (result && !result.error) {
      apiCache.set(key, result, ttl);
    }
    return result;
  } catch (error) {
    return { data: null, error };
  }
};