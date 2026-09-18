import type { JurisdictionId } from './jurisdiction';
import type { MarketId } from './market';
import type { PlanId } from './plan';
import { defaultScenario, type Scenario } from './scenario';

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

export function activeScenario(workspace: Workspace): Scenario {
  const scenario = workspace.scenarios[workspace.activeKey];
  if (!scenario) {
    throw new Error(`Сценарий ${workspace.activeKey} потерян из рабочего набора`);
  }
  return scenario;
}

export function updateActive(workspace: Workspace, scenario: Scenario): Workspace {
  const key = keyOf(scenario);
  return { activeKey: key, scenarios: { ...workspace.scenarios, [key]: scenario } };
}

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

export function resetActive(workspace: Workspace): Workspace {
  const current = activeScenario(workspace);
  const fresh = defaultScenario(
    current.jurisdictionId,
    current.marketId,
    current.planId,
  );
  return updateActive(workspace, carryOver(current, fresh));
}

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

export function workspaceFingerprint(workspace: Workspace): string {
  const entries = Object.keys(workspace.scenarios)
    .sort()
    .map((key) => [key, stable(workspace.scenarios[key])]);
  return JSON.stringify(entries);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value === null || typeof value !== 'object') return value;

  const source = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) sorted[key] = stable(source[key]);
  return sorted;
}
