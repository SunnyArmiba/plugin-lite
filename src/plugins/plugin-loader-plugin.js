import { Plugin } from '../core/framework.js';

class PluginLoaderPlugin extends Plugin {
    constructor() {
        super('pluginLoader');
        this.pluginRegistry = new Map();
    }

    install(framework) {
        this.framework = framework;
        this.registerBuiltInPlugins();
        this.createPluginLoaderUI();
    }

    // 注册内置插件信息（实际文件路径）
    registerBuiltInPlugins() {
        // 这里注册可用的插件及其文件路径
        this.pluginRegistry.set('welcome', {
            name: '欢迎插件',
            description: '添加欢迎页面功能',
            filePath: './welcome-plugin.js',
            loaded: false
        });

        this.pluginRegistry.set('theme', {
            name: '主题插件',
            description: '添加主题切换功能',
            filePath: './theme-plugin.js',
            loaded: false
        });

        this.pluginRegistry.set('notification', {
            name: '通知插件',
            description: '添加通知系统',
            filePath: './notification-plugin.js',
            loaded: false
        });

        this.pluginRegistry.set('word', {
            name: 'WORD插件',
            description: '添加WORD功能',
            filePath: './word-plugin.js',
            loaded: false
        });

        this.pluginRegistry.set('pdf', {
            name: 'PDF插件',
            description: '添加PDF功能',
            filePath: './pdf-plugin.js',
            loaded: false
        });
    }

    createPluginLoaderUI() {
        // 创建插件加载界面容器
        this.container = document.createElement('div');
        this.container.id = 'plugin-loader';
        this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      z-index: 10000;
      width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      display: none;
    `;

        this.container.innerHTML = `
      <h2>插件加载器</h2>
      <div id="plugin-loader-list"></div>
      <div style="margin-top: 20px; text-align: right;">
        <button id="close-plugin-loader">关闭</button>
      </div>
    `;

        document.body.appendChild(this.container);

        // 创建插件加载器触发按钮
        const triggerButton = document.createElement('button');
        triggerButton.id = 'plugin-loader-trigger';
        triggerButton.textContent = '加载插件';
        triggerButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      padding: 10px 15px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

        document.body.appendChild(triggerButton);

        // 绑定事件
        this.bindEvents();
        this.renderPluginList();
    }

    bindEvents() {
        // 打开插件加载器
        document.getElementById('plugin-loader-trigger').addEventListener('click', () => {
            this.container.style.display = 'block';
        });

        // 关闭插件加载器
        document.getElementById('close-plugin-loader').addEventListener('click', () => {
            this.container.style.display = 'none';
        });

        // 点击外部关闭
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.container.style.display = 'none';
            }
        });
    }

    renderPluginList() {
        const pluginList = document.getElementById('plugin-loader-list');
        pluginList.innerHTML = '';

        for (const [pluginId, pluginInfo] of this.pluginRegistry) {
            const isLoaded = this.framework.getPlugin(pluginId) !== undefined;

            const pluginItem = document.createElement('div');
            pluginItem.style.cssText = `
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 10px;
      `;

            pluginItem.innerHTML = `
        <h3>${pluginInfo.name}</h3>
        <p>${pluginInfo.description}</p>
        <p><small>文件: ${pluginInfo.filePath}</small></p>
        <button class="plugin-loader-toggle" data-plugin="${pluginId}">
          ${isLoaded ? '卸载' : '加载'}
        </button>
      `;

            pluginList.appendChild(pluginItem);
        }

        // 绑定插件切换按钮事件
        document.querySelectorAll('.plugin-loader-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                const pluginId = e.target.getAttribute('data-plugin');
                this.togglePlugin(pluginId);
            });
        });
    }

    async togglePlugin(pluginId) {
        const pluginInfo = this.pluginRegistry.get(pluginId);
        if (!pluginInfo) return;

        const isLoaded = this.framework.getPlugin(pluginId) !== undefined;

        this.notification = framework.getPlugin('notification');

        if (isLoaded) {
            // 卸载插件
            this.framework.unregisterPlugin(pluginId);
            pluginInfo.loaded = false;
            if (this.notification && 'notification' !== pluginId) {
                this.notification.showNotification(`插件 ${pluginId} 已卸载`);
            }
        } else {
            // 加载插件
            try {
                await this.loadPlugin(pluginId, pluginInfo.filePath);
                pluginInfo.loaded = true;
                if (this.notification) {
                    this.notification.showNotification(`插件 ${pluginId} 已加载`);
                }
            } catch (error) {
                console.error(`Failed to load plugin ${pluginId}:`, error);
                alert(`加载插件失败: ${error.message}`);
                return;
            }
        }

        // 更新UI
        this.renderPluginList();

        // 如果是菜单插件，重新渲染菜单
        const menu = this.framework.getPlugin('menu');
        if (menu) {
            menu.render();
        }
    }

    async loadPlugin(pluginId, filePath) {
        try {
            // 动态导入插件模块
            const module = await import(filePath);

            // 获取默认导出的插件类
            const PluginClass = module.default;

            if (!PluginClass) {
                throw new Error(`插件文件 ${filePath} 没有默认导出`);
            }

            // 创建插件实例
            const pluginInstance = new PluginClass();

            // 注册插件
            this.framework.registerPlugin(pluginId, pluginInstance);

            console.log(`Plugin ${pluginId} loaded successfully from ${filePath}`);
        } catch (error) {
            console.error(`Error loading plugin from ${filePath}:`, error);
            throw error;
        }
    }

    uninstall() {
        if (this.container) {
            this.container.remove();
        }

        const triggerButton = document.getElementById('plugin-loader-trigger');
        if (triggerButton) {
            triggerButton.remove();
        }
    }
}

export default PluginLoaderPlugin;