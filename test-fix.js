const axios = require('axios');

// 测试修复后的自定义Gemini API调用
async function testFixedCustomAPI() {
  console.log('🧪 测试修复后的自定义Gemini API调用...');
  
  const testConfig = {
    model: 'gemini-2.5-flash', // 测试模型
    apiKey: 'test-api-key', // 测试用的API密钥
    apiUrl: 'https://try-gemini-play.deno.dev/v1beta', // 您的中转API地址
    provider: 'custom-gemini',
    isCustom: true
  };
  
  try {
    console.log('📋 测试连接配置...');
    
    // 首先测试连接
    const testResponse = await axios.post('http://localhost:3001/api/models/test', {
      modelConfig: testConfig
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 连接测试结果:', testResponse.data);
    
    if (testResponse.data.success) {
      console.log('🎉 连接测试成功！现在可以尝试进行图片识别了。');
    } else {
      console.log('❌ 连接测试失败:', testResponse.data.message);
      console.log('💡 建议检查以下几点:');
      console.log('   1. API密钥是否正确');
      console.log('   2. API地址是否可访问');
      console.log('   3. 中转服务是否需要特定的端点格式');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误详情:', error.response.data);
    }
    
    console.log('\n💡 常见问题解决方案:');
    console.log('1. 确保后端服务器正在运行 (npm start)');
    console.log('2. 检查API密钥格式是否正确');
    console.log('3. 确认中转API地址可以访问');
    console.log('4. 检查网络连接和防火墙设置');
  }
}

// 运行测试
testFixedCustomAPI();