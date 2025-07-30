import { Plugin } from '../core/framework.js';

class ThemePlugin extends Plugin {
  constructor() {
    super('theme');
    this.currentTheme = 'light';
  }
  
  install(framework) {
    this.framework = framework;
    this.addThemeSwitcher();
  }
  
  addThemeSwitcher() {
    // 检查是否已经存在主题切换器
    if (document.getElementById('theme-switcher')) {
      return;
    }
    
    const themeSwitcher = document.createElement('div');
    themeSwitcher.id = 'theme-switcher';
    themeSwitcher.innerHTML = `
      <button id="toggle-theme" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
        切换主题
      </button>
    `;
    document.body.appendChild(themeSwitcher);
    
    document.getElementById('toggle-theme').addEventListener('click', () => {
      this.toggleTheme();
    });
  }
  
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.body.style.backgroundColor = this.currentTheme === 'dark' ? '#333' : '#fff';
    document.body.style.color = this.currentTheme === 'dark' ? '#fff' : '#000';
  }
  
  uninstall() {
    const switcher = document.getElementById('theme-switcher');
    if (switcher) {
      switcher.remove();
    }
  }
}

export default ThemePlugin;