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
        <div className={`animate-spin rounded-full border-[#F1E388]/20 border-t-[#F1E388] ${outerSizes[size]}`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-[#F1E388] rounded-full animate-pulse ${innerSizes[size]}`}></div>
        </div>
      </div>
      {text && (
        <p className="text-white/70 text-sm font-semibold">{text}</p>
      )}
    </div>
  );
};
