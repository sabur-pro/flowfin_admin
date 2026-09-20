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


export function usdFine(value: number): string {
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(value);
  return `${sign}$${abs.toFixed(abs < 1 ? 3 : 2)}`;
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

/**
 * Копеечные суммы: разбор одной фразы стоит доли цента, и округление до
 * центов превратило бы весь отчёт по ИИ в нули. Показываем три значащие
 * цифры, но не больше шести знаков после запятой.
 */
export function usdMicro(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';

  if (abs === 0) return '$0';
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;

  const digits = Math.min(6, Math.max(2, 2 - Math.floor(Math.log10(abs))));
  return `${sign}$${abs.toFixed(digits)}`;
}

/** Токены: их миллионы, точное число читать невозможно. */
export function tokens(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')}${NBSP}млн`;
  }
  if (abs >= 10_000) return `${groupDigits(value / 1000)}K`;
  return groupDigits(value);
}

/** Рост со знаком: +18% или −4%. */
export function signedPercent(rate: number, digits = 0): string {
  const value = (rate * 100).toFixed(digits);
  return rate >= 0 ? `+${value}%` : `−${Math.abs(Number(value)).toFixed(digits)}%`;
}

export function tjs(value: number): string {
  return `${groupDigits(value)}${NBSP}TJS`;
}

export function percent(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

/** «за год», «за два года», «за три года» — без цифры перед словом. */
export function yearsLabel(years: number): string {
  if (years === 1) return 'год';
  if (years === 2) return 'два года';
  if (years === 3) return 'три года';
  return `${years} лет`;
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
  if (!Number.isFinite(value)) return '∞';
  return value > 0 ? `${value.toFixed(1)}×` : 'убыток';
}
