import React, { useState, useRef } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    // Delay hiding to allow moving to tooltip
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-help">
        {children || (
          <Info className="w-4 h-4 text-[#F1E388]/70 hover:text-[#F1E388] transition-colors" />
        )}
      </div>
      
      {isVisible && (
        <div 
          className={`absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-4 py-3 bg-[#2B2E33] text-white text-xs rounded-[0.75rem] shadow-xl border border-white/10 max-w-md w-max animate-fadeIn ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#2B2E33]"></div>
        </div>
      )}
    </div>
  );
};
