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
          NETLIFY_DEV: process.env.NETLIFY_DEV,
          CONTEXT: process.env.CONTEXT,
          DEPLOY_URL: process.env.DEPLOY_URL,
          // 代理相关环境变量检查
          HTTP_PROXY: process.env.HTTP_PROXY || 'undefined',
          HTTPS_PROXY: process.env.HTTPS_PROXY || 'undefined',
          NO_PROXY: process.env.NO_PROXY || 'undefined'
        },
        // 代理检查结果
        proxyStatus: {
          hasHttpProxy: !!process.env.HTTP_PROXY,
          hasHttpsProxy: !!process.env.HTTPS_PROXY,
          shouldUseProxy: !!(process.env.HTTP_PROXY || process.env.HTTPS_PROXY) && 
                         !process.env.NETLIFY && 
                         !process.env.CONTEXT && 
                         !process.env.DEPLOY_URL,
          isNetlifyEnv: !!(process.env.NETLIFY || process.env.CONTEXT || process.env.DEPLOY_URL || process.env.NETLIFY_DEV)
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