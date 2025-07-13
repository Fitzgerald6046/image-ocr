// Model testing function - bypasses local proxy/DNS issues
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
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('=== Model Test Started ===');
    
    const { modelConfig } = JSON.parse(event.body);
    
    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing model configuration'
        })
      };
    }

    console.log('Testing model:', modelConfig.model);
    console.log('API URL:', modelConfig.apiUrl);

    let testResult;

    // Test different AI providers
    if (modelConfig.model.includes('gemini')) {
      testResult = await testGeminiModel(modelConfig);
    } else if (modelConfig.model.includes('gpt') || modelConfig.model.includes('openai')) {
      testResult = await testOpenAIModel(modelConfig);
    } else if (modelConfig.model.includes('deepseek')) {
      testResult = await testDeepSeekModel(modelConfig);
    } else {
      testResult = await testGenericModel(modelConfig);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: testResult.success,
        message: testResult.message,
        details: testResult.details,
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
        error: 'Model test failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Test Gemini model
async function testGeminiModel(modelConfig) {
  const apiUrl = `${modelConfig.apiUrl}/models/${modelConfig.model}:generateContent?key=${modelConfig.apiKey}`;
  
  const testBody = {
    contents: [{
      parts: [{ text: "Hello, this is a connectivity test." }]
    }]
  };

  try {
    console.log('Testing Gemini API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBody)
    });

    console.log('Gemini response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        message: 'Gemini API connection successful',
        details: {
          status: response.status,
          model: modelConfig.model,
          hasResponse: !!result.candidates
        }
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: 'Gemini API connection failed',
        details: {
          status: response.status,
          error: errorText
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Gemini API network error',
      details: {
        error: error.message
      }
    };
  }
}

// Test OpenAI model
async function testOpenAIModel(modelConfig) {
  const apiUrl = `${modelConfig.apiUrl}/chat/completions`;
  
  const testBody = {
    model: modelConfig.model,
    messages: [{ role: 'user', content: 'Hello, this is a connectivity test.' }],
    max_tokens: 5
  };

  try {
    console.log('Testing OpenAI API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBody)
    });

    console.log('OpenAI response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        message: 'OpenAI API connection successful',
        details: {
          status: response.status,
          model: modelConfig.model,
          hasResponse: !!result.choices
        }
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: 'OpenAI API connection failed',
        details: {
          status: response.status,
          error: errorText
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'OpenAI API network error',
      details: {
        error: error.message
      }
    };
  }
}

// Test DeepSeek model
async function testDeepSeekModel(modelConfig) {
  // DeepSeek uses OpenAI-compatible API
  return await testOpenAIModel(modelConfig);
}

// Test generic model (assume OpenAI-compatible)
async function testGenericModel(modelConfig) {
  return await testOpenAIModel(modelConfig);
}