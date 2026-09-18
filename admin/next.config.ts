import type { NextConfig } from 'next';

const allowedOrigins = (process.env.ADMIN_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const config: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    ...(allowedOrigins.length > 0 ? { serverActions: { allowedOrigins } } : {}),
  },
};

export default config;
