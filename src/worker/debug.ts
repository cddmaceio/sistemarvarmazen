// Debug utility specifically for Node.js worker environment

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

class WorkerLogger {
  private context: string;
  private isDev: boolean;
  private logLevel: LogLevel;

  constructor(context: string) {
    this.context = context;
    this.isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL;
    
    switch (level?.toUpperCase()) {
      case 'ERROR': return 'ERROR';
      case 'WARN': return 'WARN';
      case 'INFO': return 'INFO';
      case 'DEBUG': return 'DEBUG';
      case 'TRACE': return 'TRACE';
      default: return this.isDev ? 'DEBUG' : 'INFO';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  error(message: string, data?: any) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('INFO')) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  trace(message: string, data?: any) {
    if (this.shouldLog('TRACE')) {
      console.log(this.formatMessage('TRACE', message, data));
    }
  }
}

// Factory functions for different contexts
export function createApiLogger(endpoint?: string): WorkerLogger {
  return new WorkerLogger(`API${endpoint ? `:${endpoint}` : ''}`);
}

export function createDbLogger(table?: string): WorkerLogger {
  return new WorkerLogger(`DB${table ? `:${table}` : ''}`);
}

export function createWorkerLogger(context: string): WorkerLogger {
  return new WorkerLogger(context);
}