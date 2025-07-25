import { ErrorCode, EnhancedApiError } from '../types/enhanced';

export class EnhancedErrorHandler {
  private static errorCount = new Map<ErrorCode, number>();
  private static lastErrors = new Map<ErrorCode, number>();

  static createError(
    code: ErrorCode,
    message: string,
    options: {
      details?: Record<string, any>;
      retryable?: boolean;
      retryAfter?: number;
      suggestion?: string;
      context?: {
        component: string;
        action: string;
      };
    } = {}
  ): EnhancedApiError {
    const error = new Error(message) as EnhancedApiError;
    error.code = code;
    error.details = options.details;
    error.retryable = options.retryable ?? this.isRetryableError(code);
    error.retryAfter = options.retryAfter;
    error.suggestion = options.suggestion ?? this.getDefaultSuggestion(code);
    error.context = options.context ? {
      ...options.context,
      timestamp: Date.now()
    } : undefined;

    // 记录错误统计
    this.recordError(code);

    return error;
  }

  static handleApiError(
    response: Response,
    responseText: string,
    context?: { component: string; action: string }
  ): EnhancedApiError {
    let code: ErrorCode;
    let message: string;
    let details: Record<string, any> = {};

    switch (response.status) {
      case 400:
        code = ErrorCode.VALIDATION_ERROR;
        message = '请求参数错误';
        break;
      case 401:
        code = ErrorCode.API_KEY_INVALID;
        message = 'API密钥无效或已过期';
        break;
      case 413:
        code = ErrorCode.FILE_TOO_LARGE;
        message = '文件大小超出限制';
        break;
      case 429:
        code = ErrorCode.RATE_LIMIT_EXCEEDED;
        message = '请求频率超出限制';
        const retryAfter = response.headers.get('Retry-After');
        details.retryAfter = retryAfter ? parseInt(retryAfter) : 60;
        break;
      case 500:
      case 502:
      case 503:
        code = ErrorCode.SERVER_ERROR;
        message = '服务器错误，请稍后重试';
        break;
      default:
        code = ErrorCode.NETWORK_ERROR;
        message = `网络错误 (${response.status})`;
    }

    // 尝试解析响应中的错误信息
    try {
      const errorData = JSON.parse(responseText);
      if (errorData.message) {
        message = errorData.message;
      }
      if (errorData.details) {
        details = { ...details, ...errorData.details };
      }
    } catch {
      // 忽略JSON解析错误
    }

    return this.createError(code, message, {
      details: {
        ...details,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.slice(0, 500) // 限制错误文本长度
      },
      context
    });
  }

  static handleFileError(
    file: File,
    validationResult: { isValid: boolean; error?: string },
    context?: { component: string; action: string }
  ): EnhancedApiError {
    let code: ErrorCode;
    let message = validationResult.error || '文件验证失败';
    let suggestion: string;

    if (file.size > 10 * 1024 * 1024) { // 10MB
      code = ErrorCode.FILE_TOO_LARGE;
      suggestion = '请选择小于10MB的图片文件，或使用图片压缩功能';
    } else if (!this.isValidFileType(file.type)) {
      code = ErrorCode.INVALID_FILE_TYPE;
      suggestion = '请选择JPG、PNG、WEBP或GIF格式的图片文件';
    } else {
      code = ErrorCode.VALIDATION_ERROR;
      suggestion = '请检查文件是否完整且未损坏';
    }

    return this.createError(code, message, {
      details: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: file.lastModified
      },
      suggestion,
      context
    });
  }

  static handleNetworkError(
    error: Error,
    context?: { component: string; action: string }
  ): EnhancedApiError {
    let code: ErrorCode;
    let message: string;
    let suggestion: string;

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      code = ErrorCode.TIMEOUT_ERROR;
      message = '请求超时，请检查网络连接';
      suggestion = '请检查网络连接状态，或稍后重试';
    } else if (error.message.includes('fetch')) {
      code = ErrorCode.NETWORK_ERROR;
      message = '网络连接失败';
      suggestion = '请检查网络连接，确保服务器可访问';
    } else {
      code = ErrorCode.SERVER_ERROR;
      message = error.message || '未知错误';
      suggestion = '请稍后重试，如问题持续请联系技术支持';
    }

    return this.createError(code, message, {
      details: {
        originalError: error.name,
        originalMessage: error.message,
        stack: error.stack
      },
      suggestion,
      context
    });
  }

  private static isRetryableError(code: ErrorCode): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.SERVER_ERROR,
      ErrorCode.RATE_LIMIT_EXCEEDED
    ];
    return retryableCodes.includes(code);
  }

  private static getDefaultSuggestion(code: ErrorCode): string {
    const suggestions: Record<ErrorCode, string> = {
      [ErrorCode.FILE_TOO_LARGE]: '请选择更小的文件或使用压缩功能',
      [ErrorCode.INVALID_FILE_TYPE]: '请选择支持的图片格式（JPG、PNG、WEBP、GIF）',
      [ErrorCode.UPLOAD_FAILED]: '请检查网络连接后重试',
      [ErrorCode.RECOGNITION_FAILED]: '请尝试使用其他AI模型或检查图片质量',
      [ErrorCode.MODEL_NOT_FOUND]: '请在设置中重新选择可用的AI模型',
      [ErrorCode.API_KEY_INVALID]: '请在设置中检查并更新API密钥',
      [ErrorCode.RATE_LIMIT_EXCEEDED]: '请稍后重试，或升级API套餐',
      [ErrorCode.NETWORK_ERROR]: '请检查网络连接状态',
      [ErrorCode.TIMEOUT_ERROR]: '请稍后重试或检查网络延迟',
      [ErrorCode.SERVER_ERROR]: '服务器暂时不可用，请稍后重试',
      [ErrorCode.VALIDATION_ERROR]: '请检查输入数据的格式和完整性'
    };
    return suggestions[code] || '请稍后重试';
  }

  private static isValidFileType(mimeType: string): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
    return validTypes.includes(mimeType.toLowerCase());
  }

  private static recordError(code: ErrorCode): void {
    const count = this.errorCount.get(code) || 0;
    this.errorCount.set(code, count + 1);
    this.lastErrors.set(code, Date.now());
  }

  // 获取错误统计信息
  static getErrorStats(): { code: ErrorCode; count: number; lastOccurred: number }[] {
    const stats: { code: ErrorCode; count: number; lastOccurred: number }[] = [];
    
    for (const [code, count] of this.errorCount.entries()) {
      stats.push({
        code,
        count,
        lastOccurred: this.lastErrors.get(code) || 0
      });
    }
    
    return stats.sort((a, b) => b.count - a.count);
  }

  // 清除错误统计
  static clearErrorStats(): void {
    this.errorCount.clear();
    this.lastErrors.clear();
  }

  // 检查是否应该显示错误警告
  static shouldShowWarning(code: ErrorCode): boolean {
    const count = this.errorCount.get(code) || 0;
    const lastError = this.lastErrors.get(code) || 0;
    const timeSinceLastError = Date.now() - lastError;
    
    // 如果同类错误频繁出现，显示警告
    return count >= 3 && timeSinceLastError < 60000; // 1分钟内
  }

  // 格式化错误信息用于显示
  static formatErrorForUser(error: EnhancedApiError): {
    title: string;
    message: string;
    suggestion?: string;
    actions?: Array<{ label: string; action: string }>;
  } {
    const title = this.getErrorTitle(error.code);
    let message = error.message;
    const suggestion = error.suggestion;
    const actions: Array<{ label: string; action: string }> = [];

    // 添加相关操作建议
    if (error.retryable) {
      actions.push({ label: '重试', action: 'retry' });
    }

    if (error.code === ErrorCode.API_KEY_INVALID) {
      actions.push({ label: '设置', action: 'settings' });
    }

    if (error.code === ErrorCode.MODEL_NOT_FOUND) {
      actions.push({ label: '选择模型', action: 'selectModel' });
    }

    return { title, message, suggestion, actions };
  }

  private static getErrorTitle(code: ErrorCode): string {
    const titles: Record<ErrorCode, string> = {
      [ErrorCode.FILE_TOO_LARGE]: '文件过大',
      [ErrorCode.INVALID_FILE_TYPE]: '文件格式不支持',
      [ErrorCode.UPLOAD_FAILED]: '上传失败',
      [ErrorCode.RECOGNITION_FAILED]: '识别失败',
      [ErrorCode.MODEL_NOT_FOUND]: '模型不可用',
      [ErrorCode.API_KEY_INVALID]: 'API密钥错误',
      [ErrorCode.RATE_LIMIT_EXCEEDED]: '请求过于频繁',
      [ErrorCode.NETWORK_ERROR]: '网络错误',
      [ErrorCode.TIMEOUT_ERROR]: '请求超时',
      [ErrorCode.SERVER_ERROR]: '服务器错误',
      [ErrorCode.VALIDATION_ERROR]: '数据验证错误'
    };
    return titles[code] || '未知错误';
  }
}