/**
 * Utilitário de debug compartilhado para backend e frontend
 * Permite logs condicionais baseados em variáveis de ambiente
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

class DebugLogger {
  private config: DebugConfig;

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {
      enabled: this.isDebugEnabled(),
      level: this.getLogLevel(),
      prefix: '',
      timestamp: true,
      colors: true,
      ...config
    };
  }

  private isDebugEnabled(): boolean {
    // Verifica se está em desenvolvimento
    if (typeof window !== 'undefined') {
      // Frontend
      try {
        return (import.meta as any).env?.DEV || (import.meta as any).env?.VITE_DEBUG === 'true';
      } catch {
        return false;
      }
    } else {
      // Backend
      return process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
    }
  }

  private getLogLevel(): LogLevel {
    let level: string | undefined;
    
    if (typeof window !== 'undefined') {
      // Frontend
      try {
        level = (import.meta as any).env?.VITE_LOG_LEVEL;
      } catch {
        level = undefined;
      }
    } else {
      // Backend
      level = process.env.LOG_LEVEL;
    }
    
    switch (level?.toUpperCase()) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return LogLevel.DEBUG;
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.config.timestamp ? `[${new Date().toISOString()}]` : '';
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const levelStr = `[${level.toUpperCase()}]`;
    
    let formatted = `${timestamp}${prefix}${levelStr} ${message}`;
    
    if (data !== undefined) {
      formatted += ` | Data: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`;
    }
    
    return formatted;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && level <= this.config.level;
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  trace(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.trace(this.formatMessage('trace', message, data));
    }
  }

  // Métodos específicos para diferentes contextos
  api(endpoint: string, method: string, data?: any): void {
    this.debug(`API ${method.toUpperCase()} ${endpoint}`, data);
  }

  database(query: string, params?: any): void {
    this.debug(`Database Query: ${query}`, params);
  }

  component(componentName: string, action: string, data?: any): void {
    this.debug(`Component [${componentName}] ${action}`, data);
  }

  performance(label: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.info(`Performance [${label}]: ${duration}ms`);
  }

  // Método para criar logger com contexto específico
  createContext(prefix: string): DebugLogger {
    return new DebugLogger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix
    });
  }
}

// Instância global padrão
export const debugLogger = new DebugLogger();

// Factory functions para contextos específicos
export const createApiLogger = () => debugLogger.createContext('API');
export const createDbLogger = () => debugLogger.createContext('DB');
export const createComponentLogger = (componentName: string) => 
  debugLogger.createContext(`COMPONENT:${componentName}`);

// Decorador para métodos (opcional)
export function debugMethod(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    const logger = debugLogger.createContext(`${target.constructor.name}.${propertyName}`);
    logger.trace('Method called', { args });
    
    const startTime = Date.now();
    try {
      const result = method.apply(this, args);
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            logger.performance('Method execution', startTime);
            logger.trace('Method completed', { result: res });
            return res;
          })
          .catch((error) => {
            logger.error('Method failed', { error: error.message, stack: error.stack });
            throw error;
          });
      } else {
        logger.performance('Method execution', startTime);
        logger.trace('Method completed', { result });
        return result;
      }
    } catch (error: any) {
      logger.error('Method failed', { error: error.message, stack: error.stack });
      throw error;
    }
  };
  
  return descriptor;
}

export default debugLogger;