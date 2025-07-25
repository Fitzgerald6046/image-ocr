/**
 * API密钥管理路由
 * 提供安全的API密钥存储和访问接口
 */

import express from 'express';
import keyManager from '../utils/keyManager.js';

const router = express.Router();

/**
 * 存储API密钥配置
 * POST /api/keys/store
 */
router.post('/store', async (req, res) => {
  try {
    const { provider, apiKey, apiUrl, model } = req.body;
    
    // 验证必需字段
    if (!provider || !apiKey || !model) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: '缺少必需字段: provider, apiKey, model'
      });
    }

    // 生成用户会话ID（在实际应用中可能来自认证系统）
    const userId = req.session?.userId || req.ip || 'anonymous';
    
    // 存储加密的API密钥配置
    const configId = await keyManager.storeKeyConfig(userId, {
      provider,
      apiKey,
      apiUrl,
      model
    });

    res.json({
      success: true,
      configId,
      message: 'API密钥配置已安全存储'
    });

  } catch (error) {
    console.error('存储API密钥失败:', error);
    res.status(400).json({
      error: 'STORAGE_FAILED',
      message: error.message
    });
  }
});

/**
 * 获取API密钥配置（用于内部API调用）
 * GET /api/keys/:configId
 */
router.get('/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    
    if (!configId) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: '缺少配置ID'
      });
    }

    const config = await keyManager.getKeyConfig(configId);
    
    // 返回配置信息（包含解密的API密钥，仅用于内部API调用）
    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('获取API密钥配置失败:', error);
    res.status(404).json({
      error: 'CONFIG_NOT_FOUND',
      message: error.message
    });
  }
});

/**
 * 删除API密钥配置
 * DELETE /api/keys/:configId
 */
router.delete('/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const userId = req.session?.userId || req.ip || 'anonymous';
    
    if (!configId) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: '缺少配置ID'
      });
    }

    await keyManager.deleteKeyConfig(configId, userId);
    
    res.json({
      success: true,
      message: 'API密钥配置已删除'
    });

  } catch (error) {
    console.error('删除API密钥配置失败:', error);
    res.status(400).json({
      error: 'DELETE_FAILED',
      message: error.message
    });
  }
});

/**
 * 验证API密钥格式
 * POST /api/keys/validate
 */
router.post('/validate', (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: '缺少必需字段: provider, apiKey'
      });
    }

    const isValid = keyManager.validateKeyFormat(provider, apiKey);
    
    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'API密钥格式有效' : 'API密钥格式无效'
    });

  } catch (error) {
    console.error('验证API密钥失败:', error);
    res.status(500).json({
      error: 'VALIDATION_FAILED',
      message: error.message
    });
  }
});

// 定期清理过期配置（每24小时执行一次）
setInterval(() => {
  keyManager.cleanupExpiredConfigs().catch(console.error);
}, 24 * 60 * 60 * 1000);

export default router;