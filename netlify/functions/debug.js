// Debug function to check Netlify Functions environment
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const debugInfo = {
      success: true,
      timestamp: new Date().toISOString(),
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        headers: event.headers,
        queryStringParameters: event.queryStringParameters,
        body: event.body ? 'Body present' : 'No body'
      },
      context: {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        remainingTimeInMillis: context.getRemainingTimeInMillis()
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          NETLIFY: process.env.NETLIFY,
          NETLIFY_DEV: process.env.NETLIFY_DEV
        }
      },
      availableFunctions: [
        'upload',
        'recognition',
        'recognition-simple', 
        'recognition-stable',
        'test-api',
        'debug'
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(debugInfo, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Debug failed',
        message: error.message,
        stack: error.stack
      })
    };
  }
};