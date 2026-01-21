import { useState, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { WorkRecord, FreshBagData } from '@/types';
import { 
  formatDate, 
  createDefaultReturnsData, 
  createDefaultFreshBagData,
  createDefaultDeliveryData,
  calculateDailyIncome,
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
  const firstAllocationDelivery = workData.firstAllocationDelivery;
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

  // Stage A 핸들러들 - 50% 분배 제거, 203D만 할당
  const handleFirstAllocationDeliveryChange = (value: string) => {
    const total = parseInt(value) || 0;
    
    // Stage A: 배송 1차 전체 물량 = 203D 1회전 할당
    // 206A는 Stage B에서 계산됨
    updateWorkData(date, {
      firstAllocationDelivery: total,
      routes: {
        ...workData.routes,
        '203D': { ...delivery203D, allocated: total },
        '206A': { ...delivery206A, allocated: 0 }, // Stage B에서 설정
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

  // Stage B 핸들러들
  const handleTotalRemainingChange = (value: string) => {
    // 빈 문자열이면 0, 아니면 파싱 (0도 유효한 값으로 처리)
    const remaining = value === '' ? 0 : parseInt(value);
    updateWorkData(date, { totalRemainingAfterFirstRound: remaining });
  };

  const handle203DRemainingChange = (value: string) => {
    // 빈 문자열이면 0, 아니면 파싱 (0도 유효한 값으로 처리)
    const remaining203D = value === '' ? 0 : parseInt(value);
    const totalRemaining = workData.totalRemainingAfterFirstRound || 0;
    
    // 클램프: 0 ~ totalRemaining 범위
    const clampedRemaining203D = Math.max(0, Math.min(remaining203D, totalRemaining));
    
    // 206A 1차 할당 = 전체 잔여 - 203D 잔여
    const allocated206A = Math.max(0, totalRemaining - clampedRemaining203D);
    
    // SET 방식: 입력값으로 직접 대체 (누적 아님)
    updateWorkData(date, {
      routes: {
        ...workData.routes,
        '203D': { ...delivery203D, firstRoundRemaining: clampedRemaining203D },
        '206A': { ...delivery206A, allocated: allocated206A, firstRoundRemaining: 0 },
      },
    });
  };

  // Stage C 핸들러들
  const handleRound1EndRemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round1EndRemaining: remaining });
  };

  const handleFreshBagRound1EndChange = useCallback((data: FreshBagData) => {
    // Stage C에서 프레시백 잔여 입력 시 workData에도 저장
    updateWorkData(date, { 
      freshBag: data,
      freshBagRound1EndRegular: data.round1EndRegular || 0,
      freshBagRound1EndStandalone: data.round1EndStandalone || 0,
    });
  }, [date, updateWorkData]);

  // Stage D 핸들러들
  const handleRound2TotalRemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round2TotalRemaining: remaining });
  };

  const handleRound2TotalReturnsChange = (value: string) => {
    const returns = parseInt(value) || 0;
    updateWorkData(date, { round2TotalReturns: returns });
  };

  // Stage E 핸들러들
  const handleRound2RemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round2EndRemaining: remaining });
  };

  const handleRound2ReturnsRemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { round2EndReturnsRemaining: remaining });
  };

  // ★ 신규 5개 필드 핸들러
  const handleStageBReturnRemaining203DChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageB_returnRemaining_203D: val });
  };

  const handleStageBUnvisitedFBTotal203DChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageB_unvisitedFB_total_203D: val });
  };

  const handleStageCReturnRemaining206AChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageC_returnRemaining_206A: val });
  };

  const handleStageEUnvisitedFBSolo203DChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageE_unvisitedFB_solo_203D: val });
  };

  const handleStageFUnvisitedFBSolo206AChange = (value: string) => {
    const val = parseInt(value) || 0;
    updateWorkData(date, { stageF_unvisitedFB_solo_206A: val });
  };

  // 오늘 예상 수입 실시간 계산
  const todayRecords = records.filter(r => r.date === date);
  const currentInputAsRecords: WorkRecord[] = [];
  
  // ★ Stage A: 배송 1차 전체 물량 (= 203D 1회전 할당)
  const firstAllocation = workData.firstAllocationDelivery || 0;
  
  // ★ Stage B: 1회전 현재 '전체 잔여 물량'
  const totalRemaining = workData.totalRemainingAfterFirstRound || 0;
  
  // ★ Stage B: 203D 잔여 물량
  const remaining203D = delivery203D.firstRoundRemaining || 0;
  
  // ★ 핵심 계산: 203D 실제 처리량 = firstAllocation - totalRemaining
  const delivered203D = Math.max(0, firstAllocation - totalRemaining);
  
  // ★ 206A 할당 = totalRemaining - remaining203D
  const allocated206A = Math.max(0, totalRemaining - remaining203D);
  
  // 미배송 수량 계산 (수입 차감용)
  const undeliveredByRoute = (workData.undelivered || []).reduce((acc, entry) => {
    acc[entry.route] = (acc[entry.route] || 0) + entry.quantity;
    return acc;
  }, {} as Record<string, number>);
  
  const has203DData = delivered203D > 0;
  const has206AData = allocated206A > 0;
  
  // 203D 레코드 생성 - ★ allocated에 실제 처리량(delivered203D) 사용
  if (has203DData) {
    currentInputAsRecords.push({
      id: 'temp-203d',
      date,
      route: '203D',
      round: 1,
      delivery: {
        ...delivery203D,
        allocated: delivered203D, // ★ 할당이 아니라 실제 처리량
        cancelled: undeliveredByRoute['203D'] || 0,
      },
      returns,
      freshBag,
    });
  }
  
  // 206A 레코드 생성
  if (has206AData) {
    currentInputAsRecords.push({
      id: 'temp-206a',
      date,
      route: '206A',
      round: 1,
      delivery: {
        ...delivery206A,
        allocated: allocated206A,
        cancelled: undeliveredByRoute['206A'] || 0,
      },
      returns: createDefaultReturnsData(),
      freshBag: createDefaultFreshBagData(),
    });
  }

  // 채번 수입 계산 (라우트별 단가 적용)
  const numberedIncome = (workData.numbered || []).reduce((sum, entry) => {
    return sum + (settings.routes[entry.route] * entry.quantity);
  }, 0);

  const estimatedIncome = calculateDailyIncome([...todayRecords, ...currentInputAsRecords], settings) + numberedIncome;

  const handleSubmit = () => {
    // 할당량 학습 데이터 저장 - ★ 실제 처리량 사용
    if (delivered203D > 0 || allocated206A > 0) {
      addAllocationHistory({
        date,
        allocations: {
          '203D': delivered203D,
          '206A': allocated206A,
        },
      });
    }

    // 203D 라우트 저장 - ★ 실제 처리량 사용
    if (delivered203D > 0) {
      const record203D: WorkRecord = {
        id: `${date}-203D-1-${Date.now()}`,
        date,
        route: '203D',
        round: 1,
        delivery: {
          ...delivery203D,
          allocated: delivered203D, // ★ 실제 처리량
          cancelled: undeliveredByRoute['203D'] || 0,
        },
        returns: returns,
        freshBag: freshBag,
      };
      addRecord(record203D);
    }

    // 206A 라우트 저장
    if (allocated206A > 0) {
      const record206A: WorkRecord = {
        id: `${date}-206A-1-${Date.now() + 1}`,
        date,
        route: '206A',
        round: 1,
        delivery: {
          ...delivery206A,
          allocated: allocated206A,
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
            onStageBReturnRemaining203DChange={handleStageBReturnRemaining203DChange}
            onStageBUnvisitedFBTotal203DChange={handleStageBUnvisitedFBTotal203DChange}
          />
        );
      case 'C':
        return (
          <StageC
            workData={workData}
            onFreshBagChange={handleFreshBagRound1EndChange}
            onRound1EndRemainingChange={handleRound1EndRemainingChange}
            onStageCReturnRemaining206AChange={handleStageCReturnRemaining206AChange}
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
