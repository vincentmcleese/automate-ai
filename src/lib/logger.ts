/**
 * Production-safe logging utility
 * Logs to console in development, can be extended for production logging services
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: Date
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    }

    // Always log errors, even in production
    if (level === 'error' || this.isDevelopment) {
      this.logToConsole(entry)
    }

    // In production, you could send to external logging service here
    // Example: this.sendToExternalService(entry)
  }

  private logToConsole(entry: LogEntry) {
    const timestamp = entry.timestamp.toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`

    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.data || '')
        break
      case 'warn':
        console.warn(prefix, entry.message, entry.data || '')
        break
      case 'info':
        console.info(prefix, entry.message, entry.data || '')
        break
      case 'debug':
        console.debug(prefix, entry.message, entry.data || '')
        break
    }
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  // Convenience method for API errors
  apiError(endpoint: string, error: any, context?: any) {
    this.error(`API Error in ${endpoint}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
    })
  }

  // Convenience method for authentication errors
  authError(message: string, context?: any) {
    this.error(`Auth Error: ${message}`, context)
  }

  // Convenience method for database errors
  dbError(operation: string, error: any, context?: any) {
    this.error(`Database Error in ${operation}`, {
      error: error instanceof Error ? error.message : error,
      context,
    })
  }
}

export const logger = new Logger()
