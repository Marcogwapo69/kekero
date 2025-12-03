'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ContentData {
  url: string;
  contentType: string;
  content: string;
  displayContent: string | object;
  contentLength: number;
  fetchedAt: string;
}

interface ContentContextType {
  contentMap: Record<string, ContentData>;
  setContent: (id: string, data: ContentData) => void;
  getContent: (id: string) => ContentData | null;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [contentMap, setContentMap] = useState<Record<string, ContentData>>({});

  const setContent = (id: string, data: ContentData) => {
    setContentMap(prev => ({ ...prev, [id]: data }));
  };

  const getContent = (id: string) => {
    return contentMap[id] || null;
  };

  return (
    <ContentContext.Provider value={{ contentMap, setContent, getContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
}
