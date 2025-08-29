/**
 * Utilitário de debug compartilhado para backend e frontend
 * Permite logs condicionais baseados em variáveis de ambiente
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (LogLevel = {}));
class DebugLogger {
    config;
    constructor(config = {}) {
        this.config = {
            enabled: this.isDebugEnabled(),
            level: this.getLogLevel(),
            prefix: '',
            timestamp: true,
            colors: true,
            ...config
        };
    }
    isDebugEnabled() {
        // Verifica se está em desenvolvimento
        if (typeof window !== 'undefined') {
            // Frontend
            try {
                return import.meta.env?.DEV || import.meta.env?.VITE_DEBUG === 'true';
            }
            catch {
                return false;
            }
        }
        else {
            // Backend
            return process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
        }
    }
    getLogLevel() {
        let level;
        if (typeof window !== 'undefined') {
            // Frontend
            try {
                level = import.meta.env?.VITE_LOG_LEVEL;
            }
            catch {
                level = undefined;
            }
        }
        else {
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
    formatMessage(level, message, data) {
        const timestamp = this.config.timestamp ? `[${new Date().toISOString()}]` : '';
        const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
        const levelStr = `[${level.toUpperCase()}]`;
        let formatted = `${timestamp}${prefix}${levelStr} ${message}`;
        if (data !== undefined) {
            formatted += ` | Data: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`;
        }
        return formatted;
    }
    shouldLog(level) {
        return this.config.enabled && level <= this.config.level;
    }
    error(message, data) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('error', message, data));
        }
    }
    warn(message, data) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }
    info(message, data) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatMessage('info', message, data));
        }
    }
    debug(message, data) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage('debug', message, data));
        }
    }
    trace(message, data) {
        if (this.shouldLog(LogLevel.TRACE)) {
            console.trace(this.formatMessage('trace', message, data));
        }
    }
    // Métodos específicos para diferentes contextos
    api(endpoint, method, data) {
        this.debug(`API ${method.toUpperCase()} ${endpoint}`, data);
    }
    database(query, params) {
        this.debug(`Database Query: ${query}`, params);
    }
    component(componentName, action, data) {
        this.debug(`Component [${componentName}] ${action}`, data);
    }
    performance(label, startTime) {
        const duration = Date.now() - startTime;
        this.info(`Performance [${label}]: ${duration}ms`);
    }
    // Método para criar logger com contexto específico
    createContext(prefix) {
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
export const createComponentLogger = (componentName) => debugLogger.createContext(`COMPONENT:${componentName}`);
// Decorador para métodos (opcional)
export function debugMethod(target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = function (...args) {
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
            }
            else {
                logger.performance('Method execution', startTime);
                logger.trace('Method completed', { result });
                return result;
            }
        }
        catch (error) {
            logger.error('Method failed', { error: error.message, stack: error.stack });
            throw error;
        }
    };
    return descriptor;
}
export default debugLogger;
