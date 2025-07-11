// Minimal recognition function for testing
export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        method: event.httpMethod 
      })
    };
  }

  try {
    console.log('=== Recognition request started ===');
    console.log('HTTP Method:', event.httpMethod);
    console.log('Path:', event.path);
    console.log('Headers:', JSON.stringify(event.headers, null, 2));
    console.log('Body length:', event.body ? event.body.length : 0);

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
      console.log('Parsed request data:', JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
          received: event.body ? event.body.substring(0, 100) : 'null'
        })
      };
    }

    const { fileId, imageUrl, modelConfig, recognitionType = 'auto' } = requestData;

    // Validate required fields
    if (!fileId && !imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'Either fileId or imageUrl is required',
          received: { fileId, imageUrl }
        })
      };
    }

    if (!modelConfig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing model configuration',
          message: 'modelConfig is required',
          received: modelConfig
        })
      };
    }

    if (!modelConfig.model || !modelConfig.apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Incomplete model configuration',
          message: 'Model name and API key are required',
          received: {
            model: modelConfig.model ? 'present' : 'missing',
            apiKey: modelConfig.apiKey ? 'present' : 'missing'
          }
        })
      };
    }

    console.log('All validations passed');

    // Try to call the real AI API
    console.log('Attempting real AI recognition...');
    
    let recognitionResult;
    try {
      recognitionResult = await callRealAI(imageUrl, modelConfig, recognitionType);
      console.log('Real AI call successful:', recognitionResult);
    } catch (aiError) {
      console.error('Real AI call failed:', aiError);
      
      // Return detailed error info instead of mock result
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'AI recognition failed',
          message: aiError.message,
          details: {
            modelConfig: {
              model: modelConfig.model,
              provider: modelConfig.provider,
              hasApiKey: !!modelConfig.apiKey,
              hasApiUrl: !!modelConfig.apiUrl
            },
            imageUrl: imageUrl ? 'present' : 'missing',
            errorType: aiError.name,
            errorStack: aiError.stack
          },
          timestamp: new Date().toISOString()
        })
      };
    }

    console.log('Returning real result:', recognitionResult);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recognition: recognitionResult,
        file: {
          id: fileId,
          url: imageUrl
        },
        debug: {
          timestamp: new Date().toISOString(),
          requestReceived: true,
          validationPassed: true,
          aiCallSuccessful: true
        }
      })
    };

  } catch (error) {
    console.error('=== Recognition error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Real AI calling function
async function callRealAI(imageUrl, modelConfig, recognitionType) {
  console.log('callRealAI called with:', { imageUrl, modelConfig, recognitionType });
  
  const prompts = {
    auto: "请分析这张图片，自动识别其类型并提取相关信息。",
    ancient: "请识别这张古籍中的文字内容。",
    receipt: "请识别这张收据中的关键信息，包括商家、金额、日期等。",
    document: "请识别这张文档中的所有文字内容。",
    id: "请识别这张证件中的关键信息。",
    table: "请识别这张表格中的数据。",
    handwriting: "请识别这张手写文字。",
    prompt: "请为这张图片生成AI绘图提示词。"
  };

  const prompt = prompts[recognitionType] || prompts.auto;
  console.log('Using prompt:', prompt);
  
  try {
    if (modelConfig.model.includes('gemini')) {
      console.log('Calling Gemini API...');
      return await callGeminiAPI(imageUrl, prompt, modelConfig);
    } else if (modelConfig.model.includes('gpt') || modelConfig.model.includes('openai')) {
      console.log('Calling OpenAI API...');
      return await callOpenAIAPI(imageUrl, prompt, modelConfig);
    } else {
      console.log('Calling Generic API...');
      return await callGenericAPI(imageUrl, prompt, modelConfig);
    }
  } catch (error) {
    console.error('AI API call error:', error);
    throw error;
  }
}

// Gemini API call
async function callGeminiAPI(imageUrl, prompt, modelConfig) {
  console.log('callGeminiAPI started');
  
  try {
    // Download image and convert to base64
    console.log('Downloading image from:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    console.log('Image converted to base64, length:', imageBase64.length);

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

    const apiUrl = `${modelConfig.apiUrl}/models/${modelConfig.model}:generateContent?key=${modelConfig.apiKey}`;
    console.log('Calling Gemini API at:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Gemini API result:', JSON.stringify(result, null, 2));
    
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const content = result.candidates[0].content.parts[0].text;
      return {
        content: content,
        confidence: 0.95,
        model: modelConfig.model,
        provider: 'gemini',
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('Invalid response structure from Gemini API');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// OpenAI compatible API call
async function callOpenAIAPI(imageUrl, prompt, modelConfig) {
  console.log('callOpenAIAPI started');
  
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

    const apiUrl = `${modelConfig.apiUrl}/chat/completions`;
    console.log('Calling OpenAI API at:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('OpenAI API result:', JSON.stringify(result, null, 2));
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content;
      return {
        content: content,
        confidence: 0.92,
        model: modelConfig.model,
        provider: 'openai',
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('Invalid response structure from OpenAI API');
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Generic API call
async function callGenericAPI(imageUrl, prompt, modelConfig) {
  console.log('callGenericAPI started');
  return await callOpenAIAPI(imageUrl, prompt, modelConfig); // Use OpenAI format as fallback
}