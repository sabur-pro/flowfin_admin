/**
 * Доля от единицы: 0.09 — это 9%. Проценты в домен не попадают, они живут
 * только в UI, чтобы нельзя было случайно сложить 9 и 0.09.
 */
export type Rate = number;

/** Сумма в долларах США. Домен считает всё в одной валюте. */
export type Usd = number;

/** Номер месяца от старта проекции, начиная с 1. */
export type MonthIndex = number;

export const asRate = (percent: number): Rate => percent / 100;
export const asPercent = (rate: Rate): number => rate * 100;
