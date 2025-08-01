import { framework } from './core/framework.js';
import RouterPlugin from './plugins/router-plugin.js';
import HttpPlugin from './plugins/http-plugin.js';
import LoggerPlugin from './plugins/logger-plugin.js';
// 添加菜单插件导入
import MenuPlugin from './plugins/menu-plugin.js';
// 添加状态管理插件导入
import StatePlugin from './plugins/state-plugin.js';
// 导入插件加载器插件
import PluginLoaderPlugin from './plugins/plugin-loader-plugin.js';

import { Plugin, createElement, Component, render } from './core/framework.js';

// 注册核心插件
framework.registerPlugin('logger', new LoggerPlugin({ level: 'debug' }));
framework.registerPlugin('http', new HttpPlugin());
framework.registerPlugin('router', new RouterPlugin());
// 注册菜单插件
framework.registerPlugin('menu', new MenuPlugin());
// 注册状态管理插件
framework.registerPlugin('state', new StatePlugin({
  initialState: {
    user: 'guest',
    theme: 'light',
    notifications: []
  }
}));

// 注册插件加载器插件
framework.registerPlugin('pluginLoader', new PluginLoaderPlugin());


// 初始化框架
framework.init().then(() => {
  console.log('Framework initialized');

  // 获取路由插件并设置路由
  const router = framework.getPlugin('router');
  const logger = framework.getPlugin('logger');
  // 获取菜单插件
  const menu = framework.getPlugin('menu');
  // 获取状态管理插件
  const state = framework.getPlugin('state');
  logger.info('state loaded,default value:' + state.get('user'));
  if (router) {
    router.addRoute('/', () => {
      return '<h1>Home Page</h1><p>Welcome to the plugin framework!</p>';
    });

    router.addRoute('/about', () => {
      return '<h1>About Page</h1><p>This is a plugin-based frontend framework.</p>';
    });
  }

  // 配置菜单
  if (menu) {
    menu.addMenuItem({
      title: 'Home',
      url: '/'
    });

    menu.addMenuItem({
      title: 'About',
      url: '/about'
    });

    menu.addMenuItem({
      title: 'External Links',
      children: [
        {
          title: 'GitHub',
          url: 'https://github.com'
        },
        {
          title: 'MDN Web Docs',
          url: 'https://developer.mozilla.org'
        }
      ]
    });

    // 渲染菜单
    menu.render();
  }

  // 监听状态变化
  if (state) {
    state.subscribe((path, newValue, oldValue) => {
      logger.debug(`State changed: ${path} from ${oldValue} to ${newValue}`);
    });
  }

  // 添加动态插件注册示例
  window.addEventListener('load', () => {
    // 创建一个简单的动态插件示例
    setTimeout(() => {
      class DynamicPlugin extends Plugin {
        constructor() {
          super('dynamic');
        }

        install(framework) {
          console.log('Dynamic plugin installed');
          this.framework = framework;
          this.activate();
        }

        activate() {
          // 动态添加一个路由
          const router = this.framework.getPlugin('router');
          if (router) {
            router.addRoute('/dynamic', () => {
              return '<h1>Dynamic Plugin Page</h1><p>This page was added at runtime!</p>';
            });

            // 更新菜单

          }
          const menu = this.framework.getPlugin('menu');
          if (menu) {
            menu.addMenuItem({
              title: 'Dynamic Plugin',
              url: '/dynamic'
            });
            menu.render();
          }
        }
      }
      // 注册动态插件 (模拟运行时插件加载)
      // 在实际应用中，这可能来自外部文件或用户操作
      framework.registerPlugin('dynamic', new DynamicPlugin());
    }
      , 3000); // 3秒后注册插件以演示运行时注册
  });
});


// 将框架实例暴露到全局作用域，方便在控制台调试
window.framework = framework;