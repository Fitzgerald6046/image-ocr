/**
 * 错误处理工具类
 * 提供统一的错误处理和用户友好的错误提示
 */

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  suggestions?: string[];
  retryable?: boolean;
}

export class ApiError extends Error {
  code: string;
  userMessage: string;
  suggestions: string[];
  retryable: boolean;

  constructor(info: ErrorInfo) {
    super(info.message);
    this.code = info.code;
    this.userMessage = info.userMessage;
    this.suggestions = info.suggestions || [];
    this.retryable = info.retryable || false;
  }
}

export class ErrorHandler {
  /**
   * 网络错误处理
   */
  static handleNetworkError(error: any): ApiError {
    console.error('Network error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return new ApiError({
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: '网络连接失败，请检查网络状态',
        suggestions: [
          '检查网络连接是否正常',
          '确认服务器是否正在运行',
          '尝试刷新页面重试'
        ],
        retryable: true
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return new ApiError({
        code: 'SERVER_UNAVAILABLE',
        message: error.message,
        userMessage: '服务器连接被拒绝',
        suggestions: [
          '服务器可能未启动，请联系管理员',
          '检查服务器端口是否正确',
          '稍后再试'
        ],
        retryable: true
      });
    }

    return new ApiError({
      code: 'UNKNOWN_NETWORK_ERROR',
      message: error.message,
      userMessage: '网络请求失败',
      suggestions: ['请检查网络连接后重试'],
      retryable: true
    });
  }

  /**
   * HTTP错误处理
   */
  static handleHttpError(response: Response, _responseText?: string): ApiError {
    const status = response.status;
    const statusText = response.statusText;
    
    switch (status) {
      case 400:
        return new ApiError({
          code: 'BAD_REQUEST',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: '请求参数错误',
          suggestions: [
            '检查上传的文件格式是否正确',
            '确认文件大小是否符合要求',
            '重新选择文件后再试'
          ],
          retryable: false
        });

      case 401:
        return new ApiError({
          code: 'UNAUTHORIZED',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: 'API密钥验证失败',
          suggestions: [
            '检查AI模型配置中的API密钥',
            '确认API密钥是否有效',
            '重新配置AI模型'
          ],
          retryable: false
        });

      case 403:
        return new ApiError({
          code: 'FORBIDDEN',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: '访问被拒绝',
          suggestions: [
            '检查API密钥权限',
            '确认账户余额是否充足',
            '联系API服务商'
          ],
          retryable: false
        });

      case 413:
        return new ApiError({
          code: 'FILE_TOO_LARGE',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: '文件过大',
          suggestions: [
            '压缩图片后重试',
            '选择更小的图片文件',
            '文件大小不能超过10MB'
          ],
          retryable: false
        });

      case 429:
        return new ApiError({
          code: 'RATE_LIMITED',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: '请求过于频繁',
          suggestions: [
            '稍等片刻后再试',
            '降低请求频率',
            '检查API配额限制'
          ],
          retryable: true
        });

      case 500:
        return new ApiError({
          code: 'SERVER_ERROR',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: '服务器内部错误',
          suggestions: [
            '服务器暂时出现问题',
            '请稍后重试',
            '如果问题持续，请联系管理员'
          ],
          retryable: true
        });

      case 503:
        return new ApiError({
          code: 'SERVICE_UNAVAILABLE',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: '服务暂时不可用',
          suggestions: [
            '服务器正在维护',
            '请稍后重试',
            '检查服务状态'
          ],
          retryable: true
        });

      default:
        return new ApiError({
          code: 'HTTP_ERROR',
          message: `HTTP ${status}: ${statusText}`,
          userMessage: `请求失败 (${status})`,
          suggestions: [
            '请稍后重试',
            '如果问题持续，请联系技术支持'
          ],
          retryable: true
        });
    }
  }

  /**
   * 文件上传错误处理
   */
  static handleFileError(error: any): ApiError {
    if (error.message.includes('不支持的文件格式')) {
      return new ApiError({
        code: 'UNSUPPORTED_FORMAT',
        message: error.message,
        userMessage: '不支持的文件格式',
        suggestions: [
          '请选择JPG、PNG、GIF或WebP格式的图片',
          '确认文件扩展名正确',
          '尝试转换文件格式'
        ],
        retryable: false
      });
    }

    if (error.message.includes('文件大小')) {
      return new ApiError({
        code: 'FILE_SIZE_LIMIT',
        message: error.message,
        userMessage: '文件大小超出限制',
        suggestions: [
          '文件大小不能超过10MB',
          '压缩图片后重试',
          '选择更小的图片文件'
        ],
        retryable: false
      });
    }

    return new ApiError({
      code: 'FILE_ERROR',
      message: error.message,
      userMessage: '文件处理失败',
      suggestions: [
        '检查文件是否损坏',
        '重新选择文件',
        '尝试其他格式的图片'
      ],
      retryable: false
    });
  }

  /**
   * AI识别错误处理
   */
  static handleRecognitionError(error: any): ApiError {
    if (error.message.includes('token限制') || error.message.includes('被截断')) {
      return new ApiError({
        code: 'TOKEN_LIMIT',
        message: error.message,
        userMessage: '图片内容过多，超出AI模型处理限制',
        suggestions: [
          '尝试使用更简单的识别类型',
          '压缩图片大小后重试',
          '如果是文档，尝试分页识别',
          '使用其他AI模型（如DeepSeek或OpenAI）'
        ],
        retryable: false
      });
    }

    if (error.message.includes('API密钥')) {
      return new ApiError({
        code: 'API_KEY_ERROR',
        message: error.message,
        userMessage: 'AI模型API密钥问题',
        suggestions: [
          '检查API密钥是否正确',
          '确认API密钥权限',
          '重新配置AI模型'
        ],
        retryable: false
      });
    }

    return new ApiError({
      code: 'RECOGNITION_ERROR',
      message: error.message,
      userMessage: '图片识别失败',
      suggestions: [
        '检查图片是否清晰',
        '尝试其他AI模型',
        '稍后重试'
      ],
      retryable: true
    });
  }

  /**
   * 通用错误处理入口
   */
  static handle(error: any, context: 'network' | 'file' | 'recognition' | 'http' = 'network'): ApiError {
    // 如果已经是ApiError，直接返回
    if (error instanceof ApiError) {
      return error;
    }

    // 根据上下文选择处理方式
    switch (context) {
      case 'file':
        return this.handleFileError(error);
      case 'recognition':
        return this.handleRecognitionError(error);
      case 'http':
        return this.handleHttpError(error);
      case 'network':
      default:
        return this.handleNetworkError(error);
    }
  }
}