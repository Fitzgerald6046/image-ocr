import React, { useEffect } from 'react';
import { AppProvider, useAppContext, appActions } from './contexts/AppContext';
import MainPage from './components/pages/MainPage';
import ComparisonPage from './components/pages/ComparisonPage';
import ModelSettings from './model-settings';
import HistoryView from './components/layout/HistoryView';
import DebugInfo from './components/common/DebugInfo';
import { HistoryItem } from './utils/historyManager';
import { ThemeManager } from './utils/themeManager';

const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();

  // 添加调试日志
  useEffect(() => {
    console.log('🚀 前端应用已加载 - App.tsx');
    console.log('📋 当前应用状态:', state);
  }, []);

  // 初始化主题
  useEffect(() => {
    console.log('🎨 初始化主题管理器');
    ThemeManager.init();
  }, []);

  // 处理历史记录查看
  const handleViewHistoryResult = (item: HistoryItem) => {
    dispatch(appActions.setRecognitionResult({
      type: item.recognitionType,
      content: item.result.content,
      confidence: item.result.confidence,
      model: item.model,
      provider: item.provider,
      timestamp: new Date(item.timestamp).toISOString(),
      originalContent: item.result.originalContent,
      classification: item.result.classification,
      specialAnalysis: item.result.specialAnalysis
    }));
    dispatch(appActions.setCurrentView('main'));
  };

  // 不同视图的渲染
  if (state.currentView === 'settings') {
    return <ModelSettings onBack={() => dispatch(appActions.setCurrentView('main'))} />;
  }

  if (state.currentView === 'history') {
    return (
      <HistoryView
        onBack={() => dispatch(appActions.setCurrentView('main'))}
        onViewResult={handleViewHistoryResult}
      />
    );
  }

  if (state.currentView === 'comparison') {
    return <ComparisonPage />;
  }

  return (
    <>
      <MainPage />
      
      {/* 调试信息 */}
      <DebugInfo 
        uploadedImage={state.uploadedImage}
        selectedModel={state.selectedModel}
        isRecognizing={state.isRecognizing}
      />
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;