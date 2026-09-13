'use client';

import { useCallback, useMemo } from 'react';
import {
  buildUnitEconomicsReport,
  compareMarkets,
  comparePlans,
} from '@/application/use-cases';
import {
  JURISDICTIONS,
  MARKETS,
  PLANS,
  PLAN_IDS,
  SALES_CHANNELS,
  annualPriceUsd,
  inLocalCurrency,
  voiceCostPerMonth,
  type BillingPeriod,
  type JurisdictionId,
  type MarketId,
  type PlanId,
  type SalesChannelId,
  type Scenario,
} from '@/domain/unit-economics';
import { Card } from './Card';
import { ContributionBar } from './ContributionBar';
import { CostBreakdown } from './CostBreakdown';
import { DataTable, type Column } from './DataTable';
import { FieldGroup, SelectField, SliderField, ToggleField } from './Field';
import { ProjectionChart } from './ProjectionChart';
import { StatGrid, StatTile } from './StatTile';
import { useScenarioWorkspace } from '../hooks/useScenarioWorkspace';
import {
  groupDigits,
  months as fmtMonths,
  multiple,
  percent,
  usd,
  usdCompact,
  usdFine,
  usdPrecise,
} from '../format';
import type {
  MarketComparisonRow,
  PlanComparisonRow,
} from '@/application/use-cases';

const JURISDICTION_OPTIONS = Object.values(JURISDICTIONS).map((j) => ({
  value: j.id,
  label: j.name,
}));

const MARKET_OPTIONS = Object.values(MARKETS).map((m) => ({
  value: m.id,
  label: m.name,
}));

const PLAN_OPTIONS = PLAN_IDS.map((id) => ({
  value: id,
  label: PLANS[id].name,
}));

const BILLING_OPTIONS: readonly { value: BillingPeriod; label: string }[] = [
  { value: 'monthly', label: 'Помесячно' },
  { value: 'annual', label: 'Год вперёд' },
];

export function UnitEconomicsWorkbench() {
  const { scenario, setScenario, select, reset, resetAll, configuredCount } =
    useScenarioWorkspace();

  const report = useMemo(() => buildUnitEconomicsReport(scenario), [scenario]);
  const comparison = useMemo(
    () => compareMarkets(scenario.jurisdictionId, { planId: scenario.planId }),
    [scenario.jurisdictionId, scenario.planId],
  );
  const planComparison = useMemo(() => comparePlans(scenario), [scenario]);

  const jurisdiction = JURISDICTIONS[scenario.jurisdictionId];
  const market = MARKETS[scenario.marketId];
  const plan = PLANS[scenario.planId];
  const { economics, projection } = report;

  const patch = useCallback(
    (next: Partial<Scenario>) =>
      setScenario((current) => ({ ...current, ...next })),
    [setScenario],
  );

  // Селекторы не пересобирают сценарий, а переходят к сценарию другой
  // комбинации: настроенное для США остаётся у США, даже если сходить в Европу.
  const changeJurisdiction = (jurisdictionId: JurisdictionId) =>
    select({ jurisdictionId });

  const changeMarket = (marketId: MarketId) => select({ marketId });

  const changePlan = (planId: PlanId) => select({ planId });

  const channelOptions = jurisdiction.channels.map((id) => ({
    value: id,
    label: SALES_CHANNELS[id].name,
  }));

  const isFree = economics.grossUsd === 0;
  const voiceIfEnabled = voiceCostPerMonth(scenario.usage.voiceRequestsPerDay);

  return (
    <div className="workbench">
      <aside className="workbench-rail">
        <FieldGroup title="Тариф">
          <SelectField
            label="Что входит в подписку"
            value={scenario.planId}
            options={PLAN_OPTIONS}
            onChange={changePlan}
          />
          <p className="field-note">{plan.note}</p>
          <SliderField
            label="Цена в месяц"
            value={scenario.pricing.monthlyPriceUsd}
            display={
              isFree ? 'бесплатно' : `$${scenario.pricing.monthlyPriceUsd.toFixed(2)}`
            }
            min={0}
            max={24.99}
            step={1}
            hint={
              isFree
                ? 'Free не приносит выручки — это расход на верх воронки.'
                : `Ориентир рынка «${market.name}» — ${usdPrecise(
                    scenario.planId === 'plus'
                      ? market.benchmark.plusUsd
                      : market.benchmark.proUsd,
                  )}`
            }
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
                ? 'не пользуется'
                : `${scenario.usage.voiceRequestsPerDay}/день`
            }
            min={0}
            max={40}
            step={1}
            hint={
              plan.features.aiVoice
                ? `${usdFine(economics.variableCost.aiUsd)}/мес на подписчика · ${usdFine(
                    economics.variableCost.aiUsd * 12,
                  )}/год${
                    economics.grossUsd > 0
                      ? ` · ${percent(economics.variableCost.aiUsd / economics.grossUsd, 1)} от чека`
                      : ''
                  }`
                : `Тариф без ИИ: не тарифицируется. Включить стоило бы ${usdFine(voiceIfEnabled)}/мес`
            }
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
            hint={`Срок жизни ${economics.expectedLifetimeMonths.toFixed(0)} мес`}
            onChange={(value) =>
              patch({ usage: { ...scenario.usage, churnMonthly: value / 100 } })
            }
          />
        </FieldGroup>

        <FieldGroup title="Рост и расходы">
          <SliderField
            label={isFree ? 'Новых пользователей в 1-й месяц' : 'Новых платящих в 1-й месяц'}
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
            label={isFree ? 'CAC — цена установки' : 'CAC — цена платящего'}
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

        <div className="rail-footer">
          <span className="rail-state">
            Настройки помнятся отдельно для каждой пары «рынок × тариф» и
            переживают перезагрузку. Настроено комбинаций: {configuredCount}.
          </span>
          <div className="rail-actions">
            <button type="button" className="ghost" onClick={reset}>
              Сбросить рынок
            </button>
            <button type="button" className="ghost" onClick={resetAll}>
              Всё
            </button>
          </div>
        </div>
      </aside>

      <div className="workbench-canvas">
        <StatGrid>
          <StatTile
            label={isFree ? 'Стоит в месяц' : 'Маржа с подписчика'}
            value={
              isFree
                ? usdFine(economics.variableCost.totalUsd)
                : usdPrecise(economics.contributionUsd)
            }
            hint={
              isFree
                ? 'Себестоимость бесплатного пользователя — считается как убыток'
                : `${percent(economics.contributionRate, 0)} от чека, до маркетинга и налога`
            }
            tone={!isFree && economics.contributionUsd > 0 ? 'neutral' : 'loss'}
          />
          <StatTile
            label="LTV"
            value={
              Math.abs(economics.ltvUsd) < 10
                ? usdFine(economics.ltvUsd)
                : usd(economics.ltvUsd)
            }
            hint={`срок жизни ${economics.expectedLifetimeMonths.toFixed(0)} мес при оттоке ${percent(economics.effectiveChurn)}`}
            tone={economics.ltvUsd >= 0 ? 'neutral' : 'loss'}
          />
          <StatTile
            label="Окупаемость CAC"
            value={fmtMonths(economics.cacPaybackMonths)}
            hint={
              isFree
                ? 'Free не окупает привлечение сам — только через конверсию в платный'
                : economics.contributionUsd <= 0
                  ? 'Маржа отрицательная: привлечение не окупится ни за какой срок'
                  : `LTV / CAC = ${multiple(economics.ltvToCac)}${economics.ltvToCac >= 3 ? ' — здоровая экономика' : ' — ниже порога 3×'}`
            }
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
            isFree
              ? `Тариф «${plan.shortName}» не приносит выручки: раскладывать нечего, есть только расход.`
              : scenario.pricing.billingPeriod === 'annual'
                ? `Годовая цена ${usdPrecise(annualPriceUsd(scenario.pricing))} разложена на месяц. Фикс-комиссия списывается раз в год.`
                : `Помесячная оплата ${usdPrecise(scenario.pricing.monthlyPriceUsd)}. Фикс-комиссия канала списывается каждый месяц.`
          }
        >
          {isFree ? (
            <p className="note">
              Бесплатный пользователь обходится в{' '}
              <strong>{usdFine(economics.variableCost.totalUsd)} в месяц</strong>{' '}
              — это цена держать его в базе, пока он не перешёл на платный тариф.
              При CAC {usd(scenario.growth.cacUsd)} и сроке жизни{' '}
              {economics.expectedLifetimeMonths.toFixed(0)} мес каждый такой
              пользователь стоит{' '}
              {usdFine(
                scenario.growth.cacUsd +
                  economics.variableCost.totalUsd *
                    economics.expectedLifetimeMonths,
              )}
              . Оправдать его может только конверсия в Plus или Pro.
            </p>
          ) : (
            <>
              <ContributionBar economics={economics} />
              <p className="note">
                В валюте рынка это{' '}
                <strong>
                  {inLocalCurrency(market, economics.grossUsd).toFixed(2)}{' '}
                  {market.currency}
                </strong>{' '}
                в месяц. {market.note}
              </p>
            </>
          )}
        </Card>

        <Card
          title="Себестоимость обслуживания"
          description={`Что тратится на одного активного пользователя тарифа «${plan.shortName}» каждый месяц. Голосовые запросы попадают сюда, только если ИИ входит в тариф.`}
        >
          <CostBreakdown
            economics={economics}
            plan={plan}
            voiceRequestsPerDay={scenario.usage.voiceRequestsPerDay}
          />
        </Card>

        <Card
          title="Тарифы при этих настройках"
          description={`Один и тот же рынок, канал и поведение пользователя — меняются только цена и набор фич. Отток везде ${percent(scenario.usage.churnMonthly)}: разделить его по тарифам можно будет, когда наберётся своя статистика.`}
        >
          <DataTable
            columns={planColumns}
            rows={planComparison}
            rowKey={(row) => row.plan.id}
            highlight={(row) => row.plan.id === scenario.planId}
          />
          <ul className="notes-list">
            {PLAN_IDS.map((id) => (
              <li key={id}>
                <strong>{PLANS[id].shortName}.</strong> {PLANS[id].note}
              </li>
            ))}
          </ul>
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
          description={`Продажа из «${jurisdiction.name}» на тарифе «${plan.shortName}» по цене, к которой привык каждый рынок. Видно, что экономику определяет не себестоимость, а цена и стоимость привлечения.`}
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

const planColumns: readonly Column<PlanComparisonRow>[] = [
  {
    key: 'plan',
    header: 'Тариф',
    align: 'left',
    render: (r) => r.plan.shortName,
  },
  {
    key: 'price',
    header: 'Цена',
    render: (r) =>
      r.report.economics.grossUsd > 0
        ? usdPrecise(r.report.economics.grossUsd)
        : '—',
  },
  {
    key: 'cost',
    header: 'Себестоимость',
    render: (r) => usdFine(r.report.economics.variableCostUsd),
  },
  {
    key: 'ai',
    header: 'из них ИИ',
    render: (r) =>
      r.plan.features.aiVoice
        ? usdFine(r.report.economics.variableCost.aiUsd)
        : '—',
  },
  {
    key: 'contribution',
    header: 'Маржа/мес',
    render: (r) => usdFine(r.report.economics.contributionUsd),
  },
  {
    key: 'ltv',
    header: 'LTV',
    render: (r) => usdFine(r.report.economics.ltvUsd),
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
