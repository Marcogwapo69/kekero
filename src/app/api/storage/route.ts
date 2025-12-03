import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for fetched content
const storage: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const { action, id, data } = await request.json();
    
    console.log('Storage API - Action:', action, 'ID:', id);

    if (action === 'store') {
      console.log('Storing data for ID:', id);
      storage[id] = data;
      console.log('Storage now has keys:', Object.keys(storage));
      return NextResponse.json({ success: true });
    } else if (action === 'retrieve') {
      console.log('Retrieving data for ID:', id);
      console.log('Available keys:', Object.keys(storage));
      const content = storage[id];
      console.log('Found content:', !!content);
      if (content) {
        return NextResponse.json({ success: true, data: content });
      } else {
        return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Storage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
