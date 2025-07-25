import { useCallback } from 'react';
import { useAppContext, appActions, UploadedImageInfo } from '../contexts/AppContext';
import { ErrorHandler, ApiError } from '../utils/errorHandler';
import { FileHandler } from '../utils/fileHandler';
import { getApiUrl, API_CONFIG } from '../config';

export const useImageUpload = () => {
  const { dispatch } = useAppContext();

  const handleImageUpload = useCallback(async (file: File) => {
    // 清除之前的错误
    dispatch(appActions.setError(null));
    
    try {
      // 1. 文件验证
      const validation = FileHandler.validateFile(file);
      if (!validation.isValid) {
        throw ErrorHandler.handle(new Error(validation.error!), 'file');
      }

      // 2. 开始上传流程
      dispatch(appActions.setUploadStatus({
        isUploading: true,
        progress: 0,
        status: 'uploading'
      }));

      // 3. 检查是否需要压缩
      let uploadFile = file;
      if (FileHandler.shouldCompress(file)) {
        dispatch(appActions.setUploadStatus({
          isUploading: true,
          progress: 20,
          status: 'processing'
        }));

        try {
          const compressed = await FileHandler.compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8
          });
          uploadFile = compressed.file;
          console.log(`📦 图片压缩完成: ${compressed.compressionRatio}% 压缩率`);
        } catch (compressionError) {
          console.warn('图片压缩失败，使用原图:', compressionError);
        }
      }

      // 4. 创建FormData
      const formData = new FormData();
      formData.append('image', uploadFile);
      
      console.log('🚀 开始上传图片:', file.name);
      
      // 5. 上传到后端
      dispatch(appActions.setUploadStatus({
        isUploading: true,
        progress: 50,
        status: 'uploading'
      }));

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.upload), {
        method: 'POST',
        body: formData
      });
      
      // 6. 处理HTTP错误
      if (!response.ok) {
        const errorText = await response.text();
        throw ErrorHandler.handleHttpError(response, errorText);
      }
      
      // 7. 解析响应
      dispatch(appActions.setUploadStatus({
        isUploading: true,
        progress: 80,
        status: 'uploading'
      }));

      const result = await response.json();
      console.log('📦 后端返回结果:', result);
      
      if (result.success) {
        const imageInfo: UploadedImageInfo = {
          file,
          fileId: result.file.id,
          url: result.file.url.startsWith('http') ? result.file.url : `${API_CONFIG.baseURL}${result.file.url}`,
          metadata: result.file.metadata
        };
        
        // 8. 完成上传
        dispatch(appActions.setUploadStatus({
          isUploading: false,
          progress: 100,
          status: 'completed'
        }));

        dispatch(appActions.setUploadedImage(imageInfo));
        dispatch(appActions.setRecognitionResult(null));
        dispatch(appActions.setShowBatchSection(false));
        
        console.log('✅ 图片上传成功:', result.file.fileName);
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let apiError: ApiError;
      if (error instanceof ApiError) {
        apiError = error;
      } else {
        apiError = ErrorHandler.handle(error, 'network');
      }
      
      dispatch(appActions.setError(apiError));
      dispatch(appActions.setUploadStatus({
        isUploading: false,
        progress: 0,
        status: 'error',
        error: apiError
      }));
    }
  }, [dispatch]);

  return { handleImageUpload };
};