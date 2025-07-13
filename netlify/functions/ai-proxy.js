// AI API Proxy for Netlify Functions
// This bypasses local proxy issues by making API calls from server-side
// Direct server-side calls avoid DNS/proxy interference

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
    console.log('=== AI Proxy Request ===');
    
    const { apiUrl, apiKey, model, prompt, imageUrl, provider } = JSON.parse(event.body);
    
    console.log('Provider:', provider);
    console.log('Model:', model);
    console.log('API URL:', apiUrl);
    console.log('Has API Key:', !!apiKey);
    console.log('Image URL:', imageUrl);

    let result;
    
    // 智谱清言特殊处理 - 使用OpenAI格式
    if (provider === 'zhipu' || model.includes('glm')) {
      console.log('Using Zhipu (OpenAI format)');
      result = await callOpenAIProxy(apiUrl, apiKey, model, prompt, imageUrl);
    }
    // Gemini处理
    else if (provider === 'gemini' || model.includes('gemini')) {
      console.log('Using Gemini format');
      result = await callGeminiProxy(apiUrl, apiKey, model, prompt, imageUrl);
    } 
    // OpenAI及兼容格式（OpenRouter, DeepSeek等）
    else if (provider === 'openai' || provider === 'openrouter' || provider === 'deepseek' || model.includes('gpt')) {
      console.log('Using OpenAI format');
      result = await callOpenAIProxy(apiUrl, apiKey, model, prompt, imageUrl);
    }
    // Claude处理
    else if (provider === 'claude' || model.includes('claude')) {
      console.log('Using Claude format');
      result = await callClaudeProxy(apiUrl, apiKey, model, prompt, imageUrl);
    }
    // 默认使用OpenAI格式
    else {
      console.log('Using generic (OpenAI) format');
      result = await callGenericProxy(apiUrl, apiKey, model, prompt, imageUrl);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result: result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('AI Proxy Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'AI API call failed',
        message: error.message,
        details: error.stack
      })
    };
  }
};

// Gemini API Proxy
async function callGeminiProxy(apiUrl, apiKey, model, prompt, imageUrl) {
  console.log('Gemini Proxy: Starting...');
  
  try {
    // Download image and convert to base64
    console.log('Gemini Proxy: Downloading image from:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    // Get the correct MIME type from response headers
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    console.log('Gemini Proxy: Image content type:', contentType);
    
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Gemini Proxy: Image size:', imageBuffer.byteLength, 'bytes');
    
    // Check image size limit (Gemini has limits)
    if (imageBuffer.byteLength > 20 * 1024 * 1024) { // 20MB limit
      throw new Error(`Image too large: ${imageBuffer.byteLength} bytes (max 20MB)`);
    }
    
    // More robust base64 encoding
    const uint8Array = new Uint8Array(imageBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const imageBase64 = btoa(binaryString);
    console.log('Gemini Proxy: Base64 length:', imageBase64.length);

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: contentType,
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.1
      }
    };

    const url = `${apiUrl}/models/${model}:generateContent?key=${apiKey}`;
    console.log('Gemini Proxy: Calling API...', url);
    console.log('Gemini Proxy: Request body size:', JSON.stringify(requestBody).length, 'characters');

    // Use the same fetch pattern that worked in simple-proxy
    const fetchOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0'
      },
      body: JSON.stringify(requestBody)
    };
    
    console.log('Gemini Proxy: Making request...');
    const response = await fetch(url, fetchOptions);

    console.log('Gemini Proxy: Response status:', response.status);
    console.log('Gemini Proxy: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Proxy: Error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Gemini Proxy: Success, response keys:', Object.keys(result));

    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const text = result.candidates[0].content.parts[0].text;
      console.log('Gemini Proxy: Extracted text length:', text.length);
      return {
        content: text,
        confidence: 0.95,
        model: model,
        provider: 'gemini'
      };
    }

    console.error('Gemini Proxy: Unexpected response structure:', result);
    throw new Error('Invalid Gemini API response structure');
    
  } catch (error) {
    console.error('Gemini Proxy: Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

// OpenAI API Proxy
async function callOpenAIProxy(apiUrl, apiKey, model, prompt, imageUrl) {
  console.log('OpenAI Proxy: Starting...');

  const requestBody = {
    model: model,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    }],
    max_tokens: 2000
  };

  const url = `${apiUrl}/chat/completions`;
  console.log('OpenAI Proxy: Calling API...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  console.log('OpenAI Proxy: Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('OpenAI Proxy: Success');

  if (result.choices && result.choices[0] && result.choices[0].message) {
    return {
      content: result.choices[0].message.content,
      confidence: 0.92,
      model: model,
      provider: 'openai'
    };
  }

  throw new Error('Invalid OpenAI API response structure');
}

// Claude API Proxy
async function callClaudeProxy(apiUrl, apiKey, model, prompt, imageUrl) {
  console.log('Claude Proxy: Starting...');

  // Claude API 使用不同的格式
  const requestBody = {
    model: model,
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: await imageToBase64(imageUrl) } }
      ]
    }]
  };

  const url = `${apiUrl}/messages`;
  console.log('Claude Proxy: Calling API...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  console.log('Claude Proxy: Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Claude Proxy: Success');

  if (result.content && result.content[0] && result.content[0].text) {
    return {
      content: result.content[0].text,
      confidence: 0.93,
      model: model,
      provider: 'claude'
    };
  }

  throw new Error('Invalid Claude API response structure');
}

// Helper function to convert image URL to base64
async function imageToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
}

// Generic API Proxy
async function callGenericProxy(apiUrl, apiKey, model, prompt, imageUrl) {
  console.log('Generic Proxy: Using OpenAI format...');
  return await callOpenAIProxy(apiUrl, apiKey, model, prompt, imageUrl);
}