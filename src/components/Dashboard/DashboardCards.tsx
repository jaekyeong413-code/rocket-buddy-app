import { Package, TrendingUp, Truck, Award, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  calculatePeriodSummary,
  formatCurrency,
  formatPercent,
  getTodayRecords,
  calculateActualDeliveries,
} from '@/lib/calculations';

export function IncomeCard() {
  const { settings, records } = useStore();
  const summary = calculatePeriodSummary(records, settings);

  const hasRegularIncentive = summary.regularFBRate >= settings.incentive.regularThreshold;
  const hasStandaloneIncentive = summary.standaloneFBRate >= settings.incentive.standaloneThreshold;

  return (
    <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-lg animate-scale-in relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-primary-foreground/80 text-sm font-medium">
            이번 정산 예상 실수령액
          </span>
          <TrendingUp className="w-5 h-5 text-primary-foreground/80" />
        </div>
        <div className="text-4xl font-extrabold tracking-tight mb-1">
          {formatCurrency(summary.netIncome)}
        </div>
        <p className="text-primary-foreground/70 text-sm mb-3">
          {summary.startDate.slice(5)} ~ {summary.endDate.slice(5)} 기준
        </p>

        {/* 인센티브 배지 */}
        {(hasRegularIncentive || hasStandaloneIncentive) && (
          <div className="flex gap-2 flex-wrap">
            {hasRegularIncentive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                일반FB 인센티브 +{formatCurrency(summary.regularIncentive)}
              </div>
            )}
            {hasStandaloneIncentive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                단독FB 인센티브 +{formatCurrency(summary.standaloneIncentive)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CollectionRateGauge() {
  const { settings, records } = useStore();
  const summary = calculatePeriodSummary(records, settings);

  const regularTarget = settings.incentive.regularThreshold;
  const standaloneTarget = settings.incentive.standaloneThreshold;

  const regularAchieved = summary.regularFBRate >= regularTarget;
  const standaloneAchieved = summary.standaloneFBRate >= standaloneTarget;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30 animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary"></span>
        프레시백 회수율
      </h3>
      <div className="space-y-4">
        {/* Regular FB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">일반(연계)</span>
              {regularAchieved && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium">
                  <Award className="w-3 h-3" />
                  달성!
                </span>
              )}
            </div>
            <span className={`text-sm font-bold ${regularAchieved ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(summary.regularFBRate)}
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                regularAchieved
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
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {regularAchieved ? `+${settings.incentive.regularBonus}원/건` : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              목표 {regularTarget}%
            </span>
          </div>
        </div>

        {/* Standalone FB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">단독</span>
              {standaloneAchieved && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium">
                  <Award className="w-3 h-3" />
                  달성!
                </span>
              )}
            </div>
            <span className={`text-sm font-bold ${standaloneAchieved ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(summary.standaloneFBRate)}
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                standaloneAchieved
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
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {standaloneAchieved ? `+${settings.incentive.standaloneBonus}원/건` : ''}
            </span>
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
  const { records } = useStore();
  const todayRecords = getTodayRecords(records);

  const stats = todayRecords.reduce(
    (acc, record) => ({
      deliveries: acc.deliveries + calculateActualDeliveries(record),
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
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30 animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success"></span>
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
