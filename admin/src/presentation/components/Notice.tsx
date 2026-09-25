/** Итог серверного действия, переданный через адрес страницы. */
export function Notice({
  notice,
  error,
}: {
  readonly notice?: string;
  readonly error?: string;
}) {
  if (error) {
    return (
      <p className="notice" data-tone="loss" role="alert">
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p className="notice" data-tone="good" role="status">
        {notice}
      </p>
    );
  }
  return null;
}
