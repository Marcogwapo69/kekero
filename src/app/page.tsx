'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContent } from './context/ContentContext';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setContent } = useContent();

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Fetching from:', url);
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      console.log('Fetched data:', data);

      if (!response.ok) {
        setError(data.error || 'Failed to fetch content');
        setLoading(false);
        return;
      }

      // Generate unique ID
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      console.log('Generated ID:', id);
      
      // Store on server
      const storeResponse = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'store', id, data }),
      });

      if (!storeResponse.ok) {
        throw new Error('Failed to store content');
      }

      console.log('Content stored on server');

      // Navigate to content page
      console.log('Navigating to /content/' + id);
      router.push(`/content/${id}`);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">API Content Fetcher</h1>
          <p className="text-gray-600">Paste a URL to see its content</p>
        </div>

        {/* Form */}
        <form onSubmit={handleFetch} className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Enter URL
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or https://api.example.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Fetch & Display'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
