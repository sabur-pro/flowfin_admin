import { NextResponse } from 'next/server';
import { env } from '@/infrastructure/config/env';

/**
 * Выход по протухшей сессии. Отдельный маршрут нужен, потому что куки можно
 * менять только в Route Handler или Server Action: страница, получившая 401,
 * сама убрать негодную куку не может, а оставить её нельзя — proxy увидит
 * её и отправит человека с формы входа обратно на защищённую страницу.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(env.sessionCookieName());
  return response;
}
