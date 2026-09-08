import type { SubscriberEconomics } from '@/domain/unit-economics';
import { percent, usdPrecise } from '../format';

interface Segment {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

/**
 * Разложение месячного чека. Слагаемые в сумме дают ровно gross, поэтому
 * ширины считаются от него, а не нормализуются задним числом.
 */
export function ContributionBar({
  economics,
}: {
  readonly economics: SubscriberEconomics;
}) {
  const segments: readonly Segment[] = [
    { key: 'margin', label: 'Маржа', value: Math.max(economics.contributionUsd, 0) },
    { key: 'channel', label: 'Комиссия канала', value: economics.channelFeeUsd },
    { key: 'tax', label: 'Налог с продажи', value: economics.consumptionTaxUsd },
    { key: 'cost', label: 'ИИ и сервер', value: economics.variableCostUsd },
  ];

  const total = economics.grossUsd > 0 ? economics.grossUsd : 1;

  return (
    <div className="contribution">
      <div className="contribution-bar" role="img" aria-label="Разложение чека">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.key}
              className="contribution-seg"
              data-seg={segment.key}
              style={{ flexBasis: `${(segment.value / total) * 100}%` }}
              title={`${segment.label}: ${usdPrecise(segment.value)}`}
            />
          ))}
      </div>

      <ul className="contribution-legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className="legend-dot" data-seg={segment.key} />
            <span className="legend-name">{segment.label}</span>
            <span className="legend-value">{usdPrecise(segment.value)}</span>
            <span className="legend-share">
              {percent(segment.value / total, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
