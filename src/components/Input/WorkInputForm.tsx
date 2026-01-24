import { useState, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { WorkRecord, FreshBagData } from '@/types';
import { 
  formatDate, 
  createDefaultReturnsData, 
  createDefaultFreshBagData,
  calculateTodayIncome,
  formatCurrency,
} from '@/lib/calculations';
import { toast } from '@/hooks/use-toast';
import { StageIndicator, StageKey } from './StageIndicator';
import { StageA, StageB, StageC, StageD, StageE, StageF } from './stages';
import { QuickActionFAB } from './FAB';


export function WorkInputForm({ onComplete }: { onComplete?: () => void }) {
  const { 
    addRecord, 
    records, 
    settings, 
    addAllocationHistory,
    getWorkData,
    updateWorkData,
    getCurrentInputDate,
    setCurrentInputDate,
  } = useStore();
  
  // 현재 입력 날짜 (store에서 관리 - 탭 이동해도 유지)
  const date = getCurrentInputDate();

  // 현재 날짜의 작업 데이터 (store에서 관리 - 탭 이동해도 유지)
  const workData = getWorkData(date);

  // 현재 단계
  const [currentStage, setCurrentStage] = useState<StageKey>(workData.currentStage || 'A');

  // 편의를 위한 변수들
  const delivery203D = workData.routes['203D'];
  const delivery206A = workData.routes['206A'];
  const returns = workData.returns;
  const freshBag = workData.freshBag;

  // 날짜 변경 핸들러
  const handleDateChange = (newDate: string) => {
    setCurrentInputDate(newDate);
    const existingWorkData = getWorkData(newDate);
    setCurrentStage(existingWorkData.currentStage || 'A');
  };

  const adjustDate = (days: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + days);
    handleDateChange(formatDate(current));
  };

  // 단계 변경 시 저장
  const handleStageChange = (stage: StageKey) => {
    setCurrentStage(stage);
    updateWorkData(date, { currentStage: stage });
  };

  // ================================
  // Stage A 핸들러들
  // ================================
  const handleFirstAllocationDeliveryChange = (value: string) => {
    const total = parseInt(value) || 0;
    
    // Stage A: 배송 1차 전체 물량 = 203D 1회전 할당 (C_firstTotal)
    updateWorkData(date, {
      firstAllocationDelivery: total,
      routes: {
        ...workData.routes,
        '203D': { ...delivery203D, allocated: total },
        '206A': { ...delivery206A, allocated: 0 },
      },
    });
  };

  const handleFirstAllocationReturnsChange = (value: string) => {
    const total = parseInt(value) || 0;
    updateWorkData(date, {
      firstAllocationReturns: total,
      returns: { ...returns, allocated: total },
    });
  };

  const handleFreshBagChange = useCallback((data: FreshBagData) => {
    updateWorkData(date, { freshBag: data });
  }, [date, updateWorkData]);

  // ================================
  // Stage B 핸들러들
  // ================================
  // G: 1회전 현재 전체 잔여 물량
  const handleTotalRemainingChange = (value: string) => {
    const remaining = value === '' ? 0 : parseInt(value);
    updateWorkData(date, { totalRemainingAfterFirstRound: remaining });
  };

  // F: 203D 잔여 물량
  const handle203DRemainingChange = (value: string) => {
    const remaining203D = value === '' ? 0 : parseInt(value);
    const totalRemaining = workData.totalRemainingAfterFirstRound || 0;
    
    // 클램프: 0 ~ totalRemaining 범위
    const clampedRemaining203D = Math.max(0, Math.min(remaining203D, totalRemaining));
    
    // routes['203D'].firstRoundRemaining에 저장
    updateWorkData(date, {
      routes: {
        ...workData.routes,
        '203D': { ...delivery203D, firstRoundRemaining: clampedRemaining203D },
      },
    });
  };

  // 206A 잔여 반품 (반품 수익/통계용)
  const handleStageBReturnRemaining206AChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageB_returnRemaining_206A: val });
  };

  const handleStageBUnvisitedFBTotal203DChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageB_unvisitedFB_total_203D: val });
  };

  // ================================
  // Stage C 핸들러들
  // ================================
  // H: 1회전 종료 시점 잔여 물량
  const handleRound1EndRemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round1EndRemaining: remaining });
  };

  const handleFreshBagRound1EndChange = useCallback((data: FreshBagData) => {
    updateWorkData(date, { 
      freshBag: data,
      freshBagRound1EndRegular: data.round1EndRegular || 0,
      freshBagRound1EndStandalone: data.round1EndStandalone || 0,
    });
  }, [date, updateWorkData]);

  // ================================
  // Stage D 핸들러들
  // ================================
  // K: 2회전 출발 전 전체 남은 물량
  const handleRound2TotalRemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round2TotalRemaining: remaining });
  };

  const handleRound2TotalReturnsChange = (value: string) => {
    const returns = parseInt(value) || 0;
    updateWorkData(date, { round2TotalReturns: returns });
  };

  // ================================
  // Stage E 핸들러들
  // ================================
  // M: 2회전 종료 후 전체 남은 물량
  const handleRound2RemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round2EndRemaining: remaining });
  };

  // returnTotalFinal: 전체 남은 반품
  const handleRound2ReturnsRemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round2EndReturnsRemaining: remaining });
  };

  const handleStageEUnvisitedFBSolo203DChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageE_unvisitedFB_solo_203D: val });
  };

  // ================================
  // Stage F 핸들러들
  // ================================
  const handleStageFUnvisitedFBSolo206AChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageF_unvisitedFB_solo_206A: val });
  };

  // ================================
  // 실시간 예상 수입 계산 (엑셀식 단일 계산)
  // ================================
  const incomeBreakdown = calculateTodayIncome(workData, settings);
  const estimatedIncome = incomeBreakdown.totalIncome;

  // 미배송 수량 계산 (저장용)
  const undeliveredByRoute = (workData.undelivered || []).reduce((acc, entry) => {
    acc[entry.route] = (acc[entry.route] || 0) + entry.quantity;
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = () => {
    // 엑셀식 계산 결과 사용
    const giftPlan203D = incomeBreakdown.giftPlan203D;
    const giftPlan206A = incomeBreakdown.giftPlan206A;
    
    // 할당량 학습 데이터 저장
    if (giftPlan203D > 0 || giftPlan206A > 0) {
      addAllocationHistory({
        date,
        allocations: {
          '203D': giftPlan203D,
          '206A': giftPlan206A,
        },
      });
    }

    // 203D 라우트 저장
    if (giftPlan203D > 0) {
      const record203D: WorkRecord = {
        id: `${date}-203D-1-${Date.now()}`,
        date,
        route: '203D',
        round: 1,
        delivery: {
          ...delivery203D,
          allocated: giftPlan203D,
          cancelled: undeliveredByRoute['203D'] || 0,
        },
        returns: returns,
        freshBag: freshBag,
      };
      addRecord(record203D);
    }

    // 206A 라우트 저장
    if (giftPlan206A > 0) {
      const record206A: WorkRecord = {
        id: `${date}-206A-1-${Date.now() + 1}`,
        date,
        route: '206A',
        round: 1,
        delivery: {
          ...delivery206A,
          allocated: giftPlan206A,
          cancelled: undeliveredByRoute['206A'] || 0,
        },
        returns: createDefaultReturnsData(),
        freshBag: createDefaultFreshBagData(),
      };
      addRecord(record206A);
    }

    toast({ title: '작업 기록이 저장되었습니다!' });
    onComplete?.();
  };

  // 단계별 컴포넌트 렌더링
  const renderStageContent = () => {
    switch (currentStage) {
      case 'A':
        return (
          <StageA
            workData={workData}
            onFirstAllocationDeliveryChange={handleFirstAllocationDeliveryChange}
            onFirstAllocationReturnsChange={handleFirstAllocationReturnsChange}
            onFreshBagChange={handleFreshBagChange}
          />
        );
      case 'B':
        return (
          <StageB
            workData={workData}
            onTotalRemainingChange={handleTotalRemainingChange}
            on203DRemainingChange={handle203DRemainingChange}
            onFreshBagChange={handleFreshBagChange}
            onStageBReturnRemaining206AChange={handleStageBReturnRemaining206AChange}
            onStageBUnvisitedFBTotal203DChange={handleStageBUnvisitedFBTotal203DChange}
          />
        );
      case 'C':
        return (
          <StageC
            workData={workData}
            onFreshBagChange={handleFreshBagRound1EndChange}
            onRound1EndRemainingChange={handleRound1EndRemainingChange}
          />
        );
      case 'D':
        return (
          <StageD
            workData={workData}
            onFreshBagChange={handleFreshBagChange}
            onRound2TotalRemainingChange={handleRound2TotalRemainingChange}
            onRound2TotalReturnsChange={handleRound2TotalReturnsChange}
          />
        );
      case 'E':
        return (
          <StageE
            workData={workData}
            onRound2RemainingChange={handleRound2RemainingChange}
            onRound2ReturnsRemainingChange={handleRound2ReturnsRemainingChange}
            onFreshBagChange={handleFreshBagChange}
            onStageEUnvisitedFBSolo203DChange={handleStageEUnvisitedFBSolo203DChange}
          />
        );
      case 'F':
        return (
          <StageF
            workData={workData}
            onFreshBagChange={handleFreshBagChange}
            onStageFUnvisitedFBSolo206AChange={handleStageFUnvisitedFBSolo206AChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 실시간 예상 수입 표시 */}
      <div className="bg-gradient-primary rounded-2xl p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-80">오늘 예상 수입</span>
          <span className="text-2xl font-bold">{formatCurrency(estimatedIncome)}</span>
        </div>
        {/* 간략 상태 표시 */}
        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
          <span>203D: {incomeBreakdown.giftPlan203D}건</span>
          <span>206A: {incomeBreakdown.giftPlan206A}건</span>
          <span>반품: {incomeBreakdown.returnPlan203D + incomeBreakdown.returnPlan206A}건</span>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          날짜
        </label>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => adjustDate(-1)}
            className="touch-target flex items-center justify-center w-12 h-12 rounded-xl bg-muted hover:bg-muted/80"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="text-lg font-semibold bg-transparent text-center border-none focus:outline-none"
          />
          <button
            type="button"
            onClick={() => adjustDate(1)}
            className="touch-target flex items-center justify-center w-12 h-12 rounded-xl bg-muted hover:bg-muted/80"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stage Indicator */}
      <StageIndicator
        currentStage={currentStage}
        onStageChange={handleStageChange}
      />

      {/* Stage Content */}
      {renderStageContent()}

      {/* Submit Button - Stage F에서만 표시 */}
      {currentStage === 'F' && (
        <Button
          onClick={handleSubmit}
          className="w-full touch-target h-14 text-base font-semibold rounded-xl shadow-lg"
          size="lg"
        >
          <Check className="w-5 h-5 mr-2" />
          저장하기
        </Button>
      )}

      {/* 다음 단계 버튼 */}
      {currentStage !== 'F' && (
        <Button
          onClick={() => {
            const stages: StageKey[] = ['A', 'B', 'C', 'D', 'E', 'F'];
            const currentIndex = stages.indexOf(currentStage);
            if (currentIndex < stages.length - 1) {
              handleStageChange(stages[currentIndex + 1]);
            }
          }}
          variant="outline"
          className="w-full touch-target h-12 text-base font-medium rounded-xl"
        >
          다음 단계로 →
        </Button>
      )}

      {/* FAB - 플로팅 액션 버튼 */}
      <QuickActionFAB />
    </div>
  );
}
