import type { Projection } from '@/domain/unit-economics';
import { usdCompact } from '../format';

const WIDTH = 720;
const HEIGHT = 220;
const PADDING = { top: 12, right: 12, bottom: 24, left: 62 };

/**
 * Накопленная прибыль по месяцам. Область ниже нуля — деньги, которые в
 * проект ещё вложены; выше — уже вернувшиеся.
 */
export function ProjectionChart({ projection }: { readonly projection: Projection }) {
  const values = projection.months.map((m) => m.cumulativeProfitUsd);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (index: number) =>
    PADDING.left + (index / Math.max(values.length - 1, 1)) * plotWidth;
  const y = (value: number) =>
    PADDING.top + plotHeight - ((value - min) / span) * plotHeight;

  const line = values
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`)
    .join(' ');

  const zeroY = y(0);
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${zeroY.toFixed(1)} L${x(0).toFixed(1)} ${zeroY.toFixed(1)} Z`;
  const ticks = [max, (max + min) / 2, min];

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Накопленная прибыль по месяцам"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={y(tick)}
            y2={y(tick)}
            className="chart-grid"
          />
          <text x={PADDING.left - 8} y={y(tick) + 4} className="chart-label" textAnchor="end">
            {usdCompact(tick)}
          </text>
        </g>
      ))}

      <line
        x1={PADDING.left}
        x2={WIDTH - PADDING.right}
        y1={zeroY}
        y2={zeroY}
        className="chart-zero"
      />

      <path d={area} className="chart-area" />
      <path d={line} className="chart-line" />

      {[1, 12, 24, 36].map((month) => (
        <text
          key={month}
          x={x(month - 1)}
          y={HEIGHT - 6}
          className="chart-label"
          textAnchor="middle"
        >
          {month === 1 ? 'мес 1' : month}
        </text>
      ))}

      {projection.capitalRecoveryMonth !== null && (
        <circle
          cx={x(projection.capitalRecoveryMonth - 1)}
          cy={zeroY}
          r={4}
          className="chart-marker"
        />
      )}
    </svg>
  );
}
