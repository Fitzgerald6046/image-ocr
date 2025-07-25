import { useCallback } from 'react';
import { useAppContext, appActions } from '../contexts/AppContext';
import { ErrorHandler, ApiError } from '../utils/errorHandler';
import { HistoryManager } from '../utils/historyManager';
import { getApiUrl, API_CONFIG } from '../config';

export const useRecognition = () => {
  const { state, dispatch } = useAppContext();

  const handleRecognize = useCallback(async () => {
    console.log('🔍 开始识别流程...');
    const { uploadedImage, selectedModel, recognitionType, isRecognizing } = state;
    
    console.log('uploadedImage:', uploadedImage);
    console.log('selectedModel:', selectedModel);
    console.log('isRecognizing:', isRecognizing);

    if (!uploadedImage || !selectedModel) {
      const errorMsg = '请确保已上传图片并选择AI模型';
      console.error('❌ 前置条件检查失败:', errorMsg);
      alert(errorMsg);
      return;
    }

    if (isRecognizing) {
      console.log('❌ 正在识别中，跳过重复请求');
      return;
    }

    // 从localStorage获取模型配置
    console.log('📋 获取模型配置...');
    let providers;
    try {
      const savedProviders = localStorage.getItem('aiProviders');
      console.log('localStorage aiProviders:', savedProviders);
      providers = JSON.parse(savedProviders || '[]');
    } catch (error) {
      console.error('❌ 解析localStorage失败:', error);
      alert('配置数据解析失败，请重新配置AI模型');
      return;
    }

    let modelConfig = null;
    
    // 查找选中模型的配置
    console.log('🔍 查找模型配置...');
    
    // 解析选中的模型格式：providerId::modelName
    let targetProviderId: string;
    let targetModelName: string;
    
    if (selectedModel.includes('::')) {
      [targetProviderId, targetModelName] = selectedModel.split('::', 2);
    } else {
      // 兼容旧格式，直接是模型名称
      targetModelName = selectedModel;
      targetProviderId = '';
    }
    
    console.log('目标提供商ID:', targetProviderId, '目标模型名称:', targetModelName);
    
    for (const provider of providers) {
      console.log('检查提供商:', provider.name, provider);
      
      // 如果指定了提供商ID，只检查对应的提供商
      if (targetProviderId && provider.id !== targetProviderId) {
        continue;
      }
      
      const allModels = [...(provider.models || []), ...(provider.customModels || []), ...(provider.selectedModels || [])];
      console.log('提供商模型列表:', allModels);
      
      if (allModels.includes(targetModelName)) {
        modelConfig = {
          model: targetModelName, // 使用实际的模型名称，不包含提供商前缀
          apiKey: provider.apiKey,
          apiUrl: provider.apiUrl,
          provider: provider.id, // 添加提供商信息
          isCustom: provider.id.startsWith('custom-') // 标记是否为自定义提供商
        };
        console.log('✅ 找到模型配置:', modelConfig);
        break;
      }
    }
    
    if (!modelConfig || !modelConfig.apiKey) {
      const errorMsg = '未找到所选模型的API密钥配置，请先在设置中配置';
      console.error('❌ 模型配置检查失败:', errorMsg);
      console.log('可用提供商:', providers);
      alert(errorMsg);
      return;
    }

    dispatch(appActions.setIsRecognizing(true));
    
    try {
      console.log('🚀 发送识别请求...');
      const requestData = {
        fileId: uploadedImage.fileId,
        imageUrl: uploadedImage.url,
        modelConfig,
        recognitionType
      };
      console.log('请求数据:', requestData);

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.recognition), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP错误响应:', errorText);
        throw new Error(`识别失败: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ 后端响应:', result);
      
      if (result.success) {
        const recognitionData = {
          type: recognitionType,
          content: result.recognition.content,
          confidence: result.recognition.confidence,
          model: result.recognition.model,
          provider: result.recognition.provider,
          timestamp: result.recognition.timestamp,
          originalContent: result.recognition.originalContent,
          classification: result.recognition.classification,
          specialAnalysis: result.recognition.specialAnalysis
        };
        
        dispatch(appActions.setRecognitionResult(recognitionData));
        
        // 保存到历史记录
        if (uploadedImage) {
          HistoryManager.saveRecord({
            fileName: uploadedImage.file.name,
            fileSize: uploadedImage.file.size,
            fileType: uploadedImage.file.type,
            recognitionType: recognitionType,
            model: recognitionData.model,
            provider: recognitionData.provider || 'unknown',
            result: {
              content: recognitionData.content,
              confidence: recognitionData.confidence,
              originalContent: recognitionData.originalContent,
              classification: recognitionData.classification,
              specialAnalysis: recognitionData.specialAnalysis
            },
            previewUrl: uploadedImage.url
          });
        }
        
        console.log('✅ 图片识别完成');
      } else {
        throw new Error(result.message || '识别失败');
      }
    } catch (error) {
      console.error('❌ 识别过程出错:', error);
      
      let apiError: ApiError;
      if (error instanceof ApiError) {
        apiError = error;
      } else {
        apiError = ErrorHandler.handle(error, 'recognition');
      }
      
      dispatch(appActions.setError(apiError));
    } finally {
      dispatch(appActions.setIsRecognizing(false));
    }
  }, [state, dispatch]);

  return { handleRecognize };
};