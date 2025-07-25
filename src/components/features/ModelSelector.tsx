import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onConfigureModels: () => void;
}

interface ModelInfo {
  value: string;
  label: string;
  providerId: string;
  providerName: string;
}

// 获取隐藏模型列表
const getHiddenModels = (): string[] => {
  try {
    const hiddenModels = localStorage.getItem('hiddenModels');
    return hiddenModels ? JSON.parse(hiddenModels) : [];
  } catch (error) {
    console.error('Error loading hidden models:', error);
    return [];
  }
};

// 从localStorage获取用户配置的模型列表（只显示已选模型）
const getAvailableModels = (): ModelInfo[] => {
  try {
    const savedProviders = localStorage.getItem('aiProviders');
    if (savedProviders) {
      const providers = JSON.parse(savedProviders);
      const availableModels: ModelInfo[] = [];
      
      providers.forEach((provider: any) => {
        // 只包含已配置API密钥的提供商的已选模型
        if (provider.apiKey && provider.apiKey.trim()) {
          // 添加已选模型
          if (provider.selectedModels && provider.selectedModels.length > 0) {
            provider.selectedModels.forEach((model: string) => {
              const modelValue = `${provider.id}::${model}`;
              
              availableModels.push({
                value: modelValue,
                label: `${model} (${provider.name})`,
                providerId: provider.id,
                providerName: provider.name
              });
            });
          }
          
          // 添加自定义模型（保留兼容性）
          if (provider.customModels && provider.customModels.length > 0) {
            provider.customModels.forEach((model: string) => {
              const modelValue = `${provider.id}::${model}`;
              
              availableModels.push({
                value: modelValue,
                label: `${model} (${provider.name} - 自定义)`,
                providerId: provider.id,
                providerName: provider.name
              });
            });
          }
        }
      });
      
      return availableModels;
    }
  } catch (error) {
    console.error('Error loading models from localStorage:', error);
  }
  
  return [];
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  onConfigureModels
}) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  
  // 组件加载时和localStorage变化时更新可用模型
  useEffect(() => {
    const updateModels = () => {
      const models = getAvailableModels();
      console.log('🔄 更新可用模型列表:', models);
      setAvailableModels(models);
    };
    
    updateModels(); // 初始加载
    
    // 监听localStorage变化
    const handleStorageChange = () => {
      console.log('📡 检测到localStorage变化，更新模型列表');
      updateModels();
    };
    
    // 监听自定义事件（配置更新时触发）
    const handleProvidersUpdate = (event: any) => {
      console.log('📡 检测到提供商配置更新:', event.detail);
      updateModels();
    };
    
    // 监听隐藏模型列表更新
    const handleHiddenModelsUpdate = (event: any) => {
      console.log('📡 检测到隐藏模型列表更新:', event.detail);
      updateModels();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('aiProvidersUpdated', handleProvidersUpdate);
    window.addEventListener('hiddenModelsUpdated', handleHiddenModelsUpdate);
    
    // 由于同一页面内的localStorage变化不会触发storage事件，
    // 我们需要手动定期检查或在配置页面返回时更新
    const interval = setInterval(updateModels, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('aiProvidersUpdated', handleProvidersUpdate);
      window.removeEventListener('hiddenModelsUpdated', handleHiddenModelsUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
            <span className="text-purple-600 text-xs">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">AI模型选择</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
            >
              <option value="">
                {availableModels.length > 0 ? '请选择AI模型' : '请先配置AI模型'}
              </option>
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          
          <button
            onClick={onConfigureModels}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2 font-medium"
            style={{ 
              minWidth: '120px', 
              height: '48px',
              backgroundColor: '#f97316',
              color: 'white',
              border: '1px solid #ea580c'
            }}
          >
            <Settings className="w-4 h-4" />
            <span>模型配置</span>
          </button>
        </div>
        
        {selectedModel && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">已选择模型：</span>
              {availableModels.find(m => m.value === selectedModel)?.label || selectedModel}
            </p>
          </div>
        )}
        
        {!selectedModel && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {availableModels.length === 0 
                ? "请先点击模型配置按钮设置API密钥，然后选择AI模型" 
                : "请从上方下拉菜单中选择一个AI模型"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector;