import React from 'react';
import { PageHeader } from './PageHeader';

interface PageLoaderProps {
  title: string;
}

/**
 * Consistent loading state for admin pages
 */
export function PageLoader({ title }: PageLoaderProps) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#F1E388] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
