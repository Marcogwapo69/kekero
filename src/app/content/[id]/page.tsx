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
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
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

  const copyUrl = () => {
    navigator.clipboard.writeText(data?.url || '');
    alert('URL copied to clipboard!');
  };

  const downloadContent = () => {
    if (!data) return;

    let content = data.content;
    let filename = 'content';
    let mimeType = 'text/plain';

    if (data.contentType?.includes('html')) {
      filename += '.html';
      mimeType = 'text/html';
    } else if (data.contentType?.includes('xml')) {
      filename += '.xml';
      mimeType = 'application/xml';
    } else if (data.contentType?.includes('json')) {
      filename += '.json';
      mimeType = 'application/json';
    } else {
      filename += '.txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(href);
  };

  const getFileExtension = () => {
    if (data?.contentType?.includes('html')) return '.html';
    if (data?.contentType?.includes('xml')) return '.xml';
    if (data?.contentType?.includes('json')) return '.json';
    return '.txt';
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block">
            ← Back
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium">No Content</p>
            <p className="text-red-600 mt-2">Failed to load content. Please try fetching again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex gap-2">
          <button
            onClick={copyUrl}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            title="Copy fetched URL to clipboard"
          >
            📋 Copy URL
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {data.contentType?.includes('html') && (
            <div className="w-full">
              <iframe
                srcDoc={data.content}
                className="w-full min-h-screen"
                title="Content Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          )}

          {!data.contentType?.includes('html') && (
            <div className="p-4 max-h-screen overflow-auto bg-gray-50">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {typeof data.displayContent === 'string'
                  ? data.displayContent
                  : JSON.stringify(data.displayContent, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
