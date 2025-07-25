import React, { useState } from 'react';
import { 
  Book, 
  Upload, 
  Settings, 
  BarChart3, 
  History, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  Camera,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Clock,
  Award,
  Users,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface UserGuideProps {
  onBack?: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const UserGuide: React.FC<UserGuideProps> = ({ onBack }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
  const [activeTab, setActiveTab] = useState('overview');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const tabs = [
    { id: 'overview', label: '系统概览', icon: <Info className="w-4 h-4" /> },
    { id: 'features', label: '功能特性', icon: <Zap className="w-4 h-4" /> },
    { id: 'tutorial', label: '使用教程', icon: <Book className="w-4 h-4" /> },
    { id: 'tips', label: '技巧提示', icon: <Award className="w-4 h-4" /> }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 系统介绍 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">智能图片识别系统</h3>
            <p className="text-sm text-gray-600">支持多种AI模型的专业图像识别平台</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          本系统集成了Gemini、GPT-4、Claude、DeepSeek等多种顶级AI模型，提供高精度的图像识别服务。
          支持古籍文献、票据发票、证件识别、表格分析、手写文字等多种专业场景，
          同时具备多模型对比、批量处理、历史记录等高级功能。
        </p>
      </div>

      {/* 核心特性 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: <BarChart3 className="w-6 h-6 text-purple-600" />, title: '多模型对比', desc: '同时使用多个AI模型识别，对比准确率和速度' },
          { icon: <FolderOpen className="w-6 h-6 text-green-600" />, title: '批量处理', desc: '支持批量上传和识别，提高工作效率' },
          { icon: <History className="w-6 h-6 text-blue-600" />, title: '历史记录', desc: '自动保存识别历史，支持搜索和导出' },
          { icon: <Settings className="w-6 h-6 text-orange-600" />, title: '模型配置', desc: '灵活配置API密钥，支持自定义模型' },
          { icon: <Shield className="w-6 h-6 text-red-600" />, title: '数据安全', desc: '本地处理，保护您的隐私数据' },
          { icon: <Globe className="w-6 h-6 text-indigo-600" />, title: '多语言支持', desc: '支持中文、英文等多种语言识别' }
        ].map((feature, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              {feature.icon}
              <h4 className="font-medium text-gray-800">{feature.title}</h4>
            </div>
            <p className="text-sm text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* 技术架构 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">技术架构</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">前端技术</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• React 18 + TypeScript</li>
              <li>• Tailwind CSS 响应式设计</li>
              <li>• Vite 构建工具</li>
              <li>• 组件化架构</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">后端技术</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Node.js Express 服务器</li>
              <li>• REST API 接口</li>
              <li>• 多AI模型集成</li>
              <li>• 文件上传处理</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      {/* 功能模块 */}
      {[
        {
          title: '单图识别',
          icon: <Upload className="w-5 h-5 text-blue-600" />,
          features: [
            '支持JPG、PNG、WebP等多种格式',
            '自动图片压缩优化',
            '智能识别类型检测',
            '实时识别进度显示',
            '高精度文字提取',
            '置信度评分'
          ]
        },
        {
          title: '多模型对比',
          icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
          features: [
            '同时使用多个AI模型',
            '速度和准确率对比',
            '智能推荐最佳模型',
            '详细性能分析',
            '对比结果导出',
            '可视化数据展示'
          ]
        },
        {
          title: '批量处理',
          icon: <FolderOpen className="w-5 h-5 text-green-600" />,
          features: [
            '支持批量文件上传',
            '并行识别处理',
            '进度实时监控',
            '失败重试机制',
            '批量结果导出',
            '错误统计分析'
          ]
        },
        {
          title: '历史管理',
          icon: <History className="w-5 h-5 text-indigo-600" />,
          features: [
            '自动保存识别记录',
            '按时间、类型筛选',
            '关键词搜索',
            '标签分类管理',
            '批量导出功能',
            '数据统计报告'
          ]
        }
      ].map((module, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {module.icon}
              <h3 className="text-lg font-semibold text-gray-800">{module.title}</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {module.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTutorial = () => (
    <div className="space-y-6">
      {/* 快速开始 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-600" />
          快速开始
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: '配置模型', desc: '设置AI模型API密钥' },
            { step: '2', title: '上传图片', desc: '选择要识别的图片' },
            { step: '3', title: '选择类型', desc: '选择识别类型' },
            { step: '4', title: '开始识别', desc: '获取识别结果' }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-semibold">{item.step}</span>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 详细教程 */}
      <div className="space-y-4">
        {[
          {
            id: 'getting-started',
            title: '🚀 快速上手指南',
            icon: <Zap className="w-5 h-5 text-green-600" />,
            content: (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">第一步：配置AI模型</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>点击右上角的"设置"按钮</li>
                    <li>选择要使用的AI提供商（如Gemini、OpenAI等）</li>
                    <li>输入对应的API密钥和API地址</li>
                    <li>点击"测试连接"验证配置</li>
                    <li>返回主页面开始使用</li>
                  </ol>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">第二步：开始识别</h4>
                  <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                    <li>在主页面点击或拖拽上传图片</li>
                    <li>选择合适的AI模型</li>
                    <li>选择识别类型（智能检测、古籍文献等）</li>
                    <li>点击"开始识别"按钮</li>
                    <li>等待识别完成，查看结果</li>
                  </ol>
                </div>
              </div>
            )
          },
          {
            id: 'model-comparison',
            title: '📊 多模型对比使用',
            icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
            content: (
              <div className="space-y-4">
                <p className="text-gray-700">多模型对比功能让您可以同时使用多个AI模型识别同一张图片，对比它们的表现：</p>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">使用步骤：</h4>
                  <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                    <li>点击顶部的"模型对比"按钮</li>
                    <li>上传要识别的图片</li>
                    <li>选择多个AI模型（建议2-4个）</li>
                    <li>选择识别类型</li>
                    <li>点击"开始对比"</li>
                    <li>查看对比结果和性能分析</li>
                  </ol>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-800 mb-2">对比指标</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 识别准确率（置信度）</li>
                      <li>• 处理速度（响应时间）</li>
                      <li>• 内容完整性</li>
                      <li>• 特殊功能支持</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-800 mb-2">智能推荐</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 最快模型（速度优先）</li>
                      <li>• 最准确模型（精度优先）</li>
                      <li>• 综合推荐（平衡考虑）</li>
                      <li>• 成本效益分析</li>
                    </ul>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'batch-processing',
            title: '📁 批量处理功能',
            icon: <FolderOpen className="w-5 h-5 text-green-600" />,
            content: (
              <div className="space-y-4">
                <p className="text-gray-700">批量处理功能适合处理大量图片，提高工作效率：</p>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">批量处理步骤：</h4>
                  <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                    <li>在主页面选择AI模型</li>
                    <li>点击"批量处理"按钮</li>
                    <li>拖拽或选择多个图片文件</li>
                    <li>设置识别类型</li>
                    <li>点击"开始批量识别"</li>
                    <li>监控处理进度</li>
                    <li>下载批量结果</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-yellow-800 mb-1">注意事项</h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• 批量处理采用串行方式，避免API限制</li>
                        <li>• 支持暂停和恢复功能</li>
                        <li>• 单个文件失败不影响整体进度</li>
                        <li>• 建议单次处理不超过50张图片</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'recognition-types',
            title: '🎯 识别类型说明',
            icon: <Camera className="w-5 h-5 text-blue-600" />,
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      type: '🤖 智能检测', 
                      desc: '自动判断图片内容类型，选择最适合的识别策略',
                      scenarios: ['混合内容', '不确定类型', '快速识别'] 
                    },
                    { 
                      type: '📜 古籍文献', 
                      desc: '专门优化的古代文字识别，支持繁体字和古体字',
                      scenarios: ['古代书籍', '书法作品', '历史文献'] 
                    },
                    { 
                      type: '🧾 票据发票', 
                      desc: '结构化识别票据信息，提取关键字段',
                      scenarios: ['发票', '收据', '账单', '报销单'] 
                    },
                    { 
                      type: '📄 文档资料', 
                      desc: '通用文字识别，适合印刷体和清晰文本',
                      scenarios: ['合同', '报告', '书籍', '杂志'] 
                    },
                    { 
                      type: '🆔 证件识别', 
                      desc: '专门识别证件信息，提取关键身份数据',
                      scenarios: ['身份证', '护照', '驾照', '营业执照'] 
                    },
                    { 
                      type: '📊 表格图表', 
                      desc: '识别表格结构和数据，支持复杂表格',
                      scenarios: ['数据表', '统计图', '财务报表'] 
                    },
                    { 
                      type: '✍️ 手写文字', 
                      desc: '识别手写内容，支持多种字体风格',
                      scenarios: ['手写笔记', '签名', '手写表单'] 
                    },
                    { 
                      type: '🎨 AI提示词', 
                      desc: '生成AI绘画提示词，描述图片内容和风格',
                      scenarios: ['艺术创作', '设计参考', '风格分析'] 
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-gray-800 mb-2">{item.type}</h5>
                      <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
                      <div>
                        <h6 className="text-xs font-medium text-gray-700 mb-1">适用场景：</h6>
                        <div className="flex flex-wrap gap-1">
                          {item.scenarios.map((scenario, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                              {scenario}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        ].map((section) => (
          <div key={section.id} className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {section.icon}
                <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
              </div>
              {expandedSections.has(section.id) ? 
                <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                <ChevronRight className="w-5 h-5 text-gray-400" />
              }
            </button>
            {expandedSections.has(section.id) && (
              <div className="px-4 pb-4 border-t border-gray-100">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTips = () => (
    <div className="space-y-6">
      {/* 最佳实践 */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          最佳实践建议
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: '图片质量', tips: ['使用高分辨率图片', '确保光线充足', '避免模糊和倾斜', '裁剪掉无关内容'] },
            { title: '模型选择', tips: ['根据内容类型选择', '考虑速度和精度平衡', '多模型对比验证', '关注API成本'] },
            { title: '批量处理', tips: ['合理控制批量大小', '使用相同识别类型', '监控处理进度', '及时处理错误'] },
            { title: '结果优化', tips: ['检查置信度评分', '人工校验重要内容', '保存有用的结果', '定期清理历史'] }
          ].map((category, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-amber-200">
              <h4 className="font-medium text-gray-800 mb-2">{category.title}</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {category.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 问题排查 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">常见问题解决</h3>
        {[
          {
            question: '为什么无法上传图片？',
            answer: [
              '检查图片格式是否支持（JPG、PNG、WebP、GIF、BMP、TIFF）',
              '确认图片大小不超过20MB',
              '检查网络连接是否正常',
              '尝试刷新页面重新上传'
            ]
          },
          {
            question: '识别结果不准确怎么办？',
            answer: [
              '尝试选择更适合的识别类型',
              '使用多模型对比功能验证',
              '检查图片质量和清晰度',
              '考虑使用不同的AI模型'
            ]
          },
          {
            question: 'API连接失败如何解决？',
            answer: [
              '检查API密钥是否正确',
              '确认API地址格式正确',
              '验证账户余额是否充足',
              '查看API提供商状态'
            ]
          },
          {
            question: '批量处理中断怎么处理？',
            answer: [
              '使用暂停/恢复功能控制进度',
              '检查网络连接稳定性',
              '减少单次处理的文件数量',
              '查看错误日志定位问题'
            ]
          }
        ].map((faq, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              {faq.question}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-6">
              {faq.answer.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 快捷键 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'Ctrl + U', desc: '打开文件选择器' },
            { key: 'Ctrl + Enter', desc: '开始识别' },
            { key: 'Ctrl + S', desc: '保存识别结果' },
            { key: 'Ctrl + H', desc: '打开历史记录' },
            { key: 'Ctrl + ,', desc: '打开设置' },
            { key: 'Esc', desc: '关闭当前对话框' }
          ].map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">{shortcut.desc}</span>
              <kbd className="px-2 py-1 bg-gray-200 text-xs text-gray-700 rounded font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'features': return renderFeatures();
      case 'tutorial': return renderTutorial();
      case 'tips': return renderTips();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 顶部标题栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-blue-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">使用说明</h1>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">详细的功能介绍和使用指南</p>
              </div>
            </div>
            
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回主页</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-6xl mx-auto px-4 py-4 md:py-8">
        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="mb-8">
          {renderContent()}
        </div>

        {/* 底部信息 */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">需要更多帮助？</h3>
            <p className="text-gray-600 mb-4">
              如果您在使用过程中遇到问题，或有功能建议，欢迎联系我们。
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="#" className="text-blue-600 hover:text-blue-800 underline">技术支持</a>
              <a href="#" className="text-blue-600 hover:text-blue-800 underline">功能建议</a>
              <a href="#" className="text-blue-600 hover:text-blue-800 underline">更新日志</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserGuide;