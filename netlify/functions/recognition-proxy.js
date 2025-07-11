// Recognition function using AI proxy to bypass local network issues
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
    console.log('=== Recognition via Proxy ===');
    
    const { fileId, imageUrl, modelConfig, recognitionType = 'auto' } = JSON.parse(event.body);

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
          message: '请提供完整的模型配置'
        })
      };
    }

    console.log('Using model:', modelConfig.model);
    console.log('Recognition type:', recognitionType);
    console.log('Image URL:', imageUrl);

    // Generate prompt based on recognition type
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

    // Call AI proxy function
    console.log('Calling AI proxy...');
    
    const proxyResponse = await fetch(`${process.env.URL || 'https://chipper-cocada-99a2cc.netlify.app'}/.netlify/functions/ai-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiUrl: modelConfig.apiUrl,
        apiKey: modelConfig.apiKey,
        model: modelConfig.model,
        prompt: prompt,
        imageUrl: imageUrl,
        provider: modelConfig.provider || 'auto'
      })
    });

    console.log('AI proxy response status:', proxyResponse.status);

    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text();
      console.error('AI proxy error:', errorText);
      throw new Error(`AI proxy error: ${proxyResponse.status} - ${errorText}`);
    }

    const proxyResult = await proxyResponse.json();
    console.log('AI proxy success:', proxyResult);

    if (!proxyResult.success) {
      throw new Error(proxyResult.message || 'AI proxy call failed');
    }

    // Format the result
    const recognitionResult = {
      content: proxyResult.result.content,
      confidence: proxyResult.result.confidence,
      model: proxyResult.result.model,
      provider: proxyResult.result.provider,
      type: recognitionType,
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recognition: recognitionResult,
        file: {
          id: fileId,
          url: imageUrl
        }
      })
    };

  } catch (error) {
    console.error('Recognition proxy error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Recognition failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};