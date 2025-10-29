import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
};
