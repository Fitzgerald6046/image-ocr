/**
 * 系统监控工具
 * 用于跟踪性能指标、错误统计和安全事件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SystemMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        avgResponseTime: 0,
        lastHour: [],
        byEndpoint: new Map()
      },
      uploads: {
        total: 0,
        totalSize: 0,
        avgSize: 0,
        success: 0,
        failed: 0,
        byType: new Map()
      },
      recognition: {
        total: 0,
        success: 0,
        failed: 0,
        avgProcessingTime: 0,
        byModel: new Map(),
        byType: new Map()
      },
      security: {
        blockedRequests: 0,
        rateLimitHits: 0,
        suspiciousActivity: [],
        invalidFileAttempts: 0,
        xssAttempts: 0
      },
      system: {
        startTime: Date.now(),
        uptime: 0,
        memoryUsage: {
          rss: 0,
          heapUsed: 0,
          heapTotal: 0,
          external: 0
        },
        errors: [],
        warnings: []
      }
    };

    // 定期更新系统指标
    this.startPeriodicUpdates();
  }

  /**
   * 记录HTTP请求
   */
  recordRequest(req, res, responseTime) {
    const endpoint = this.normalizeEndpoint(req.path);
    const isSuccess = res.statusCode < 400;
    
    this.metrics.requests.total++;
    
    if (isSuccess) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.error++;
    }

    // 更新平均响应时间
    this.updateAverage('requests', 'avgResponseTime', responseTime);

    // 记录最近一小时的请求
    const now = Date.now();
    this.metrics.requests.lastHour.push({
      timestamp: now,
      endpoint,
      status: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 清理超过1小时的记录
    this.metrics.requests.lastHour = this.metrics.requests.lastHour.filter(
      record => now - record.timestamp < 60 * 60 * 1000
    );

    // 按端点统计
    const endpointStats = this.metrics.requests.byEndpoint.get(endpoint) || {
      total: 0,
      success: 0,
      error: 0,
      avgResponseTime: 0
    };
    
    endpointStats.total++;
    if (isSuccess) {
      endpointStats.success++;
    } else {
      endpointStats.error++;
    }
    
    this.updateAverageInObject(endpointStats, 'avgResponseTime', responseTime);
    this.metrics.requests.byEndpoint.set(endpoint, endpointStats);
  }

  /**
   * 记录文件上传
   */
  recordUpload(file, success = true, error = null) {
    this.metrics.uploads.total++;
    
    if (success) {
      this.metrics.uploads.success++;
      this.metrics.uploads.totalSize += file.size;
      this.updateAverage('uploads', 'avgSize', file.size);

      // 按文件类型统计
      const fileType = this.getFileType(file.mimetype);
      const typeStats = this.metrics.uploads.byType.get(fileType) || { count: 0, totalSize: 0 };
      typeStats.count++;
      typeStats.totalSize += file.size;
      this.metrics.uploads.byType.set(fileType, typeStats);
    } else {
      this.metrics.uploads.failed++;
      if (error) {
        this.recordSecurityEvent('upload_failed', { error: error.message, fileType: file?.mimetype });
      }
    }
  }

  /**
   * 记录识别任务
   */
  recordRecognition(model, recognitionType, processingTime, success = true, error = null) {
    this.metrics.recognition.total++;
    
    if (success) {
      this.metrics.recognition.success++;
      this.updateAverage('recognition', 'avgProcessingTime', processingTime);
    } else {
      this.metrics.recognition.failed++;
    }

    // 按模型统计
    const modelStats = this.metrics.recognition.byModel.get(model) || {
      total: 0,
      success: 0,
      failed: 0,
      avgTime: 0
    };
    modelStats.total++;
    if (success) {
      modelStats.success++;
      this.updateAverageInObject(modelStats, 'avgTime', processingTime);
    } else {
      modelStats.failed++;
    }
    this.metrics.recognition.byModel.set(model, modelStats);

    // 按识别类型统计
    const typeStats = this.metrics.recognition.byType.get(recognitionType) || {
      total: 0,
      success: 0,
      failed: 0
    };
    typeStats.total++;
    if (success) {
      typeStats.success++;
    } else {
      typeStats.failed++;
    }
    this.metrics.recognition.byType.set(recognitionType, typeStats);
  }

  /**
   * 记录安全事件
   */
  recordSecurityEvent(type, details = {}) {
    const event = {
      type,
      timestamp: Date.now(),
      details,
      ip: details.ip,
      userAgent: details.userAgent
    };

    switch (type) {
      case 'rate_limit':
        this.metrics.security.rateLimitHits++;
        break;
      case 'blocked_request':
        this.metrics.security.blockedRequests++;
        break;
      case 'invalid_file':
        this.metrics.security.invalidFileAttempts++;
        break;
      case 'xss_attempt':
        this.metrics.security.xssAttempts++;
        break;
    }

    this.metrics.security.suspiciousActivity.push(event);

    // 保持最近的1000个安全事件
    if (this.metrics.security.suspiciousActivity.length > 1000) {
      this.metrics.security.suspiciousActivity = this.metrics.security.suspiciousActivity.slice(-1000);
    }

    // 严重安全事件记录到日志
    if (['blocked_request', 'xss_attempt'].includes(type)) {
      console.warn(`🚨 Security Event: ${type}`, details);
    }
  }

  /**
   * 记录系统错误
   */
  recordError(error, context = {}) {
    const errorRecord = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context
    };

    this.metrics.system.errors.push(errorRecord);

    // 保持最近的100个错误
    if (this.metrics.system.errors.length > 100) {
      this.metrics.system.errors = this.metrics.system.errors.slice(-100);
    }
  }

  /**
   * 记录系统警告
   */
  recordWarning(message, details = {}) {
    const warningRecord = {
      message,
      details,
      timestamp: Date.now()
    };

    this.metrics.system.warnings.push(warningRecord);

    // 保持最近的200个警告
    if (this.metrics.system.warnings.length > 200) {
      this.metrics.system.warnings = this.metrics.system.warnings.slice(-200);
    }
  }

  /**
   * 获取系统状态总览
   */
  getSystemStatus() {
    const now = Date.now();
    const uptime = now - this.metrics.system.startTime;
    
    return {
      status: 'healthy',
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      timestamp: now,
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        error: this.metrics.requests.error,
        successRate: this.calculateRate(this.metrics.requests.success, this.metrics.requests.total),
        avgResponseTime: Math.round(this.metrics.requests.avgResponseTime),
        lastHourCount: this.metrics.requests.lastHour.length
      },
      uploads: {
        total: this.metrics.uploads.total,
        success: this.metrics.uploads.success,
        failed: this.metrics.uploads.failed,
        successRate: this.calculateRate(this.metrics.uploads.success, this.metrics.uploads.total),
        totalSizeMB: Math.round(this.metrics.uploads.totalSize / 1024 / 1024 * 100) / 100,
        avgSizeMB: Math.round(this.metrics.uploads.avgSize / 1024 / 1024 * 100) / 100
      },
      recognition: {
        total: this.metrics.recognition.total,
        success: this.metrics.recognition.success,
        failed: this.metrics.recognition.failed,
        successRate: this.calculateRate(this.metrics.recognition.success, this.metrics.recognition.total),
        avgProcessingTime: Math.round(this.metrics.recognition.avgProcessingTime)
      },
      security: {
        blockedRequests: this.metrics.security.blockedRequests,
        rateLimitHits: this.metrics.security.rateLimitHits,
        recentEvents: this.metrics.security.suspiciousActivity.slice(-10)
      },
      memory: this.metrics.system.memoryUsage,
      recentErrors: this.metrics.system.errors.slice(-5),
      recentWarnings: this.metrics.system.warnings.slice(-5)
    };
  }

  /**
   * 获取详细分析报告
   */
  getAnalyticsReport() {
    return {
      overview: this.getSystemStatus(),
      endpoints: Object.fromEntries(this.metrics.requests.byEndpoint),
      uploadsByType: Object.fromEntries(this.metrics.uploads.byType),
      recognitionByModel: Object.fromEntries(this.metrics.recognition.byModel),
      recognitionByType: Object.fromEntries(this.metrics.recognition.byType),
      securityTrends: this.analyzeSecurityTrends(),
      performanceTrends: this.analyzePerformanceTrends()
    };
  }

  /**
   * 检查系统健康状态
   */
  healthCheck() {
    const errors = [];
    const warnings = [];
    
    // 检查错误率
    if (this.metrics.requests.total > 100) {
      const errorRate = this.calculateRate(this.metrics.requests.error, this.metrics.requests.total);
      if (errorRate > 10) {
        errors.push(`High error rate: ${errorRate.toFixed(1)}%`);
      } else if (errorRate > 5) {
        warnings.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
      }
    }

    // 检查内存使用
    const memUsage = this.metrics.system.memoryUsage.heapUsed / this.metrics.system.memoryUsage.heapTotal;
    if (memUsage > 0.9) {
      errors.push(`High memory usage: ${(memUsage * 100).toFixed(1)}%`);
    } else if (memUsage > 0.8) {
      warnings.push(`High memory usage: ${(memUsage * 100).toFixed(1)}%`);
    }

    // 检查安全事件
    const recentSecurityEvents = this.metrics.security.suspiciousActivity.filter(
      event => Date.now() - event.timestamp < 60 * 60 * 1000 // 过去1小时
    );
    if (recentSecurityEvents.length > 50) {
      errors.push(`Too many security events in the last hour: ${recentSecurityEvents.length}`);
    } else if (recentSecurityEvents.length > 20) {
      warnings.push(`High security event rate: ${recentSecurityEvents.length} in the last hour`);
    }

    const status = errors.length > 0 ? 'unhealthy' : warnings.length > 0 ? 'degraded' : 'healthy';
    
    return {
      status,
      errors,
      warnings,
      timestamp: Date.now()
    };
  }

  /**
   * 导出数据到文件
   */
  async exportData(format = 'json') {
    const data = this.getAnalyticsReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `system-metrics-${timestamp}.${format}`;
    const filepath = path.join(__dirname, '..', 'logs', filename);

    try {
      // 确保日志目录存在
      const logDir = path.dirname(filepath);
      await fs.promises.mkdir(logDir, { recursive: true });

      if (format === 'json') {
        await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
      } else if (format === 'csv') {
        const csv = this.convertToCSV(data);
        await fs.promises.writeFile(filepath, csv);
      }

      return { success: true, filepath };
    } catch (error) {
      console.error('Failed to export metrics:', error);
      return { success: false, error: error.message };
    }
  }

  // 私有辅助方法

  startPeriodicUpdates() {
    // 每分钟更新系统指标
    setInterval(() => {
      this.updateSystemMetrics();
    }, 60 * 1000);

    // 每小时清理旧数据
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.system.memoryUsage = memUsage;
    this.metrics.system.uptime = Date.now() - this.metrics.system.startTime;
  }

  cleanupOldData() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    // 清理旧的请求记录
    this.metrics.requests.lastHour = this.metrics.requests.lastHour.filter(
      record => record.timestamp > oneHourAgo
    );

    // 清理旧的安全事件
    this.metrics.security.suspiciousActivity = this.metrics.security.suspiciousActivity.filter(
      event => Date.now() - event.timestamp < 24 * 60 * 60 * 1000 // 保留24小时
    );
  }

  normalizeEndpoint(path) {
    // 标准化端点路径，移除动态参数
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }

  getFileType(mimetype) {
    if (mimetype.startsWith('image/')) {
      return mimetype.split('/')[1];
    }
    return 'other';
  }

  updateAverage(category, field, newValue) {
    const current = this.metrics[category][field];
    const count = this.metrics[category].total;
    this.metrics[category][field] = (current * (count - 1) + newValue) / count;
  }

  updateAverageInObject(obj, field, newValue) {
    const current = obj[field];
    const count = obj.total;
    obj[field] = (current * (count - 1) + newValue) / count;
  }

  calculateRate(numerator, denominator) {
    return denominator > 0 ? (numerator / denominator) * 100 : 0;
  }

  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  analyzeSecurityTrends() {
    const now = Date.now();
    const timeRanges = [
      { name: 'last_hour', duration: 60 * 60 * 1000 },
      { name: 'last_6_hours', duration: 6 * 60 * 60 * 1000 },
      { name: 'last_24_hours', duration: 24 * 60 * 60 * 1000 }
    ];

    return timeRanges.map(range => {
      const events = this.metrics.security.suspiciousActivity.filter(
        event => now - event.timestamp < range.duration
      );

      const eventTypes = {};
      events.forEach(event => {
        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
      });

      return {
        timeRange: range.name,
        totalEvents: events.length,
        eventTypes,
        riskLevel: this.calculateRiskLevel(events.length, range.duration)
      };
    });
  }

  analyzePerformanceTrends() {
    const recentRequests = this.metrics.requests.lastHour;
    const now = Date.now();
    
    const timeSlots = [];
    for (let i = 5; i >= 0; i--) {
      const slotEnd = now - (i * 10 * 60 * 1000); // 10分钟间隔
      const slotStart = slotEnd - 10 * 60 * 1000;
      
      const slotRequests = recentRequests.filter(
        req => req.timestamp >= slotStart && req.timestamp < slotEnd
      );

      timeSlots.push({
        timeSlot: new Date(slotStart).toISOString(),
        requestCount: slotRequests.length,
        avgResponseTime: slotRequests.length > 0 
          ? slotRequests.reduce((sum, req) => sum + req.responseTime, 0) / slotRequests.length 
          : 0,
        errorCount: slotRequests.filter(req => req.status >= 400).length
      });
    }

    return timeSlots;
  }

  calculateRiskLevel(eventCount, duration) {
    const eventsPerHour = (eventCount / duration) * (60 * 60 * 1000);
    
    if (eventsPerHour > 50) return 'high';
    if (eventsPerHour > 20) return 'medium';
    if (eventsPerHour > 5) return 'low';
    return 'minimal';
  }

  convertToCSV(data) {
    // 简化的CSV转换（实际应用中可能需要更复杂的实现）
    const rows = [];
    rows.push('Metric,Value,Timestamp');
    
    const flatten = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, `${prefix}${key}.`);
        } else {
          rows.push(`${prefix}${key},${value},${new Date().toISOString()}`);
        }
      }
    };
    
    flatten(data.overview);
    return rows.join('\n');
  }
}

// 创建全局监控实例
const monitor = new SystemMonitor();

export default monitor;