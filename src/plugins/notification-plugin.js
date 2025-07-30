import { Plugin } from '../core/framework.js';

class NotificationPlugin extends Plugin {
  constructor() {
    super('notification');
  }
  
  install(framework) {
    this.framework = framework;
    this.createNotificationArea();
    this.showNotification('通知插件已加载！');
  }
  
  createNotificationArea() {
    // 检查是否已经存在通知区域
    if (document.getElementById('notification-area')) {
      return;
    }
    
    const notificationArea = document.createElement('div');
    notificationArea.id = 'notification-area';
    notificationArea.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      z-index: 1000;
      width: 300px;
    `;
    document.body.appendChild(notificationArea);
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      background: #4CAF50;
      color: white;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      animation: fadeIn 0.3s;
    `;
    notification.textContent = message;
    
    // 添加淡入动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    const notificationArea = document.getElementById('notification-area');
    notificationArea.appendChild(notification);
    
    // 3秒后自动移除通知
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }
  
  uninstall() {
    const area = document.getElementById('notification-area');
    if (area) {
      area.remove();
    }
  }
}

export default NotificationPlugin;