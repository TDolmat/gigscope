import React from 'react';

interface AdminSectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * Reusable white card section for admin pages
 */
export function AdminSection({ children, title, className = '' }: AdminSectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 ${className}`}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

