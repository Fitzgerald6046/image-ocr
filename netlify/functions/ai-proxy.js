// AI API Proxy for Netlify Functions
// This bypasses local proxy issues by making API calls from server-side

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
    
    if (provider === 'gemini' || model.includes('gemini')) {
      result = await callGeminiProxy(apiUrl, apiKey, model, prompt, imageUrl);
    } else if (provider === 'openai' || model.includes('gpt')) {
      result = await callOpenAIProxy(apiUrl, apiKey, model, prompt, imageUrl);
    } else {
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
  
  // Download image and convert to base64
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  
  console.log('Gemini Proxy: Image downloaded and converted');

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

  const url = `${apiUrl}/models/${model}:generateContent?key=${apiKey}`;
  console.log('Gemini Proxy: Calling API...');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  console.log('Gemini Proxy: Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Gemini Proxy: Success');

  if (result.candidates && result.candidates[0] && result.candidates[0].content) {
    return {
      content: result.candidates[0].content.parts[0].text,
      confidence: 0.95,
      model: model,
      provider: 'gemini'
    };
  }

  throw new Error('Invalid Gemini API response structure');
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

// Generic API Proxy
async function callGenericProxy(apiUrl, apiKey, model, prompt, imageUrl) {
  console.log('Generic Proxy: Using OpenAI format...');
  return await callOpenAIProxy(apiUrl, apiKey, model, prompt, imageUrl);
}