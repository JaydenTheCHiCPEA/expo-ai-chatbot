import NextAuth from 'next-auth';
import { authConfig } from './app/(auth)/auth.config';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, extractTokenFromHeader } from "./lib/auth/token";

function applyCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith('/api');

  if (request.method === 'OPTIONS' && isApi) {
    return applyCors(request, new NextResponse(null, { status: 204 }));
  }

  // Public API endpoints used by the Expo app (no auth required)
  const publicApiPaths = [
    '/api/auth/register',
    '/api/token',
    '/api/chat-open',
    '/api/chat',
    '/api/history',
    '/api/files/upload',
  ];
  if (publicApiPaths.some((p) => pathname.startsWith(p))) {
    return applyCors(request, NextResponse.next());
  }

  // Allow requests authenticated with a Bearer token (Expo app)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return applyCors(request, NextResponse.next());
      }
    }
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = !userAgent.includes('Mozilla/');

  if (!isMobile) {
    // For web requests, let NextAuth handle it
    return NextAuth(authConfig).auth(request);
  }

  // Mobile-specific middleware ok
  if (
    pathname.startsWith('/api/chat-open')
  ) {
    return applyCors(request, NextResponse.next());
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};