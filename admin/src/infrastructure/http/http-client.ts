import { env } from '../config/env';
import { ApiError } from './api-error';

export interface HttpClientOptions {
  readonly baseUrl?: string;
  readonly accessToken?: string;
}

type Query = Record<string, string | number | undefined>;

/**
 * Тонкая обёртка над fetch: заголовки, разбор ошибок API и сборка query.
 * Ничего не знает о доменных типах — их накладывает шлюз выше.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly accessToken?: string;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? env.apiBaseUrl()).replace(/\/+$/, '');
    this.accessToken = options.accessToken;
  }

  async get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    options: { query?: Query; body?: unknown },
  ): Promise<T> {
    const url = this.baseUrl + path + buildQuery(options.query);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken
          ? { Authorization: `Bearer ${this.accessToken}` }
          : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      // Админка всегда показывает текущее состояние базы.
      cache: 'no-store',
    });

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  }
}

function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallback = `Запрос завершился с кодом ${response.status}`;
  try {
    const payload = (await response.json()) as {
      message?: string | string[];
      code?: string;
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message;
    return new ApiError(response.status, message ?? fallback, payload.code);
  } catch {
    return new ApiError(response.status, fallback);
  }
}
