import express from 'express';
import aiModelService from '../services/aiModels.js';

const router = express.Router();

// 测试模型连接
router.post('/test', async (req, res) => {
  try {
    const { modelConfig } = req.body;

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey || !modelConfig.apiUrl) {
      return res.status(400).json({
        error: 'Invalid model config',
        message: '请提供完整的模型配置（模型名称、API密钥和API地址）'
      });
    }

    console.log(`🧪 测试模型连接: ${modelConfig.model}`);

    const testResult = await aiModelService.testConnection(modelConfig);

    res.json({
      success: testResult.success,
      message: testResult.message,
      model: modelConfig.model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Model test error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '模型连接测试失败'
    });
  }
});

// 获取可用的模型列表
router.get('/available', (req, res) => {
  const availableModels = {
    gemini: {
      name: 'Gemini',
      icon: '🤖',
      models: [
        'gemini-2.5-pro-preview-03-25',
        'gemini-2.5-pro-preview-05-06',
        'gemini-2.5-flash-preview-04-17-thinking',
        'gemini-2.5-pro-exp-03-25',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ],
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
      description: 'Google的多模态AI模型，支持文本和图像理解'
    },
    deepseek: {
      name: 'DeepSeek',
      icon: '🧠',
      models: [
        'deepseek-chat',
        'deepseek-vl-chat'
      ],
      apiUrl: 'https://api.deepseek.com/v1',
      description: '深度求索的AI模型，专注于推理和理解能力'
    },
    openai: {
      name: 'OpenAI',
      icon: '⚡',
      models: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo'
      ],
      apiUrl: 'https://api.openai.com/v1',
      description: 'OpenAI的GPT系列模型，强大的语言理解和生成能力'
    }
  };

  res.json({
    success: true,
    providers: availableModels,
    timestamp: new Date().toISOString()
  });
});

// 获取模型的详细信息
router.get('/:provider/:model', (req, res) => {
  try {
    const { provider, model } = req.params;

    // 模拟的模型详细信息
    const modelInfo = {
      provider,
      model,
      capabilities: {
        textRecognition: true,
        imageAnalysis: true,
        multiLanguage: true,
        batchProcessing: true
      },
      limits: {
        maxImageSize: '20MB',
        maxResolution: '4096x4096',
        supportedFormats: ['JPEG', 'PNG', 'WebP', 'GIF', 'BMP', 'TIFF']
      },
      pricing: {
        inputTokens: 'Variable based on provider',
        outputTokens: 'Variable based on provider',
        imageProcessing: 'Variable based on provider'
      },
      performance: {
        averageResponseTime: '2-5 seconds',
        accuracy: '95%+',
        reliability: '99.9%'
      }
    };

    res.json({
      success: true,
      modelInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get model info error:', error);
    res.status(500).json({
      error: 'Failed to get model info',
      message: error.message
    });
  }
});

// 验证API密钥格式
router.post('/validate-key', (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: '请提供提供商和API密钥'
      });
    }

    let isValid = false;
    let message = '';

    // 简单的API密钥格式验证
    switch (provider) {
      case 'gemini':
        isValid = apiKey.length > 20 && apiKey.startsWith('AIza');
        message = isValid ? 'Gemini API密钥格式正确' : 'Gemini API密钥格式不正确，应以"AIza"开头';
        break;
        
      case 'deepseek':
        isValid = apiKey.length > 30 && apiKey.startsWith('sk-');
        message = isValid ? 'DeepSeek API密钥格式正确' : 'DeepSeek API密钥格式不正确，应以"sk-"开头';
        break;
        
      case 'openai':
        isValid = apiKey.length > 40 && apiKey.startsWith('sk-');
        message = isValid ? 'OpenAI API密钥格式正确' : 'OpenAI API密钥格式不正确，应以"sk-"开头';
        break;
        
      default:
        isValid = apiKey.length > 10;
        message = isValid ? 'API密钥格式可能正确' : 'API密钥过短';
    }

    res.json({
      success: true,
      valid: isValid,
      message,
      provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validate key error:', error);
    res.status(500).json({
      error: 'Failed to validate key',
      message: error.message
    });
  }
});

// 获取模型使用统计
router.get('/stats', (req, res) => {
  try {
    // 模拟的使用统计数据
    const stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      topModels: [],
      dailyUsage: [],
      errorTypes: {},
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      stats,
      message: '统计功能将在后续版本中实现'
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

export default router; 