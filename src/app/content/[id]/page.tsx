'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useContent } from '../../context/ContentContext';

interface ContentData {
  url: string;
  contentType: string;
  content: string;
  displayContent: string | object;
  contentLength: number;
  fetchedAt: string;
}

export default function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { getContent, setContent } = useContent();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        console.log('Content page loaded, retrieving ID:', id);
        
        // First try to get from context
        let stored = getContent(id);
        console.log('Retrieved from context:', stored);
        
        // If not in context, fetch from server storage
        if (!stored) {
          console.log('Fetching from server storage...');
          const response = await fetch('/api/storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'retrieve', id }),
          });

          if (response.ok) {
            const result = await response.json();
            stored = result.data;
            console.log('Retrieved from server:', stored);
            // Also restore to context for this session
            if (stored) {
              setContent(id, stored);
            }
          } else {
            console.error('Failed to retrieve from server');
          }
        }
        
        if (stored) {
          setData(stored);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching params:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params, getContent, setContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <iframe
        src={data.url}
        className="w-full h-full border-0"
        title="Website"
        allow="geolocation; microphone; camera; payment; usb"
      />
    </div>
  );
}
