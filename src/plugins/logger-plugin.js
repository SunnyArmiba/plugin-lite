import { Plugin } from '../core/framework.js';

class LoggerPlugin extends Plugin {
  constructor(options = {}) {
    super('logger');
    this.options = {
      level: options.level || 'info',
      timestamp: options.timestamp !== false
    };
    
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    this.hooks = {
      onLog: this.onLog.bind(this)
    };
  }
  
  install(framework) {
    this.framework = framework;
    
    // 扩展框架实例，添加日志方法
    framework.log = {
      debug: this.debug.bind(this),
      info: this.info.bind(this),
      warn: this.warn.bind(this),
      error: this.error.bind(this)
    };
  }
  
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.options.level];
  }
  
  formatMessage(level, message) {
    let formatted = message;
    if (this.options.timestamp) {
      formatted = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    }
    return formatted;
  }
  
  log(level, message) {
    if (!this.shouldLog(level)) return;
    
    // 触发日志钩子
    this.framework.callHook('onLog', level, message);
    
    // 输出到控制台
    switch (level) {
      case 'debug':
        console.debug(this.formatMessage(level, message));
        break;
      case 'info':
        console.info(this.formatMessage(level, message));
        break;
      case 'warn':
        console.warn(this.formatMessage(level, message));
        break;
      case 'error':
        console.error(this.formatMessage(level, message));
        break;
    }
  }
  
  debug(message) {
    this.log('debug', message);
  }
  
  info(message) {
    this.log('info', message);
  }
  
  warn(message) {
    this.log('warn', message);
  }
  
  error(message) {
    this.log('error', message);
  }
  
  onLog(level, message) {
    // 默认的日志处理逻辑
    // 可以被其他插件扩展，比如发送到远程服务器
  }
}

export default LoggerPlugin;