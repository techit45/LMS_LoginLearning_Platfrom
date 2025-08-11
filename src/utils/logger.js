/**
 * Production-safe logging utility
 * Prevents console.log in production builds
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// Override global console in production
if (!isDevelopment) {
  const noop = () => {};
  window.console = {
    log: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    group: noop,
    groupEnd: noop,
    table: noop,
    time: noop,
    timeEnd: noop,
    assert: noop,
    count: noop,
    clear: noop,
    dir: noop,
    profile: noop,
    profileEnd: noop
  };
}

export default logger;