// Fixed models function that bypasses proxy issues
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path.replace('/.netlify/functions/models-fixed', '');
    console.log('Models API path:', path, 'method:', event.httpMethod);
    
    if (event.httpMethod === 'POST' && path === '/test') {
      return await handleTestModel(event, headers);
    } else if (event.httpMethod === 'GET' && path === '/available') {
      return handleGetAvailableModels(headers);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found', path, method: event.httpMethod })
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

// Handle model testing by calling our ai-proxy
async function handleTestModel(event, headers) {
  try {
    console.log('=== Model Test via Proxy ===');
    
    const { modelConfig } = JSON.parse(event.body);

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey || !modelConfig.apiUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid model config',
          message: '请提供完整的模型配置'
        })
      };
    }

    console.log('Testing model:', modelConfig.model);

    // Use our AI proxy to test the connection
    const proxyUrl = `${process.env.URL || 'https://chipper-cocada-99a2cc.netlify.app'}/.netlify/functions/test-model`;
    
    const proxyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelConfig })
    });

    console.log('Proxy response status:', proxyResponse.status);

    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text();
      console.error('Proxy error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Model test failed via proxy',
          details: errorText
        })
      };
    }

    const result = await proxyResponse.json();
    console.log('Proxy result:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: result.success,
        message: result.message || (result.success ? '模型连接成功' : '模型连接失败'),
        model: modelConfig.model,
        timestamp: new Date().toISOString(),
        details: result.details
      })
    };

  } catch (error) {
    console.error('Model test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: '模型连接测试失败',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}

// Get available models
function handleGetAvailableModels(headers) {
  const models = {
    gemini: [
      'gemini-2.5-pro-preview-03-25',
      'gemini-2.5-pro-preview-05-06',
      'gemini-2.5-flash-preview-04-17-thinking',
      'gemini-2.5-pro-exp-03-25'
    ],
    openai: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ],
    deepseek: [
      'deepseek-chat',
      'deepseek-coder'
    ]
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      models,
      timestamp: new Date().toISOString()
    })
  };
}