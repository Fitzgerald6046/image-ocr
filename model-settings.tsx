import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, CheckCircle, XCircle, Loader, ChevronDown, ChevronRight, ArrowLeft, RefreshCw, X } from 'lucide-react';
import { getApiUrl, API_CONFIG } from './src/config';

interface ModelSettingsProps {
  onBack?: () => void;
}

interface AIProvider {
  id: string;
  name: string;
  icon: string;
  apiKey: string;
  apiUrl: string;
  models: string[];
  customModels: string[];
  selectedModels: string[]; // 已选择的模型列表
  availableModels: string[]; // 从更新模型列表获取的可用模型
  expanded: boolean;
  testStatus: 'success' | 'error' | null;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ onBack }) => {
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: 'gemini',
      name: 'Gemini',
      icon: '🤖',
      apiKey: '',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: [
        'gemini-2.5-pro-preview-03-25',
        'gemini-2.5-pro-preview-05-06',
        'gemini-2.5-flash-preview-04-17-thinking',
        'gemini-2.5-pro-exp-03-25'
      ],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: true,
      testStatus: null
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      icon: '🌐',
      apiKey: '',
      apiUrl: 'https://openrouter.ai/api/v1',
      models: [
        'google/gemini-2.5-pro-exp-03-25:free',
        'google/gemini-2.5-flash-preview-04-17-thinking:free', 
        'google/gemini-1.5-flash:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'mistralai/mistral-7b-instruct:free'
      ],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      icon: '🧠',
      apiKey: '',
      apiUrl: 'https://api.deepseek.com/v1',
      models: ['deepseek-chat'],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '⚡',
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    },
    {
      id: 'hunyuan',
      name: '腾讯混元',
      icon: '🐧',
      apiKey: '',
      apiUrl: 'https://hunyuan.tencentcloudapi.com',
      models: ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    },
    {
      id: 'zhipuai',
      name: '智谱清言',
      icon: '🧩',
      apiKey: '',
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
      models: ['glm-4-flash', 'glm-4-plus', 'glm-4v-plus', 'glm-4-air'],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    },
    {
      id: 'tongyi',
      name: '阿里云通义千问',
      icon: '🌤️',
      apiKey: '',
      apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
      models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-plus', 'qwen-vl-max'],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    },
    {
      id: 'paddleocr',
      name: 'PaddleOCR (百度)',
      icon: '🔍',
      apiKey: '',
      apiUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1',
      models: ['general_basic', 'accurate_basic', 'general', 'accurate', 'handwriting'],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    },
    {
      id: 'claude',
      name: 'Claude',
      icon: '🤖',
      apiKey: '',
      apiUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      customModels: [],
      selectedModels: [],
      availableModels: [],
      expanded: false,
      testStatus: null
    }
  ]);

  const [customProviders, setCustomProviders] = useState<AIProvider[]>([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    models: [] as string[]
  });
  const [newModel, setNewModel] = useState('');
  const [selectedAvailableModel, setSelectedAvailableModel] = useState<{[providerId: string]: string}>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [showModelSelector, setShowModelSelector] = useState<string | null>(null);
  const [updatingModels, setUpdatingModels] = useState<string | null>(null);
  const [modelTestResults, setModelTestResults] = useState<{[key: string]: 'success' | 'error'}>({});

  // 从localStorage加载配置
  useEffect(() => {
    const saved = localStorage.getItem('aiProviders');
    console.log('🔍 从localStorage加载配置:', saved);
    if (saved) {
      try {
        const savedProviders: AIProvider[] = JSON.parse(saved);
        console.log('📖 解析的配置数据:', savedProviders);
        
        // 兼容旧数据格式，为没有新字段的provider添加默认值
        const updatedProviders = savedProviders.map(provider => ({
          ...provider,
          selectedModels: provider.selectedModels || [],
          availableModels: provider.availableModels || []
        }));
        
        setProviders(updatedProviders);
      } catch (error) {
        console.error('❌ 从localStorage加载配置失败:', error);
      }
    }
  }, []);

  // 保存配置到localStorage
  useEffect(() => {
    // 跳过初始渲染时的保存，避免覆盖已加载的配置
    if (providers.some(p => p.apiKey)) {
      try {
        const dataToSave = JSON.stringify(providers);
        localStorage.setItem('aiProviders', dataToSave);
        console.log('✅ 配置已保存到localStorage:', dataToSave);
        
        // 触发自定义事件，通知其他组件更新
        const event = new CustomEvent('aiProvidersUpdated', { 
          detail: providers 
        });
        window.dispatchEvent(event);
        console.log('📢 触发aiProvidersUpdated事件');
      } catch (error) {
        console.error('❌ 保存配置失败:', error);
      }
    }
  }, [providers]);

  const toggleProvider = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, expanded: !p.expanded } : p
    ));
  };

  const updateProvider = (providerId: string, field: keyof AIProvider, value: any) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, [field]: value } : p
    ));
  };

  const addCustomModel = (providerId: string, modelName: string) => {
    if (!modelName.trim()) {
      alert('请输入模型名称');
      return;
    }
    
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.customModels.includes(modelName.trim())) {
      alert('模型名称已存在');
      return;
    }
    
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, customModels: [...p.customModels, modelName.trim()] }
        : p
    ));
  };

  const removeCustomModel = (providerId: string, modelIndex: number) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, customModels: p.customModels.filter((_, i) => i !== modelIndex) }
        : p
    ));
  };

  const addManualModel = (providerId: string, modelName: string) => {
    if (!modelName.trim()) {
      alert('请输入模型名称');
      return;
    }
    
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.includes(modelName.trim())) {
      alert('模型名称已存在于内置列表中');
      return;
    }
    
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, models: [...p.models, modelName.trim()] }
        : p
    ));
    
    alert(`模型 "${modelName.trim()}" 已添加到内置模型列表`);
  };

  const testConnection = async (providerId: string, selectedModel?: string) => {
    setTestingProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider || !provider.apiKey || !provider.apiUrl) {
      alert('请先填写API密钥和API地址');
      setTestingProvider(null);
      return;
    }
    
    const availableModels = [...provider.models, ...provider.customModels, ...provider.selectedModels];
    const modelToTest = selectedModel || availableModels[0] || `${provider.id}-test`;
    
    if (!selectedModel && availableModels.length > 1) {
      setShowModelSelector(providerId);
      setTestingProvider(null);
      return;
    }
    
    setTestingModel(modelToTest);
    
    try {
      console.log('🧪 测试连接:', provider, '模型:', modelToTest);
      
      // 调用后端测试API
      const response = await fetch(getApiUrl(`${API_CONFIG.endpoints.models}/test`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelConfig: {
            model: modelToTest,
            apiKey: provider.apiKey,
            apiUrl: provider.apiUrl
          }
        })
      });
      
      const result = await response.json();
      console.log('🧪 测试结果:', result);
      
      // 保存模型测试结果
      const modelKey = `${providerId}::${modelToTest}`;
      setModelTestResults(prev => ({
        ...prev,
        [modelKey]: result.success ? 'success' : 'error'
      }));
      
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, testStatus: result.success ? 'success' : 'error' }
          : p
      ));
      
      if (!result.success) {
        alert(`连接测试失败 (${modelToTest}): ${result.message}`);
      } else {
        alert(`连接测试成功！(${modelToTest})`);
      }
      
    } catch (error) {
      console.error('❌ 测试连接失败:', error);
      
      // 保存模型测试失败结果
      const modelKey = `${providerId}::${modelToTest}`;
      setModelTestResults(prev => ({
        ...prev,
        [modelKey]: 'error'
      }));
      
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, testStatus: 'error' }
          : p
      ));
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`连接测试失败 (${modelToTest}): ${errorMessage}`);
    } finally {
      setTestingProvider(null);
      setTestingModel(null);
    }
  };
  
  const ModelSelector: React.FC<{ providerId: string; onSelect: (model: string) => void; onClose: () => void }> = ({ providerId, onSelect, onClose }) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return null;
    
    const availableModels = [...provider.models, ...provider.customModels, ...provider.selectedModels];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
          <h3 className="text-lg font-semibold mb-4">选择要测试的模型</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableModels.map((model) => (
              <button
                key={model}
                onClick={() => {
                  onSelect(model);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 border border-gray-200"
              >
                {model}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    );
  };

  const addCustomProvider = () => {
    if (!newProvider.name || !newProvider.apiUrl) return;
    
    const customProvider: AIProvider = {
      id: `custom-${Date.now()}`,
      name: newProvider.name,
      icon: '🔧',
      apiKey: newProvider.apiKey,
      apiUrl: newProvider.apiUrl,
      models: [],
      customModels: newProvider.models,
      selectedModels: [],
      availableModels: [],
      expanded: true,
      testStatus: null
    };
    
    setProviders(prev => [...prev, customProvider]);
    setNewProvider({ name: '', apiUrl: '', apiKey: '', models: [] });
    setShowAddProvider(false);
  };

  const removeProvider = (providerId: string) => {
    if (confirm('确定要删除这个提供商吗？')) {
      setProviders(prev => prev.filter(p => p.id !== providerId));
    }
  };

  const updateAvailableModels = async (providerId: string) => {
    setUpdatingModels(providerId);
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider || !provider.apiKey || !provider.apiUrl) {
      alert('请先填写API密钥和API地址');
      setUpdatingModels(null);
      return;
    }
    
    try {
      console.log('🔄 更新可用模型:', provider);
      
      // 调用后端API获取模型列表
      const response = await fetch(getApiUrl(`${API_CONFIG.endpoints.models}/list`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: provider.id,
          apiKey: provider.apiKey,
          apiUrl: provider.apiUrl
        })
      });
      
      const result = await response.json();
      console.log('📋 模型列表结果:', result);
      
      if (result.success && result.models) {
        // 将获取的模型添加到availableModels中
        setProviders(prev => prev.map(p => 
          p.id === providerId 
            ? { ...p, availableModels: result.models }
            : p
        ));
        alert(`成功更新模型列表！发现 ${result.models.length} 个模型`);
      } else {
        alert(`获取模型列表失败: ${result.message || '未知错误'}`);
      }
      
    } catch (error) {
      console.error('❌ 更新模型列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`更新模型列表失败: ${errorMessage}`);
    } finally {
      setUpdatingModels(null);
    }
  };

  // 获取隐藏模型列表
  const getHiddenModels = (): string[] => {
    try {
      const hiddenModels = localStorage.getItem('hiddenModels');
      return hiddenModels ? JSON.parse(hiddenModels) : [];
    } catch (error) {
      console.error('❌ 获取隐藏模型列表失败:', error);
      return [];
    }
  };

  // 隐藏模型功能
  const hideModel = (providerId: string, modelName: string) => {
    try {
      const modelValue = `${providerId}::${modelName}`;
      const hiddenModels = JSON.parse(localStorage.getItem('hiddenModels') || '[]');
      
      if (!hiddenModels.includes(modelValue)) {
        const updatedHiddenModels = [...hiddenModels, modelValue];
        localStorage.setItem('hiddenModels', JSON.stringify(updatedHiddenModels));
        
        // 触发自定义事件，通知其他组件更新
        const event = new CustomEvent('hiddenModelsUpdated', { 
          detail: updatedHiddenModels 
        });
        window.dispatchEvent(event);
        
        console.log('✅ 模型已隐藏:', modelValue);
        alert(`模型 "${modelName}" 已隐藏，在图像识别界面中将不再显示`);
      }
    } catch (error) {
      console.error('❌ 隐藏模型失败:', error);
      alert('隐藏模型失败，请重试');
    }
  };

  // 清除所有模型
  // 从可用模型下拉框添加到已选模型
  const addToSelectedModels = (providerId: string) => {
    const selectedModel = selectedAvailableModel[providerId];
    if (!selectedModel) {
      alert('请先选择一个模型');
      return;
    }
    
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.selectedModels.includes(selectedModel)) {
      alert('该模型已在已选模型列表中');
      return;
    }
    
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, selectedModels: [...p.selectedModels, selectedModel] }
        : p
    ));
    
    // 清空选择
    setSelectedAvailableModel(prev => ({
      ...prev,
      [providerId]: ''
    }));
    
    alert(`模型 "${selectedModel}" 已添加到已选模型`);
  };

  // 从已选模型中删除
  const removeFromSelectedModels = (providerId: string, modelIndex: number) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, selectedModels: p.selectedModels.filter((_, i) => i !== modelIndex) }
        : p
    ));
  };

  const clearAllModels = (providerId: string) => {
    if (confirm('确定要清除此提供商的所有可用模型吗？此操作不可撤销。')) {
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, availableModels: [] } : p
      ));
      alert('所有可用模型已清除');
    }
  };

  // 恢复隐藏的模型
  const restoreHiddenModels = (providerId: string) => {
    try {
      const hiddenModels = getHiddenModels();
      const providerHiddenModels = hiddenModels.filter(model => model.startsWith(`${providerId}::`));
      
      if (providerHiddenModels.length === 0) {
        alert('没有需要恢复的隐藏模型');
        return;
      }

      // 从隐藏列表中移除此提供商的所有模型
      const updatedHiddenModels = hiddenModels.filter(model => !model.startsWith(`${providerId}::`));
      localStorage.setItem('hiddenModels', JSON.stringify(updatedHiddenModels));
      
      // 触发自定义事件
      const event = new CustomEvent('hiddenModelsUpdated', { 
        detail: updatedHiddenModels 
      });
      window.dispatchEvent(event);
      
      alert(`已恢复 ${providerHiddenModels.length} 个隐藏的模型`);
    } catch (error) {
      console.error('❌ 恢复隐藏模型失败:', error);
      alert('恢复隐藏模型失败，请重试');
    }
  };

  const TestStatusIcon: React.FC<{ status: 'success' | 'error' | null; isLoading: boolean }> = ({ status, isLoading }) => {
    if (isLoading) return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-800">模型提供商设置</h1>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回主页</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">通用模型</h2>
            
            {providers.map((provider) => (
              <div key={provider.id} className="mb-4 border border-gray-200 rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleProvider(provider.id)}
                >
                  <div className="flex items-center gap-3">
                    {provider.expanded ? 
                      <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                    <span className="text-2xl">{provider.icon}</span>
                    <span className="font-medium text-gray-800">{provider.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TestStatusIcon 
                      status={provider.testStatus} 
                      isLoading={testingProvider === provider.id}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        testConnection(provider.id);
                      }}
                      disabled={testingProvider === provider.id}
                      className="px-3 py-1 text-sm border border-blue-200 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                    >
                      {testingProvider === provider.id ? 
                        (testingModel ? `测试中 (${testingModel})...` : '测试中...') : 
                        '测试连接'
                      }
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAvailableModels(provider.id);
                      }}
                      disabled={updatingModels === provider.id}
                      className="px-3 py-1 text-sm border border-green-200 text-green-600 rounded hover:bg-green-50 disabled:opacity-50"
                      title="更新模型列表"
                    >
                      {updatingModels === provider.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    {provider.id.startsWith('custom') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProvider(provider.id);
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="删除提供商"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {provider.expanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API 密钥
                        </label>
                        <input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) => updateProvider(provider.id, 'apiKey', e.target.value)}
                          placeholder="输入API密钥"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API 地址
                        </label>
                        <input
                          type="text"
                          value={provider.apiUrl}
                          onChange={(e) => updateProvider(provider.id, 'apiUrl', e.target.value)}
                          placeholder={provider.id === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : 
                                     provider.id === 'openrouter' ? 'https://openrouter.ai/api/v1' :
                                     provider.id === 'deepseek' ? 'https://api.deepseek.com/v1' :
                                     provider.id === 'openai' ? 'https://api.openai.com/v1' :
                                     'https://api.example.com/v1/endpoint'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {provider.id === 'gemini' && '对于自定义Gemini端点，请提供完整的API地址，如 https://your-domain.com/v1beta'}
                          {provider.id === 'openrouter' && 'OpenRouter提供多种免费AI模型，包括免费的Gemini 2.5 Pro。请在 openrouter.ai 注册获取免费API密钥'}
                          {provider.id === 'deepseek' && '对于自定义DeepSeek端点，请提供完整的API地址，如 https://your-domain.com/v1'}
                          {provider.id === 'openai' && '对于自定义OpenAI端点，请提供完整的API地址，如 https://your-domain.com/v1'}
                          {provider.id === 'hunyuan' && '腾讯混元大模型API。请在腾讯云控制台获取API密钥'}
                          {provider.id === 'zhipuai' && '智谱清言API。请在 open.bigmodel.cn 注册获取API密钥'}
                          {provider.id === 'tongyi' && '阿里云通义千问API。请在阿里云控制台获取API密钥'}
                          {provider.id === 'paddleocr' && '百度PaddleOCR API。请在百度AI开放平台获取API密钥'}
                          {provider.id === 'claude' && 'Anthropic Claude API。请在 console.anthropic.com 获取API密钥'}
                          {provider.id.startsWith('custom') && '请提供完整的API测试地址，如 https://your-api.com/v1/models'}
                        </p>
                      </div>
                    </div>

                    {/* 可用模型下拉框选择区域 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          可用模型选择
                        </label>
                        <button
                          onClick={() => clearAllModels(provider.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title="清除所有可用模型"
                        >
                          清除全部
                        </button>
                      </div>
                      
                      {provider.availableModels.length > 0 ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedAvailableModel[provider.id] || ''}
                            onChange={(e) => setSelectedAvailableModel(prev => ({
                              ...prev,
                              [provider.id]: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">请选择模型</option>
                            {provider.availableModels.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => addToSelectedModels(provider.id)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            添加
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded border-2 border-dashed border-gray-200">
                          暂无可用模型，请点击右上角的更新按钮获取模型列表
                        </div>
                      )}
                    </div>

                    {/* 已选模型列表 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          已选模型
                        </label>
                      </div>
                      
                      {provider.selectedModels.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded border-2 border-dashed border-gray-200">
                          暂无已选模型，请从上方可用模型中选择添加
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {provider.selectedModels.map((model, index) => (
                            <div key={index} className="flex items-center justify-between px-4 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                              <span className="flex-1 truncate font-medium">{model}</span>
                              <div className="flex items-center gap-3">
                                {/* 测试成功标志 */}
                                {(() => {
                                  const modelKey = `${provider.id}::${model}`;
                                  const testResult = modelTestResults[modelKey];
                                  if (testResult === 'success') {
                                    return (
                                      <span className="text-green-600 text-xl font-bold" title="测试成功">
                                        ✓
                                      </span>
                                    );
                                  } else if (testResult === 'error') {
                                    return (
                                      <span className="text-red-600 text-xl font-bold" title="测试失败">
                                        ✗
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {/* 测试按钮 - 更大 */}
                                <button
                                  onClick={() => testConnection(provider.id, model)}
                                  disabled={testingProvider === provider.id}
                                  className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 font-medium"
                                  title="测试此模型连接"
                                >
                                  {testingProvider === provider.id && testingModel === model ? '测试中...' : '测试'}
                                </button>
                                
                                {/* 删除按钮 - 更大 */}
                                <button
                                  onClick={() => removeFromSelectedModels(provider.id, index)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg"
                                  title="删除此模型"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {provider.customModels.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          自定义模型
                        </label>
                        <div className="space-y-2">
                          {provider.customModels.map((model, index) => (
                            <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border border-gray-200">
                              <span className="text-sm font-medium">{model}</span>
                              <div className="flex items-center gap-2">
                                {/* 测试成功标志 */}
                                {(() => {
                                  const modelKey = `${provider.id}::${model}`;
                                  const testResult = modelTestResults[modelKey];
                                  if (testResult === 'success') {
                                    return (
                                      <span className="text-green-600 text-lg font-bold" title="测试成功">
                                        ✓
                                      </span>
                                    );
                                  } else if (testResult === 'error') {
                                    return (
                                      <span className="text-red-600 text-lg font-bold" title="测试失败">
                                        ✗
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {/* 测试按钮 */}
                                <button
                                  onClick={() => testConnection(provider.id, model)}
                                  disabled={testingProvider === provider.id}
                                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 font-medium"
                                  title="测试此模型连接"
                                >
                                  {testingProvider === provider.id && testingModel === model ? '测试中...' : '测试'}
                                </button>
                                
                                {/* 删除按钮 */}
                                <button
                                  onClick={() => removeCustomModel(provider.id, index)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="删除此模型"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newModel}
                          onChange={(e) => setNewModel(e.target.value)}
                          placeholder="添加模型名称（自定义模型或手动添加的模型）"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomModel(provider.id, newModel);
                              setNewModel('');
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            addCustomModel(provider.id, newModel);
                            setNewModel('');
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                          title="添加模型"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addManualModel(provider.id, newModel)}
                          className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                          title="添加到内置模型列表"
                        >
                          添加到内置列表
                        </button>
                        <span className="text-xs text-gray-500">
                          添加到内置列表的模型会显示在"可用模型"区域
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 添加自定义提供商按钮 */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowAddProvider(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              <span>添加自定义提供商</span>
            </button>
          </div>

          {/* 添加自定义提供商表单 */}
          {showAddProvider && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800 mb-4">添加自定义提供商</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    提供商名称
                  </label>
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入提供商名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API 地址
                  </label>
                  <input
                    type="text"
                    value={newProvider.apiUrl}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, apiUrl: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API 密钥
                </label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="输入API密钥"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={addCustomProvider}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  添加提供商
                </button>
                <button
                  onClick={() => setShowAddProvider(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 模型选择器弹窗 */}
      {showModelSelector && (
        <ModelSelector
          providerId={showModelSelector}
          onSelect={(model) => testConnection(showModelSelector, model)}
          onClose={() => setShowModelSelector(null)}
        />
      )}
    </div>
  );
};

export default ModelSettings;