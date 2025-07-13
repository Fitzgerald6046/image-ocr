// Simple AI API test without any complex logic
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('=== Simple AI Test Started ===');
    
    const { provider, apiKey, apiUrl, model } = JSON.parse(event.body);
    
    console.log('Testing:', { provider, model, apiUrl: apiUrl ? 'present' : 'missing', apiKey: apiKey ? 'present' : 'missing' });

    let testResult;

    if (provider === 'zhipu' || model?.includes('glm')) {
      // 智谱清言测试
      testResult = await testZhipuAPI(apiKey, apiUrl, model);
    } else if (provider === 'gemini' || model?.includes('gemini')) {
      // Gemini测试
      testResult = await testGeminiAPI(apiKey, apiUrl, model);
    } else if (provider === 'openai' || model?.includes('gpt')) {
      // OpenAI测试
      testResult = await testOpenAIAPI(apiKey, apiUrl, model);
    } else {
      testResult = {
        success: false,
        message: `未知的提供商: ${provider}`,
        details: { provider, model }
      };
    }

    console.log('Test result:', testResult);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: testResult.success,
        message: testResult.message,
        details: testResult.details || {},
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Simple AI test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Test failed',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// 智谱清言API测试
async function testZhipuAPI(apiKey, apiUrl, model) {
  console.log('Testing Zhipu API...');
  
  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });

    console.log('Zhipu response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: '智谱清言API连接成功',
        details: { status: response.status, hasChoices: !!data.choices }
      };
    } else {
      const errorText = await response.text();
      console.error('Zhipu error:', errorText);
      return {
        success: false,
        message: '智谱清言API连接失败',
        details: { status: response.status, error: errorText }
      };
    }
  } catch (error) {
    console.error('Zhipu fetch error:', error);
    return {
      success: false,
      message: '智谱清言API网络错误',
      details: { error: error.message }
    };
  }
}

// Gemini API测试
async function testGeminiAPI(apiKey, apiUrl, model) {
  console.log('Testing Gemini API...');
  
  try {
    const response = await fetch(`${apiUrl}/models?key=${apiKey}`, {
      method: 'GET'
    });

    console.log('Gemini response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Gemini API连接成功',
        details: { status: response.status, hasModels: !!data.models }
      };
    } else {
      const errorText = await response.text();
      console.error('Gemini error:', errorText);
      return {
        success: false,
        message: 'Gemini API连接失败',
        details: { status: response.status, error: errorText }
      };
    }
  } catch (error) {
    console.error('Gemini fetch error:', error);
    return {
      success: false,
      message: 'Gemini API网络错误',
      details: { error: error.message }
    };
  }
}

// OpenAI API测试
async function testOpenAIAPI(apiKey, apiUrl, model) {
  console.log('Testing OpenAI API...');
  
  try {
    const response = await fetch(`${apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('OpenAI response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'OpenAI API连接成功',
        details: { status: response.status, hasData: !!data.data }
      };
    } else {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      return {
        success: false,
        message: 'OpenAI API连接失败',
        details: { status: response.status, error: errorText }
      };
    }
  } catch (error) {
    console.error('OpenAI fetch error:', error);
    return {
      success: false,
      message: 'OpenAI API网络错误',
      details: { error: error.message }
    };
  }
}