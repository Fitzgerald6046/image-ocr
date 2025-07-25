import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings, Check, X, BarChart3, Zap, Users } from 'lucide-react';

interface MultiModelSelectorProps {
  selectedModels: string[];
  onModelSelectionChange: (models: string[]) => void;
  onConfigureModels: () => void;
  maxModels?: number;
  comparisonMode?: boolean;
}

interface ModelInfo {
  value: string;
  label: string;
  providerId: string;
  providerName: string;
  icon?: string;
  category?: string;
  performance?: 'high' | 'medium' | 'low';
  cost?: 'high' | 'medium' | 'low' | 'free';
  specialty?: string[];
}

// 模型分类和元数据
const getModelMetadata = (modelName: string, providerId: string): Partial<ModelInfo> => {
  const model = modelName.toLowerCase();
  
  // 分类逻辑
  let category = 'general';
  let performance: 'high' | 'medium' | 'low' = 'medium';
  let cost: 'high' | 'medium' | 'low' | 'free' = 'medium';
  const specialty: string[] = [];
  
  // OpenRouter特殊处理
  if (providerId === 'openrouter') {
    if (model.includes('free')) cost = 'free';
    if (model.includes('gpt-4') || model.includes('claude-3-5') || model.includes('gemini-2')) {
      performance = 'high';
      cost = 'high';
    }
    if (model.includes('vision') || model.includes('vision-preview')) {
      specialty.push('视觉');
    }
  }
  
  // 按模型名称分类
  if (model.includes('gpt-4') || model.includes('claude-3') || model.includes('gemini-2')) {
    category = 'flagship';
    performance = 'high';
  } else if (model.includes('gpt-3.5') || model.includes('claude-instant') || model.includes('gemini-1.5')) {
    category = 'standard';
    performance = 'medium';
  } else if (model.includes('free') || model.includes('lite') || model.includes('mini')) {
    category = 'budget';
    cost = 'free';
    performance = 'low';
  }
  
  // 专业特性检测
  if (model.includes('vision') || model.includes('multi') || model.includes('image')) {
    specialty.push('图像识别');
  }
  if (model.includes('code') || model.includes('programming')) {
    specialty.push('代码生成');
  }
  if (model.includes('reasoning') || model.includes('logic')) {
    specialty.push('推理分析');
  }
  if (model.includes('instruct') || model.includes('chat')) {
    specialty.push('对话交互');
  }
  
  return { category, performance, cost, specialty };
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
              const metadata = getModelMetadata(model, provider.id);
              availableModels.push({
                value: `${provider.id}::${model}`,
                label: `${model} (${provider.name})`,
                providerId: provider.id,
                providerName: provider.name,
                icon: provider.icon || '🤖',
                ...metadata
              });
            });
          }
          
          // 添加自定义模型（保留兼容性）
          if (provider.customModels && provider.customModels.length > 0) {
            provider.customModels.forEach((model: string) => {
              const metadata = getModelMetadata(model, provider.id);
              availableModels.push({
                value: `${provider.id}::${model}`,
                label: `${model} (${provider.name} - 自定义)`,
                providerId: provider.id,
                providerName: provider.name,
                icon: provider.icon || '🔧',
                ...metadata
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

const MultiModelSelector: React.FC<MultiModelSelectorProps> = ({
  selectedModels,
  onModelSelectionChange,
  onConfigureModels,
  maxModels = 5,
  comparisonMode = true
}) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [concurrentLimit, setConcurrentLimit] = useState(2);
  const [timeoutSetting, setTimeoutSetting] = useState(30);
  
  // 组件加载时和localStorage变化时更新可用模型
  useEffect(() => {
    const updateModels = () => {
      const models = getAvailableModels();
      console.log('🔄 更新多模型选择器可用模型列表:', models);
      setAvailableModels(models);
    };
    
    updateModels();
    
    const handleStorageChange = () => {
      console.log('📡 多模型选择器检测到localStorage变化');
      updateModels();
    };
    
    const handleProvidersUpdate = (event: any) => {
      console.log('📡 多模型选择器检测到提供商配置更新:', event.detail);
      updateModels();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('aiProvidersUpdated', handleProvidersUpdate);
    
    const interval = setInterval(updateModels, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('aiProvidersUpdated', handleProvidersUpdate);
      clearInterval(interval);
    };
  }, []);

  // 处理模型选择/取消选择
  const handleModelToggle = (modelValue: string) => {
    const newSelectedModels = selectedModels.includes(modelValue)
      ? selectedModels.filter(model => model !== modelValue)
      : selectedModels.length < maxModels
      ? [...selectedModels, modelValue]
      : selectedModels;
    
    onModelSelectionChange(newSelectedModels);
  };

  // 清除所有选择
  const handleClearAll = () => {
    onModelSelectionChange([]);
  };

  // 智能推荐模型组合
  const getRecommendedModels = () => {
    const recommended: string[] = [];
    
    // 优先选择不同提供商的高性能模型
    const priorityModels = [
      'gemini::gemini-2.5-pro-exp-03-25',
      'openai::gpt-4o',
      'claude::claude-3-5-sonnet-20241022',
      'deepseek::deepseek-chat',
      'openrouter::google/gemini-2.5-pro-exp-03-25:free'
    ];
    
    priorityModels.forEach(model => {
      if (availableModels.some(m => m.value === model) && recommended.length < 3) {
        recommended.push(model);
      }
    });
    
    return recommended;
  };

  const handleQuickSelect = (models: string[]) => {
    onModelSelectionChange(models.slice(0, maxModels));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">多模型对比选择</h3>
          </div>
          <div className="text-sm text-gray-500">
            已选择 {selectedModels.length}/{maxModels} 个模型
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* 快速选择按钮 */}
        {availableModels.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickSelect(getRecommendedModels())}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                智能推荐
              </button>
              <button
                onClick={() => handleQuickSelect(availableModels.slice(0, 3).map(m => m.value))}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                前3个模型
              </button>
              {selectedModels.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  清除选择
                </button>
              )}
            </div>
          </div>
        )}

        {/* 模型选择区域 */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
          >
            <span className="text-gray-700">
              {availableModels.length > 0 ? 
                (selectedModels.length > 0 ? `已选择 ${selectedModels.length} 个模型` : `点击选择模型 (共${availableModels.length}个可用)`) : 
                '请先配置AI模型'
              }
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* 下拉选择列表 */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden">
              {availableModels.length === 0 ? (
                <div className="p-3 text-gray-500 text-center">
                  暂无可用模型，请先配置模型
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-80">
                  {availableModels.map((model) => (
                    <div
                      key={model.value}
                      className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        selectedModels.includes(model.value) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleModelToggle(model.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg">{model.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">{model.label}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span>{model.providerName}</span>
                              {model.performance && (
                                <span className={`px-1 py-0.5 rounded ${
                                  model.performance === 'high' ? 'bg-green-100 text-green-700' :
                                  model.performance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {model.performance === 'high' ? '高性能' :
                                   model.performance === 'medium' ? '中等' : '基础'}
                                </span>
                              )}
                              {model.cost && (
                                <span className={`px-1 py-0.5 rounded ${
                                  model.cost === 'free' ? 'bg-blue-100 text-blue-700' :
                                  model.cost === 'low' ? 'bg-green-100 text-green-700' :
                                  model.cost === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {model.cost === 'free' ? '免费' :
                                   model.cost === 'low' ? '低成本' :
                                   model.cost === 'medium' ? '中等' : '高成本'}
                                </span>
                              )}
                              {model.specialty && model.specialty.length > 0 && (
                                <span className="px-1 py-0.5 rounded bg-purple-100 text-purple-700">
                                  {model.specialty[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedModels.includes(model.value) && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 已选择的模型列表 */}
        {selectedModels.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">已选择的模型：</h4>
            <div className="space-y-1">
              {selectedModels.map((modelValue) => {
                const model = availableModels.find(m => m.value === modelValue);
                if (!model) return null;
                
                return (
                  <div key={modelValue} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{model.icon}</span>
                      <span className="text-sm font-medium text-blue-800">{model.label}</span>
                    </div>
                    <button
                      onClick={() => handleModelToggle(modelValue)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 对比配置选项 */}
        {comparisonMode && selectedModels.length > 1 && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-700">对比配置</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">并发数量</label>
                <select
                  value={concurrentLimit}
                  onChange={(e) => setConcurrentLimit(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value={1}>1 (串行)</option>
                  <option value={2}>2 (推荐)</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">超时设置</label>
                <select
                  value={timeoutSetting}
                  onChange={(e) => setTimeoutSetting(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value={15}>15 秒</option>
                  <option value={30}>30 秒</option>
                  <option value={60}>60 秒</option>
                  <option value={120}>120 秒</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 配置按钮和状态提示 */}
        <div className="flex items-center justify-between">
          <button
            onClick={onConfigureModels}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors duration-200 flex items-center gap-2 font-medium shadow-md border border-orange-600"
            style={{ backgroundColor: '#f97316', color: '#ffffff' }}
          >
            <Settings className="w-4 h-4" />
            <span>🔧 模型配置</span>
          </button>

          {selectedModels.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedModels.length === 1 && "单模型识别"}
              {selectedModels.length > 1 && `${selectedModels.length}模型对比`}
            </div>
          )}
        </div>

        {/* 提示信息 */}
        {availableModels.length === 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              请先点击模型配置按钮设置API密钥，然后选择要对比的AI模型
            </p>
          </div>
        )}

        {selectedModels.length === 0 && availableModels.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              请选择至少1个模型进行识别，选择2个或以上模型进行对比分析
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiModelSelector;