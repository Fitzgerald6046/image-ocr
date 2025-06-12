import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, CheckCircle, XCircle, Loader, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';

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
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // 从localStorage加载配置
  useEffect(() => {
    const saved = localStorage.getItem('aiProviders');
    console.log('🔍 从localStorage加载配置:', saved);
    if (saved) {
      try {
        const savedProviders: AIProvider[] = JSON.parse(saved);
        console.log('📖 解析的配置数据:', savedProviders);
        setProviders(savedProviders);
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
    if (!modelName.trim()) return;
    
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

  const testConnection = async (providerId: string) => {
    setTestingProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider || !provider.apiKey || !provider.apiUrl) {
      alert('请先填写API密钥和API地址');
      setTestingProvider(null);
      return;
    }
    
    try {
      console.log('🧪 测试连接:', provider);
      
      // 调用后端测试API
      const response = await fetch('http://localhost:3001/api/models/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelConfig: {
            model: provider.models[0] || `${provider.id}-test`,
            apiKey: provider.apiKey,
            apiUrl: provider.apiUrl
          }
        })
      });
      
      const result = await response.json();
      console.log('🧪 测试结果:', result);
      
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, testStatus: result.success ? 'success' : 'error' }
          : p
      ));
      
      if (!result.success) {
        alert(`连接测试失败: ${result.message}`);
      } else {
        alert('连接测试成功！');
      }
      
    } catch (error) {
      console.error('❌ 测试连接失败:', error);
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, testStatus: 'error' }
          : p
      ));
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`连接测试失败: ${errorMessage}`);
    } finally {
      setTestingProvider(null);
    }
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
      expanded: true,
      testStatus: null
    };
    
    setProviders(prev => [...prev, customProvider]);
    setNewProvider({ name: '', apiUrl: '', apiKey: '', models: [] });
    setShowAddProvider(false);
  };

  const removeProvider = (providerId: string) => {
    setProviders(prev => prev.filter(p => p.id !== providerId));
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
                      {testingProvider === provider.id ? '测试中...' : '测试连接'}
                    </button>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
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
                          {provider.id.startsWith('custom') && '请提供完整的API测试地址，如 https://your-api.com/v1/models'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        可用模型
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {provider.models.map((model) => (
                          <div key={model} className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                            {model}
                          </div>
                        ))}
                      </div>
                    </div>

                    {provider.customModels.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          自定义模型
                        </label>
                        <div className="space-y-2">
                          {provider.customModels.map((model, index) => (
                            <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
                              <span className="text-sm">{model}</span>
                              <button
                                onClick={() => removeCustomModel(provider.id, index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        placeholder="添加自定义模型名称"
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
                      >
                        <Plus className="w-4 h-4" />
                      </button>
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
    </div>
  );
};

export default ModelSettings;