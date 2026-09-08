import type { NextConfig } from 'next';

/**
 * Домены, с которых Next примет Server Action. За обратным прокси заголовок
 * Origin приходит от браузера, а Host — от прокси; если они разойдутся, форма
 * входа молча перестанет работать. Список задаётся через ADMIN_ALLOWED_ORIGINS
 * (через запятую), чтобы домен не был зашит в образ.
 */
const allowedOrigins = (process.env.ADMIN_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Админка ходит в API только на сервере, поэтому API_BASE_URL остаётся
// серверной переменной без префикса NEXT_PUBLIC и не попадает в бандл.
const config: NextConfig = {
  reactStrictMode: true,
  // Самодостаточная сборка: в образ уезжает только нужный кусок node_modules.
  output: 'standalone',
  experimental: {
    ...(allowedOrigins.length > 0 ? { serverActions: { allowedOrigins } } : {}),
  },
};

export default config;
