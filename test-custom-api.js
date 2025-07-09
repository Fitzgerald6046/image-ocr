const axios = require('axios');

// 测试自定义Gemini API调用
async function testCustomGeminiAPI() {
  console.log('🧪 测试自定义Gemini API调用...');
  
  const testConfig = {
    model: 'gemini-2.5-flash-preview-05-20', // 假设这是您的自定义模型
    apiKey: 'YOUR_API_KEY_HERE', // 请替换为您的实际API密钥
    apiUrl: 'https://try-gemini-play.deno.dev/', // 您的中转API地址
    provider: 'custom-12345', // 自定义提供商ID
    isCustom: true
  };
  
  const requestData = {
    fileId: 'test-file-id',
    modelConfig: testConfig,
    recognitionType: 'auto'
  };
  
  try {
    console.log('📋 发送测试请求:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/recognition', requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 测试成功，响应:', response.data);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('响应头:', error.response.headers);
    }
  }
}

// 运行测试
testCustomGeminiAPI(); 