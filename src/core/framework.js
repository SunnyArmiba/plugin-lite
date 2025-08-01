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
    
    // 只有当组件已经被挂载时才重新渲染
    if (this._element) {
      // 保存当前的根元素引用
      const rootElement = this._element;
      
      // 重新渲染组件
      const newElement = this.render();
      
      // 清空当前根元素的内容
      while (rootElement.firstChild) {
        rootElement.removeChild(rootElement.firstChild);
      }
      
      // 渲染新的内容到根元素
      render(newElement, rootElement);
    }
  }
  
  render() {
    // 子类需要实现
  }
}

function render(element, container) {
  if (typeof element === 'string' || typeof element === 'number') {
    const textNode = document.createTextNode(element);
    container.appendChild(textNode);
    return textNode;
  }
  
  if (!element) return null;
  
  const { tag, props, children } = element;
  
  // 处理组件
  if (tag instanceof Function) {
    // 创建组件实例
    const componentInstance = new tag(props);
    
    // 调用组件的 render 方法
    const componentElement = componentInstance.render();
    
    // 保存组件实例的根元素引用
    componentInstance._element = container;
    
    // 渲染组件元素到容器
    return render(componentElement, container);
  }
  
  // 创建DOM元素
  const dom = document.createElement(tag);
  
  // 设置属性
  if (props) {
    Object.keys(props).forEach(key => {
      if (key.startsWith('on')) {
        // 事件处理
        const eventName = key.substring(2).toLowerCase();
        dom.addEventListener(eventName, props[key]);
      } else if (key === 'className') {
        // className 特殊处理
        dom.className = props[key];
      } else if (key === 'ref') {
        // ref 回调处理
        if (typeof props[key] === 'function') {
          props[key](dom);
        }
      } else if (key === 'innerHTML') {
        // innerHTML 特殊处理
        dom.innerHTML = props[key];
      } else {
        // 普通属性
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
  
  // 添加到容器
  if (container) {
    container.appendChild(dom);
  }
  
  return dom;
}

function renderComponent(component, container) {
  // 设置组件的根元素
  component._element = container;
  
  // 清空容器
  container.innerHTML = '';
  
  // 渲染组件
  const element = component.render();
  return render(element, container);
}

export { PluginFramework, Plugin, framework, createElement, Component, render, renderComponent };