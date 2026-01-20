import { useState } from 'react';
import { Package, TrendingUp, Truck, Award, Sparkles, ChevronRight, RotateCcw, Wallet, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  calculatePeriodSummary,
  formatCurrency,
  formatPercent,
  getTodayRecords,
  calculateTodayIncome,
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
  const { settings, getTodayWorkData } = useStore();
  const [showDetails, setShowDetails] = useState(false);
  
  // 현재 입력 중인 오늘 데이터 (store에서 실시간 조회)
  const todayWorkData = getTodayWorkData();
  
  // ★ Plan/Loss/Extra 기반 수입 계산
  const incomeBreakdown = calculateTodayIncome(todayWorkData, settings);

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
              {incomeBreakdown.status === 'incomplete' && (
                <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                  입력 대기
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(incomeBreakdown.totalIncome)}
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
            {/* 상태 메시지 */}
            {incomeBreakdown.statusMessage && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{incomeBreakdown.statusMessage}</span>
              </div>
            )}

            {/* 기프트(배송) 수입 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">배송 수입 (기프트)</h4>
              {(incomeBreakdown.giftPlan203D > 0 || incomeBreakdown.giftPlan206A > 0) ? (
                <>
                  {incomeBreakdown.giftPlan203D > 0 && (
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">203D</span>
                        <span className="text-xs text-muted-foreground">
                          {incomeBreakdown.giftPlan203D - incomeBreakdown.giftLoss203D}건
                          {incomeBreakdown.giftLoss203D > 0 && (
                            <span className="text-destructive ml-1">(-{incomeBreakdown.giftLoss203D})</span>
                          )}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency((incomeBreakdown.giftPlan203D - incomeBreakdown.giftLoss203D) * settings.routes['203D'])}
                      </span>
                    </div>
                  )}
                  {incomeBreakdown.giftPlan206A > 0 && (
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">206A</span>
                        <span className="text-xs text-muted-foreground">
                          {incomeBreakdown.giftPlan206A - incomeBreakdown.giftLoss206A}건
                          {incomeBreakdown.giftLoss206A > 0 && (
                            <span className="text-destructive ml-1">(-{incomeBreakdown.giftLoss206A})</span>
                          )}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency((incomeBreakdown.giftPlan206A - incomeBreakdown.giftLoss206A) * settings.routes['206A'])}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Stage A/B 입력 필요</p>
              )}
            </div>

            {/* 반품 수입 */}
            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-warning">반품</span>
                <span className="text-xs text-muted-foreground">
                  {(todayWorkData.returns?.allocated || 0) - incomeBreakdown.returnLoss203D - incomeBreakdown.returnLoss206A}건
                  {(incomeBreakdown.returnLoss203D + incomeBreakdown.returnLoss206A) > 0 && (
                    <span className="text-destructive ml-1">
                      (-{incomeBreakdown.returnLoss203D + incomeBreakdown.returnLoss206A})
                    </span>
                  )}
                </span>
              </div>
              <span className="font-medium">{formatCurrency(incomeBreakdown.returnIncome)}</span>
            </div>

            {/* 프레시백 수입 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">프레시백</h4>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-success">일반(연계)</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.max(0, incomeBreakdown.fbPlanGeneral - incomeBreakdown.fbLossGeneral)}건
                    {incomeBreakdown.fbLossGeneral > 0 && (
                      <span className="text-destructive ml-1">(-{incomeBreakdown.fbLossGeneral})</span>
                    )}
                  </span>
                </div>
                <span className="font-medium">
                  {formatCurrency(Math.max(0, incomeBreakdown.fbPlanGeneral - incomeBreakdown.fbLossGeneral) * settings.freshBag.regular)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-success">단독</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.max(0, incomeBreakdown.fbPlanSolo - incomeBreakdown.fbLossSolo)}건
                    {incomeBreakdown.fbLossSolo > 0 && (
                      <span className="text-destructive ml-1">(-{incomeBreakdown.fbLossSolo})</span>
                    )}
                  </span>
                </div>
                <span className="font-medium">
                  {formatCurrency(Math.max(0, incomeBreakdown.fbPlanSolo - incomeBreakdown.fbLossSolo) * settings.freshBag.standalone)}
                </span>
              </div>
            </div>

            {/* 채번 수입 (Extra) */}
            {(incomeBreakdown.chaebeon203D > 0 || incomeBreakdown.chaebeon206A > 0) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  채번 (추가 수입)
                </h4>
                {incomeBreakdown.chaebeon203D > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">203D 채번</span>
                      <span className="text-xs text-muted-foreground">{incomeBreakdown.chaebeon203D}건</span>
                    </div>
                    <span className="font-medium text-blue-600">
                      +{formatCurrency(incomeBreakdown.chaebeon203D * settings.routes['203D'])}
                    </span>
                  </div>
                )}
                {incomeBreakdown.chaebeon206A > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">206A 채번</span>
                      <span className="text-xs text-muted-foreground">{incomeBreakdown.chaebeon206A}건</span>
                    </div>
                    <span className="font-medium text-blue-600">
                      +{formatCurrency(incomeBreakdown.chaebeon206A * settings.routes['206A'])}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 인센티브 */}
            {(incomeBreakdown.regularIncentive > 0 || incomeBreakdown.standaloneIncentive > 0) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  인센티브 (예상)
                </h4>
                {incomeBreakdown.regularIncentive > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">일반FB</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPercent(incomeBreakdown.regularFBRate)} ≥ {settings.incentive.regularThreshold}%
                      </span>
                    </div>
                    <span className="font-medium text-primary">+{formatCurrency(incomeBreakdown.regularIncentive)}</span>
                  </div>
                )}
                {incomeBreakdown.standaloneIncentive > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">단독FB</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPercent(incomeBreakdown.standaloneFBRate)} ≥ {settings.incentive.standaloneThreshold}%
                      </span>
                    </div>
                    <span className="font-medium text-primary">+{formatCurrency(incomeBreakdown.standaloneIncentive)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 최종 합계 */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">오늘 총 수입</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(incomeBreakdown.totalIncome)}</span>
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
  
  // 프레시백 시작 = 할당 + 조정 - 이관 + 추가
  const freshbagStart = (freshBag.regularAllocated || 0) + (freshBag.standaloneAllocated || 0) 
                        + (freshBag.regularAdjustment || 0) 
                        - (freshBag.transferred || 0) + (freshBag.added || 0);
  
  // 미방문 합계 (Stage F 입력값)
  const totalUndone = (freshBag.undoneLinked || 0) + (freshBag.undoneSolo || 0);
  
  // 완료 = 시작 - 미방문 (음수 방지)
  const freshbagCompleted = Math.max(0, freshbagStart - totalUndone);
  
  // 진행률 = 완료 / 시작
  const progressRate = freshbagStart > 0 ? (freshbagCompleted / freshbagStart) * 100 : 0;
  
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
      
      {/* 미방문 표시 */}
      {totalUndone > 0 && (
        <div className="mt-4 p-3 bg-warning/10 rounded-xl">
          <div className="text-xs text-warning font-medium">
            미방문: 일반(연계) {freshBag.undoneLinked || 0}건, 단독 {freshBag.undoneSolo || 0}건
          </div>
        </div>
      )}
      
      {/* 미회수 사유 표시 (failedAbsent, failedWithProducts) */}
      {((freshBag.failedAbsent || 0) + (freshBag.failedWithProducts || 0)) > 0 && (
        <div className="mt-2 p-3 bg-destructive/10 rounded-xl">
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
  // 중요: firstRoundRemaining은 사용자가 입력한 값 그대로 유지 (set, not +=)
  const createEnhancedDelivery = (baseDelivery: typeof delivery203D, ratio: number): typeof delivery203D => {
    const allocated = (baseDelivery.allocated || 0) > 0 
      ? baseDelivery.allocated 
      : Math.round(firstAllocationDelivery * ratio);
    
    // 사용자 입력 firstRoundRemaining을 그대로 사용 (2차 물량과 누적하지 않음)
    const userInputRemaining = baseDelivery.firstRoundRemaining ?? 0;
    
    return {
      ...baseDelivery,
      allocated,
      // SET 방식: 사용자 입력값만 사용, 누적 없음
      firstRoundRemaining: userInputRemaining,
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
