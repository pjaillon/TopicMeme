
import React from 'react';
import { NewsStory } from '../types';

interface NewsCardProps {
  story: NewsStory;
}

const NewsCard: React.FC<NewsCardProps> = ({ story }) => {
  return (
    <div className="news-card p-5 mb-6 shadow-sm rounded-sm transition-all hover:border-sky-500/40">
      <div className="mb-2">
        <h2 className="text-xl font-bold leading-tight group">
          <a href={story.url} target="_blank" rel="noopener noreferrer" className="news-link inline-flex items-center gap-1">
            {story.title}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </h2>
        <div className="flex items-center text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">{story.source}</span>
          <span className="mx-2 text-slate-700">•</span>
          <span>{story.timestamp}</span>
          <span className="ml-auto flex items-center gap-1 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            Grounded
          </span>
        </div>
      </div>
      
      <p className="text-[15px] text-slate-200 serif leading-relaxed mb-4 mt-3">
        {story.summary}
      </p>

      {story.relatedSources.length > 0 && (
        <div className="pl-4 border-l-2 border-sky-500/20 space-y-3 bg-slate-900/60 p-3 rounded-r-sm">
          {story.relatedSources.map((rel, idx) => (
            <div key={idx} className="text-xs">
              <div className="font-semibold">
                <a href={rel.url} target="_blank" rel="noopener noreferrer" className="news-link flex items-center gap-1">
                  {rel.title}
                </a>
              </div>
              <div className="flex items-center text-slate-500 mt-0.5 italic">
                <span className="font-bold uppercase text-[9px] tracking-tighter mr-1">{rel.source}</span>
                {rel.snippet && (
                  <>
                    <span className="mx-1 opacity-50">•</span>
                    <span className="line-clamp-1 opacity-80">{rel.snippet}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsCard;
