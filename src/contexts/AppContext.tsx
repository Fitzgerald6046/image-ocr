import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ApiError } from '../utils/errorHandler';

export interface UploadedImageInfo {
  file: File;
  fileId: string;
  url: string;
  metadata: any;
}

export interface UploadStatus {
  isUploading: boolean;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: ApiError;
}

export interface RecognitionResult {
  type: string;
  content: string;
  confidence: number;
  model: string;
  provider?: string;
  timestamp?: string;
  originalContent?: string;
  classification?: {
    detectedType: string;
    confidence: number;
    reasoning: string;
    suggestedOptions: Array<{
      key: string;
      label: string;
      default: boolean;
    }>;
  };
  specialAnalysis?: any;
}

export interface AppState {
  currentView: 'main' | 'comparison' | 'settings' | 'history' | 'guide';
  uploadedImage: UploadedImageInfo | null;
  selectedModel: string;
  recognitionType: string;
  recognitionResult: RecognitionResult | null;
  isRecognizing: boolean;
  uploadStatus: UploadStatus;
  error: ApiError | null;
  batchFiles: any[];
  showExportDialog: boolean;
  exportItems: any[];
  showBatchSection: boolean;
}

type AppAction =
  | { type: 'SET_CURRENT_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_UPLOADED_IMAGE'; payload: UploadedImageInfo | null }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_RECOGNITION_TYPE'; payload: string }
  | { type: 'SET_RECOGNITION_RESULT'; payload: RecognitionResult | null }
  | { type: 'SET_IS_RECOGNIZING'; payload: boolean }
  | { type: 'SET_UPLOAD_STATUS'; payload: UploadStatus }
  | { type: 'SET_ERROR'; payload: ApiError | null }
  | { type: 'SET_BATCH_FILES'; payload: any[] }
  | { type: 'SET_SHOW_EXPORT_DIALOG'; payload: boolean }
  | { type: 'SET_EXPORT_ITEMS'; payload: any[] }
  | { type: 'SET_SHOW_BATCH_SECTION'; payload: boolean }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  currentView: 'main',
  uploadedImage: null,
  selectedModel: '',
  recognitionType: 'auto',
  recognitionResult: null,
  isRecognizing: false,
  uploadStatus: {
    isUploading: false,
    progress: 0,
    status: 'completed'
  },
  error: null,
  batchFiles: [],
  showExportDialog: false,
  exportItems: [],
  showBatchSection: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_UPLOADED_IMAGE':
      return { ...state, uploadedImage: action.payload };
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload };
    case 'SET_RECOGNITION_TYPE':
      return { ...state, recognitionType: action.payload };
    case 'SET_RECOGNITION_RESULT':
      return { ...state, recognitionResult: action.payload };
    case 'SET_IS_RECOGNIZING':
      return { ...state, isRecognizing: action.payload };
    case 'SET_UPLOAD_STATUS':
      return { ...state, uploadStatus: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_BATCH_FILES':
      return { ...state, batchFiles: action.payload };
    case 'SET_SHOW_EXPORT_DIALOG':
      return { ...state, showExportDialog: action.payload };
    case 'SET_EXPORT_ITEMS':
      return { ...state, exportItems: action.payload };
    case 'SET_SHOW_BATCH_SECTION':
      return { ...state, showBatchSection: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// 便捷的action creators
export const appActions = {
  setCurrentView: (view: AppState['currentView']) => 
    ({ type: 'SET_CURRENT_VIEW' as const, payload: view }),
  setUploadedImage: (image: UploadedImageInfo | null) => 
    ({ type: 'SET_UPLOADED_IMAGE' as const, payload: image }),
  setSelectedModel: (model: string) => 
    ({ type: 'SET_SELECTED_MODEL' as const, payload: model }),
  setRecognitionType: (type: string) => 
    ({ type: 'SET_RECOGNITION_TYPE' as const, payload: type }),
  setRecognitionResult: (result: RecognitionResult | null) => 
    ({ type: 'SET_RECOGNITION_RESULT' as const, payload: result }),
  setIsRecognizing: (isRecognizing: boolean) => 
    ({ type: 'SET_IS_RECOGNIZING' as const, payload: isRecognizing }),
  setUploadStatus: (status: UploadStatus) => 
    ({ type: 'SET_UPLOAD_STATUS' as const, payload: status }),
  setError: (error: ApiError | null) => 
    ({ type: 'SET_ERROR' as const, payload: error }),
  setBatchFiles: (files: any[]) => 
    ({ type: 'SET_BATCH_FILES' as const, payload: files }),
  setShowExportDialog: (show: boolean) => 
    ({ type: 'SET_SHOW_EXPORT_DIALOG' as const, payload: show }),
  setExportItems: (items: any[]) => 
    ({ type: 'SET_EXPORT_ITEMS' as const, payload: items }),
  setShowBatchSection: (show: boolean) => 
    ({ type: 'SET_SHOW_BATCH_SECTION' as const, payload: show }),
  resetState: () => 
    ({ type: 'RESET_STATE' as const })
};