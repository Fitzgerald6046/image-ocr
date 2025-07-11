// Stable recognition function for Netlify
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Recognition request received');
    
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }

    const { fileId, imageUrl, modelConfig, recognitionType = 'auto' } = requestData;
    
    console.log('Request data:', { fileId, imageUrl, modelConfig, recognitionType });

    // Validate parameters
    if (!fileId && !imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing fileId or imageUrl',
          message: '请提供文件ID或图片URL'
        })
      };
    }

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid model config',
          message: '请提供完整的模型配置（模型名称和API密钥）'
        })
      };
    }

    // For Netlify Functions, we'll use the native fetch API instead of axios
    const result = await callAIModel(imageUrl, modelConfig, recognitionType);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recognition: result,
        file: {
          id: fileId,
          url: imageUrl
        }
      })
    };

  } catch (error) {
    console.error('Recognition error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Recognition failed',
        message: error.message || '图片识别失败',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// AI model calling function using fetch
async function callAIModel(imageUrl, modelConfig, recognitionType) {
  const prompts = {
    auto: "请分析这张图片，自动识别其类型并提取相关信息。",
    ancient: "请识别这张古籍中的文字内容。",
    receipt: "请识别这张收据中的关键信息。",
    document: "请识别这张文档中的文字内容。",
    id: "请识别这张证件中的信息。",
    table: "请识别这张表格中的数据。",
    handwriting: "请识别这张手写文字。",
    prompt: "请为这张图片生成AI绘图提示词。"
  };

  const prompt = prompts[recognitionType] || prompts.auto;
  
  try {
    if (modelConfig.model.includes('gemini')) {
      return await callGeminiAPI(imageUrl, prompt, modelConfig);
    } else if (modelConfig.model.includes('gpt') || modelConfig.model.includes('openai')) {
      return await callOpenAIAPI(imageUrl, prompt, modelConfig);
    } else {
      return await callGenericAPI(imageUrl, prompt, modelConfig);
    }
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error(`AI模型调用失败: ${error.message}`);
  }
}

// Gemini API call using fetch
async function callGeminiAPI(imageUrl, prompt, modelConfig) {
  try {
    // Download image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }]
    };

    const response = await fetch(
      `${modelConfig.apiUrl}/models/${modelConfig.model}:generateContent?key=${modelConfig.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      return {
        content: result.candidates[0].content.parts[0].text,
        confidence: 0.95,
        model: modelConfig.model,
        provider: 'gemini',
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('Invalid response from Gemini API');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// OpenAI compatible API call
async function callOpenAIAPI(imageUrl, prompt, modelConfig) {
  try {
    const requestBody = {
      model: modelConfig.model,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }],
      max_tokens: 2000
    };

    const response = await fetch(`${modelConfig.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return {
        content: result.choices[0].message.content,
        confidence: 0.92,
        model: modelConfig.model,
        provider: 'openai',
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('Invalid response from OpenAI API');
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Generic API call (OpenAI compatible)
async function callGenericAPI(imageUrl, prompt, modelConfig) {
  try {
    const requestBody = {
      model: modelConfig.model,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }],
      max_tokens: 2000
    };

    const response = await fetch(`${modelConfig.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return {
        content: result.choices[0].message.content,
        confidence: 0.85,
        model: modelConfig.model,
        provider: 'generic',
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('Invalid response from API');
  } catch (error) {
    console.error('Generic API error:', error);
    throw error;
  }
}