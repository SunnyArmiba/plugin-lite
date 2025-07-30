import { Plugin } from '../core/framework.js';

class HttpPlugin extends Plugin {
  constructor() {
    super('http');
    this.hooks = {
      beforeRequest: this.beforeRequest.bind(this),
      afterResponse: this.afterResponse.bind(this)
    };
  }
  
  install(framework) {
    this.framework = framework;
  }
  
  // HTTP请求方法
  async request(options) {
    // 触发请求前钩子
    await this.framework.callHook('beforeRequest', options);
    
    try {
      const response = await fetch(options.url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      
      const data = await response.json();
      
      // 触发响应后钩子
      const results = await this.framework.callHook('afterResponse', data, response);
      
      // 如果有插件修改了响应数据，使用最后一个返回的结果
      return results.length > 0 ? results[results.length - 1] : data;
    } catch (error) {
      console.error('HTTP request failed:', error);
      throw error;
    }
  }
  
  // GET请求
  get(url, options = {}) {
    return this.request({ ...options, url, method: 'GET' });
  }
  
  // POST请求
  post(url, data, options = {}) {
    return this.request({ ...options, url, method: 'POST', body: data });
  }
  
  // PUT请求
  put(url, data, options = {}) {
    return this.request({ ...options, url, method: 'PUT', body: data });
  }
  
  // DELETE请求
  delete(url, options = {}) {
    return this.request({ ...options, url, method: 'DELETE' });
  }
  
  // 请求前钩子
  beforeRequest(options) {
    // 默认实现，可以被其他插件扩展
    if (!options.headers) {
      options.headers = {};
    }
    // 添加默认的Content-Type
    if (!options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
  }
  
  // 响应后钩子
  afterResponse(data, response) {
    // 默认实现，可以被其他插件扩展
    return data;
  }
}

export default HttpPlugin;