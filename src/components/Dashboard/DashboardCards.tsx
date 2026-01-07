import { useState } from 'react';
import { Package, TrendingUp, Truck, Award, Sparkles, ChevronRight, X, RotateCcw, ArrowDownUp, Wallet } from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  calculatePeriodSummary,
  formatCurrency,
  formatPercent,
  getTodayRecords,
  calculateActualDeliveries,
  calculateDailyIncome,
  calculateDailyIncomeDetails,
  calculateDeliveryProgress,
  calculateReturnsProgress,
  calculateFBProgress,
  calculateTodayRegularFBRate,
  calculateTodayStandaloneFBRate,
} from '@/lib/calculations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function IncomeCard() {
  const { settings, records } = useStore();
  const summary = calculatePeriodSummary(records, settings);

  const hasRegularIncentive = summary.regularFBRate >= settings.incentive.regularThreshold;
  const hasStandaloneIncentive = summary.standaloneFBRate >= settings.incentive.standaloneThreshold;

  return (
    <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-lg animate-scale-in relative overflow-hidden">
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

        {(hasRegularIncentive || hasStandaloneIncentive) && (
          <div className="flex gap-2 flex-wrap">
            {hasRegularIncentive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                일반FB +{formatCurrency(summary.regularIncentive)}
              </div>
            )}
            {hasStandaloneIncentive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                단독FB +{formatCurrency(summary.standaloneIncentive)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TodayIncomeCard() {
  const { settings, records } = useStore();
  const todayRecords = getTodayRecords(records);
  const [showDetails, setShowDetails] = useState(false);
  
  const todayIncome = calculateDailyIncome(todayRecords, settings);
  const details = calculateDailyIncomeDetails(todayRecords, settings);

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className="w-full bg-card rounded-2xl p-5 shadow-card border border-border/30 animate-slide-up text-left hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">오늘의 수입</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(todayIncome)}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </button>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              오늘 수입 상세
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* 라우트별 수입 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">배송 수입</h4>
              {details.routeIncomes.length > 0 ? (
                details.routeIncomes.map((item) => (
                  <div key={item.route} className="flex items-center justify-between p-3 bg-accent/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{item.route}</span>
                      <span className="text-xs text-muted-foreground">{item.count}건</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.income)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">오늘 기록 없음</p>
              )}
            </div>

            {/* 반품 수입 */}
            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
              <span className="text-sm font-medium text-warning">반품</span>
              <span className="font-medium">{formatCurrency(details.returnsIncome)}</span>
            </div>

            {/* FB 수입 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">프레시백</h4>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <span className="text-sm font-medium text-success">일반(연계)</span>
                <span className="font-medium">{formatCurrency(details.fbIncome.regular)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <span className="text-sm font-medium text-success">단독</span>
                <span className="font-medium">{formatCurrency(details.fbIncome.standalone)}</span>
              </div>
            </div>

            {/* FB 인센티브 */}
            {(details.fbIncentive.regular > 0 || details.fbIncentive.standalone > 0) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  인센티브 (예상)
                </h4>
                {details.fbIncentive.regular > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                    <span className="text-sm font-medium text-primary">일반FB 인센티브</span>
                    <span className="font-medium text-primary">+{formatCurrency(details.fbIncentive.regular)}</span>
                  </div>
                )}
                {details.fbIncentive.standalone > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                    <span className="text-sm font-medium text-primary">단독FB 인센티브</span>
                    <span className="font-medium text-primary">+{formatCurrency(details.fbIncentive.standalone)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 합계 */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">오늘 총 수입</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(todayIncome)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TodayFBStatus() {
  const { settings, records } = useStore();
  const todayRecords = getTodayRecords(records);
  
  const regularRate = calculateTodayRegularFBRate(todayRecords);
  const standaloneRate = calculateTodayStandaloneFBRate(todayRecords);
  
  const regularTarget = settings.incentive.regularThreshold;
  const standaloneTarget = settings.incentive.standaloneThreshold;
  
  const regularAchieved = regularRate >= regularTarget;
  const standaloneAchieved = standaloneRate >= standaloneTarget;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30 animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success"></span>
        오늘 FB 현황
      </h3>
      
      <div className="space-y-4">
        {/* 일반(연계) FB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">일반(연계)</span>
              {regularAchieved && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium animate-pulse">
                  <Award className="w-3 h-3" />
                  달성!
                </span>
              )}
            </div>
            <span className={`text-sm font-bold ${regularAchieved ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(regularRate)}
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                regularAchieved ? 'bg-gradient-success' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, regularRate)}%` }}
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
            <span className="text-xs text-muted-foreground">목표 {regularTarget}%</span>
          </div>
        </div>

        {/* 단독 FB */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">단독</span>
              {standaloneAchieved && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium animate-pulse">
                  <Award className="w-3 h-3" />
                  달성!
                </span>
              )}
            </div>
            <span className={`text-sm font-bold ${standaloneAchieved ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(standaloneRate)}
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                standaloneAchieved ? 'bg-gradient-success' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, standaloneRate)}%` }}
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
            <span className="text-xs text-muted-foreground">목표 {standaloneTarget}%</span>
          </div>
        </div>
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
        이번 달 FB 회수율
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
                regularAchieved ? 'bg-gradient-success' : 'bg-primary'
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
                standaloneAchieved ? 'bg-gradient-success' : 'bg-primary'
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

function ProgressBar({ label, completed, total, color }: { 
  label: string; 
  completed: number; 
  total: number; 
  color: string;
}) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">
          {completed} / {total}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

export function TodayProgress() {
  const { records } = useStore();
  const todayRecords = getTodayRecords(records);
  
  const deliveryProgress = calculateDeliveryProgress(todayRecords);
  const returnsProgress = calculateReturnsProgress(todayRecords);
  const fbProgress = calculateFBProgress(todayRecords);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30 animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-warning"></span>
        오늘 진행률
      </h3>
      
      <div className="space-y-4">
        <ProgressBar 
          label="배송" 
          completed={deliveryProgress.completed} 
          total={deliveryProgress.total}
          color="bg-primary"
        />
        <ProgressBar 
          label="반품" 
          completed={returnsProgress.completed} 
          total={returnsProgress.total}
          color="bg-warning"
        />
        <ProgressBar 
          label="FB 회수" 
          completed={fbProgress.completed} 
          total={fbProgress.total}
          color="bg-success"
        />
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
      icon: RotateCcw,
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
