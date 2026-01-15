import { useState } from 'react';
import { Package, TrendingUp, Truck, Award, Sparkles, ChevronRight, RotateCcw, Wallet } from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  calculatePeriodSummary,
  formatCurrency,
  formatPercent,
  getTodayRecords,
  calculateDailyIncome,
  calculateDailyIncomeDetails,
  calculateDeliveryProgress,
  calculateReturnsProgress,
  calculateFBProgress,
  formatDate,
  createDefaultReturnsData,
  createDefaultFreshBagData,
} from '@/lib/calculations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkRecord } from '@/types';

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
  const { settings, records, getTodayWorkData } = useStore();
  const [showDetails, setShowDetails] = useState(false);
  
  // 저장된 오늘 기록
  const savedTodayRecords = getTodayRecords(records);
  
  // 현재 입력 중인 오늘 데이터 (store에서 실시간 조회)
  const todayWorkData = getTodayWorkData();
  const today = formatDate(new Date());
  
  // 현재 입력 중인 데이터를 임시 레코드로 변환
  const currentInputAsRecords: WorkRecord[] = [];
  const delivery203D = todayWorkData.routes['203D'];
  const delivery206A = todayWorkData.routes['206A'];
  const freshBag = todayWorkData.freshBag;
  const returns = todayWorkData.returns;
  
  // 2차 관련 필드들을 DeliveryData에 매핑 (계산 로직이 읽을 수 있도록)
  // round2TotalRemaining = 1회전 잔여 포함 전체 남은 물량 (2차 상차 시점)
  // 이 값이 있으면 firstRoundRemaining에 추가 반영
  const round2Remaining = todayWorkData.round2TotalRemaining || 0;
  const round1EndRemaining = todayWorkData.round1EndRemaining || 0;
  
  // 1차 할당 배송량을 routes에 반영 (Stage A 입력 시)
  const firstAllocationDelivery = todayWorkData.firstAllocationDelivery || 0;
  
  // 모든 단계(A~F)의 입력을 포함하여 레코드 생성 여부 결정
  const hasAnyDeliveryInput = 
    firstAllocationDelivery > 0 ||
    (todayWorkData.totalRemainingAfterFirstRound || 0) > 0 ||
    round1EndRemaining > 0 ||
    round2Remaining > 0 ||
    (todayWorkData.round2EndRemaining || 0) > 0;
  
  const has203DData = hasAnyDeliveryInput ||
                      (delivery203D.allocated || 0) > 0 || 
                      (delivery203D.firstRoundRemaining || 0) > 0 || 
                      (delivery203D.completed || 0) > 0;
  const has206AData = hasAnyDeliveryInput ||
                      (delivery206A.allocated || 0) > 0 || 
                      (delivery206A.firstRoundRemaining || 0) > 0 || 
                      (delivery206A.completed || 0) > 0;
  
  // 2차 데이터를 포함한 DeliveryData 생성
  // 계산 로직(calculateExpectedDeliveries)이 allocated + firstRoundRemaining을 사용하므로
  // 2차 데이터(round2TotalRemaining)를 firstRoundRemaining에 합산
  const createEnhancedDelivery = (baseDelivery: typeof delivery203D, ratio: number): typeof delivery203D => {
    const allocated = (baseDelivery.allocated || 0) > 0 
      ? baseDelivery.allocated 
      : Math.round(firstAllocationDelivery * ratio);
    
    // 2차 잔여물량이 있으면 firstRoundRemaining에 합산 (계산식에 반영되도록)
    const additionalRemaining = Math.round((round2Remaining + round1EndRemaining) * ratio);
    
    return {
      ...baseDelivery,
      allocated,
      firstRoundRemaining: (baseDelivery.firstRoundRemaining || 0) + additionalRemaining,
    };
  };
  
  // 라우트 비율 (기본값 50:50, 과거 데이터 기반 학습 가능)
  const ratio203D = 0.5;
  const ratio206A = 0.5;
  
  if (has203DData) {
    currentInputAsRecords.push({
      id: 'temp-203d',
      date: today,
      route: '203D',
      round: 1,
      delivery: createEnhancedDelivery(delivery203D, ratio203D),
      returns,
      freshBag,
    });
  }
  
  if (has206AData) {
    currentInputAsRecords.push({
      id: 'temp-206a',
      date: today,
      route: '206A',
      round: 1,
      delivery: createEnhancedDelivery(delivery206A, ratio206A),
      returns: createDefaultReturnsData(),
      freshBag: createDefaultFreshBagData(),
    });
  }

  // 저장된 기록 + 현재 입력 중인 데이터 합산
  const allTodayRecords = [...savedTodayRecords, ...currentInputAsRecords];
  
  // 채번 수입 계산 (라우트별 단가 적용)
  const numberedIncome = (todayWorkData.numbered || []).reduce((sum, entry) => {
    return sum + (settings.routes[entry.route] * entry.quantity);
  }, 0);
  
  const todayIncome = calculateDailyIncome(allTodayRecords, settings) + numberedIncome;
  const details = calculateDailyIncomeDetails(allTodayRecords, settings);

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
              <span className="text-sm font-medium text-muted-foreground">오늘의 예상 수입</span>
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

            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-warning">반품</span>
                <span className="text-xs text-muted-foreground">{details.returnsCount}건</span>
              </div>
              <span className="font-medium">{formatCurrency(details.returnsIncome)}</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">프레시백</h4>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-success">일반(연계)</span>
                  <span className="text-xs text-muted-foreground">{details.fbCount.regular}건</span>
                </div>
                <span className="font-medium">{formatCurrency(details.fbIncome.regular)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-success">단독</span>
                  <span className="text-xs text-muted-foreground">{details.fbCount.standalone}건</span>
                </div>
                <span className="font-medium">{formatCurrency(details.fbIncome.standalone)}</span>
              </div>
            </div>

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
  const { settings, records, getTodayWorkData } = useStore();
  const savedTodayRecords = getTodayRecords(records);
  const todayWorkData = getTodayWorkData();
  const today = formatDate(new Date());
  
  // 현재 입력 중인 프레시백 데이터
  const freshBag = todayWorkData.freshBag;
  
  // 진행률용 회수율 (전체 기준)
  const totalAllocated = (freshBag.regularAllocated || 0) + (freshBag.standaloneAllocated || 0) 
                         + (freshBag.regularAdjustment || 0) 
                         - (freshBag.transferred || 0) + (freshBag.added || 0);
  const totalFailed = (freshBag.failedAbsent || 0) + (freshBag.failedWithProducts || 0);
  const progressRate = totalAllocated > 0 ? ((totalAllocated - totalFailed) / totalAllocated) * 100 : 0;
  
  // 평가용 단독 회수율
  const standaloneAllocated = Math.max(0, (freshBag.standaloneAllocated || 0) - (freshBag.regularAdjustment || 0));
  const standaloneRate = standaloneAllocated > 0 ? 100 : 0; // 단독은 별도 미회수 없음
  
  const regularTarget = settings.incentive.regularThreshold;
  const standaloneTarget = settings.incentive.standaloneThreshold;
  
  const regularAchieved = progressRate >= regularTarget;
  const standaloneAchieved = standaloneRate >= standaloneTarget;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30 animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success"></span>
        오늘 FB 현황
      </h3>
      
      <div className="space-y-4">
        {/* 진행률용 회수율 (전체) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">진행률 (전체)</span>
              {regularAchieved && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium animate-pulse">
                  <Award className="w-3 h-3" />
                  달성!
                </span>
              )}
            </div>
            <span className={`text-sm font-bold ${regularAchieved ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(progressRate)}
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                regularAchieved ? 'bg-gradient-success' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, progressRate)}%` }}
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

        {/* 평가용 단독 회수율 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">단독 (평가용)</span>
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
      
      {/* 미회수 사유 표시 */}
      {totalFailed > 0 && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-xl">
          <div className="text-xs text-destructive font-medium">
            확인 완료 (단가 미지급): 부재 {freshBag.failedAbsent || 0}건, 상품 남아 있음 {freshBag.failedWithProducts || 0}건
          </div>
        </div>
      )}
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
  const { records, getTodayWorkData } = useStore();
  const savedTodayRecords = getTodayRecords(records);
  const todayWorkData = getTodayWorkData();
  const today = formatDate(new Date());
  
  // 현재 입력 중인 데이터를 임시 레코드로 변환
  const currentInputAsRecords: WorkRecord[] = [];
  const delivery203D = todayWorkData.routes['203D'];
  const delivery206A = todayWorkData.routes['206A'];
  
  // 2차 관련 필드
  const round2Remaining = todayWorkData.round2TotalRemaining || 0;
  const round1EndRemaining = todayWorkData.round1EndRemaining || 0;
  const firstAllocationDelivery = todayWorkData.firstAllocationDelivery || 0;
  
  // 모든 단계(A~F)의 입력을 포함하여 레코드 생성 여부 결정
  const hasAnyDeliveryInput = 
    firstAllocationDelivery > 0 ||
    (todayWorkData.totalRemainingAfterFirstRound || 0) > 0 ||
    round1EndRemaining > 0 ||
    round2Remaining > 0 ||
    (todayWorkData.round2EndRemaining || 0) > 0;
  
  const has203DData = hasAnyDeliveryInput ||
                      (delivery203D.allocated || 0) > 0 || 
                      (delivery203D.firstRoundRemaining || 0) > 0 || 
                      (delivery203D.completed || 0) > 0;
  const has206AData = hasAnyDeliveryInput ||
                      (delivery206A.allocated || 0) > 0 || 
                      (delivery206A.firstRoundRemaining || 0) > 0 || 
                      (delivery206A.completed || 0) > 0;
  
  // 2차 데이터를 포함한 DeliveryData 생성
  const createEnhancedDelivery = (baseDelivery: typeof delivery203D, ratio: number): typeof delivery203D => {
    const allocated = (baseDelivery.allocated || 0) > 0 
      ? baseDelivery.allocated 
      : Math.round(firstAllocationDelivery * ratio);
    const additionalRemaining = Math.round((round2Remaining + round1EndRemaining) * ratio);
    return {
      ...baseDelivery,
      allocated,
      firstRoundRemaining: (baseDelivery.firstRoundRemaining || 0) + additionalRemaining,
    };
  };
  
  const ratio203D = 0.5;
  const ratio206A = 0.5;
  
  if (has203DData) {
    currentInputAsRecords.push({
      id: 'temp-203d',
      date: today,
      route: '203D',
      round: 1,
      delivery: createEnhancedDelivery(delivery203D, ratio203D),
      returns: todayWorkData.returns,
      freshBag: todayWorkData.freshBag,
    });
  }
  
  if (has206AData) {
    currentInputAsRecords.push({
      id: 'temp-206a',
      date: today,
      route: '206A',
      round: 1,
      delivery: createEnhancedDelivery(delivery206A, ratio206A),
      returns: createDefaultReturnsData(),
      freshBag: createDefaultFreshBagData(),
    });
  }

  const allTodayRecords = [...savedTodayRecords, ...currentInputAsRecords];
  
  const deliveryProgress = calculateDeliveryProgress(allTodayRecords);
  const returnsProgress = calculateReturnsProgress(allTodayRecords);
  const fbProgress = calculateFBProgress(allTodayRecords);

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
  const { records, getTodayWorkData } = useStore();
  const savedTodayRecords = getTodayRecords(records);
  const todayWorkData = getTodayWorkData();
  const today = formatDate(new Date());

  // 현재 입력 중인 데이터를 임시 레코드로 변환
  const currentInputAsRecords: WorkRecord[] = [];
  const delivery203D = todayWorkData.routes['203D'];
  const delivery206A = todayWorkData.routes['206A'];
  
  if (delivery203D.allocated > 0 || delivery203D.completed > 0) {
    currentInputAsRecords.push({
      id: 'temp-203d',
      date: today,
      route: '203D',
      round: 1,
      delivery: delivery203D,
      returns: todayWorkData.returns,
      freshBag: todayWorkData.freshBag,
    });
  }
  
  if (delivery206A.allocated > 0 || delivery206A.completed > 0) {
    currentInputAsRecords.push({
      id: 'temp-206a',
      date: today,
      route: '206A',
      round: 1,
      delivery: delivery206A,
      returns: createDefaultReturnsData(),
      freshBag: createDefaultFreshBagData(),
    });
  }

  const allTodayRecords = [...savedTodayRecords, ...currentInputAsRecords];

  const deliveryProgress = calculateDeliveryProgress(allTodayRecords);
  const returnsProgress = calculateReturnsProgress(allTodayRecords);
  const fbProgress = calculateFBProgress(allTodayRecords);

  const items = [
    {
      label: '배송',
      value: deliveryProgress.completed,
      total: deliveryProgress.total,
      icon: Truck,
      color: 'text-primary',
      bg: 'bg-accent',
    },
    {
      label: '반품',
      value: returnsProgress.completed,
      total: returnsProgress.total,
      icon: RotateCcw,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'FB',
      value: fbProgress.completed,
      total: fbProgress.total,
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
              {item.label} / {item.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
