/**
 * 主题管理器
 * 负责处理亮色/暗色主题切换
 */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  systemTheme?: 'light' | 'dark';
}

export class ThemeManager {
  private static readonly STORAGE_KEY = 'app_theme';
  private static readonly DARK_CLASS = 'dark';
  private static listeners: ((theme: Theme) => void)[] = [];

  /**
   * 初始化主题
   */
  static init(): void {
    const savedTheme = this.getStoredTheme();
    const systemTheme = this.getSystemTheme();
    
    this.applyTheme(savedTheme, systemTheme);
    this.setupSystemThemeListener();
  }

  /**
   * 获取当前主题
   */
  static getCurrentTheme(): Theme {
    return this.getStoredTheme();
  }

  /**
   * 设置主题
   */
  static setTheme(theme: Theme): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
    const systemTheme = this.getSystemTheme();
    this.applyTheme(theme, systemTheme);
    this.notifyListeners(theme);
  }

  /**
   * 切换主题
   */
  static toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const nextTheme = this.getNextTheme(currentTheme);
    this.setTheme(nextTheme);
  }

  /**
   * 获取系统主题
   */
  static getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 获取实际应用的主题
   */
  static getAppliedTheme(): 'light' | 'dark' {
    const theme = this.getCurrentTheme();
    if (theme === 'system') {
      return this.getSystemTheme();
    }
    return theme;
  }

  /**
   * 检查当前是否为暗色主题
   */
  static isDarkMode(): boolean {
    return this.getAppliedTheme() === 'dark';
  }

  /**
   * 添加主题变化监听器
   */
  static addListener(listener: (theme: Theme) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除主题变化监听器
   */
  static removeListener(listener: (theme: Theme) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取主题配置
   */
  static getThemeConfig(): ThemeConfig {
    return {
      theme: this.getCurrentTheme(),
      systemTheme: this.getSystemTheme()
    };
  }

  /**
   * 获取主题CSS变量
   */
  static getThemeVariables(): Record<string, string> {
    const isDark = this.isDarkMode();
    
    return {
      '--bg-primary': isDark ? '#1a1a1a' : '#ffffff',
      '--bg-secondary': isDark ? '#2a2a2a' : '#f8f9fa',
      '--bg-tertiary': isDark ? '#3a3a3a' : '#e9ecef',
      '--text-primary': isDark ? '#ffffff' : '#1a1a1a',
      '--text-secondary': isDark ? '#d1d5db' : '#6b7280',
      '--text-tertiary': isDark ? '#9ca3af' : '#9ca3af',
      '--border-primary': isDark ? '#374151' : '#e5e7eb',
      '--border-secondary': isDark ? '#4b5563' : '#d1d5db',
      '--accent-primary': isDark ? '#3b82f6' : '#2563eb',
      '--accent-secondary': isDark ? '#1e40af' : '#1d4ed8',
      '--success': isDark ? '#10b981' : '#059669',
      '--warning': isDark ? '#f59e0b' : '#d97706',
      '--error': isDark ? '#ef4444' : '#dc2626',
      '--shadow-sm': isDark ? '0 1px 2px rgba(0, 0, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
      '--shadow-md': isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': isDark ? '0 10px 15px rgba(0, 0, 0, 0.3)' : '0 10px 15px rgba(0, 0, 0, 0.1)'
    };
  }

  /**
   * 应用主题CSS变量
   */
  static applyThemeVariables(): void {
    const variables = this.getThemeVariables();
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }

  /**
   * 获取存储的主题
   */
  private static getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system'; // 默认跟随系统
  }

  /**
   * 应用主题
   */
  private static applyTheme(theme: Theme, systemTheme: 'light' | 'dark'): void {
    const root = document.documentElement;
    const shouldUseDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
    
    if (shouldUseDark) {
      root.classList.add(this.DARK_CLASS);
    } else {
      root.classList.remove(this.DARK_CLASS);
    }

    // 应用CSS变量
    this.applyThemeVariables();
    
    // 更新meta标签
    this.updateMetaTheme(shouldUseDark);
  }

  /**
   * 更新meta主题标签
   */
  private static updateMetaTheme(isDark: boolean): void {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#1a1a1a' : '#ffffff');
    }
  }

  /**
   * 获取下一个主题
   */
  private static getNextTheme(currentTheme: Theme): Theme {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    return themeOrder[nextIndex];
  }

  /**
   * 设置系统主题监听器
   */
  private static setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const currentTheme = this.getCurrentTheme();
      if (currentTheme === 'system') {
        this.applyTheme('system', e.matches ? 'dark' : 'light');
        this.notifyListeners('system');
      }
    };

    // 现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleSystemThemeChange);
    }
  }

  /**
   * 通知监听器
   */
  private static notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
}

/**
 * React Hook for theme management
 */
export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(ThemeManager.getCurrentTheme());
  const [isDark, setIsDark] = React.useState(ThemeManager.isDarkMode());

  React.useEffect(() => {
    const handleThemeChange = (newTheme: Theme) => {
      setTheme(newTheme);
      setIsDark(ThemeManager.isDarkMode());
    };

    ThemeManager.addListener(handleThemeChange);
    
    return () => {
      ThemeManager.removeListener(handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    ThemeManager.toggleTheme();
  };

  const setThemeMode = (newTheme: Theme) => {
    ThemeManager.setTheme(newTheme);
  };

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme: setThemeMode,
    systemTheme: ThemeManager.getSystemTheme()
  };
}

// 需要在文件顶部添加React导入
import React from 'react';