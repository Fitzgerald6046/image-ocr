import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../utils/themeManager';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className={sizeClasses[size]} />;
      case 'dark':
        return <Moon className={sizeClasses[size]} />;
      case 'system':
        return <Monitor className={sizeClasses[size]} />;
      default:
        return <Sun className={sizeClasses[size]} />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return '亮色模式';
      case 'dark':
        return '暗色模式';
      case 'system':
        return '跟随系统';
      default:
        return '亮色模式';
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return '当前: 亮色模式，点击切换到暗色模式';
      case 'dark':
        return '当前: 暗色模式，点击切换到跟随系统';
      case 'system':
        return '当前: 跟随系统，点击切换到亮色模式';
      default:
        return '切换主题';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      title={getTooltip()}
      className={`
        ${buttonSizeClasses[size]} 
        rounded-lg 
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 
        text-gray-600 dark:text-gray-400 
        hover:text-gray-900 dark:hover:text-white 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        transition-all duration-200 
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        {showLabel && (
          <span className="text-sm font-medium">
            {getLabel()}
          </span>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;