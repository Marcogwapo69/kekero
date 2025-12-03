import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Allow login page without authentication
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Check if the request is for a protected route
  if (pathname === '/' || pathname.startsWith('/content/') || pathname.startsWith('/api/')) {
    // Get the password from cookies or query params
    const cookiePassword = request.cookies.get('auth_password')?.value;
    const queryPassword = request.nextUrl.searchParams.get('pwd');
    const PASSWORD = process.env.NEXT_PUBLIC_PASSWORD || 'secret123';

    // Check if authenticated
    const isAuthenticated = cookiePassword === PASSWORD || queryPassword === PASSWORD;

    if (!isAuthenticated) {
      // If accessing API directly, return error
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // For UI routes, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If password was in query and correct, set cookie for future requests
    if (queryPassword === PASSWORD && cookiePassword !== PASSWORD) {
      const response = NextResponse.next();
      response.cookies.set('auth_password', PASSWORD, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/content/:path*', '/api/:path*'],
};
