// backend/utils/proxyConfig.js
const { HttpsProxyAgent } = require('https-proxy-agent');

/**
 * 获取代理配置
 * @returns {Object|null} 代理配置对象或 null
 */
function getProxyConfig() {
  // 检查是否在生产环境（Netlify）
  const isProduction = process.env.NODE_ENV === 'production';
  const isNetlify = process.env.NETLIFY === 'true' || process.env.CONTEXT === 'production';
  
  // 在生产环境或 Netlify 上不使用代理
  if (isProduction || isNetlify) {
    console.log('🌐 生产环境：不使用代理');
    return null;
  }
  
  // 检查是否在 WSL 环境
  const isWSL = process.platform === 'linux' && 
    (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
  
  // 只在 WSL 环境中使用代理
  if (isWSL) {
    const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    
    if (httpProxy || httpsProxy) {
      const proxyUrl = httpsProxy || httpProxy;
      console.log(`🔧 WSL 环境：使用代理 ${proxyUrl}`);
      return {
        httpAgent: new HttpsProxyAgent(proxyUrl),
        httpsAgent: new HttpsProxyAgent(proxyUrl)
      };
    }

  }
  
  console.log('🌐 默认环境：不使用代理');
  return null;
}

/**
 * 为 axios 配置代理
 * @param {Object} axiosConfig - axios 配置对象
 * @returns {Object} 更新后的配置对象
 */
function configureAxiosProxy(axiosConfig) {
  const proxyConfig = getProxyConfig();
  
  if (proxyConfig) {
    return {
      ...axiosConfig,
      ...proxyConfig
    };
  }
  
  return axiosConfig;
}

/**
 * 为 fetch 配置代理
 * @param {Object} fetchOptions - fetch 选项对象
 * @returns {Object} 更新后的选项对象
 */
function configureFetchProxy(fetchOptions = {}) {
  const proxyConfig = getProxyConfig();
  
  if (proxyConfig) {
    return {
      ...fetchOptions,
      agent: proxyConfig.httpsAgent
    };
  }
  
  return fetchOptions;
}

module.exports = {
  getProxyConfig,
  configureAxiosProxy,
  configureFetchProxy
};};
