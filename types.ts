
export interface RelatedSource {
  title: string;
  source: string;
  url: string;
  snippet?: string;
}

export interface NewsStory {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  timestamp: string;
  relatedSources: RelatedSource[];
}

export interface SidebarItem {
  title: string;
  url: string;
  source: string;
}

export interface NewsFeed {
  topic: string;
  topStories: NewsStory[];
  riverOfNews: RelatedSource[];
  sidebar: {
    quickLinks: SidebarItem[];
    trendingTopics: string[];
  };
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}

export interface Tab {
  id: string;
  topic: string;
  feed: NewsFeed | null;
  status: LoadingState;
}
