
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Не задана переменная окружения ${name}. Смотрите admin/.env.example`,
    );
  }
  return value;
}

export const env = {
  apiBaseUrl: () => required('API_BASE_URL', 'http://localhost:3000'),
  sessionCookieName: () => process.env.SESSION_COOKIE_NAME ?? 'flowfin_admin',
  isProduction: () => process.env.NODE_ENV === 'production',
} as const;
