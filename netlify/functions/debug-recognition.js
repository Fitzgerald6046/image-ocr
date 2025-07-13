// Debug function to trace the entire recognition flow
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
    console.log('=== DEBUG RECOGNITION START ===');
    console.log('Request body:', event.body);
    
    const { fileId, imageUrl, modelConfig, recognitionType = 'auto' } = JSON.parse(event.body);
    
    console.log('Parsed parameters:');
    console.log('- fileId:', fileId);
    console.log('- imageUrl:', imageUrl);
    console.log('- modelConfig:', JSON.stringify(modelConfig, null, 2));
    console.log('- recognitionType:', recognitionType);
    
    // 验证图片URL是否可访问
    console.log('\n=== TESTING IMAGE URL ===');
    try {
      const imageResponse = await fetch(imageUrl);
      console.log('Image URL response status:', imageResponse.status);
      console.log('Image URL response headers:', Object.fromEntries(imageResponse.headers.entries()));
      
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        console.log('Image downloaded successfully, size:', imageBuffer.byteLength, 'bytes');
      } else {
        console.error('Failed to download image:', await imageResponse.text());
      }
    } catch (imageError) {
      console.error('Image URL fetch error:', imageError.message);
    }
    
    // 测试AI API调用
    console.log('\n=== TESTING AI API ===');
    const prompt = "请识别这张图片中的内容";
    
    let aiResult;
    
    try {
      console.log('Calling AI proxy with provider:', modelConfig.provider);
      
      const aiResponse = await fetch(`${process.env.URL || 'https://chipper-cocada-99a2cc.netlify.app'}/.netlify/functions/ai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: modelConfig.apiUrl,
          apiKey: modelConfig.apiKey,
          model: modelConfig.model,
          prompt: prompt,
          imageUrl: imageUrl,
          provider: modelConfig.provider
        })
      });
      
      console.log('AI proxy response status:', aiResponse.status);
      console.log('AI proxy response headers:', Object.fromEntries(aiResponse.headers.entries()));
      
      if (aiResponse.ok) {
        aiResult = await aiResponse.json();
        console.log('AI proxy success:', JSON.stringify(aiResult, null, 2));
      } else {
        const errorText = await aiResponse.text();
        console.error('AI proxy error response:', errorText);
        aiResult = { success: false, error: errorText };
      }
    } catch (aiError) {
      console.error('AI proxy fetch error:', aiError.message);
      aiResult = { success: false, error: aiError.message };
    }
    
    // 直接测试各个AI API
    console.log('\n=== DIRECT AI API TESTS ===');
    
    const directTests = [];
    
    // 测试智谱清言
    if (modelConfig.provider === 'zhipu') {
      console.log('Testing Zhipu directly...');
      try {
        const zhipuResponse = await fetch(`${modelConfig.apiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${modelConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelConfig.model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl } }
                ]
              }
            ],
            max_tokens: 100
          })
        });
        
        console.log('Zhipu direct response status:', zhipuResponse.status);
        if (zhipuResponse.ok) {
          const zhipuData = await zhipuResponse.json();
          console.log('Zhipu direct success:', JSON.stringify(zhipuData, null, 2));
          directTests.push({ provider: 'zhipu', success: true, data: zhipuData });
        } else {
          const zhipuError = await zhipuResponse.text();
          console.error('Zhipu direct error:', zhipuError);
          directTests.push({ provider: 'zhipu', success: false, error: zhipuError });
        }
      } catch (error) {
        console.error('Zhipu direct fetch error:', error.message);
        directTests.push({ provider: 'zhipu', success: false, error: error.message });
      }
    }
    
    // 测试Gemini
    if (modelConfig.provider === 'gemini') {
      console.log('Testing Gemini directly...');
      try {
        // 下载图片转base64
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        // Get correct MIME type
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        console.log('Debug Gemini: Image content type:', contentType);
        
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // More robust base64 encoding
        const uint8Array = new Uint8Array(imageBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        const imageBase64 = btoa(binaryString);
        
        console.log('Debug Gemini: Image size:', imageBuffer.byteLength, 'bytes');
        
        const geminiResponse = await fetch(`${modelConfig.apiUrl}/models/${modelConfig.model}:generateContent?key=${modelConfig.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
            }]
          })
        });
        
        console.log('Gemini direct response status:', geminiResponse.status);
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          console.log('Gemini direct success:', JSON.stringify(geminiData, null, 2));
          directTests.push({ provider: 'gemini', success: true, data: geminiData });
        } else {
          const geminiError = await geminiResponse.text();
          console.error('Gemini direct error:', geminiError);
          directTests.push({ provider: 'gemini', success: false, error: geminiError });
        }
      } catch (error) {
        console.error('Gemini direct fetch error:', error.message);
        directTests.push({ provider: 'gemini', success: false, error: error.message });
      }
    }
    
    console.log('\n=== DEBUG RECOGNITION END ===');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        debug: {
          parameters: {
            fileId,
            imageUrl,
            modelConfig,
            recognitionType
          },
          aiProxyResult: aiResult,
          directTests: directTests,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Debug recognition error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Debug failed',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};