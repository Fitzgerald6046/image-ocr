/**
 * 速率限制中间件
 * 防止滥用API和DoS攻击
 */

import rateLimit from 'express-rate-limit';
import SlowDown from 'express-slow-down';

// 内存存储（生产环境建议使用Redis）
const store = new Map();

class RateLimiter {
  
  /**
   * 创建通用速率限制器
   * @param {object} options - 配置选项
   */
  static createLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 每个窗口最多100个请求
      message: {
        error: 'Too many requests',
        message: '请求过于频繁，请稍后重试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      // 跳过成功的请求（可选）
      skipSuccessfulRequests: false,
      // 跳过失败的请求
      skipFailedRequests: true,
      ...options
    };

    return rateLimit(defaultOptions);
  }

  /**
   * 文件上传专用限制器
   */
  static uploadLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1分钟
      max: 10, // 每分钟最多10次上传
      message: {
        error: 'Upload rate limit exceeded',
        message: '文件上传过于频繁，请等待后重试',
        code: 'UPLOAD_RATE_LIMIT',
        retryAfter: 60
      }
    });
  }

  /**
   * AI识别专用限制器
   */
  static recognitionLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1分钟
      max: 20, // 每分钟最多20次识别
      message: {
        error: 'Recognition rate limit exceeded',
        message: 'AI识别请求过于频繁，请稍后重试',
        code: 'RECOGNITION_RATE_LIMIT',
        retryAfter: 60
      }
    });
  }

  /**
   * 严格的速率限制器（用于敏感操作）
   */
  static strictLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1分钟
      max: 5, // 每分钟最多5次请求
      message: {
        error: 'Strict rate limit exceeded',
        message: '操作过于频繁，请稍后重试',
        code: 'STRICT_RATE_LIMIT',
        retryAfter: 60
      }
    });
  }

  /**
   * 慢速请求限制器（逐渐增加延迟）
   */
  static slowDown() {
    return SlowDown({
      windowMs: 15 * 60 * 1000, // 15分钟
      delayAfter: 50, // 50个请求后开始延迟
      delayMs: () => 500, // 固定延迟500ms
      maxDelayMs: 5000, // 最大延迟5秒
      validate: {
        delayMs: false // 禁用delayMs验证警告
      }
    });
  }

  /**
   * 基于IP的动态限制器
   * @param {object} limits - 不同IP段的限制配置
   */
  static dynamicLimiter(limits = {}) {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      
      // 检查是否为白名单IP
      const whitelist = limits.whitelist || [];
      if (whitelist.some(whiteIp => ip.startsWith(whiteIp))) {
        return next();
      }

      // 检查是否为黑名单IP
      const blacklist = limits.blacklist || [];
      if (blacklist.some(blackIp => ip.startsWith(blackIp))) {
        return res.status(403).json({
          error: 'IP blocked',
          message: '您的IP已被阻止访问',
          code: 'IP_BLOCKED'
        });
      }

      // 根据IP段应用不同的限制
      let limiterConfig = limits.default || { max: 100, windowMs: 15 * 60 * 1000 };

      // 本地网络更宽松的限制
      if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1') {
        limiterConfig = limits.local || { max: 1000, windowMs: 15 * 60 * 1000 };
      }

      // 创建临时限制器
      const limiter = this.createLimiter(limiterConfig);
      return limiter(req, res, next);
    };
  }

  /**
   * 基于用户行为的自适应限制器
   */
  static adaptiveLimiter() {
    const userBehavior = new Map();
    
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // 获取用户行为历史
      let behavior = userBehavior.get(key) || {
        requestCount: 0,
        errorCount: 0,
        lastRequest: now,
        trustScore: 100 // 初始信任分数
      };

      // 更新请求计数
      behavior.requestCount++;
      
      // 计算请求频率
      const timeDiff = now - behavior.lastRequest;
      const isRapidRequest = timeDiff < 1000; // 1秒内的快速请求
      
      if (isRapidRequest) {
        behavior.trustScore = Math.max(0, behavior.trustScore - 10);
      } else if (timeDiff > 10000) { // 10秒以上的正常间隔
        behavior.trustScore = Math.min(100, behavior.trustScore + 1);
      }

      behavior.lastRequest = now;
      userBehavior.set(key, behavior);

      // 根据信任分数决定限制策略
      let maxRequests = 100;
      if (behavior.trustScore < 30) {
        maxRequests = 10; // 低信任用户严格限制
      } else if (behavior.trustScore < 60) {
        maxRequests = 50; // 中等信任用户适中限制
      }

      // 应用动态限制
      const limiter = this.createLimiter({
        windowMs: 15 * 60 * 1000,
        max: maxRequests,
        message: {
          error: 'Adaptive rate limit exceeded',
          message: '根据您的使用行为，当前请求频率受限',
          code: 'ADAPTIVE_RATE_LIMIT',
          trustScore: behavior.trustScore
        }
      });

      // 监听响应状态，更新错误计数
      const originalEnd = res.end;
      res.end = function(...args) {
        if (res.statusCode >= 400) {
          behavior.errorCount++;
          behavior.trustScore = Math.max(0, behavior.trustScore - 5);
          userBehavior.set(key, behavior);
        }
        originalEnd.apply(this, args);
      };

      return limiter(req, res, next);
    };
  }

  /**
   * API密钥验证中间件
   */
  static apiKeyValidator() {
    return (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || req.query.apikey;
      
      if (!apiKey) {
        // 对于某些公开端点，可能不需要API密钥
        const publicEndpoints = ['/health', '/api/models'];
        if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
          return next();
        }
        
        return res.status(401).json({
          error: 'API key required',
          message: '请提供有效的API密钥',
          code: 'API_KEY_REQUIRED'
        });
      }

      // 验证API密钥格式
      if (!/^[a-zA-Z0-9\-_]{20,}$/.test(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key format',
          message: 'API密钥格式无效',
          code: 'INVALID_API_KEY_FORMAT'
        });
      }

      // 这里应该与数据库或缓存中的有效密钥进行比较
      // 目前简化处理
      req.apiKey = apiKey;
      next();
    };
  }

  /**
   * 请求大小限制中间件
   */
  static requestSizeLimit(maxSize = 10 * 1024 * 1024) { // 默认10MB
    return (req, res, next) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      
      if (contentLength > maxSize) {
        return res.status(413).json({
          error: 'Request entity too large',
          message: `请求体大小超出限制 (${Math.round(maxSize / 1024 / 1024)}MB)`,
          code: 'REQUEST_TOO_LARGE',
          maxSize
        });
      }
      
      next();
    };
  }

  /**
   * 清理过期数据
   */
  static cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    for (const [key, data] of store.entries()) {
      if (now - data.lastRequest > maxAge) {
        store.delete(key);
      }
    }
  }

  /**
   * 获取限制状态
   */
  static getStatus(req) {
    const key = req.ip || req.connection.remoteAddress;
    return store.get(key) || { requestCount: 0, remaining: 100 };
  }
}

// 定期清理过期数据
setInterval(() => {
  RateLimiter.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次

export default RateLimiter;