// Simple proxy to test external API connectivity
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

  try {
    console.log('=== Simple Proxy Test ===');
    
    const { url, method = 'GET', requestHeaders = {}, requestBody } = JSON.parse(event.body || '{}');
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'URL is required'
        })
      };
    }
    
    console.log('Testing URL:', url);
    console.log('Method:', method);
    console.log('Headers:', requestHeaders);
    
    const fetchOptions = {
      method: method,
      headers: {
        'User-Agent': 'Netlify-Function/1.0',
        ...requestHeaders
      }
    };
    
    if (requestBody && method !== 'GET') {
      fetchOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
    }
    
    console.log('Fetch options:', fetchOptions);
    
    const response = await fetch(url, fetchOptions);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        data: responseData,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Simple proxy error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Network test failed',
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      })
    };
  }
};