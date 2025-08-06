import { Plugin, createElement, Component, render, renderComponent } from '../core/framework.js';

// 在模块顶层声明 PDF.js 变量
let pdfjsLib = null;

class PDFPreviewComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            pdfDocument: null,
            error: null,
            loading: false,
            currentPage: 1,
            totalPages: 0,
            annotations: [], // 存储所有标注
            isAnnotating: false, // 是否处于标注模式
            currentAnnotation: null // 当前正在绘制的标注
        };
        this.canvasRef = null;
        this.startX = 0;
        this.startY = 0;
    }

    render() {
        const { error, loading, pdfDocument, currentPage, totalPages } = this.state;

        return createElement('div', { className: 'pdf-preview-plugin' },
            createElement('h2', null, 'PDF 文档预览'),
            this.renderUploadArea(),
            loading ? this.renderLoading() : null,
            error ? this.renderError() : null,
            pdfDocument ? this.renderPDFViewer() : null
        );
    }

    renderPDFViewer() {
        const { currentPage, totalPages, isAnnotating } = this.state;

        return createElement('div', { className: 'pdf-viewer' },
            // 工具栏（包含分页控制和标注功能）
            createElement('div', { className: 'pdf-toolbar' },
                createElement('div', { className: 'pagination-info' },
                    `第 ${currentPage} 页 / 共 ${totalPages} 页`
                ),
                createElement('button', {
                    onClick: () => this.toggleAnnotationMode(),
                    className: isAnnotating ? 'active' : ''
                }, isAnnotating ? '退出标注' : '添加标注'),
                createElement('button', {
                    onClick: () => this.clearAnnotations()
                }, '清除标注'),
                createElement('button', {
                    onClick: () => this.goToPage(currentPage - 1),
                    ...(currentPage <= 1 ? { disabled: true } : {})
                }, '上一页'),
                createElement('button', {
                    onClick: () => this.goToPage(currentPage + 1),
                    ...(currentPage >= totalPages ? { disabled: true } : {})
                }, '下一页')
            ),
            // PDF 内容
            createElement('div', { className: 'pdf-content' },
                createElement('canvas', {
                    id: 'pdf-canvas',
                    ref: (element) => { this.canvasRef = element; },
                    style: { width: '100%', border: '1px solid #ddd', cursor: this.state.isAnnotating ? 'crosshair' : 'default' },
                    onMouseDown: (e) => this.handleMouseDown(e),
                    onMouseMove: (e) => this.handleMouseMove(e),
                    onMouseUp: (e) => this.handleMouseUp(e)
                })
            )
        );
    }

    renderUploadArea() {
        return createElement('div', { className: 'upload-area' },
            createElement('input', {
                type: 'file',
                accept: '.pdf',
                id: 'pdf-file-input',
                style: { display: 'none' },
                onChange: (e) => this.handleFileSelect(e)
            }),
            createElement('label', {
                for: 'pdf-file-input'
            }, '选择 PDF 文件')
        );
    }

    renderLoading() {
        return createElement('div', { className: 'loading' }, '正在加载文档...');
    }

    renderError() {
        return createElement('div', { className: 'error' }, this.state.error);
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.name.endsWith('.pdf')) {
            this.setState({ error: '请选择 .pdf 文件' });
            return;
        }

        this.setState({
            loading: true,
            error: null,
            file,
            pdfDocument: null,
            currentPage: 1,
            totalPages: 0,
            annotations: [], // 清除之前的标注
            isAnnotating: false,
            currentAnnotation: null
        });

        try {
            await this.previewPDFFile(file);
        } catch (error) {
            this.setState({ error: error.message, loading: false });
        }
    }

    async previewPDFFile(file) {
        // 检查 PDF.js 是否已加载
        if (!pdfjsLib) {
            throw new Error('PDF解析库未加载，请稍后重试');
        }

        try {
            // 读取文件为 ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // 加载 PDF 文档
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // 获取总页数
            const totalPages = pdf.numPages;

            this.setState({
                pdfDocument: pdf,
                totalPages,
                currentPage: 1,
                loading: false
            });

            // 渲染第一页
            await this.renderPage(1);

        } catch (error) {
            console.error('PDF文档解析失败:', error);
            throw new Error('文档解析失败: ' + (error.message || '未知错误'));
        }
    }

    async renderPage(pageNum) {
        const { pdfDocument } = this.state;

        if (!pdfDocument || !this.canvasRef) {
            return;
        }

        try {
            // 获取页面
            const page = await pdfDocument.getPage(pageNum);

            // 设置视口
            const viewport = page.getViewport({ scale: 1.5 });

            // 设置 canvas 尺寸
            const canvas = this.canvasRef;
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // 渲染页面
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // 渲染标注
            this.renderAnnotations(context);

        } catch (error) {
            console.error('页面渲染失败:', error);
            this.setState({ error: '页面渲染失败: ' + error.message });
        }
    }

    // 只渲染标注，不重新渲染整个PDF页面
    renderAnnotationsOnly() {
        if (!this.canvasRef) return;

        const context = this.canvasRef.getContext('2d');

        // 渲染标注
        // this.renderAnnotations(context);

        // 清除画布上一次绘制的临时标注
        // 通过重新渲染当前页面和所有标注来实现
        this.renderPage(this.state.currentPage);
    }

    // 渲染所有标注
    renderAnnotations(context) {
        const { annotations, currentAnnotation, currentPage } = this.state;

        // 渲染已保存的标注
        annotations
            .filter(ann => ann.page === currentPage)
            .forEach(annotation => {
                this.drawAnnotation(context, annotation);
            });

        // 渲染当前正在绘制的标注
        if (currentAnnotation) {
            this.drawAnnotation(context, currentAnnotation);
        }
    }

    // 绘制单个标注
    drawAnnotation(context, annotation) {
        context.fillStyle = annotation.color || 'rgba(255, 255, 0, 0.4)';
        context.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);

        context.strokeStyle = 'rgba(255, 200, 0, 0.8)';
        context.lineWidth = 1;
        context.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
    }

    async goToPage(pageNum) {
        const { totalPages } = this.state;

        if (pageNum < 1 || pageNum > totalPages) return;

        this.setState({
            currentPage: pageNum,
            currentAnnotation: null // 切换页面时清除当前正在绘制的标注
        });
        await this.renderPage(pageNum);
    }

    // 切换标注模式
    toggleAnnotationMode() {
        const newState = {
            isAnnotating: !this.state.isAnnotating,
            currentAnnotation: null
        };

        this.setState(newState, () => {

        });

        // 确保切换模式后PDF仍然显示
        if (this.state.pdfDocument) {
            this.renderPage(this.state.currentPage);
        }
    }

    // 清除所有标注
    clearAnnotations() {
        this.setState({
            annotations: [],
            currentAnnotation: null
        }, () => {

        });

        // 重新渲染当前页面以清除标注
        if (this.state.pdfDocument) {
            this.renderPage(this.state.currentPage);
        }
    }

    // 鼠标按下事件 - 开始绘制
    handleMouseDown(e) {
        if (!this.state.isAnnotating) return;

        const canvas = this.canvasRef;
        const rect = canvas.getBoundingClientRect();

        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;

        // 创建一个新的标注对象
        this.setState({
            currentAnnotation: {
                x: this.startX,
                y: this.startY,
                width: 0,
                height: 0,
                page: this.state.currentPage,
                color: 'rgba(255, 255, 0, 0.4)'
            }
        });
        // 重新渲染当前页面以清除标注
        if (this.state.pdfDocument) {
            this.renderPage(this.state.currentPage);
        }
    }

    // 鼠标移动事件 - 更新绘制
    handleMouseMove(e) {
        if (!this.state.isAnnotating || !this.state.currentAnnotation) return;

        const canvas = this.canvasRef;
        const rect = canvas.getBoundingClientRect();

        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // 更新当前标注的尺寸
        const updatedAnnotation = {
            ...this.state.currentAnnotation,
            width: currentX - this.startX,
            height: currentY - this.startY
        };

        this.setState({ currentAnnotation: updatedAnnotation });

        // 重新渲染页面和标注
        this.renderAnnotationsOnly();
    }

    // 鼠标抬起事件 - 完成绘制
    handleMouseUp(e) {
        if (!this.state.isAnnotating || !this.state.currentAnnotation) return;

        // 如果区域太小，则忽略
        if (Math.abs(this.state.currentAnnotation.width) < 5 ||
            Math.abs(this.state.currentAnnotation.height) < 5) {
            this.setState({ currentAnnotation: null }, () => {

            });
            // 重新渲染页面以清除临时标注
            this.renderPage(this.state.currentPage);
            return;
        }

        // 标准化坐标（确保宽度和高度为正值）
        let { x, y, width, height } = this.state.currentAnnotation;
        if (width < 0) {
            x += width;
            width = Math.abs(width);
        }
        if (height < 0) {
            y += height;
            height = Math.abs(height);
        }

        const normalizedAnnotation = {
            x, y, width, height,
            page: this.state.currentPage,
            color: 'rgba(255, 255, 0, 0.4)'
        };

        // 添加到标注列表
        const newAnnotations = [...this.state.annotations, normalizedAnnotation];
        this.setState({
            annotations: newAnnotations,
            currentAnnotation: null
        }, () => {

        });
        // 重新渲染页面和标注
        this.renderPage(this.state.currentPage);
    }

    // 当组件状态更新后，如果需要重新渲染页面则执行
    setState(partialState, callback) {
        const oldCurrentPage = this.state.currentPage;
        super.setState(partialState, callback);

        // 如果页面发生变化，重新渲染
        if (partialState.currentPage !== undefined &&
            partialState.currentPage !== oldCurrentPage) {
            // 不需要在这里做任何事，因为 goToPage 已经处理了渲染
        }
    }
}

class PDFPlugin extends Plugin {
    constructor(options = {}) {
        super('pdf');
        this.options = {
            container: options.container || 'content',
            ...options
        };
        this.pdfComponent = null;
        this.hooks = {
            onInit: () => { console.log('-----PDFPlugin initialized-----'); }
        };
    }

    async install(framework) {
        this.framework = framework;

        // 在安装插件时加载 PDF.js
        try {
            // 动态加载 PDF.js 脚本
            await new Promise((resolve, reject) => {
                // 检查是否已经加载过
                if (window.pdfjsLib) {
                    pdfjsLib = window.pdfjsLib;
                    // 设置 worker 路径
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
                    // 减少日志输出
                    pdfjsLib.verbosity = pdfjsLib.VerbosityLevel.ERRORS;
                    resolve();
                    return;
                }

                // 首先加载 PDF.js 主库
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.min.js';
                script.onload = () => {
                    pdfjsLib = window.pdfjsLib;
                    // 设置 worker 路径
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
                    // 减少日志输出
                    pdfjsLib.verbosity = pdfjsLib.VerbosityLevel.ERRORS;
                    console.log('PDF.js 加载成功');
                    resolve();
                };
                script.onerror = () => {
                    console.error('PDF.js 加载失败');
                    reject(new Error('PDF.js 脚本加载失败'));
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('PDF.js 加载失败:', error);
        }

        this.injectStyles();
        this.render();
    }

    injectStyles() {
        const styleId = 'pdf-plugin-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
  .pdf-preview-plugin {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .pdf-preview-plugin h2 {
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
  
  #pdf-file-input {
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
  
  .pdf-toolbar {
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .pdf-toolbar .pagination-info {
    margin-right: auto;
    font-size: 14px;
    color: #333;
  }
  
  .pdf-toolbar button {
    padding: 5px 12px;
    background-color: #fff;
    color: #333;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    font-size: 13px;
  }
  
  .pdf-toolbar button:hover:not(:disabled) {
    background-color: #e9e9e9;
  }
  
  .pdf-toolbar button:disabled {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
  }
  
  .pdf-toolbar button.active {
    background-color: #007bff;
    color: white;
  }
  
  .pdf-content {
    text-align: center;
    margin: 0;
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
  }
  
  .pagination button {
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .pagination button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .pagination .page-info {
    font-weight: bold;
    color: #333;
  }
  
  canvas {
    max-width: 100%;
    height: auto;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border: 1px solid #ddd;
  }
`;

        document.head.appendChild(style);
    }

    render() {
        const container = document.getElementById(this.options.container);
        if (!container) {
            console.warn(`PDF container with id '${this.options.container}' not found`);
            return;
        }

        this.pdfComponent = new PDFPreviewComponent({});

        // 使用专门的组件渲染函数
        renderComponent(this.pdfComponent, container);
    }

    uninstall() {
        const container = document.getElementById(this.options.container);
        if (!container) {
            console.warn(`PDF container with id '${this.options.container}' not found for uninstallation`);
            return;
        }
        // 清空容器
        container.innerHTML = '';

        if (this.pdfComponent) {
            this.pdfComponent = null;
        }
        const style = document.getElementById('pdf-plugin-styles');
        if (style) {
            style.remove();
        }
    }
}

export default PDFPlugin;