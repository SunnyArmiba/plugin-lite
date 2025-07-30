import { Plugin } from '../core/framework.js';

class RouterPlugin extends Plugin {
  constructor() {
    super('router');
    this.routes = new Map();
    this.currentRoute = null;
    this.hooks = {
      onRouteChange: this.onRouteChange.bind(this)
    };
  }
  
  install(framework) {
    this.framework = framework;
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }
  
  // 添加路由
  addRoute(path, component) {
    this.routes.set(path, component);
  }

  // 移除路由
  removeRoute(path) {
    this.routes.delete(path);
  }
  
  // 导航到指定路径
  navigate(path) {
    if (this.routes.has(path)) {
      window.history.pushState({}, '', path);
      this.currentRoute = path;
      this.framework.callHook('onRouteChange', path, this.routes.get(path));
      this.framework.state.set('router', path);
    }
  }
  
  // 处理浏览器前进后退
  handlePopState(event) {
    const path = window.location.pathname;
    if (this.routes.has(path)) {
      this.currentRoute = path;
      this.framework.callHook('onRouteChange', path, this.routes.get(path));
    }
  }
  
  // 路由变化钩子
  onRouteChange(path, component) {
    // 默认的路由处理逻辑
    const appElement = document.getElementById('app');
    if (appElement && component) {
      appElement.innerHTML = typeof component === 'function' ? component() : component;
    }
  }
}

export default RouterPlugin;