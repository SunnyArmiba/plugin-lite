import { Plugin } from '../core/framework.js';

class StatePlugin extends Plugin {
  constructor(options = {}) {
    super('state');
    this.state = options.initialState || {};
    this.listeners = [];
    this.hooks = {
      onStateChange: this.onStateChange.bind(this)
    };
  }

  install(framework) {
    this.framework = framework;
    
    // 扩展框架实例，添加状态管理方法
    framework.state = {
      get: this.get.bind(this),
      set: this.set.bind(this),
      subscribe: this.subscribe.bind(this),
      unsubscribe: this.unsubscribe.bind(this)
    };
  }

  // 获取状态值
  get(path) {
    if (!path) return this.state;
    
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  // 设置状态值
  set(path, value) {
    const oldValue = this.get(path);
    let changed = false;

    if (typeof path === 'string') {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((obj, key) => {
        if (!obj[key]) obj[key] = {};
        return obj[key];
      }, this.state);
      
      if (target[lastKey] !== value) {
        target[lastKey] = value;
        changed = true;
      }
    } else if (typeof path === 'object' && arguments.length === 1) {
      // 批量更新状态
      Object.keys(path).forEach(key => {
        if (this.state[key] !== path[key]) {
          this.state[key] = path[key];
          changed = true;
        }
      });
    }

    if (changed) {
      this.notifyListeners(path, value, oldValue);
      this.framework.callHook('onStateChange', path, value, oldValue);
    }
    
    return this;
  }

  // 订阅状态变化
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
    return () => this.unsubscribe(listener);
  }

  // 取消订阅状态变化
  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知监听器
  notifyListeners(path, newValue, oldValue) {
    this.listeners.forEach(listener => {
      try {
        listener(path, newValue, oldValue);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  // 状态变化钩子
  onStateChange(path, newValue, oldValue) {
    // 默认实现，可以被其他插件扩展
  }
}

export default StatePlugin;