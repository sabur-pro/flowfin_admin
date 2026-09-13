import type { JurisdictionId } from './jurisdiction';
import type { MarketId } from './market';
import type { PlanId } from './plan';
import { defaultScenario, type Scenario } from './scenario';

/**
 * Настройки сценария осмысленны только внутри своей комбинации: CAC $40 —
 * это цена платящего в США, а не универсальное число, и переносить его на
 * Таджикистан нельзя. Поэтому сценарии живут по одному на комбинацию
 * «юрисдикция × рынок × тариф», а переключение селектора — это переход к
 * другому сценарию, а не пересборка текущего.
 */
export type ScenarioKey = string;

export interface Workspace {
  readonly activeKey: ScenarioKey;
  readonly scenarios: Readonly<Record<ScenarioKey, Scenario>>;
}

export interface ScenarioTarget {
  readonly jurisdictionId: JurisdictionId;
  readonly marketId: MarketId;
  readonly planId: PlanId;
}

export function scenarioKey(target: ScenarioTarget): ScenarioKey {
  return `${target.jurisdictionId}:${target.marketId}:${target.planId}`;
}

export const keyOf = (scenario: Scenario): ScenarioKey => scenarioKey(scenario);

export function createWorkspace(scenario: Scenario): Workspace {
  return { activeKey: keyOf(scenario), scenarios: { [keyOf(scenario)]: scenario } };
}

/** Инвариант: активный ключ всегда есть в словаре — его кладут все операции. */
export function activeScenario(workspace: Workspace): Scenario {
  const scenario = workspace.scenarios[workspace.activeKey];
  if (!scenario) {
    throw new Error(`Сценарий ${workspace.activeKey} потерян из рабочего набора`);
  }
  return scenario;
}

/** Правка ползунком: переписывает сценарий той комбинации, которой он принадлежит. */
export function updateActive(workspace: Workspace, scenario: Scenario): Workspace {
  const key = keyOf(scenario);
  return { activeKey: key, scenarios: { ...workspace.scenarios, [key]: scenario } };
}

/**
 * Переход к другой комбинации. Сценарий, который там уже настраивали,
 * возвращается как был; впервые открытая комбинация берёт ориентиры своего
 * рынка. Текущий никуда не девается — он лежит под своим ключом.
 */
export function switchTo(workspace: Workspace, target: ScenarioTarget): Workspace {
  const key = scenarioKey(target);
  if (key === workspace.activeKey) return workspace;

  const stored = workspace.scenarios[key];
  const base =
    stored ??
    defaultScenario(target.jurisdictionId, target.marketId, target.planId);

  return {
    activeKey: key,
    scenarios: {
      ...workspace.scenarios,
      [key]: carryOver(activeScenario(workspace), base),
    },
  };
}

/** Вернуть активную комбинацию к ориентирам её рынка, не трогая остальные. */
export function resetActive(workspace: Workspace): Workspace {
  const current = activeScenario(workspace);
  const fresh = defaultScenario(
    current.jurisdictionId,
    current.marketId,
    current.planId,
  );
  return updateActive(workspace, carryOver(current, fresh));
}

/**
 * Часть настроек описывает не рынок, а саму компанию: аренда и зарплаты не
 * меняются от того, что вы посмотрели на Европу, и модель биллинга у продукта
 * одна на всех. Такие поля идут за вами при переключении, остальные —
 * цена, CAC, отток, налоги, канал — остаются свойством комбинации.
 */
function carryOver(from: Scenario, to: Scenario): Scenario {
  return {
    ...to,
    pricing: {
      ...to.pricing,
      billingPeriod: from.pricing.billingPeriod,
      annualDiscount: from.pricing.annualDiscount,
    },
    growth: {
      ...to.growth,
      firstMonthPayingUsers: from.growth.firstMonthPayingUsers,
      monthlyGrowth: from.growth.monthlyGrowth,
      fixedMonthlyCostUsd: from.growth.fixedMonthlyCostUsd,
    },
  };
}
