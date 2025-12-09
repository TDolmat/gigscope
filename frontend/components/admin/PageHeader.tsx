import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

/**
 * Consistent page header for admin pages
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className={description ? 'mb-4 sm:mb-6' : ''}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-white/50">{description}</p>
      )}
    </div>
  );
}
