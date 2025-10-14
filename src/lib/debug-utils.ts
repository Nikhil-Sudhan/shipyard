// Debug utilities for development

/**
 * Enhanced console logger with timestamps and optional context
 * @param level Log level (log, info, warn, error)
 * @param message Message to log
 * @param context Optional context object
 */
export const logger = {
  log: (message: string, context?: any) => {
    console.log(`[${new Date().toISOString()}] ${message}`, context || '');
  },
  info: (message: string, context?: any) => {
    console.info(`[${new Date().toISOString()}] INFO: ${message}`, context || '');
  },
  warn: (message: string, context?: any) => {
    console.warn(`[${new Date().toISOString()}] WARNING: ${message}`, context || '');
  },
  error: (message: string, context?: any) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, context || '');
  }
};

/**
 * Utility to handle API responses and extract error messages
 * @param response Fetch API response
 * @returns Object with success status and data or error message
 */
export async function handleApiResponse<T>(response: Response): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}> {
  const statusCode = response.status;
  
  try {
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data as T,
        statusCode
      };
    } else {
      return {
        success: false,
        error: data.error || 'Unknown error occurred',
        statusCode
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse response',
      statusCode
    };
  }
}
