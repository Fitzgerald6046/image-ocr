// Simple recognition function for testing
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
    const { fileId, imageUrl, modelConfig, recognitionType = 'auto' } = JSON.parse(event.body);
    
    console.log('Recognition request:', { fileId, imageUrl, modelConfig, recognitionType });

    // Validate parameters
    if (!fileId && !imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing fileId or imageUrl',
          message: 'Please provide file ID or image URL'
        })
      };
    }

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid model config',
          message: 'Please provide complete model configuration'
        })
      };
    }

    // For now, return a mock response to test the connection
    const mockResult = {
      content: `Mock recognition result for ${recognitionType}. Image URL: ${imageUrl}. Model: ${modelConfig.model}`,
      confidence: 0.95,
      model: modelConfig.model,
      provider: modelConfig.provider || 'test',
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recognition: mockResult,
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
        message: error.message || 'Image recognition failed',
        details: error.stack
      })
    };
  }
};