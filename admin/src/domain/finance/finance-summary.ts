/**
 * Всё, что реально прошло через кассу. Пока это только AlifPay, поэтому суммы
 * в сомони — переводим в доллары на границе отображения, а не в данных.
 */
export interface FinanceSummary {
  readonly rangeDays: number;
  readonly paid: { readonly count: number; readonly amountTjs: number };
  readonly lifetime: { readonly count: number; readonly amountTjs: number };
  readonly conversion: {
    readonly started: number;
    readonly paid: number;
    readonly rate: number;
  };
  readonly byPlan: readonly {
    readonly plan: string;
    readonly count: number;
    readonly amountTjs: number;
  }[];
  readonly byGate: readonly {
    readonly gate: string;
    readonly count: number;
    readonly amountTjs: number;
  }[];
  readonly daily: readonly {
    readonly date: string;
    readonly count: number;
    readonly amountTjs: number;
  }[];
}

/** Средний чек за период. Ноль платежей — ноль, а не деление на ноль. */
export function averagePaymentTjs(summary: FinanceSummary): number {
  return summary.paid.count > 0
    ? summary.paid.amountTjs / summary.paid.count
    : 0;
}
