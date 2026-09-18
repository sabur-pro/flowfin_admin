import {
  PLANS,
  PLAN_IDS,
  withPlan,
  type Plan,
  type Scenario,
} from '@/domain/unit-economics';
import {
  buildUnitEconomicsReport,
  type UnitEconomicsReport,
} from './build-unit-economics-report';

export interface PlanComparisonRow {
  readonly plan: Plan;
  readonly report: UnitEconomicsReport;
}

export function comparePlans(scenario: Scenario): readonly PlanComparisonRow[] {
  return PLAN_IDS.map((planId) => ({
    plan: PLANS[planId],
    report: buildUnitEconomicsReport(withPlan(scenario, planId)),
  }));
}
