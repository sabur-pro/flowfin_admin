/**
 * Явный результат вместо исключений на границах приложения: сценарии
 * возвращают его наружу, а UI решает, что показать. Домен исключения не бросает.
 */
export type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
