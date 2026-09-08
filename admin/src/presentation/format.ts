const NBSP = ' ';

/** Разряды неразрывным пробелом: 1 234 567. Минус — типографский. */
export function groupDigits(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const grouped = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return (value < 0 ? '−' : '') + grouped;
}

export function usd(value: number): string {
  return `$${groupDigits(value)}`;
}

export function usdPrecise(value: number): string {
  const sign = value < 0 ? '−' : '';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

/** Компактная сумма для крупных чисел: $1,2 млн, $265K. */
export function usdCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';

  if (abs >= 1_000_000) {
    const millions = (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1);
    return `${sign}$${millions.replace('.', ',')}${NBSP}млн`;
  }
  if (abs >= 10_000) return `${sign}$${groupDigits(abs / 1000)}K`;
  return `${sign}$${groupDigits(abs)}`;
}

export function tjs(value: number): string {
  return `${groupDigits(value)}${NBSP}TJS`;
}

export function percent(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

export function months(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  if (value > 60) return '> 60 мес';
  return `${value.toFixed(1)} мес`;
}

export function date(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function multiple(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(1)}×` : '∞';
}
