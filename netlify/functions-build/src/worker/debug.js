"use strict";
// Debug utility specifically for Node.js worker environment
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiLogger = createApiLogger;
exports.createDbLogger = createDbLogger;
exports.createWorkerLogger = createWorkerLogger;
class WorkerLogger {
    context;
    isDev;
    logLevel;
    constructor(context) {
        this.context = context;
        this.isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
        this.logLevel = this.getLogLevel();
    }
    getLogLevel() {
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
    shouldLog(level) {
        const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}] [${this.context}]`;
        if (data) {
            return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
        }
        return `${prefix} ${message}`;
    }
    error(message, data) {
        if (this.shouldLog('ERROR')) {
            console.error(this.formatMessage('ERROR', message, data));
        }
    }
    warn(message, data) {
        if (this.shouldLog('WARN')) {
            console.warn(this.formatMessage('WARN', message, data));
        }
    }
    info(message, data) {
        if (this.shouldLog('INFO')) {
            console.info(this.formatMessage('INFO', message, data));
        }
    }
    debug(message, data) {
        if (this.shouldLog('DEBUG')) {
            console.log(this.formatMessage('DEBUG', message, data));
        }
    }
    trace(message, data) {
        if (this.shouldLog('TRACE')) {
            console.log(this.formatMessage('TRACE', message, data));
        }
    }
}
// Factory functions for different contexts
function createApiLogger(endpoint) {
    return new WorkerLogger(`API${endpoint ? `:${endpoint}` : ''}`);
}
function createDbLogger(table) {
    return new WorkerLogger(`DB${table ? `:${table}` : ''}`);
}
function createWorkerLogger(context) {
    return new WorkerLogger(context);
}
