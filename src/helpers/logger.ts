const IS_DEV = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

declare global {
  interface Window {
    __DEBUG_AV_COMPONENT__?: boolean;
  }
}

const isDev = () => IS_DEV || (window && window.__DEBUG_AV_COMPONENT__);

export const Logger = {
  log(...args) {
    if (isDev()) {
      console.log(...args);
    }
  },
  warn(...args) {
    if (isDev()) {
      console.warn(...args);
    }
  },
  error(...args) {
    if (isDev()) {
      console.error(...args);
    }
  },
  groupCollapsed(...args) {
    if (isDev()) {
      console.groupCollapsed(...args);
    }
  },
  group(...args) {
    if (isDev()) {
      console.group(...args);
    }
  },
  groupEnd() {
    if (isDev()) {
      console.groupEnd();
    }
  },
};
