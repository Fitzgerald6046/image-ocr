/**
 * 系统健康检查和监控端点
 */

import express from 'express';
import monitor from '../utils/monitoring.js';
import RateLimiter from '../middleware/rateLimiter.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础健康检查（无限制）
router.get('/', (req, res) => {
  const health = monitor.healthCheck();
  const status = monitor.getSystemStatus();
  
  res.status(health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503).json({
    status: health.status,
    timestamp: Date.now(),
    uptime: status.uptimeFormatted,
    service: 'onebyone-ocr-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    health: {
      ...health,
      database: 'not_applicable', // 如果有数据库连接可以在这里检查
      externalServices: 'unknown' // 可以检查外部AI服务的连通性
    }
  });
});

// 详细系统状态（有限制）
router.get('/status', RateLimiter.createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 10 // 每分钟最多10次请求
}), (req, res) => {
  try {
    const status = monitor.getSystemStatus();
    res.json({
      success: true,
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

// 系统指标分析报告（严格限制）
router.get('/analytics', RateLimiter.strictLimiter(), (req, res) => {
  try {
    const report = monitor.getAnalyticsReport();
    res.json({
      success: true,
      data: report,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting analytics report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics report',
      message: error.message
    });
  }
});

// 安全事件日志（仅开发环境）
router.get('/security', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Access denied',
      message: '安全日志仅在开发环境可访问'
    });
  }

  try {
    const report = monitor.getAnalyticsReport();
    res.json({
      success: true,
      data: {
        securityEvents: report.securityTrends,
        recentEvents: report.overview.security.recentEvents,
        summary: {
          blockedRequests: report.overview.security.blockedRequests,
          rateLimitHits: report.overview.security.rateLimitHits
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get security data',
      message: error.message
    });
  }
});

// 性能指标
router.get('/performance', RateLimiter.createLimiter({
  windowMs: 60 * 1000,
  max: 5
}), (req, res) => {
  try {
    const report = monitor.getAnalyticsReport();
    res.json({
      success: true,
      data: {
        requests: report.overview.requests,
        uploads: report.overview.uploads,
        recognition: report.overview.recognition,
        memory: report.overview.memory,
        trends: report.performanceTrends,
        endpoints: report.endpoints
      },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get performance data',
      message: error.message
    });
  }
});

// 导出监控数据
router.post('/export', RateLimiter.strictLimiter(), async (req, res) => {
  try {
    const { format = 'json' } = req.body;
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format',
        message: '支持的格式: json, csv'
      });
    }

    const result = await monitor.exportData(format);
    
    if (result.success) {
      res.json({
        success: true,
        message: '数据导出成功',
        filepath: result.filepath,
        timestamp: Date.now()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Export failed',
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: error.message
    });
  }
});

// 系统信息
router.get('/info', (req, res) => {
  const packageJson = JSON.parse(
    require('fs').readFileSync(
      path.join(__dirname, '..', 'package.json'),
      'utf8'
    )
  );

  res.json({
    success: true,
    data: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      started: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      memory: process.memoryUsage(),
      features: {
        rateLimit: true,
        inputValidation: true,
        monitoring: true,
        securityHeaders: true,
        errorHandling: true
      }
    },
    timestamp: Date.now()
  });
});

// 测试端点（开发环境）
router.get('/test', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({
      error: 'Not found',
      message: '测试端点仅在开发环境可用'
    });
  }

  // 模拟各种响应时间来测试监控
  const delay = Math.random() * 1000;
  setTimeout(() => {
    res.json({
      success: true,
      message: '测试端点正常工作',
      delay: Math.round(delay),
      timestamp: Date.now()
    });
  }, delay);
});

// 错误模拟端点（开发环境）
router.get('/test-error', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({
      error: 'Not found'
    });
  }

  // 随机产生不同类型的错误
  const errorTypes = [400, 401, 403, 404, 429, 500, 502, 503];
  const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  
  monitor.recordError(new Error(`Test error ${randomError}`), {
    endpoint: '/health/test-error',
    type: 'simulated'
  });

  res.status(randomError).json({
    success: false,
    error: `Test error ${randomError}`,
    message: '这是一个模拟错误用于测试监控系统',
    code: `TEST_ERROR_${randomError}`
  });
});

// 监控中间件 - 记录所有健康检查相关的请求
router.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    monitor.recordRequest(req, res, responseTime);
  });
  
  next();
});

export default router;