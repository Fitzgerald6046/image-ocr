/**
 * 输入验证和清理工具
 * 防止路径遍历、注入攻击和其他安全问题
 */

import path from 'path';
import crypto from 'crypto';

class InputValidator {
  
  /**
   * 验证和清理文件路径，防止路径遍历攻击
   * @param {string} filePath - 待验证的文件路径
   * @param {string} basePath - 允许的基础路径
   * @returns {string} 清理后的安全路径
   * @throws {Error} 如果路径不安全
   */
  static validateFilePath(filePath, basePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }

    // 移除危险字符和序列
    const dangerous = ['../', '.\\', '../', '..\\', '%2e%2e', '%2E%2E'];
    for (const danger of dangerous) {
      if (filePath.toLowerCase().includes(danger.toLowerCase())) {
        throw new Error('Path traversal attempt detected');
      }
    }

    // 解析和规范化路径
    const resolvedPath = path.resolve(basePath, filePath);
    const normalizedBase = path.resolve(basePath);

    // 确保解析后的路径仍在基础目录内
    if (!resolvedPath.startsWith(normalizedBase)) {
      throw new Error('Path outside allowed directory');
    }

    return resolvedPath;
  }

  /**
   * 验证文件ID格式（UUID或安全的文件标识符）
   * @param {string} fileId - 文件标识符
   * @returns {boolean} 是否为有效格式
   */
  static validateFileId(fileId) {
    if (!fileId || typeof fileId !== 'string') {
      return false;
    }

    // 检查UUID格式 (v4)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // 检查安全的文件名格式（只包含字母数字和连字符）
    const safeNamePattern = /^[a-zA-Z0-9\-_]{8,64}$/;

    return uuidPattern.test(fileId) || safeNamePattern.test(fileId);
  }

  /**
   * 清理和验证文件名
   * @param {string} filename - 原始文件名
   * @returns {string} 清理后的安全文件名
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Invalid filename');
    }

    // 移除或替换危险字符
    let sanitized = filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // 移除文件系统禁用字符
      .replace(/^\.+/, '') // 移除开头的点
      .replace(/\.+$/, '') // 移除结尾的点
      .replace(/\s+/g, '_') // 空格替换为下划线
      .toLowerCase();

    // 限制文件名长度
    if (sanitized.length > 255) {
      const ext = path.extname(sanitized);
      sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }

    // 确保文件名不为空
    if (!sanitized) {
      sanitized = 'unnamed_file';
    }

    return sanitized;
  }

  /**
   * 验证图像文件类型
   * @param {string} mimeType - MIME类型
   * @param {string} filename - 文件名
   * @returns {boolean} 是否为允许的图像类型
   */
  static validateImageType(mimeType, filename) {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    
    const isValidMime = allowedMimes.includes(mimeType?.toLowerCase());
    const hasValidExtension = allowedExtensions.some(ext => 
      filename?.toLowerCase().endsWith(ext)
    );

    return isValidMime && hasValidExtension;
  }

  /**
   * 验证文件大小
   * @param {number} fileSize - 文件大小（字节）
   * @param {number} maxSize - 最大允许大小（字节）
   * @returns {boolean} 是否在允许范围内
   */
  static validateFileSize(fileSize, maxSize = 10 * 1024 * 1024) { // 默认10MB
    return typeof fileSize === 'number' && 
           fileSize > 0 && 
           fileSize <= maxSize;
  }

  /**
   * 验证和清理字符串输入，防止XSS
   * @param {string} input - 输入字符串
   * @param {number} maxLength - 最大长度
   * @returns {string} 清理后的字符串
   */
  static sanitizeString(input, maxLength = 1000) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // 移除潜在的脚本标签和危险字符
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/javascript:/gi, '') // 移除javascript:协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim();

    // 限制长度
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * 验证识别类型
   * @param {string} recognitionType - 识别类型
   * @returns {boolean} 是否为有效类型
   */
  static validateRecognitionType(recognitionType) {
    const validTypes = [
      'auto',
      'ancient', 
      'receipt',
      'document',
      'id',
      'table',
      'handwriting',
      'prompt'
    ];

    return validTypes.includes(recognitionType);
  }

  /**
   * 验证AI提供商名称
   * @param {string} provider - 提供商名称
   * @returns {boolean} 是否为有效提供商
   */
  static validateProvider(provider) {
    const validProviders = [
      'openai',
      'gemini',
      'deepseek', 
      'zhipu',
      'claude',
      'custom'
    ];

    return validProviders.includes(provider?.toLowerCase());
  }

  /**
   * 生成安全的文件名
   * @param {string} originalName - 原始文件名
   * @returns {string} 安全的唯一文件名
   */
  static generateSafeFilename(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    
    return `${timestamp}-${random}${ext}`;
  }

  /**
   * 验证URL格式
   * @param {string} url - 待验证的URL
   * @returns {boolean} 是否为有效的HTTPS URL
   */
  static validateApiUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      // 只允许HTTPS协议（开发环境可能允许HTTP）
      const isHttps = urlObj.protocol === 'https:';
      const isLocalHttp = process.env.NODE_ENV === 'development' && 
                         urlObj.protocol === 'http:' && 
                         (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1');
      
      return isHttps || isLocalHttp;
    } catch {
      return false;
    }
  }

  /**
   * 综合请求验证
   * @param {object} request - Express请求对象
   * @param {object} options - 验证选项
   * @returns {object} 验证结果
   */
  static validateRequest(request, options = {}) {
    const errors = [];
    const warnings = [];

    // 验证请求来源
    const origin = request.get('Origin');
    if (options.checkOrigin && origin) {
      // 这里应该与CORS配置保持一致
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (!allowedOrigins.includes(origin)) {
        errors.push(`Unauthorized origin: ${origin}`);
      }
    }

    // 验证Content-Type
    if (options.requireJson && !request.is('json')) {
      errors.push('Content-Type must be application/json');
    }

    // 验证请求体大小
    const contentLength = parseInt(request.get('Content-Length') || '0');
    const maxSize = options.maxBodySize || 10 * 1024 * 1024; // 10MB
    if (contentLength > maxSize) {
      errors.push(`Request body too large: ${contentLength} bytes`);
    }

    // 检查可疑的User-Agent
    const userAgent = request.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
      warnings.push('Suspicious User-Agent header');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default InputValidator;