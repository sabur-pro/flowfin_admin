
export type Rate = number;

export type Usd = number;

export type MonthIndex = number;

export const asRate = (percent: number): Rate => percent / 100;
export const asPercent = (rate: Rate): number => rate * 100;
