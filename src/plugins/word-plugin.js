import { Plugin, createElement, Component, render, renderComponent } from '../core/framework.js';

// 在模块顶层声明 mammoth 变量
let mammoth = null;

class WordPreviewComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            content: '',
            error: null,
            loading: false
        };
    }

    render() {
        const { content, error, loading } = this.state;

        return createElement('div', { className: 'word-preview-plugin' },
            createElement('h2', null, 'Word 文档预览'),
            this.renderUploadArea(),
            loading ? this.renderLoading() : null,
            error ? this.renderError() : null,
            content ? this.renderContent() : null
        );
    }

    renderUploadArea() {
        return createElement('div', { className: 'upload-area' },
            createElement('input', {
                type: 'file',
                accept: '.doc,.docx',
                id: 'word-file-input',
                style: { display: 'none' },
                onChange: (e) => this.handleFileSelect(e)
            }),
            createElement('label', {
                for: 'word-file-input'
            }, '选择 Word 文件')
        );
    }


    renderLoading() {
        return createElement('div', { className: 'loading' }, '正在加载文档...');
    }

    renderError() {
        return createElement('div', { className: 'error' }, this.state.error);
    }

    renderContent() {
        return createElement('div', {
            className: 'preview-content',
            innerHTML: this.state.content
        });
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
            this.setState({ error: '请选择 .doc 或 .docx 文件' });
            return;
        }

        this.setState({ loading: true, error: null, file });

        try {
            const content = await this.previewWordFile(file);
            this.setState({ content, loading: false });
        } catch (error) {
            this.setState({ error: error.message, loading: false });
        }
    }

    async previewWordFile(file) {
        // 检查 mammoth 是否已加载
        if (!mammoth) {
            throw new Error('文档解析库未加载，请稍后重试');
        }
        try {
            // 检查文件类型，mammoth 只支持 .docx 文件
            if (!file.name.endsWith('.docx')) {
                throw new Error('当前仅支持 .docx 格式的 Word 文档');
            }

            // 将文件转换为 arrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // 使用 mammoth 解析 Word 文档
            // 处理不同的导出格式
            const mammothLib = mammoth.default || mammoth;

            if (typeof mammothLib.convertToHtml !== 'function') {
                throw new Error('mammoth 库格式不正确');
            }

            const result = await mammothLib.convertToHtml({ arrayBuffer });

            // 检查是否有解析错误
            if (result.messages && result.messages.length > 0) {
                const errors = result.messages.filter(msg => msg.type === 'error');
                if (errors.length > 0) {
                    throw new Error('文档解析出现错误: ' + errors.map(e => e.message).join(', '));
                }
            }

            // 返回解析后的 HTML 内容
            return result.value;
        } catch (error) {
            console.error('Word文档解析失败:', error);
            throw new Error('文档解析失败: ' + (error.message || '未知错误'));
        }
    }
}

class WordPlugin extends Plugin {
    constructor(options = {}) {
        super('word');
        this.options = {
            container: options.container || 'content',
            ...options
        };
        this.wordComponent = null;
        this.hooks = {
            onInit: () => { console.log('-----WordPlugin initialized-----'); }
        };
    }

    async install(framework) {
        this.framework = framework;

        // 在安装插件时加载 mammoth.js
        try {
            // 动态加载 mammoth.js 脚本
            await new Promise((resolve, reject) => {
                // 检查是否已经加载过
                if (window.mammoth) {
                    mammoth = window.mammoth;
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://unpkg.com/mammoth@1.4.2/mammoth.browser.min.js';
                script.onload = () => {
                    mammoth = window.mammoth;
                    console.log('Mammoth.js 加载成功');
                    resolve();
                };
                script.onerror = () => {
                    console.error('Mammoth.js 加载失败');
                    reject(new Error('Mammoth.js 脚本加载失败'));
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('Mammoth.js 加载失败:', error);
        }

        this.injectStyles();
    }

    injectStyles() {
        const styleId = 'word-plugin-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
      .word-preview-plugin {
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
      }
      
      .word-preview-plugin h2 {
        color: #333;
        margin-bottom: 20px;
      }
      
      .upload-area {
        margin-bottom: 20px;
        padding: 20px;
        border: 2px dashed #ccc;
        text-align: center;
        border-radius: 5px;
      }
      
      #word-file-input {
        display: none;
      }
      
      .upload-area label {
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        display: inline-block;
      }
      
      .upload-area label:hover {
        background-color: #0056b3;
      }
      
      .loading {
        text-align: center;
        padding: 20px;
        color: #007bff;
      }
      
      .error {
        padding: 15px;
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        margin-bottom: 20px;
      }
      
      .preview-content {
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .preview-content h1 {
        color: #333;
        border-bottom: 2px solid #007bff;
        padding-bottom: 10px;
      }
      
      .preview-content p {
        line-height: 1.6;
        margin-bottom: 15px;
      }
      
      .preview-content ul {
        margin-left: 20px;
        margin-bottom: 15px;
      }
      
      .preview-content li {
        margin-bottom: 5px;
      }
    `;

        document.head.appendChild(style);
        this.render()
    }

    render() {
        const container = document.getElementById(this.options.container);
        if (!container) {
            console.warn(`Word container with id '${this.options.container}' not found`);
            return;
        }

        this.wordComponent = new WordPreviewComponent({});

        // 使用专门的组件渲染函数
        renderComponent(this.wordComponent, container);
    }

    uninstall() {
        const container = document.getElementById(this.options.container);
        if (!container) {
            console.warn(`Word container with id '${this.options.container}' not found for uninstallation`);
            return;
        }
        // 清空容器
        container.innerHTML = '';

        if (this.wordComponent) {
            this.wordComponent = null;
        }
        const style = document.getElementById('word-plugin-styles');
        if (style) {
            style.remove();
        }
    }
}

export default WordPlugin;