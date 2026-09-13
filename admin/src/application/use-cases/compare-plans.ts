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

/**
 * Три тарифа при одних и тех же юрисдикции, рынке, канале и поведении
 * пользователя. Меняется ровно то, что отличает тарифы: цена и набор фич,
 * из которого складывается себестоимость. Так видно цену синхронизации и
 * цену ИИ по отдельности, а не одной суммой.
 */
export function comparePlans(scenario: Scenario): readonly PlanComparisonRow[] {
  return PLAN_IDS.map((planId) => ({
    plan: PLANS[planId],
    report: buildUnitEconomicsReport(withPlan(scenario, planId)),
  }));
}
