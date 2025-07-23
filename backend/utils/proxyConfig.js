import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Dynamic proxy configuration based on environment
 * Handles different proxy settings for WSL, production, and local development
 */
class ProxyConfig {
  constructor() {
    this.isWSL = this.detectWSL();
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isNetlify = process.env.NETLIFY === 'true';
  }

  /**
   * Detect if running in WSL environment
   */
  detectWSL() {
    return process.env.WSL_DISTRO_NAME !== undefined || 
           process.env.WSLENV !== undefined ||
           (process.platform === 'linux' && process.env.PATH && process.env.PATH.includes('/mnt/'));
  }

  /**
   * Get proxy configuration for HTTP requests
   */
  getProxyConfig() {
    // Production or Netlify - NEVER use proxy
    if (this.isProduction || this.isNetlify) {
      console.log('🚫 Production/Netlify environment detected - proxy disabled');
      return null;
    }

    // Check for Netlify-specific environment variables
    if (process.env.NETLIFY_DEV || process.env.CONTEXT || process.env.DEPLOY_URL) {
      console.log('🚫 Netlify deployment environment detected - proxy disabled');
      return null;
    }

    // WSL development - use local proxy only if explicitly set
    if (this.isWSL && (process.env.HTTP_PROXY || process.env.HTTPS_PROXY)) {
      const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
      console.log('🔗 WSL development proxy enabled:', proxyUrl);
      return {
        proxy: proxyUrl,
        agent: new HttpsProxyAgent(proxyUrl)
      };
    }

    // Local development - check for explicit proxy settings
    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
      const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      console.log('🔗 Local development proxy enabled:', proxyUrl);
      return {
        proxy: proxyUrl,
        agent: new HttpsProxyAgent(proxyUrl)
      };
    }

    // Default - no proxy
    console.log('✅ No proxy configuration - direct connection');
    return null;
  }

  /**
   * Get axios configuration with proxy settings
   */
  getAxiosConfig() {
    const proxyConfig = this.getProxyConfig();
    
    if (!proxyConfig) {
      return {};
    }

    return {
      httpsAgent: proxyConfig.agent,
      proxy: false // Disable axios built-in proxy, use agent instead
    };
  }

  /**
   * Get fetch configuration with proxy settings
   */
  getFetchConfig() {
    const proxyConfig = this.getProxyConfig();
    
    if (!proxyConfig) {
      return {};
    }

    return {
      agent: proxyConfig.agent
    };
  }

  /**
   * Log current proxy status for debugging
   */
  logProxyStatus() {
    const proxyConfig = this.getProxyConfig();
    
    console.log('=== Proxy Configuration Status ===');
    console.log('Environment:', {
      isWSL: this.isWSL,
      isProduction: this.isProduction,
      isNetlify: this.isNetlify,
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: process.env.NETLIFY
    });
    
    if (proxyConfig) {
      console.log('Proxy enabled:', proxyConfig.proxy);
    } else {
      console.log('Proxy: disabled (direct connection)');
    }
    console.log('==================================');
  }
}

// Export singleton instance
const proxyConfig = new ProxyConfig();

export default proxyConfig;