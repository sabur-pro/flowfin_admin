import { NextResponse, type NextRequest } from 'next/server';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'flowfin_admin';
const PUBLIC_PATHS = ['/login'];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(COOKIE);

  if (PUBLIC_PATHS.includes(pathname)) {
    return hasSession
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
