import React from 'react';

interface AdminSectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * Reusable card section for admin pages
 */
export function AdminSection({ children, title, className = '' }: AdminSectionProps) {
  return (
    <div className={`bg-[#2B2E33] rounded-[1rem] border border-white/10 p-4 sm:p-6 ${className}`}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
