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
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
}

