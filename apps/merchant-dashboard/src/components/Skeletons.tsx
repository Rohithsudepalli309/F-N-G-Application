import React from 'react';

const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
    </div>
    <div className="w-20 h-8 bg-gray-200 rounded"></div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 animate-pulse"></div>
      ))}
    </div>
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
      {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
    </div>
  </div>
);