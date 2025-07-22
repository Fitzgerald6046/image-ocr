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

// 获取提供商的最新模型列表
router.post('/list', async (req, res) => {
  try {
    const { providerId, apiKey, apiUrl } = req.body;

    if (!providerId || !apiKey || !apiUrl) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的提供商信息'
      });
    }

    console.log(`🔄 获取 ${providerId} 的模型列表`);

    // 根据不同提供商调用相应的API获取模型列表
    let models = [];
    
    switch (providerId) {
      case 'openai':
        models = await getOpenAIModels(apiKey, apiUrl);
        break;
      case 'gemini':
        models = await getGeminiModels(apiKey, apiUrl);
        break;
      case 'deepseek':
        models = await getDeepSeekModels(apiKey, apiUrl);
        break;
      case 'claude':
        models = await getClaudeModels(apiKey, apiUrl);
        break;
      case 'openrouter':
        models = await getOpenRouterModels(apiKey, apiUrl);
        break;
      case 'hunyuan':
        models = await getHunyuanModels(apiKey, apiUrl);
        break;
      case 'zhipuai':
        models = await getZhipuAIModels(apiKey, apiUrl);
        break;
      case 'tongyi':
        models = await getTongyiModels(apiKey, apiUrl);
        break;
      case 'paddleocr':
        models = await getPaddleOCRModels(apiKey, apiUrl);
        break;
      default:
        models = await getGenericModels(apiKey, apiUrl);
    }

    res.json({
      success: true,
      models,
      provider: providerId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get models list error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取模型列表失败'
    });
  }
});

// 各个提供商的模型获取函数
async function getOpenAIModels(apiKey, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('OpenAI API响应:', data);
    
    let models = [];
    if (data.data && Array.isArray(data.data)) {
      models = data.data.map(model => model.id);
      // 过滤出GPT模型，排除一些不相关的模型
      models = models.filter(id => 
        id.includes('gpt') || 
        id.includes('text-') || 
        id.includes('davinci') ||
        id.includes('curie') ||
        id.includes('babbage') ||
        id.includes('ada')
      );
    }
    
    console.log('解析的OpenAI模型:', models);
    return models.length > 0 ? models : getDefaultOpenAIModels();
    
  } catch (error) {
    console.error('OpenAI模型获取失败:', error);
    return getDefaultOpenAIModels();
  }
}

function getDefaultOpenAIModels() {
  return [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4',
    'gpt-4-32k',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k'
  ];
}

async function getGeminiModels(apiKey, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Gemini API响应:', data);
    
    let models = [];
    if (data.models && Array.isArray(data.models)) {
      models = data.models.map(model => {
        // 处理Gemini的模型名称格式：从 "models/gemini-pro" 提取 "gemini-pro"
        const modelName = model.name ? model.name.replace('models/', '') : model.displayName || model.id;
        return modelName;
      });
    }
    
    console.log('解析的Gemini模型:', models);
    return models.length > 0 ? models : getDefaultGeminiModels();
    
  } catch (error) {
    console.error('Gemini模型获取失败:', error);
    return getDefaultGeminiModels();
  }
}

function getDefaultGeminiModels() {
  return [
    'gemini-2.5-pro-exp-03-25',
    'gemini-2.5-pro-exp-01-21',
    'gemini-2.5-flash-exp-01-21',
    'gemini-2.5-flash-preview-04-17-thinking',
    'gemini-2.5-pro-preview-03-25',
    'gemini-2.5-pro-preview-05-06',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b-latest'
  ];
}

async function getDeepSeekModels(apiKey, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('DeepSeek API响应:', data);
    
    let models = [];
    if (data.data && Array.isArray(data.data)) {
      models = data.data.map(model => model.id || model.name);
    } else if (Array.isArray(data)) {
      models = data.map(model => model.id || model.name);
    }
    
    console.log('解析的DeepSeek模型:', models);
    return models.length > 0 ? models : getDefaultDeepSeekModels();
    
  } catch (error) {
    console.error('DeepSeek模型获取失败:', error);
    return getDefaultDeepSeekModels();
  }
}

function getDefaultDeepSeekModels() {
  return [
    'deepseek-chat',
    'deepseek-vl-chat',
    'deepseek-reasoner',
    'deepseek-coder'
  ];
}

async function getClaudeModels(apiKey, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Claude API响应:', data);
    
    // Claude API返回的数据结构可能是 { data: [...] } 或直接是数组
    let models = [];
    if (data.data && Array.isArray(data.data)) {
      models = data.data.map(model => model.id || model.name);
    } else if (Array.isArray(data)) {
      models = data.map(model => model.id || model.name);
    } else if (data.models && Array.isArray(data.models)) {
      models = data.models.map(model => model.id || model.name);
    }
    
    console.log('解析的Claude模型:', models);
    return models.length > 0 ? models : getDefaultClaudeModels();
    
  } catch (error) {
    console.error('Claude模型获取失败:', error);
    // 如果API调用失败，返回默认模型列表
    return getDefaultClaudeModels();
  }
}

function getDefaultClaudeModels() {
  return [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-sonnet-4-20250514'  // 添加最新的Claude 4模型
  ];
}

async function getOpenRouterModels(apiKey, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data?.map(model => model.id) || [];
  } catch (error) {
    console.error('OpenRouter模型获取失败:', error);
    return ['google/gemini-2.5-pro-exp-03-25:free', 'google/gemini-2.5-flash-preview-04-17-thinking:free']; // 默认模型
  }
}

async function getHunyuanModels(apiKey, apiUrl) {
  try {
    // 尝试调用腾讯混元API获取模型列表
    // 注意：腾讯混元使用特殊的认证方式，这里提供基础实现
    console.log('尝试获取腾讯混元模型列表...');
    return getDefaultHunyuanModels();
  } catch (error) {
    console.error('腾讯混元模型获取失败:', error);
    return getDefaultHunyuanModels();
  }
}

function getDefaultHunyuanModels() {
  return [
    'hunyuan-lite',
    'hunyuan-standard', 
    'hunyuan-pro',
    'hunyuan-turbo',
    'hunyuan-code',
    'hunyuan-vision'
  ];
}

async function getZhipuAIModels(apiKey, apiUrl) {
  try {
    // 尝试调用智谱清言API获取模型列表
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('智谱清言API响应:', data);
    
    let models = [];
    if (data.data && Array.isArray(data.data)) {
      models = data.data.map(model => model.id || model.name);
    } else if (Array.isArray(data)) {
      models = data.map(model => model.id || model.name);
    }
    
    console.log('解析的智谱清言模型:', models);
    return models.length > 0 ? models : getDefaultZhipuAIModels();
    
  } catch (error) {
    console.error('智谱清言模型获取失败:', error);
    return getDefaultZhipuAIModels();
  }
}

function getDefaultZhipuAIModels() {
  return [
    'glm-4-flash',
    'glm-4-plus', 
    'glm-4v-plus',
    'glm-4-air',
    'glm-4-alltools',
    'glm-4-long',
    'codegeex-4'
  ];
}

async function getTongyiModels(apiKey, apiUrl) {
  try {
    // 尝试调用通义千问API获取模型列表
    console.log('尝试获取通义千问模型列表...');
    return getDefaultTongyiModels();
  } catch (error) {
    console.error('通义千问模型获取失败:', error);
    return getDefaultTongyiModels();
  }
}

function getDefaultTongyiModels() {
  return [
    'qwen-turbo',
    'qwen-plus', 
    'qwen-max',
    'qwen-vl-plus',
    'qwen-vl-max',
    'qwen2.5-72b-instruct',
    'qwen2.5-32b-instruct',
    'qwen2.5-14b-instruct',
    'qwen2.5-7b-instruct',
    'qwen-coder-turbo',
    'qwen-math-plus'
  ];
}

async function getPaddleOCRModels(apiKey, apiUrl) {
  try {
    console.log('获取PaddleOCR模型列表...');
    return getDefaultPaddleOCRModels();
  } catch (error) {
    console.error('PaddleOCR模型获取失败:', error);
    return getDefaultPaddleOCRModels();
  }
}

function getDefaultPaddleOCRModels() {
  return [
    'general_basic',
    'accurate_basic', 
    'general',
    'accurate',
    'handwriting',
    'numbers',
    'receipt',
    'table',
    'vin_code',
    'license_plate'
  ];
}

async function getGenericModels(apiKey, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('通用API响应:', data);
    
    let models = [];
    if (data.data && Array.isArray(data.data)) {
      models = data.data.map(model => model.id || model.name);
    } else if (Array.isArray(data.models)) {
      models = data.models.map(model => model.id || model.name || model);
    } else if (Array.isArray(data)) {
      models = data.map(model => model.id || model.name || model);
    }
    
    console.log('解析的通用模型:', models);
    return models.length > 0 ? models : getDefaultGenericModels();
    
  } catch (error) {
    console.error('通用模型获取失败:', error);
    return getDefaultGenericModels();
  }
}

function getDefaultGenericModels() {
  return ['default-model'];
}

export default router; 