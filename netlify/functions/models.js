export const handler = async (event, context) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/models', '');
    
    // 路由处理
    if (event.httpMethod === 'GET' && path === '/available') {
      return handleGetAvailableModels(headers);
    } else if (event.httpMethod === 'POST' && path === '/test') {
      return handleTestModel(event, headers);
    } else if (event.httpMethod === 'POST' && path === '/validate-key') {
      return handleValidateKey(event, headers);
    } else if (event.httpMethod === 'GET' && path === '/types') {
      return handleGetRecognitionTypes(headers);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found' })
      };
    }
  } catch (error) {
    console.error('Models API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

// 获取可用的模型列表
function handleGetAvailableModels(headers) {
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
    },
    claude: {
      name: 'Claude',
      icon: '🎭',
      models: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      apiUrl: 'https://api.anthropic.com/v1',
      description: 'Anthropic的Claude系列模型，专注于安全和有用的AI助手'
    }
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      providers: availableModels,
      timestamp: new Date().toISOString()
    })
  };
}

// 测试模型连接
async function handleTestModel(event, headers) {
  try {
    const { modelConfig } = JSON.parse(event.body);

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey || !modelConfig.apiUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid model config',
          message: '请提供完整的模型配置（模型名称、API密钥和API地址）'
        })
      };
    }

    console.log(`🧪 测试模型连接: ${modelConfig.model}`);

    const testResult = await testModelConnection(modelConfig);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: testResult.success,
        message: testResult.message,
        model: modelConfig.model,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Model test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message || '模型连接测试失败'
      })
    };
  }
}

// 验证API密钥格式
function handleValidateKey(event, headers) {
  try {
    const { provider, apiKey } = JSON.parse(event.body);

    if (!provider || !apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing parameters',
          message: '请提供提供商和API密钥'
        })
      };
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
        
      case 'claude':
        isValid = apiKey.length > 40 && apiKey.startsWith('sk-ant-');
        message = isValid ? 'Claude API密钥格式正确' : 'Claude API密钥格式不正确，应以"sk-ant-"开头';
        break;
        
      default:
        isValid = apiKey.length > 10;
        message = isValid ? 'API密钥格式可能正确' : 'API密钥过短';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        valid: isValid,
        message,
        provider,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Validate key error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to validate key',
        message: error.message
      })
    };
  }
}

// 获取支持的识别类型
function handleGetRecognitionTypes(headers) {
  const recognitionTypes = [
    { value: 'auto', label: '🔍 智能识别 (自动判断类型)', description: '自动判断图片类型并进行相应识别' },
    { value: 'ancient', label: '📜 古籍文献识别', description: '识别古籍、古文字等历史文献' },
    { value: 'receipt', label: '🧾 票据类识别', description: '识别发票、收据等票据信息' },
    { value: 'document', label: '📄 文档识别', description: '识别各种文档和表格内容' },
    { value: 'id', label: '🆔 证件识别', description: '识别身份证、驾照等证件信息' },
    { value: 'table', label: '📊 表格图表识别', description: '识别表格、图表中的数据' },
    { value: 'handwriting', label: '✍️ 手写内容识别', description: '识别手写文字和笔记' },
    { value: 'prompt', label: '🎯 AI绘图Prompt生成', description: '为图片生成AI绘图提示词' }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      types: recognitionTypes
    })
  };
}

// 测试模型连接
async function testModelConnection(modelConfig) {
  const { model, apiKey, apiUrl } = modelConfig;

  try {
    // 根据不同的模型类型进行测试
    if (model.includes('gemini')) {
      return await testGeminiConnection(apiKey, apiUrl);
    } else if (model.includes('gpt') || model.includes('openai')) {
      return await testOpenAIConnection(apiKey, apiUrl);
    } else if (model.includes('deepseek')) {
      return await testDeepSeekConnection(apiKey, apiUrl);
    } else if (model.includes('claude')) {
      return await testClaudeConnection(apiKey, apiUrl);
    } else {
      return await testGenericConnection(apiKey, apiUrl);
    }
  } catch (error) {
    return {
      success: false,
      message: `连接测试失败: ${error.message}`
    };
  }
}

// 测试Gemini连接
async function testGeminiConnection(apiKey, apiUrl) {
  // 确保直接连接，不使用代理
  const response = await fetch(`${apiUrl}/models?key=${apiKey}`, {
    // 明确禁用代理
    agent: false
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API连接失败: ${response.status} - ${errorText}`);
  }
  
  return {
    success: true,
    message: 'Gemini API连接成功'
  };
}

// 测试OpenAI连接
async function testOpenAIConnection(apiKey, apiUrl) {
  const response = await fetch(`${apiUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API连接失败: ${response.status}`);
  }
  
  return {
    success: true,
    message: 'OpenAI API连接成功'
  };
}

// 测试DeepSeek连接
async function testDeepSeekConnection(apiKey, apiUrl) {
  const response = await fetch(`${apiUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API连接失败: ${response.status}`);
  }
  
  return {
    success: true,
    message: 'DeepSeek API连接成功'
  };
}

// 测试Claude连接
async function testClaudeConnection(apiKey, apiUrl) {
  const response = await fetch(`${apiUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`API连接失败: ${response.status}`);
  }
  
  return {
    success: true,
    message: 'Claude API连接成功'
  };
}

// 测试通用连接
async function testGenericConnection(apiKey, apiUrl) {
  const response = await fetch(`${apiUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API连接失败: ${response.status}`);
  }
  
  return {
    success: true,
    message: 'API连接成功'
  };
}