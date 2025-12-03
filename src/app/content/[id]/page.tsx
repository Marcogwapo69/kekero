'use client';

import { useState, useEffect, useRef } from 'react';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = (iframe: HTMLIFrameElement) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Find all links in the iframe
      const links = iframeDoc.querySelectorAll('a');
      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('gcash://') || href.startsWith('whatsapp://') || href.startsWith('sms://') || href.startsWith('tel://'))) {
          // Override click event for custom schemes
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(href, '_blank');
          });
        }
      });

      // Also intercept onclick attributes
      const elementsWithOnClick = iframeDoc.querySelectorAll('[onclick]');
      elementsWithOnClick.forEach((element) => {
        const onclick = element.getAttribute('onclick');
        if (onclick && (onclick.includes('gcash://') || onclick.includes('whatsapp://') || onclick.includes('sms://') || onclick.includes('tel://'))) {
          element.addEventListener('click', (e) => {
            e.preventDefault();
            const match = onclick.match(/(['"`])(.*?)\1/);
            if (match) {
              window.open(match[2], '_blank');
            }
          });
        }
      });
    } catch (err) {
      console.log('Cannot access iframe content (cross-origin):', err);
    }
  };

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

  useEffect(() => {
    fetchData();
  }, [params, getContent, setContent]);

  useEffect(() => {
    const ref = iframeRef.current;
    if (ref) {
      ref.addEventListener('load', () => handleIframeLoad(ref));
    }
    return () => {
      if (ref) {
        ref.removeEventListener('load', () => handleIframeLoad(ref));
      }
    };
  }, []);

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
        srcDoc={data.content}
        className="w-full h-full border-0"
        title="Website"
        allow="geolocation; microphone; camera; payment; usb"
        onLoad={(e) => {
          try {
            const iframe = e.currentTarget as HTMLIFrameElement;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
              // Inject script to handle custom schemes
              const script = doc.createElement('script');
              script.textContent = `
                document.addEventListener('click', function(e) {
                  const link = e.target.closest('a');
                  if (link) {
                    const href = link.getAttribute('href');
                    if (href && (href.startsWith('gcash://') || href.startsWith('whatsapp://') || href.startsWith('sms://') || href.startsWith('tel://'))) {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(href, '_blank');
                    }
                  }
                }, true);
              `;
              doc.head.appendChild(script);
            }
          } catch (err) {
            console.log('Cannot modify iframe:', err);
          }
        }}
      />
    </div>
  );
}
