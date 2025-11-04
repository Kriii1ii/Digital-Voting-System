// Enhanced logger utility with structured logging
const getTimestamp = () => new Date().toISOString();

export const info = (message, meta = {}) => {
  console.log(JSON.stringify({
    level: 'INFO',
    timestamp: getTimestamp(),
    message,
    ...meta
  }));
};

export const warn = (message, meta = {}) => {
  console.warn(JSON.stringify({
    level: 'WARN', 
    timestamp: getTimestamp(),
    message,
    ...meta
  }));
};

export const error = (message, error = null, meta = {}) => {
  console.error(JSON.stringify({
    level: 'ERROR',
    timestamp: getTimestamp(),
    message,
    error: error?.message || error,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    ...meta
  }));
};

export const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(JSON.stringify({
      level: 'DEBUG',
      timestamp: getTimestamp(),
      message,
      ...meta
    }));
  }
};

// Keep the default export for backward compatibility
const logger = { info, warn, error, debug };
export default logger;
