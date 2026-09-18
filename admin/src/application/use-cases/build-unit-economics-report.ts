import {
  calculateSubscriberEconomics,
  project,
  type Projection,
  type Scenario,
  type SubscriberEconomics,
} from '@/domain/unit-economics';

export interface UnitEconomicsReport {
  readonly scenario: Scenario;
  readonly economics: SubscriberEconomics;
  readonly projection: Projection;
}

export function buildUnitEconomicsReport(
  scenario: Scenario,
): UnitEconomicsReport {
  const economics = calculateSubscriberEconomics(scenario);
  return { scenario, economics, projection: project(scenario, economics) };
}
