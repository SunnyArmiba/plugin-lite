class PluginFramework {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.initialized = false;
  }

  // 注册插件
  registerPlugin(name, plugin) {
    if (this.plugins.has(name)) {
      console.warn(`Plugin ${name} is already registered`);
      return;
    }
    
    this.plugins.set(name, plugin);
    
    // 如果框架已经初始化，则立即初始化插件
    if (this.initialized) {
      this.initializePlugin(name, plugin);
    }
  }

  // 初始化单个插件
  initializePlugin(name, plugin) {
    if (plugin.install) {
      plugin.install(this);
    }
    
    // 注册插件的钩子
    if (plugin.hooks) {
      Object.keys(plugin.hooks).forEach(hookName => {
        const hookFunc = plugin.hooks[hookName];
        if (typeof hookFunc === 'function') {
          this.registerHook(name, hookName, hookFunc);
        }
      });
    }
  }

  // 初始化框架
  async init() {
    for (const [name, plugin] of this.plugins) {
      try {
        this.initializePlugin(name, plugin);
      } catch (error) {
        console.error(`Error initializing plugin ${name}:`, error);
      }
    }
    
    // 触发初始化完成钩子
    await this.callHook('onInit');
    this.initialized = true;
  }

  // 注册钩子
  registerHook(pluginName, hookName, func) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    this.hooks.get(hookName).push({
      pluginName,
      func
    });
  }

  // 调用钩子
  async callHook(hookName, ...args) {
    const hooks = this.hooks.get(hookName) || [];
    const results = [];
    
    for (const hook of hooks) {
      try {
        const result = await hook.func(...args);
        results.push(result);
      } catch (error) {
        console.error(`Error in hook ${hookName} of plugin ${hook.pluginName}:`, error);
      }
    }
    
    return results;
  }

  // 获取插件
  getPlugin(name) {
    return this.plugins.get(name);
  }

  // 卸载插件
  unregisterPlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.uninstall) {
      plugin.uninstall(this);
    }
    this.plugins.delete(name);
  }
}

// 创建全局框架实例
const framework = new PluginFramework();

// 插件基础类
class Plugin {
  constructor(name) {
    this.name = name;
  }
  
  // 插件安装时调用
  install(framework) {
    // 子类实现
  }
  
  // 插件卸载时调用
  uninstall(framework) {
    // 子类实现
  }
}

// 添加虚拟DOM和组件支持
function createElement(tag, props, ...children) {
  return {
    tag,
    props: props || {},
    children
  };
}

class Component {
  constructor(props) {
    this.props = props || {};
    this.state = {};
  }
  
  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.render();
  }
  
  render() {
    // 子类需要实现
  }
}

function render(element, container) {
  if (typeof element === 'string') {
    container.appendChild(document.createTextNode(element));
    return;
  }
  
  if (!element) return;
  
  const { tag, props, children } = element;
  
  // 创建DOM元素
  const dom = tag instanceof Function 
    ? document.createElement('div') 
    : document.createElement(tag);
  
  // 设置属性
  if (props) {
    Object.keys(props).forEach(key => {
      if (key.startsWith('on')) {
        dom.addEventListener(key.substring(2).toLowerCase(), props[key]);
      } else if (key === 'className') {
        dom.className = props[key];
      } else {
        dom.setAttribute(key, props[key]);
      }
    });
  }
  
  // 渲染子元素
  if (children) {
    children.forEach(child => {
      if (Array.isArray(child)) {
        child.forEach(c => render(c, dom));
      } else {
        render(child, dom);
      }
    });
  }
  
  // 如果是组件，调用组件的render方法
  if (tag instanceof Function) {
    const componentInstance = new tag(props);
    const componentElement = componentInstance.render();
    render(componentElement, dom);
  }
  
  // 添加到容器
  if (container) {
    container.appendChild(dom);
  }
  
  return dom;
}

export { PluginFramework, Plugin, framework, createElement, Component, render };