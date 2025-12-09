import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, glow = false }) => {
  return (
    <div 
      className={`
        bg-[#2B2E33] rounded-[1rem] border border-white/10 p-6
        ${hover ? 'card-hover' : ''} 
        ${glow ? 'card-glow' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
