import { Plugin } from '../core/framework.js';

class WelcomePlugin extends Plugin {
  constructor() {
    super('welcome');
  }
  
  install(framework) {
    this.framework = framework;
    // 添加欢迎页面路由
    const router = framework.getPlugin('router');
    if (router) {
      router.addRoute('/welcome', () => {
        return `
          <div style="text-align: center; padding: 2rem;">
            <h1>欢迎使用插件系统！</h1>
            <p>这是通过动态插件加载的功能</p>
            <button onclick="alert('欢迎！')">点击我</button>
          </div>
        `;
      });
    }
    
    // 添加到菜单
    const menu = framework.getPlugin('menu');
    if (menu) {
      menu.addMenuItem({
        title: '欢迎',
        url: '/welcome'
      });
    }
  }
  
  uninstall() {
    // 移除路由和菜单项
    const router = this.framework.getPlugin('router');
    const menu = this.framework.getPlugin('menu');
    
    if (router) {
      router.removeRoute('/welcome');
    }
    
    if (menu) {
      menu.removeMenuItem('/welcome');
    }
  }
}

export default WelcomePlugin;