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

    // Return a mock success response for testing
    const mockResult = {
      content: `这是一个测试识别结果。识别类型: ${recognitionType}, 模型: ${modelConfig.model}, 图片URL: ${imageUrl || 'N/A'}`,
      confidence: 0.95,
      model: modelConfig.model,
      provider: modelConfig.provider || 'test',
      type: recognitionType,
      timestamp: new Date().toISOString()
    };

    console.log('Returning mock result:', mockResult);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recognition: mockResult,
        file: {
          id: fileId,
          url: imageUrl
        },
        debug: {
          timestamp: new Date().toISOString(),
          requestReceived: true,
          validationPassed: true
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