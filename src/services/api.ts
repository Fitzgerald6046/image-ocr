import { API_CONFIG, getApiUrl } from '../config';

// 通用的API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// 文件上传API
export const uploadFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const url = getApiUrl(API_CONFIG.endpoints.upload);
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed: ${response.status}`);
  }
  
  return await response.json();
};

// 图片识别API
export const recognizeImage = async (data: {
  fileId?: string;
  imageUrl?: string;
  modelConfig: any;
  recognitionType?: string;
}): Promise<any> => {
  return apiRequest(API_CONFIG.endpoints.recognition, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 批量识别API
export const recognizeBatch = async (data: {
  fileIds?: string[];
  imageUrls?: string[];
  modelConfig: any;
  recognitionType?: string;
}): Promise<any> => {
  return apiRequest(`${API_CONFIG.endpoints.recognition}/batch`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 获取可用模型
export const getAvailableModels = async (): Promise<any> => {
  return apiRequest(`${API_CONFIG.endpoints.models}/available`);
};

// 测试模型连接
export const testModelConnection = async (modelConfig: any): Promise<any> => {
  return apiRequest(`${API_CONFIG.endpoints.models}/test`, {
    method: 'POST',
    body: JSON.stringify({ modelConfig }),
  });
};

// 验证API密钥
export const validateApiKey = async (provider: string, apiKey: string): Promise<any> => {
  return apiRequest(`${API_CONFIG.endpoints.models}/validate-key`, {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey }),
  });
};

// 获取识别类型
export const getRecognitionTypes = async (): Promise<any> => {
  return apiRequest(`${API_CONFIG.endpoints.models}/types`);
};

// 健康检查
export const healthCheck = async (): Promise<any> => {
  return apiRequest(API_CONFIG.endpoints.health);
};