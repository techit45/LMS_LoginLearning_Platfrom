// ==========================================
// CACHING SYSTEM
// ระบบแคชข้อมูลเพื่อลดการเรียกใช้ API และฐานข้อมูล
// ==========================================

/**
 * Cache storage types
 */
export const CACHE_STORAGE = {
  MEMORY: "memory",
  LOCAL_STORAGE: "localStorage",
  SESSION_STORAGE: "sessionStorage",
  INDEXED_DB: "indexedDB",
};

/**
 * Cache priorities
 */
export const CACHE_PRIORITY = {
  LOW: "low", // Non-critical data, can be evicted first
  NORMAL: "normal", // Standard priority
  HIGH: "high", // Important data, evict last
  CRITICAL: "critical", // Never evict automatically
};

/**
 * Enhanced in-memory cache for API responses
 */
class EnhancedCache {
  constructor(options = {}) {
    const {
      defaultTTL = 5 * 60 * 1000, // 5 minutes default
      maxSize = 100, // Maximum number of items
      storageType = CACHE_STORAGE.MEMORY,
      namespace = "app-cache",
      debug = false,
    } = options;

    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.storageType = storageType;
    this.namespace = namespace;
    this.debug = debug;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };

    // Initialize storage
    this._initStorage();

    // Set up automatic cleanup
    this._setupCleanup();
  }

  /**
   * Initialize storage based on type
   */
  _initStorage() {
    if (this.storageType === CACHE_STORAGE.MEMORY) {
      // Already using Map
      return;
    }

    if (
      this.storageType === CACHE_STORAGE.LOCAL_STORAGE ||
      this.storageType === CACHE_STORAGE.SESSION_STORAGE
    ) {
      try {
        // Load existing cache from storage
        const storage =
          this.storageType === CACHE_STORAGE.LOCAL_STORAGE
            ? localStorage
            : sessionStorage;

        const cachedData = storage.getItem(this.namespace);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          Object.entries(parsedData).forEach(([key, item]) => {
            // Only load non-expired items
            if (Date.now() <= item.expiresAt) {
              this.cache.set(key, item);
            }
          });

          if (this.debug) {
            }
        }
      } catch (error) {
        }
    }

    // IndexedDB initialization would go here
    // Not implemented for simplicity
  }

  /**
   * Set up automatic cleanup
   */
  _setupCleanup() {
    // Clean up expired items every minute
    setInterval(() => this._cleanupExpired(), 60 * 1000);
  }

  /**
   * Clean up expired items
   */
  _cleanupExpired() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (this.debug && expiredCount > 0) {
      }

    // Persist to storage if needed
    this._persistCache();

    return expiredCount;
  }

  /**
   * Evict items if cache is too large
   */
  _evictIfNeeded() {
    if (this.cache.size <= this.maxSize) {
      return 0;
    }

    const itemsToEvict = this.cache.size - this.maxSize;

    // Sort items by priority (lowest first) and then by expiration (soonest first)
    const sortedItems = Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => {
        // First by priority
        const priorityOrder = {
          [CACHE_PRIORITY.LOW]: 0,
          [CACHE_PRIORITY.NORMAL]: 1,
          [CACHE_PRIORITY.HIGH]: 2,
          [CACHE_PRIORITY.CRITICAL]: 3,
        };

        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Then by expiration
        return a.expiresAt - b.expiresAt;
      });

    // Evict items
    for (let i = 0; i < itemsToEvict; i++) {
      if (
        i < sortedItems.length &&
        sortedItems[i].priority !== CACHE_PRIORITY.CRITICAL
      ) {
        this.cache.delete(sortedItems[i].key);
        this.stats.evictions++;
      }
    }

    if (this.debug) {
      }

    return itemsToEvict;
  }

  /**
   * Persist cache to storage
   */
  _persistCache() {
    if (this.storageType === CACHE_STORAGE.MEMORY) {
      return;
    }

    if (
      this.storageType === CACHE_STORAGE.LOCAL_STORAGE ||
      this.storageType === CACHE_STORAGE.SESSION_STORAGE
    ) {
      try {
        const storage =
          this.storageType === CACHE_STORAGE.LOCAL_STORAGE
            ? localStorage
            : sessionStorage;

        // Convert Map to object for storage
        const cacheObject = {};
        for (const [key, value] of this.cache.entries()) {
          cacheObject[key] = value;
        }

        storage.setItem(this.namespace, JSON.stringify(cacheObject));
      } catch (error) {
        }
    }

    // IndexedDB persistence would go here
  }

  /**
   * Set a value in the cache
   */
  set(key, value, options = {}) {
    const {
      ttl = this.defaultTTL,
      priority = CACHE_PRIORITY.NORMAL,
      metadata = {},
    } = options;

    const expiresAt = Date.now() + ttl;
    const item = {
      value,
      expiresAt,
      priority,
      metadata,
      createdAt: Date.now(),
      accessCount: 0,
    };

    this.cache.set(key, item);
    this.stats.sets++;

    // Evict if needed
    this._evictIfNeeded();

    // Persist to storage
    this._persistCache();

    if (this.debug) {
      console.log(
        `Cache set: ${key} (expires in ${ttl / 1000}s, priority: ${priority})`
      );
    }
  }

  /**
   * Get a value from the cache
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      if (this.debug) {
        }
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      if (this.debug) {
        }
      return null;
    }

    // Update access count
    item.accessCount++;
    this.cache.set(key, item);

    this.stats.hits++;
    if (this.debug) {
      console.log(`Cache hit: ${key} (access #${item.accessCount})`);
    }

    return item.value;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();

    // Clear persistent storage
    if (this.storageType === CACHE_STORAGE.LOCAL_STORAGE) {
      localStorage.removeItem(this.namespace);
    } else if (this.storageType === CACHE_STORAGE.SESSION_STORAGE) {
      sessionStorage.removeItem(this.namespace);
    }

    if (this.debug) {
      }
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);

    // Update persistent storage
    this._persistCache();

    if (this.debug && deleted) {
      }

    return deleted;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (
            (this.stats.hits / (this.stats.hits + this.stats.misses)) *
            100
          ).toFixed(2)
        : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Get all keys in the cache
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache
   */
  values() {
    return Array.from(this.cache.values()).map((item) => item.value);
  }

  /**
   * Get all entries in the cache with metadata
   */
  entries() {
    return Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      value: item.value,
      expiresAt: item.expiresAt,
      priority: item.priority,
      metadata: item.metadata,
      createdAt: item.createdAt,
      accessCount: item.accessCount,
      ttl: item.expiresAt - Date.now(),
    }));
  }
}

// Global cache instances
export const apiCache = new EnhancedCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  storageType: CACHE_STORAGE.MEMORY,
  namespace: "api-cache",
  debug: false,
});

export const pageCache = new EnhancedCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxSize: 50,
  storageType: CACHE_STORAGE.LOCAL_STORAGE,
  namespace: "page-cache",
  debug: false,
});

export const userCache = new EnhancedCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxSize: 20,
  storageType: CACHE_STORAGE.SESSION_STORAGE,
  namespace: "user-cache",
  debug: false,
});

/**
 * Cache key generators
 */
export const getCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(":")}`;
};

/**
 * Cached wrapper for API calls
 */
export const withCache = async (key, fetchFn, ttl, options = {}) => {
  const {
    cache = apiCache,
    priority = CACHE_PRIORITY.NORMAL,
    forceRefresh = false,
    metadata = {},
    onHit = null,
    onMiss = null,
  } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cache.get(key);
    if (cached) {
      if (onHit) onHit(cached, key);
      return cached;
    }
  }

  if (onMiss) onMiss(key);

  // Fetch and cache
  try {
    const result = await fetchFn();
    if (result && !result.error) {
      cache.set(key, result, { ttl, priority, metadata });
    }
    return result;
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Prefetch data into cache
 */
export const prefetchData = async (key, fetchFn, options = {}) => {
  // Use low priority by default for prefetched data
  const { priority = CACHE_PRIORITY.LOW, ...otherOptions } = options;

  return withCache(key, fetchFn, undefined, {
    priority,
    forceRefresh: true, // Always fetch fresh data
    ...otherOptions,
  });
};

/**
 * Batch prefetch multiple items
 */
export const batchPrefetch = async (items) => {
  return Promise.all(
    items.map(({ key, fetchFn, options }) =>
      prefetchData(key, fetchFn, options)
    )
  );
};

/**
 * Clear cache by prefix
 */
export const clearCacheByPrefix = (prefix, cache = apiCache) => {
  const keys = cache.keys();
  let count = 0;

  keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  });

  return count;
};

/**
 * Cache hook for React components
 */
export const useCachedData = (key, fetchFn, options = {}) => {
  // This would be implemented with React hooks
  // Not implemented here for simplicity
};

export default {
  apiCache,
  pageCache,
  userCache,
  getCacheKey,
  withCache,
  prefetchData,
  batchPrefetch,
  clearCacheByPrefix,
  CACHE_STORAGE,
  CACHE_PRIORITY,
};
