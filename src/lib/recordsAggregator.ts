import { TodayWorkData, ReturnNotCollectedReason } from '@/types';
import { calculateFromWorkData, RATE_203D, RATE_206A } from '@/lib/recordDerived';
import { RecordsQuery, resolveDateRange, RouteScope } from '@/lib/recordsQuery';

export interface RecordsAggregate {
  meta: {
    startDate: string;
    endDate: string;
    label: string;
    days: number;
    recordCount: number;
  };
  gift: {
    total: number;
    route203D: number;
    route206A: number;
    r1Total: number;
    r1_203D: number;
    r1_206A: number;
    r2Total: number;
    r2_203D: number;
    r2_206A: number;
  };
  returns: {
    total: number;
    route203D: number;
    route206A: number;
    notCollectedTotal: number;
    notCollected203D: number;
    notCollected206A: number;
    notCollectedByReason: Record<ReturnNotCollectedReason, number>;
  };
  freshBag: {
    genAssigned: number;
    soloAssigned: number;
    genUncollected: number;
    soloUncollected: number;
    route203DAssigned: number;
    route206AAssigned: number;
    route203DUncollected: number;
    route206AUncollected: number;
  };
  income: {
    gift: number;
    returns: number;
    fbAssigned: number;
    fbDeduct: number;
    total: number;
    returnDeduct203D: number;
    returnDeduct206A: number;
  };
}

const EMPTY_REASON_COUNTS: Record<ReturnNotCollectedReason, number> = {
  absent: 0,
  customerNotReceived: 0,
  alreadyCollected: 0,
  cancelled: 0,
};

function pickByRoute(scope: RouteScope, all: number, route203D: number, route206A: number): number {
  if (scope === '203D') return route203D;
  if (scope === '206A') return route206A;
  return all;
}

export function aggregateRecords(
  records: Array<{ date: string; workData: TodayWorkData }>,
  query: RecordsQuery
): RecordsAggregate {
  const { startDate, endDate, label } = resolveDateRange(query);
  const filtered = records.filter(r => r.date >= startDate && r.date <= endDate);

  const totals: RecordsAggregate = {
    meta: {
      startDate,
      endDate,
      label,
      days: filtered.length,
      recordCount: filtered.length,
    },
    gift: {
      total: 0,
      route203D: 0,
      route206A: 0,
      r1Total: 0,
      r1_203D: 0,
      r1_206A: 0,
      r2Total: 0,
      r2_203D: 0,
      r2_206A: 0,
    },
    returns: {
      total: 0,
      route203D: 0,
      route206A: 0,
      notCollectedTotal: 0,
      notCollected203D: 0,
      notCollected206A: 0,
      notCollectedByReason: { ...EMPTY_REASON_COUNTS },
    },
    freshBag: {
      genAssigned: 0,
      soloAssigned: 0,
      genUncollected: 0,
      soloUncollected: 0,
      route203DAssigned: 0,
      route206AAssigned: 0,
      route203DUncollected: 0,
      route206AUncollected: 0,
    },
    income: {
      gift: 0,
      returns: 0,
      fbAssigned: 0,
      fbDeduct: 0,
      total: 0,
      returnDeduct203D: 0,
      returnDeduct206A: 0,
    },
  };

  for (const record of filtered) {
    const { derived } = calculateFromWorkData(record.workData);

    totals.gift.total += derived.GIFT_DAY_TOTAL;
    totals.gift.route203D += derived.GIFT_DAY_203D;
    totals.gift.route206A += derived.GIFT_DAY_206A;
    totals.gift.r1Total += derived.GIFT_R1_DONE_TOTAL;
    totals.gift.r1_203D += derived.GIFT_R1_203D_ASSIGNED;
    totals.gift.r1_206A += derived.GIFT_R1_206A_ASSIGNED;
    totals.gift.r2Total += derived.GIFT_R2_NEW_TOTAL;
    totals.gift.r2_203D += derived.GIFT_R2_NEW_203D;
    totals.gift.r2_206A += derived.GIFT_R2_NEW_206A;

    totals.returns.total += derived.RET_DAY_TOTAL;
    totals.returns.route203D += derived.RET_DAY_203D;
    totals.returns.route206A += derived.RET_DAY_206A;

    totals.freshBag.genAssigned += derived.FB_GEN_ASSIGNED;
    totals.freshBag.soloAssigned += derived.FB_SOLO_ASSIGNED;
    totals.freshBag.genUncollected += derived.FB_GEN_UNCOLLECTED;
    totals.freshBag.soloUncollected += derived.FB_SOLO_UNCOLLECTED;
    totals.freshBag.route203DAssigned += derived.FB_203D_ASSIGNED;
    totals.freshBag.route206AAssigned += derived.FB_206A_ASSIGNED;
    totals.freshBag.route203DUncollected += derived.FB_203D_UNCOLLECTED;
    totals.freshBag.route206AUncollected += derived.FB_206A_UNCOLLECTED;

    totals.income.gift += derived.INCOME_GIFT;
    totals.income.returns += derived.INCOME_RET;
    totals.income.fbAssigned += derived.INCOME_FB_ASSIGNED;
    totals.income.fbDeduct += derived.INCOME_FB_DEDUCT;
    totals.income.total += derived.TODAY_EST_INCOME_BASE;

    const returnNotCollectedEntries = record.workData.returnNotCollected || [];
    for (const entry of returnNotCollectedEntries) {
      totals.returns.notCollectedTotal += entry.quantity;
      totals.returns.notCollectedByReason[entry.reason] += entry.quantity;
      if (entry.route === '203D') {
        totals.returns.notCollected203D += entry.quantity;
        totals.income.returnDeduct203D += entry.quantity * RATE_203D;
      } else {
        totals.returns.notCollected206A += entry.quantity;
        totals.income.returnDeduct206A += entry.quantity * RATE_206A;
      }
    }
  }

  return totals;
}

export function getRouteScopedValue(scope: RouteScope, all: number, route203D: number, route206A: number): number {
  return pickByRoute(scope, all, route203D, route206A);
}
