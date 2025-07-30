import { Plugin, createElement, Component, render } from '../core/framework.js';

class MenuComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menuItems: props.menuItems || []
    };
  }
  
  render() {
    return createElement('div', { id: 'menu' }, 
      this.generateMenuList(this.state.menuItems)
    );
  }
  
  generateMenuList(menuItems, level = 0) {
    if (!menuItems || menuItems.length === 0) return null;
    
    const className = level === 0 ? 'menu' : 'submenu';
    
    return createElement('ul', { className }, 
      ...menuItems.map(item => this.generateMenuItem(item, level))
    );
  }
  
  generateMenuItem(item, level) {
    const hasChildren = item.children && item.children.length > 0;
    const isExternal = item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'));
    
    const linkProps = isExternal 
      ? { href: item.url, target: '_blank' }
      : item.url 
        ? { href: '#', onClick: (e) => this.handleNavigation(e, item.url) }
        : {};
    
    return createElement('li', { className: 'menu-item' },
      item.url 
        ? createElement('a', linkProps, item.title)
        : createElement('span', null, item.title),
      hasChildren ? this.generateMenuList(item.children, level + 1) : null
    );
  }
  
  handleNavigation(e, path) {
    e.preventDefault();
    const router = this.props.framework.getPlugin('router');
    if (router) {
      router.navigate(path);
    }
  }
}

class MenuPlugin extends Plugin {
  constructor(options = {}) {
    super('menu');
    this.options = {
      container: options.container || 'menu',
      ...options
    };
    this.menuItems = [];
    this.hooks = {
      onMenuRender: this.onMenuRender.bind(this),
      onInit: () => {console.log('-----MenuPlugin initialized-----');}
    };
    this.menuComponent = null;
  }

  install(framework) {
    this.framework = framework;
    this.injectStyles();
  }

  // 注入菜单样式
  injectStyles() {
    const styleId = 'menu-plugin-styles';
    // 检查是否已经注入过样式
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #menu {
        background-color: #f5f5f5;
        padding: 6px;
      }
      
      .menu {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: row;
      }
      
      .menu li {
        margin: 0;
        position: relative;
      }
      
      .menu a, .menu > li > span {
        text-decoration: none;
        color: #333;
        display: block;
        padding: 10px 15px;
      }
      
      .menu a:hover {
        background-color: #ddd;
      }
      
      .submenu {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background-color: #f5f5f5;
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
      }
      
      .menu li:hover .submenu {
        display: block;
      }
      
      .submenu li {
        margin: 0;
      }
      
      .submenu a {
        padding: 10px 15px;
        display: block;
      }
      
      nav {
        margin: 10px 0;
      }
      
      nav button {
        margin-right: 10px;
        padding: 5px 10px;
      }
    `;
    
    document.head.appendChild(style);
  }

  // 添加菜单项
  addMenuItem(item) {
    this.menuItems.push(item);
    if (this.menuComponent) {
      this.menuComponent.setState({ menuItems: this.menuItems });
    }
  }

  // 移除菜单项
  removeMenuItem(url) {
    this.menuItems = this.menuItems.filter(item => item.url !== url);
    if (this.menuComponent) {
      this.menuComponent.setState({ menuItems: this.menuItems });
    }
  }

  // 渲染菜单
  render() {
    const container = document.getElementById(this.options.container);
    if (!container) {
      console.warn(`Menu container with id '${this.options.container}' not found`);
      return;
    }

    // 使用新的组件系统渲染菜单
    this.menuComponent = new MenuComponent({
      menuItems: this.menuItems,
      framework: this.framework
    });
    
    // 清空容器
    container.innerHTML = '';
    
    // 渲染组件
    const element = this.menuComponent.render();
    render(element, container);
    
    // 触发菜单渲染钩子
    this.framework.callHook('onMenuRender', this.menuItems);
  }

  // 菜单渲染钩子
  onMenuRender(menuItems) {
    // 默认实现，可以被其他插件扩展
  }
}

export default MenuPlugin;