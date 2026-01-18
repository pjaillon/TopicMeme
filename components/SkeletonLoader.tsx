
import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="animate-pulse space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-sm">
          <div className="h-6 bg-slate-800 rounded w-3/4 mb-4"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-slate-800/80 rounded"></div>
            <div className="h-4 bg-slate-800/80 rounded w-5/6"></div>
          </div>
          <div className="pl-4 border-l-2 border-slate-800 space-y-3">
            <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
            <div className="h-3 bg-slate-800/60 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
