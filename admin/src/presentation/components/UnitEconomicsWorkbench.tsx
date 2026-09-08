'use client';

import { useMemo, useState } from 'react';
import {
  buildUnitEconomicsReport,
  compareMarkets,
} from '@/application/use-cases';
import {
  JURISDICTIONS,
  MARKETS,
  SALES_CHANNELS,
  annualPriceUsd,
  defaultScenario,
  inLocalCurrency,
  type BillingPeriod,
  type JurisdictionId,
  type MarketId,
  type SalesChannelId,
  type Scenario,
} from '@/domain/unit-economics';
import { Card } from './Card';
import { ContributionBar } from './ContributionBar';
import { DataTable, type Column } from './DataTable';
import { FieldGroup, SelectField, SliderField, ToggleField } from './Field';
import { ProjectionChart } from './ProjectionChart';
import { StatGrid, StatTile } from './StatTile';
import {
  groupDigits,
  months as fmtMonths,
  multiple,
  percent,
  usd,
  usdCompact,
  usdPrecise,
} from '../format';
import type { MarketComparisonRow } from '@/application/use-cases';

const JURISDICTION_OPTIONS = Object.values(JURISDICTIONS).map((j) => ({
  value: j.id,
  label: j.name,
}));

const MARKET_OPTIONS = Object.values(MARKETS).map((m) => ({
  value: m.id,
  label: m.name,
}));

const BILLING_OPTIONS: readonly { value: BillingPeriod; label: string }[] = [
  { value: 'monthly', label: 'Помесячно' },
  { value: 'annual', label: 'Год вперёд' },
];

export function UnitEconomicsWorkbench() {
  const [scenario, setScenario] = useState<Scenario>(() =>
    defaultScenario('uae', 'usa'),
  );

  const report = useMemo(() => buildUnitEconomicsReport(scenario), [scenario]);
  const comparison = useMemo(
    () => compareMarkets(scenario.jurisdictionId),
    [scenario.jurisdictionId],
  );

  const jurisdiction = JURISDICTIONS[scenario.jurisdictionId];
  const market = MARKETS[scenario.marketId];
  const { economics, projection } = report;

  /** Смена юрисдикции сбрасывает сценарий: у неё другие каналы и налог. */
  const changeJurisdiction = (id: JurisdictionId) =>
    setScenario(defaultScenario(id, scenario.marketId));

  const changeMarket = (id: MarketId) =>
    setScenario(defaultScenario(scenario.jurisdictionId, id));

  const patch = (next: Partial<Scenario>) =>
    setScenario((current) => ({ ...current, ...next }));

  const channelOptions = jurisdiction.channels.map((id) => ({
    value: id,
    label: SALES_CHANNELS[id].name,
  }));

  return (
    <div className="workbench">
      <aside className="workbench-rail">
        <FieldGroup title="Откуда и кому">
          <SelectField
            label="Юрисдикция продавца"
            value={scenario.jurisdictionId}
            options={JURISDICTION_OPTIONS}
            onChange={changeJurisdiction}
          />
          <SelectField
            label="Рынок покупателя"
            value={scenario.marketId}
            options={MARKET_OPTIONS}
            onChange={changeMarket}
          />
          <SelectField
            label="Канал продаж"
            value={scenario.channelId}
            options={channelOptions}
            onChange={(channelId: SalesChannelId) => patch({ channelId })}
          />
        </FieldGroup>

        <FieldGroup title="Тариф">
          <SliderField
            label="Цена в месяц"
            value={scenario.pricing.monthlyPriceUsd}
            display={`$${scenario.pricing.monthlyPriceUsd.toFixed(2)}`}
            min={0.99}
            max={24.99}
            step={1}
            onChange={(monthlyPriceUsd) =>
              patch({ pricing: { ...scenario.pricing, monthlyPriceUsd } })
            }
          />
          <ToggleField
            label="Периодичность"
            value={scenario.pricing.billingPeriod}
            options={BILLING_OPTIONS}
            onChange={(billingPeriod) =>
              patch({ pricing: { ...scenario.pricing, billingPeriod } })
            }
          />
          <SliderField
            label="Скидка за год"
            value={scenario.pricing.annualDiscount * 100}
            display={percent(scenario.pricing.annualDiscount, 0)}
            min={0}
            max={50}
            step={1}
            onChange={(value) =>
              patch({
                pricing: { ...scenario.pricing, annualDiscount: value / 100 },
              })
            }
          />
        </FieldGroup>

        <FieldGroup title="Налоги">
          <SliderField
            label="Налог с продажи (НДС)"
            value={scenario.consumptionTaxRate * 100}
            display={percent(scenario.consumptionTaxRate, 0)}
            min={0}
            max={27}
            step={1}
            onChange={(value) => patch({ consumptionTaxRate: value / 100 })}
          />
          <SliderField
            label="Налог на прибыль"
            value={scenario.corporateTaxRate * 100}
            display={percent(scenario.corporateTaxRate, 0)}
            min={0}
            max={30}
            step={1}
            onChange={(value) => patch({ corporateTaxRate: value / 100 })}
          />
        </FieldGroup>

        <FieldGroup title="Поведение">
          <SliderField
            label="Голосовых запросов в день"
            value={scenario.usage.voiceRequestsPerDay}
            display={
              scenario.usage.voiceRequestsPerDay === 0
                ? 'без ИИ'
                : `${scenario.usage.voiceRequestsPerDay}/день`
            }
            min={0}
            max={40}
            step={1}
            onChange={(voiceRequestsPerDay) =>
              patch({ usage: { ...scenario.usage, voiceRequestsPerDay } })
            }
          />
          <SliderField
            label="Отток в месяц"
            value={scenario.usage.churnMonthly * 100}
            display={percent(scenario.usage.churnMonthly)}
            min={1}
            max={15}
            step={0.5}
            onChange={(value) =>
              patch({ usage: { ...scenario.usage, churnMonthly: value / 100 } })
            }
          />
        </FieldGroup>

        <FieldGroup title="Рост и расходы">
          <SliderField
            label="Новых платящих в 1-й месяц"
            value={scenario.growth.firstMonthPayingUsers}
            display={groupDigits(scenario.growth.firstMonthPayingUsers)}
            min={25}
            max={1500}
            step={25}
            onChange={(firstMonthPayingUsers) =>
              patch({ growth: { ...scenario.growth, firstMonthPayingUsers } })
            }
          />
          <SliderField
            label="Рост привлечения"
            value={scenario.growth.monthlyGrowth * 100}
            display={`+${percent(scenario.growth.monthlyGrowth, 0)}`}
            min={0}
            max={25}
            step={1}
            onChange={(value) =>
              patch({ growth: { ...scenario.growth, monthlyGrowth: value / 100 } })
            }
          />
          <SliderField
            label="CAC — цена платящего"
            value={scenario.growth.cacUsd}
            display={usd(scenario.growth.cacUsd)}
            min={0}
            max={150}
            step={1}
            onChange={(cacUsd) => patch({ growth: { ...scenario.growth, cacUsd } })}
          />
          <SliderField
            label="Постоянные расходы"
            value={scenario.growth.fixedMonthlyCostUsd}
            display={`${usdCompact(scenario.growth.fixedMonthlyCostUsd)}/мес`}
            min={0}
            max={150_000}
            step={2500}
            onChange={(fixedMonthlyCostUsd) =>
              patch({ growth: { ...scenario.growth, fixedMonthlyCostUsd } })
            }
          />
        </FieldGroup>
      </aside>

      <div className="workbench-canvas">
        <StatGrid>
          <StatTile
            label="Маржа с подписчика"
            value={usdPrecise(economics.contributionUsd)}
            hint={`${percent(economics.contributionRate, 0)} от чека, до маркетинга и налога`}
            tone={economics.contributionUsd > 0 ? 'neutral' : 'loss'}
          />
          <StatTile
            label="LTV"
            value={usd(economics.ltvUsd)}
            hint={`срок жизни ${economics.expectedLifetimeMonths.toFixed(0)} мес при оттоке ${percent(economics.effectiveChurn)}`}
          />
          <StatTile
            label="Окупаемость CAC"
            value={fmtMonths(economics.cacPaybackMonths)}
            hint={`LTV / CAC = ${multiple(economics.ltvToCac)}${economics.ltvToCac >= 3 ? ' — здоровая экономика' : ' — ниже порога 3×'}`}
            tone={
              economics.cacPaybackMonths <= 12
                ? 'good'
                : economics.cacPaybackMonths > 24
                  ? 'loss'
                  : 'neutral'
            }
          />
          <StatTile
            label="Прибыль за 3 года"
            value={usdCompact(projection.cumulativeProfitUsd)}
            hint={`${groupDigits(projection.endingSubscribers)} активных к 36-му месяцу`}
            tone={projection.cumulativeProfitUsd >= 0 ? 'good' : 'loss'}
          />
        </StatGrid>

        <Card
          title="Куда уходит каждый доллар"
          description={
            scenario.pricing.billingPeriod === 'annual'
              ? `Годовая цена ${usdPrecise(annualPriceUsd(scenario.pricing))} разложена на месяц. Фикс-комиссия списывается раз в год.`
              : `Помесячная оплата ${usdPrecise(scenario.pricing.monthlyPriceUsd)}. Фикс-комиссия канала списывается каждый месяц.`
          }
        >
          <ContributionBar economics={economics} />
          <p className="note">
            В валюте рынка это{' '}
            <strong>
              {inLocalCurrency(market, economics.grossUsd).toFixed(2)}{' '}
              {market.currency}
            </strong>{' '}
            в месяц. {market.note}
          </p>
        </Card>

        <Card
          title="Накопленная прибыль после налога"
          description={
            projection.capitalRecoveryMonth
              ? `Операционный плюс с ${projection.operatingBreakEvenMonth}-го месяца, вложенное возвращается на ${projection.capitalRecoveryMonth}-м. Пик просадки ${usdCompact(projection.peakDrawdownUsd)} — это и есть потребность в деньгах.`
              : `За три года вложенное не возвращается. Пик просадки ${usdCompact(projection.peakDrawdownUsd)}.`
          }
        >
          <ProjectionChart projection={projection} />
        </Card>

        <Card
          title="Все рынки при этой юрисдикции"
          description={`Продажа из «${jurisdiction.name}» по цене, к которой привык каждый рынок. Видно, что экономику определяет не себестоимость, а цена и стоимость привлечения.`}
        >
          <DataTable
            columns={marketColumns}
            rows={comparison}
            rowKey={(row) => row.market.id}
            highlight={(row) => row.market.id === scenario.marketId}
          />
        </Card>

        <Card title={`Ограничения юрисдикции «${jurisdiction.name}»`}>
          <ul className="notes-list">
            {jurisdiction.restrictions.map((restriction) => (
              <li key={restriction}>{restriction}</li>
            ))}
            <li>{SALES_CHANNELS[scenario.channelId].note}</li>
          </ul>
        </Card>

        <Card title="P&L по годам">
          <DataTable
            columns={yearColumns}
            rows={projection.years}
            rowKey={(row) => String(row.year)}
          />
        </Card>
      </div>
    </div>
  );
}

const marketColumns: readonly Column<MarketComparisonRow>[] = [
  { key: 'market', header: 'Рынок', align: 'left', render: (r) => r.market.name },
  {
    key: 'price',
    header: 'Цена',
    render: (r) => usdPrecise(r.report.scenario.pricing.monthlyPriceUsd),
  },
  {
    key: 'contribution',
    header: 'Маржа/мес',
    render: (r) => usdPrecise(r.report.economics.contributionUsd),
  },
  { key: 'ltv', header: 'LTV', render: (r) => usd(r.report.economics.ltvUsd) },
  {
    key: 'cac',
    header: 'CAC',
    render: (r) => usd(r.report.scenario.growth.cacUsd),
  },
  {
    key: 'payback',
    header: 'Окупаемость',
    render: (r) => fmtMonths(r.report.economics.cacPaybackMonths),
  },
  {
    key: 'ltvcac',
    header: 'LTV / CAC',
    render: (r) => multiple(r.report.economics.ltvToCac),
  },
];

const yearColumns: readonly Column<
  MarketComparisonRow['report']['projection']['years'][number]
>[] = [
  { key: 'year', header: 'Год', align: 'left', render: (y) => `Год ${y.year}` },
  {
    key: 'subs',
    header: 'Активных на конец',
    render: (y) => groupDigits(y.endingSubscribers),
  },
  { key: 'gross', header: 'Выручка', render: (y) => usdCompact(y.grossRevenueUsd) },
  {
    key: 'contribution',
    header: 'Марж. доход',
    render: (y) => usdCompact(y.contributionUsd),
  },
  { key: 'marketing', header: 'Маркетинг', render: (y) => usdCompact(y.marketingUsd) },
  { key: 'fixed', header: 'Пост. расходы', render: (y) => usdCompact(y.fixedCostUsd) },
  {
    key: 'tax',
    header: 'Налог',
    render: (y) => (y.taxUsd > 0 ? usdCompact(y.taxUsd) : '—'),
  },
  {
    key: 'profit',
    header: 'Прибыль',
    render: (y) => usdCompact(y.netProfitUsd),
  },
];
