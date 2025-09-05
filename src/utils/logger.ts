export interface LogData {
  [key: string]: any;
}

export const logger = {
  info: (message: string, data?: LogData) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error);
  },
  
  warn: (message: string, data?: LogData) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  debug: (message: string, data?: LogData) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

