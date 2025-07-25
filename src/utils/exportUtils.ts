/**
 * 导出工具类
 * 支持多种格式导出识别结果
 */

export interface ExportItem {
  fileName: string;
  recognitionType: string;
  model: string;
  provider: string;
  confidence: number;
  timestamp: number;
  content: string;
  originalContent?: string;
  metadata?: any;
}

export interface ExportOptions {
  format: 'txt' | 'json' | 'csv' | 'markdown' | 'pdf' | 'docx';
  includeMetadata?: boolean;
  includeThumbnails?: boolean;
  template?: string;
}

export class ExportUtils {
  /**
   * 导出为文本文件
   */
  static exportToText(items: ExportItem[], options: ExportOptions = { format: 'txt' }): string {
    const lines: string[] = [];
    
    lines.push('智能图片识别结果');
    lines.push('='.repeat(50));
    lines.push(`导出时间: ${new Date().toLocaleString()}`);
    lines.push(`文件数量: ${items.length}`);
    lines.push('');

    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.fileName}`);
      lines.push(`   识别类型: ${item.recognitionType}`);
      lines.push(`   AI模型: ${item.model} (${item.provider})`);
      lines.push(`   置信度: ${Math.round(item.confidence * 100)}%`);
      lines.push(`   时间: ${new Date(item.timestamp).toLocaleString()}`);
      lines.push('   识别内容:');
      lines.push(`   ${item.content.split('\n').join('\n   ')}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * 导出为JSON格式
   */
  static exportToJson(items: ExportItem[], options: ExportOptions = { format: 'json' }): string {
    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        totalItems: items.length,
        format: 'json',
        version: '1.0'
      },
      items: items.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).toISOString(),
        ...(options.includeMetadata && item.metadata ? { metadata: item.metadata } : {})
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导出为CSV格式
   */
  static exportToCsv(items: ExportItem[], options: ExportOptions = { format: 'csv' }): string {
    const headers = [
      '文件名',
      '识别类型',
      'AI模型',
      '提供商',
      '置信度',
      '时间',
      '识别内容'
    ];

    const rows = items.map(item => [
      item.fileName,
      item.recognitionType,
      item.model,
      item.provider,
      Math.round(item.confidence * 100) + '%',
      new Date(item.timestamp).toLocaleString(),
      item.content.replace(/[\r\n]/g, ' ').replace(/"/g, '""')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * 导出为Markdown格式
   */
  static exportToMarkdown(items: ExportItem[], options: ExportOptions = { format: 'markdown' }): string {
    const lines: string[] = [];
    
    lines.push('# 智能图片识别结果');
    lines.push('');
    lines.push(`**导出时间**: ${new Date().toLocaleString()}`);
    lines.push(`**文件数量**: ${items.length}`);
    lines.push('');

    items.forEach((item, index) => {
      lines.push(`## ${index + 1}. ${item.fileName}`);
      lines.push('');
      lines.push('| 项目 | 值 |');
      lines.push('|------|-----|');
      lines.push(`| 识别类型 | ${item.recognitionType} |`);
      lines.push(`| AI模型 | ${item.model} |`);
      lines.push(`| 提供商 | ${item.provider} |`);
      lines.push(`| 置信度 | ${Math.round(item.confidence * 100)}% |`);
      lines.push(`| 时间 | ${new Date(item.timestamp).toLocaleString()} |`);
      lines.push('');
      lines.push('### 识别内容');
      lines.push('');
      lines.push('```');
      lines.push(item.content);
      lines.push('```');
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * 导出为HTML格式
   */
  static exportToHtml(items: ExportItem[], options: ExportOptions = { format: 'txt' }): string {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>智能图片识别结果</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }
        .meta-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .item {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            background: #fff;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .item-title {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
        }
        .item-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }
        .meta-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        .meta-label {
            font-weight: 500;
            color: #6c757d;
        }
        .meta-value {
            color: #495057;
        }
        .content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        .confidence-high { color: #28a745; }
        .confidence-medium { color: #ffc107; }
        .confidence-low { color: #dc3545; }
        @media print {
            body { font-size: 12px; }
            .item { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>智能图片识别结果</h1>
        <p>导出时间: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="meta-info">
        <strong>文件数量:</strong> ${items.length}
    </div>
    
    ${items.map((item, index) => `
    <div class="item">
        <div class="item-header">
            <div class="item-title">${index + 1}. ${item.fileName}</div>
        </div>
        
        <div class="item-meta">
            <div class="meta-item">
                <span class="meta-label">识别类型:</span>
                <span class="meta-value">${item.recognitionType}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">AI模型:</span>
                <span class="meta-value">${item.model}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">提供商:</span>
                <span class="meta-value">${item.provider}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">置信度:</span>
                <span class="meta-value confidence-${item.confidence > 0.8 ? 'high' : item.confidence > 0.5 ? 'medium' : 'low'}">
                    ${Math.round(item.confidence * 100)}%
                </span>
            </div>
            <div class="meta-item">
                <span class="meta-label">时间:</span>
                <span class="meta-value">${new Date(item.timestamp).toLocaleString()}</span>
            </div>
        </div>
        
        <div class="content">${item.content}</div>
    </div>
    `).join('')}
</body>
</html>`;

    return htmlTemplate;
  }

  /**
   * 触发文件下载
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 根据格式导出文件
   */
  static async exportItems(items: ExportItem[], options: ExportOptions): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case 'txt':
        content = this.exportToText(items, options);
        filename = `识别结果_${timestamp}.txt`;
        mimeType = 'text/plain';
        break;

      case 'json':
        content = this.exportToJson(items, options);
        filename = `识别结果_${timestamp}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        content = this.exportToCsv(items, options);
        filename = `识别结果_${timestamp}.csv`;
        mimeType = 'text/csv';
        break;

      case 'markdown':
        content = this.exportToMarkdown(items, options);
        filename = `识别结果_${timestamp}.md`;
        mimeType = 'text/markdown';
        break;

      case 'pdf':
        // PDF导出需要额外的库，这里先用HTML代替
        content = this.exportToHtml(items, options);
        filename = `识别结果_${timestamp}.html`;
        mimeType = 'text/html';
        break;

      case 'docx':
        // DOCX导出需要额外的库，这里先用HTML代替
        content = this.exportToHtml(items, options);
        filename = `识别结果_${timestamp}.html`;
        mimeType = 'text/html';
        break;

      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }

    this.downloadFile(content, filename, mimeType);
  }

  /**
   * 批量导出识别结果
   */
  static async batchExport(items: ExportItem[], formats: ExportOptions[]): Promise<void> {
    for (const options of formats) {
      await this.exportItems(items, options);
      // 短暂延迟避免同时下载多个文件
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 创建导出预览
   */
  static createPreview(items: ExportItem[], format: ExportOptions['format']): string {
    const sampleItems = items.slice(0, 3); // 只取前3个作为预览
    
    switch (format) {
      case 'txt':
        return this.exportToText(sampleItems);
      case 'json':
        return this.exportToJson(sampleItems);
      case 'csv':
        return this.exportToCsv(sampleItems);
      case 'markdown':
        return this.exportToMarkdown(sampleItems);
      default:
        return this.exportToText(sampleItems);
    }
  }

  /**
   * 验证导出数据
   */
  static validateExportData(items: ExportItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!items || items.length === 0) {
      errors.push('没有可导出的数据');
    }

    items.forEach((item, index) => {
      if (!item.fileName) {
        errors.push(`第${index + 1}项缺少文件名`);
      }
      if (!item.content) {
        errors.push(`第${index + 1}项缺少识别内容`);
      }
      if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
        errors.push(`第${index + 1}项置信度数据无效`);
      }
      if (!item.timestamp) {
        errors.push(`第${index + 1}项缺少时间戳`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}