import { RecordsAggregate, getRouteScopedValue } from '@/lib/recordsAggregator';
import { RecordsQuery, RouteScope } from '@/lib/recordsQuery';
import { ReturnNotCollectedReason } from '@/types';

export type MetricGroup = 'gift' | 'returns' | 'freshbag' | 'income';
export type MetricFormat = 'count' | 'percent' | 'currency';

export type MetricResult =
  | { kind: 'value'; value: number; format: MetricFormat; negative?: boolean }
  | { kind: 'table'; rows: Array<{ label: string; value: string }> };

export interface MetricDefinition {
  id: string;
  label: string;
  group: MetricGroup;
  format?: MetricFormat;
  display: 'card' | 'table';
  negative?: boolean;
  compute: (agg: RecordsAggregate, query: RecordsQuery) => MetricResult;
}

export interface MetricPreset {
  id: string;
  label: string;
  period: RecordsQuery['period'];
  route: RouteScope;
  metrics: string[];
}

const reasonLabels: Record<ReturnNotCollectedReason, string> = {
  absent: '반품 부재',
  customerNotReceived: '미수령',
  alreadyCollected: '이미 회수',
  cancelled: '철회/취소',
};

function calcRate(assigned: number, uncollected: number): number {
  if (assigned <= 0) return 0;
  return (assigned - uncollected) / assigned;
}

function scopeValue(scope: RouteScope, all: number, route203D: number, route206A: number): number {
  return getRouteScopedValue(scope, all, route203D, route206A);
}

export const METRIC_GROUP_LABELS: Record<MetricGroup, string> = {
  gift: '기프트',
  returns: '반품',
  freshbag: '프레시백',
  income: '수입',
};

export const METRICS: MetricDefinition[] = [
  // Gift
  {
    id: 'gift_total',
    label: '기간 기프트 할당 합계',
    group: 'gift',
    display: 'card',
    compute: (agg, query) => ({
      kind: 'value',
      value: scopeValue(query.route, agg.gift.total, agg.gift.route203D, agg.gift.route206A),
      format: 'count',
    }),
  },
  {
    id: 'gift_r1_total',
    label: '1회전 기프트 할당량',
    group: 'gift',
    display: 'card',
    compute: (agg, query) => ({
      kind: 'value',
      value: scopeValue(query.route, agg.gift.r1Total, agg.gift.r1_203D, agg.gift.r1_206A),
      format: 'count',
    }),
  },
  {
    id: 'gift_r2_total',
    label: '2회전 기프트 할당량',
    group: 'gift',
    display: 'card',
    compute: (agg, query) => ({
      kind: 'value',
      value: scopeValue(query.route, agg.gift.r2Total, agg.gift.r2_203D, agg.gift.r2_206A),
      format: 'count',
    }),
  },
  {
    id: 'gift_route_share_203d',
    label: '203D 기프트 비중',
    group: 'gift',
    display: 'card',
    compute: (agg) => ({
      kind: 'value',
      value: agg.gift.total > 0 ? agg.gift.route203D / agg.gift.total : 0,
      format: 'percent',
    }),
  },
  {
    id: 'gift_route_share_206a',
    label: '206A 기프트 비중',
    group: 'gift',
    display: 'card',
    compute: (agg) => ({
      kind: 'value',
      value: agg.gift.total > 0 ? agg.gift.route206A / agg.gift.total : 0,
      format: 'percent',
    }),
  },

  // Returns
  {
    id: 'ret_total',
    label: '기간 반품 할당 합계',
    group: 'returns',
    display: 'card',
    compute: (agg, query) => ({
      kind: 'value',
      value: scopeValue(query.route, agg.returns.total, agg.returns.route203D, agg.returns.route206A),
      format: 'count',
    }),
  },
  {
    id: 'ret_not_collected_total',
    label: '반품 미회수 합계',
    group: 'returns',
    display: 'card',
    negative: true,
    compute: (agg, query) => ({
      kind: 'value',
      value: scopeValue(
        query.route,
        agg.returns.notCollectedTotal,
        agg.returns.notCollected203D,
        agg.returns.notCollected206A
      ),
      format: 'count',
      negative: true,
    }),
  },
  {
    id: 'ret_not_collected_203d',
    label: '203D 반품 미회수',
    group: 'returns',
    display: 'card',
    negative: true,
    compute: (agg) => ({
      kind: 'value',
      value: agg.returns.notCollected203D,
      format: 'count',
      negative: true,
    }),
  },
  {
    id: 'ret_not_collected_206a',
    label: '206A 반품 미회수',
    group: 'returns',
    display: 'card',
    negative: true,
    compute: (agg) => ({
      kind: 'value',
      value: agg.returns.notCollected206A,
      format: 'count',
      negative: true,
    }),
  },
  {
    id: 'ret_not_collected_by_reason',
    label: '반품 미회수 사유별',
    group: 'returns',
    display: 'table',
    compute: (agg) => ({
      kind: 'table',
      rows: Object.entries(agg.returns.notCollectedByReason).map(([reason, count]) => ({
        label: reasonLabels[reason as ReturnNotCollectedReason],
        value: count > 0 ? `-${count}건` : '0건',
      })),
    }),
  },

  // Freshbag
  {
    id: 'fb_gen_assigned',
    label: '프레시백 할당(일반)',
    group: 'freshbag',
    display: 'card',
    compute: (agg) => ({ kind: 'value', value: agg.freshBag.genAssigned, format: 'count' }),
  },
  {
    id: 'fb_solo_assigned',
    label: '프레시백 할당(단독)',
    group: 'freshbag',
    display: 'card',
    compute: (agg) => ({ kind: 'value', value: agg.freshBag.soloAssigned, format: 'count' }),
  },
  {
    id: 'fb_gen_uncollected',
    label: '프레시백 미회수(일반)',
    group: 'freshbag',
    display: 'card',
    negative: true,
    compute: (agg) => ({ kind: 'value', value: agg.freshBag.genUncollected, format: 'count', negative: true }),
  },
  {
    id: 'fb_solo_uncollected',
    label: '프레시백 미회수(단독)',
    group: 'freshbag',
    display: 'card',
    negative: true,
    compute: (agg) => ({ kind: 'value', value: agg.freshBag.soloUncollected, format: 'count', negative: true }),
  },
  {
    id: 'fb_rate_total',
    label: '프레시백 회수율(전체)',
    group: 'freshbag',
    display: 'card',
    compute: (agg) => ({
      kind: 'value',
      value: calcRate(
        agg.freshBag.genAssigned + agg.freshBag.soloAssigned,
        agg.freshBag.genUncollected + agg.freshBag.soloUncollected
      ),
      format: 'percent',
    }),
  },
  {
    id: 'fb_rate_gen',
    label: '프레시백 회수율(일반)',
    group: 'freshbag',
    display: 'card',
    compute: (agg) => ({
      kind: 'value',
      value: calcRate(agg.freshBag.genAssigned, agg.freshBag.genUncollected),
      format: 'percent',
    }),
  },
  {
    id: 'fb_rate_solo',
    label: '프레시백 회수율(단독)',
    group: 'freshbag',
    display: 'card',
    compute: (agg) => ({
      kind: 'value',
      value: calcRate(agg.freshBag.soloAssigned, agg.freshBag.soloUncollected),
      format: 'percent',
    }),
  },
  {
    id: 'fb_rate_203d',
    label: '203D 프레시백 회수율',
    group: 'freshbag',
    display: 'card',
    compute: (agg) => ({
      kind: 'value',
      value: calcRate(agg.freshBag.route203DAssigned, agg.freshBag.route203DUncollected),
      format: 'percent',
    }),
  },
  {
    id: 'fb_rate_206a',
    label: '206A 프레시백 회수율',
    group: 'freshbag',
    display: 'card',
    compute: (agg) => ({
      kind: 'value',
      value: calcRate(agg.freshBag.route206AAssigned, agg.freshBag.route206AUncollected),
      format: 'percent',
    }),
  },

  // Income
  {
    id: 'income_gift',
    label: '기프트 수입',
    group: 'income',
    display: 'card',
    compute: (agg) => ({ kind: 'value', value: agg.income.gift, format: 'currency' }),
  },
  {
    id: 'income_ret',
    label: '반품 수입',
    group: 'income',
    display: 'card',
    compute: (agg) => ({ kind: 'value', value: agg.income.returns, format: 'currency' }),
  },
  {
    id: 'income_fb',
    label: '프레시백 수입',
    group: 'income',
    display: 'card',
    compute: (agg) => ({ kind: 'value', value: agg.income.fbAssigned, format: 'currency' }),
  },
  {
    id: 'income_fb_deduct',
    label: '프레시백 차감',
    group: 'income',
    display: 'card',
    negative: true,
    compute: (agg) => ({ kind: 'value', value: agg.income.fbDeduct, format: 'currency', negative: true }),
  },
  {
    id: 'income_return_deduct',
    label: '반품 미회수 차감',
    group: 'income',
    display: 'card',
    negative: true,
    compute: (agg) => ({
      kind: 'value',
      value: agg.income.returnDeduct203D + agg.income.returnDeduct206A,
      format: 'currency',
      negative: true,
    }),
  },
  {
    id: 'income_total',
    label: '차감 반영 최종 수입',
    group: 'income',
    display: 'card',
    compute: (agg) => ({ kind: 'value', value: agg.income.total, format: 'currency' }),
  },
];

export const METRIC_PRESETS: MetricPreset[] = [
  {
    id: 'preset_settlement_summary',
    label: '이번 정산 요약',
    period: 'settlement',
    route: 'all',
    metrics: ['gift_total', 'ret_total', 'fb_rate_total', 'income_total', 'income_gift', 'income_ret'],
  },
  {
    id: 'preset_week_summary',
    label: '이번 주 요약',
    period: 'week',
    route: 'all',
    metrics: ['gift_total', 'ret_total', 'fb_rate_total', 'income_total'],
  },
  {
    id: 'preset_fb_rate',
    label: '프레시백 회수율 점검',
    period: 'week',
    route: 'all',
    metrics: ['fb_rate_total', 'fb_rate_203d', 'fb_rate_206a', 'fb_rate_gen', 'fb_rate_solo', 'fb_gen_uncollected', 'fb_solo_uncollected'],
  },
  {
    id: 'preset_route_share',
    label: '라우트 비중(203D/206A)',
    period: 'settlement',
    route: 'all',
    metrics: ['gift_route_share_203d', 'gift_route_share_206a'],
  },
  {
    id: 'preset_returns_uncollected',
    label: '반품 미회수(사유 포함)',
    period: 'settlement',
    route: 'all',
    metrics: ['ret_not_collected_total', 'ret_not_collected_203d', 'ret_not_collected_206a', 'ret_not_collected_by_reason'],
  },
];

export function getMetricById(id: string): MetricDefinition | undefined {
  return METRICS.find(metric => metric.id === id);
}
