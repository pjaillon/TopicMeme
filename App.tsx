
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchNewsForTopic } from './services/openaiService';
import { NewsFeed, LoadingState, Tab } from './types';
import NewsCard from './components/NewsCard';
import SkeletonLoader from './components/SkeletonLoader';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [inputTopic, setInputTopic] = useState('');

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || null, [tabs, activeTabId]);

  const createTab = useCallback(async (topic: string) => {
    const existingTab = tabs.find(t => t.topic.toLowerCase() === topic.toLowerCase());
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTabId = Math.random().toString(36).substring(7);
    const newTab: Tab = {
      id: newTabId,
      topic,
      feed: null,
      status: LoadingState.LOADING
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);

    try {
      const data = await fetchNewsForTopic(topic);
      setTabs(prev => prev.map(t => 
        t.id === newTabId ? { ...t, feed: data, status: LoadingState.IDLE } : t
      ));
    } catch (err) {
      console.error(err);
      setTabs(prev => prev.map(t => 
        t.id === newTabId ? { ...t, status: LoadingState.ERROR } : t
      ));
    }
  }, [tabs]);

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  useEffect(() => {
    if (tabs.length === 0) {
      createTab('Artificial Intelligence');
    }
  }, [createTab, tabs.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTopic.trim()) {
      createTab(inputTopic.trim());
      setInputTopic('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl shadow-sm">T</div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-100">
              TOPIC<span className="text-blue-600">MEME</span>
            </h1>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 max-w-lg">
            <div className="relative">
              <input
                type="text"
                placeholder="Deep search any topic..."
                className="w-full pl-4 pr-10 py-2.5 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm shadow-inner bg-slate-900 text-slate-100 placeholder:text-slate-500"
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-sky-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          <div className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              LIVE SYNTHESIS
            </div>
          </div>
        </div>
        
        <div className="bg-slate-950 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 flex items-end gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer border-t-4 border-x transition-all whitespace-nowrap ${
                  activeTabId === tab.id 
                    ? 'bg-slate-900 border-t-sky-500 border-x-slate-800 text-sky-300 font-black' 
                    : 'bg-slate-950 border-t-transparent border-x-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{tab.topic}</span>
                <button 
                  onClick={(e) => closeTab(e, tab.id)}
                  className="p-1 hover:bg-slate-800 rounded-full transition-colors opacity-60 hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {activeTab?.feed && (
          <div className="bg-sky-500/10 border-b border-slate-800 py-2">
            <div className="max-w-6xl mx-auto px-4 flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <span className="text-[9px] font-black text-sky-300 uppercase tracking-widest bg-sky-500/20 px-1.5 py-0.5 rounded">Deep Explore</span>
              <div className="flex gap-4 text-[11px] text-sky-300 font-semibold">
                {activeTab.feed.sidebar.trendingTopics.map((t, idx) => (
                  <button key={idx} onClick={() => createTab(t)} className="hover:text-sky-200 transition-colors">
                    #{t.replace(/\s+/g, '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!activeTab ? (
          <div className="text-center py-32">
            <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-300">Discover your next obsession</h2>
            <p className="text-sm text-slate-500 mt-2">Enter a niche topic in the search bar to generate a live news feed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="hidden lg:block lg:col-span-3 space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 pb-2">
                The River
              </h3>
              <div className="space-y-5">
                {activeTab.status === LoadingState.LOADING ? (
                  Array(10).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse flex flex-col gap-2">
                      <div className="h-2.5 bg-slate-800 rounded w-full"></div>
                      <div className="h-2 bg-slate-800/70 rounded w-1/3"></div>
                    </div>
                  ))
                ) : (
                  activeTab.feed?.riverOfNews.map((item, idx) => (
                    <div key={idx} className="group border-b border-slate-800 pb-3 last:border-0">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-slate-100 hover:text-sky-300 transition-colors leading-snug block mb-1">
                        {item.title}
                      </a>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{item.source}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="lg:col-span-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 pb-2 mb-6">
                Featured Highlights
              </h3>
              
              {activeTab.status === LoadingState.LOADING && <SkeletonLoader />}
              
              {activeTab.status === LoadingState.ERROR && (
                <div className="bg-red-950/40 text-red-200 p-6 rounded-lg border border-red-900 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-900/50 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="font-bold">Sync Failed</h4>
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed">The AI search engine encountered a hurdle while fetching the latest on <strong>{activeTab.topic}</strong>.</p>
                  <button 
                    onClick={() => createTab(activeTab.topic)} 
                    className="mt-6 w-full py-2 bg-red-600 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-red-500 transition-colors"
                  >
                    Try Resyncing
                  </button>
                </div>
              )}

              {activeTab.status === LoadingState.IDLE && activeTab.feed && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  {activeTab.feed.topStories.map((story) => (
                    <NewsCard key={story.id} story={story} />
                  ))}
                </div>
              )}
            </section>

            <section className="lg:col-span-3 space-y-8">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded shadow-sm">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 pb-2 mb-5">
                  Reference Points
                </h3>
                <ul className="space-y-4">
                  {activeTab.status === LoadingState.LOADING ? (
                    Array(5).fill(0).map((_, i) => <div key={i} className="h-3 bg-slate-800 rounded animate-pulse w-full"></div>)
                  ) : (
                    activeTab.feed?.sidebar.quickLinks.map((link, idx) => (
                      <li key={idx} className="group">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-slate-100 hover:text-sky-300 transition-colors leading-snug block">
                          {link.title}
                        </a>
                        <div className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-tighter">{link.source}</div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="p-6 rounded bg-slate-900 border border-slate-800 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 -mr-16 -mt-16 rounded-full opacity-50"></div>
                <h4 className="font-black text-sm uppercase tracking-widest text-slate-100 mb-3 relative z-10">AI Insights</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium relative z-10">
                  Currently indexing real-time reports for <span className="text-sky-300 font-bold">{activeTab.topic}</span>. 
                  Our engine prioritizes high-authority sources and removes noise to build this structured view.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800 relative z-10 flex items-center justify-between">
                   <span className="text-[9px] font-black text-slate-500 uppercase">Model</span>
                   <span className="text-[9px] font-black text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded">GPT-4o</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-800 mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
           <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-900 font-bold text-lg">T</div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-100">
                TOPIC<span className="text-blue-600">MEME</span>
              </h1>
            </div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
            Real-time News Aggregation via Generative Synthesis
          </p>
          <div className="mt-8 flex justify-center gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="hover:text-sky-300 cursor-pointer">Grounding API</span>
            <span className="hover:text-sky-300 cursor-pointer">Terms</span>
            <span className="hover:text-sky-300 cursor-pointer">AI Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
