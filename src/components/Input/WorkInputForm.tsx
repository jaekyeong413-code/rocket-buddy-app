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
import { toast } from 'sonner';
import { StageIndicator, StageKey } from './StageIndicator';
import { StageA, StageB, StageC, StageD, StageE, StageF } from './stages';

export function WorkInputForm({ onComplete }: { onComplete?: () => void }) {
  const { 
    addRecord, 
    records, 
    settings, 
    getRouteRatio, 
    addAllocationHistory,
    getWorkData,
    updateWorkData,
    getCurrentInputDate,
    setCurrentInputDate,
  } = useStore();
  
  // 현재 입력 날짜 (store에서 관리 - 탭 이동해도 유지)
  const date = getCurrentInputDate();
  const ratio = getRouteRatio();

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

  // Stage A 핸들러들
  const handleFirstAllocationDeliveryChange = (value: string) => {
    const total = parseInt(value) || 0;
    const suggested203D = total > 0 ? Math.round((total * ratio['203D']) / 100) : 0;
    const suggested206A = total > 0 ? total - suggested203D : 0;
    
    updateWorkData(date, {
      firstAllocationDelivery: total,
      routes: {
        ...workData.routes,
        '203D': { ...delivery203D, allocated: suggested203D },
        '206A': { ...delivery206A, allocated: suggested206A },
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
    const remaining = parseInt(value) || 0;
    updateWorkData(date, { totalRemainingAfterFirstRound: remaining });
  };

  const handle203DRemainingChange = (value: string) => {
    const remaining203D = parseInt(value) || 0;
    const totalRemaining = workData.totalRemainingAfterFirstRound || 0;
    const remaining206A = Math.max(0, totalRemaining - remaining203D);
    
    updateWorkData(date, {
      routes: {
        ...workData.routes,
        '203D': { ...delivery203D, firstRoundRemaining: remaining203D },
        '206A': { ...delivery206A, firstRoundRemaining: remaining206A },
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

  // 오늘 예상 수입 실시간 계산
  const todayRecords = records.filter(r => r.date === date);
  const currentInputAsRecords: WorkRecord[] = [];
  
  const has203DData = (delivery203D.allocated || 0) > 0 || 
                      (delivery203D.firstRoundRemaining || 0) > 0 || 
                      (delivery203D.completed || 0) > 0;
  const has206AData = (delivery206A.allocated || 0) > 0 || 
                      (delivery206A.firstRoundRemaining || 0) > 0 || 
                      (delivery206A.completed || 0) > 0;
  
  if (has203DData) {
    currentInputAsRecords.push({
      id: 'temp-203d',
      date,
      route: '203D',
      round: 1,
      delivery: delivery203D,
      returns,
      freshBag,
    });
  }
  
  if (has206AData) {
    currentInputAsRecords.push({
      id: 'temp-206a',
      date,
      route: '206A',
      round: 1,
      delivery: delivery206A,
      returns: createDefaultReturnsData(),
      freshBag: createDefaultFreshBagData(),
    });
  }

  const estimatedIncome = calculateDailyIncome([...todayRecords, ...currentInputAsRecords], settings);

  const handleSubmit = () => {
    // 할당량 학습 데이터 저장
    if (delivery203D.allocated > 0 || delivery206A.allocated > 0) {
      addAllocationHistory({
        date,
        allocations: {
          '203D': delivery203D.allocated,
          '206A': delivery206A.allocated,
        },
      });
    }

    // 203D 라우트 저장
    if (delivery203D.allocated > 0 || delivery203D.completed > 0) {
      const record203D: WorkRecord = {
        id: `${date}-203D-1-${Date.now()}`,
        date,
        route: '203D',
        round: 1,
        delivery: delivery203D,
        returns: returns,
        freshBag: freshBag,
      };
      addRecord(record203D);
    }

    // 206A 라우트 저장
    if (delivery206A.allocated > 0 || delivery206A.completed > 0) {
      const record206A: WorkRecord = {
        id: `${date}-206A-1-${Date.now() + 1}`,
        date,
        route: '206A',
        round: 1,
        delivery: delivery206A,
        returns: createDefaultReturnsData(),
        freshBag: createDefaultFreshBagData(),
      };
      addRecord(record206A);
    }

    toast.success('작업 기록이 저장되었습니다!');
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
            ratio={ratio}
          />
        );
      case 'B':
        return (
          <StageB
            workData={workData}
            onTotalRemainingChange={handleTotalRemainingChange}
            on203DRemainingChange={handle203DRemainingChange}
            onFreshBagChange={handleFreshBagChange}
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
          />
        );
      case 'F':
        return (
          <StageF
            workData={workData}
            onFreshBagChange={handleFreshBagChange}
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
    </div>
  );
}
