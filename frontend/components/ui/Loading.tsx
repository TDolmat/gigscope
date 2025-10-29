import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text 
}) => {
  const outerSizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  };

  const innerSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`animate-spin rounded-full border-violet-200 border-t-violet-600 ${outerSizes[size]}`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full animate-pulse ${innerSizes[size]}`}></div>
        </div>
      </div>
      {text && (
        <p className="text-gray-600 text-sm font-medium">{text}</p>
      )}
    </div>
  );
};
