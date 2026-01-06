import { Package, TrendingUp, Truck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  calculatePeriodSummary,
  formatCurrency,
  formatPercent,
  getTodayRecords,
} from '@/lib/calculations';

export function IncomeCard() {
  const { settings, records } = useStore();
  const summary = calculatePeriodSummary(records, settings);

  return (
    <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-lg animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-primary-foreground/80 text-sm font-medium">
          이번 정산 예상 실수령액
        </span>
        <TrendingUp className="w-5 h-5 text-primary-foreground/80" />
      </div>
      <div className="text-4xl font-extrabold tracking-tight mb-1">
        {formatCurrency(summary.netIncome)}
      </div>
      <p className="text-primary-foreground/70 text-sm">
        {summary.startDate.slice(5)} ~ {summary.endDate.slice(5)} 기준
      </p>
    </div>
  );
}

export function CollectionRateGauge() {
  const { settings, records } = useStore();
  const summary = calculatePeriodSummary(records, settings);

  const regularTarget = settings.incentive.regularThreshold;
  const standaloneTarget = settings.incentive.standaloneThreshold;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        프레시백 회수율
      </h3>
      <div className="space-y-4">
        {/* Regular FB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">일반(연계)</span>
            <span className={`text-sm font-bold ${summary.regularFBRate >= regularTarget ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(summary.regularFBRate)}
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                summary.regularFBRate >= regularTarget
                  ? 'bg-gradient-success'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, summary.regularFBRate)}%` }}
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-destructive"
              style={{ left: `${regularTarget}%` }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">
              목표 {regularTarget}%
            </span>
          </div>
        </div>

        {/* Standalone FB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">단독</span>
            <span className={`text-sm font-bold ${summary.standaloneFBRate >= standaloneTarget ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(summary.standaloneFBRate)}
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                summary.standaloneFBRate >= standaloneTarget
                  ? 'bg-gradient-success'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, summary.standaloneFBRate)}%` }}
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-destructive"
              style={{ left: `${standaloneTarget}%` }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">
              목표 {standaloneTarget}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TodayStats() {
  const { settings, records } = useStore();
  const todayRecords = getTodayRecords(records);

  const stats = todayRecords.reduce(
    (acc, record) => ({
      deliveries: acc.deliveries + record.delivery.completed,
      returns: acc.returns + record.returns.completed,
      freshBags:
        acc.freshBags +
        record.freshBag.regular +
        record.freshBag.standalone,
    }),
    { deliveries: 0, returns: 0, freshBags: 0 }
  );

  const items = [
    {
      label: '배송 완료',
      value: stats.deliveries,
      icon: Truck,
      color: 'text-primary',
      bg: 'bg-accent',
    },
    {
      label: '반품 완료',
      value: stats.returns,
      icon: Package,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'FB 회수',
      value: stats.freshBags,
      icon: Package,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        오늘 작업 현황
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-xl p-3 text-center`}
          >
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
