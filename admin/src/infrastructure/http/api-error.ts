export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}
