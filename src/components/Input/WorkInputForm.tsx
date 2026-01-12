import { useCallback, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight, Lightbulb, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { WorkRecord, DeliveryData } from '@/types';
import { 
  formatDate, 
  createDefaultReturnsData, 
  createDefaultFreshBagData,
  createDefaultDeliveryData,
  calculateDailyIncome,
  formatCurrency,
} from '@/lib/calculations';
import { RouteCard } from './RouteCard';
import { ReturnsCard } from './ReturnsCard';
import { FreshBagCard } from './FreshBagCard';
import { toast } from 'sonner';

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

  // 편의를 위한 변수들
  const firstAllocationDelivery = workData.firstAllocationDelivery;
  const firstAllocationReturns = workData.firstAllocationReturns;
  const totalRemainingAfterFirstRound = workData.totalRemainingAfterFirstRound;
  const delivery203D = workData.routes['203D'];
  const delivery206A = workData.routes['206A'];
  const returns = workData.returns;
  const freshBag = workData.freshBag;

  // 날짜 변경 시 저장된 기록이 있으면 prefill
  const handleDateChange = (newDate: string) => {
    setCurrentInputDate(newDate);
    
    // 이미 workDataByDate에 데이터가 있으면 그대로 사용
    const existingWorkData = getWorkData(newDate);
    if (existingWorkData.firstAllocationDelivery > 0 || 
        existingWorkData.routes['203D'].allocated > 0 || 
        existingWorkData.routes['206A'].allocated > 0) {
      return; // 이미 입력 데이터가 있음
    }
    
    // 저장된 records에서 해당 날짜 데이터 로드 (prefill)
    const savedRecords = records.filter(r => r.date === newDate);
    if (savedRecords.length > 0) {
      const record203D = savedRecords.find(r => r.route === '203D');
      const record206A = savedRecords.find(r => r.route === '206A');
      
      const total203D = record203D?.delivery.allocated || 0;
      const total206A = record206A?.delivery.allocated || 0;
      const totalAlloc = total203D + total206A;
      
      updateWorkData(newDate, {
        firstAllocationDelivery: totalAlloc,
        firstAllocationReturns: record203D?.returns.allocated || 0,
        routes: {
          '203D': record203D?.delivery || createDefaultDeliveryData(),
          '206A': record206A?.delivery || createDefaultDeliveryData(),
        },
        returns: record203D?.returns || createDefaultReturnsData(),
        freshBag: record203D?.freshBag || createDefaultFreshBagData(),
      });
    }
  };

  const adjustDate = (days: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + days);
    handleDateChange(formatDate(current));
  };

  // 1차 할당 배송 입력 시 라우트별 자동 분배
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

  // 1회전 잔여 포함 전체 남은 물량 입력
  const handleTotalRemainingChange = (value: string) => {
    const remaining = parseInt(value) || 0;
    const firstAlloc = firstAllocationDelivery || 0;
    
    let remaining203D = 0;
    let remaining206A = 0;
    
    if (remaining > 0 && remaining > firstAlloc) {
      const firstRoundRemaining = remaining - firstAlloc;
      remaining203D = Math.round((firstRoundRemaining * ratio['203D']) / 100);
      remaining206A = firstRoundRemaining - remaining203D;
    }
    
    updateWorkData(date, {
      totalRemainingAfterFirstRound: remaining,
      routes: {
        ...workData.routes,
        '203D': { ...delivery203D, firstRoundRemaining: remaining203D },
        '206A': { ...delivery206A, firstRoundRemaining: remaining206A },
      },
    });
  };

  // 라우트별 할당 수정 시 총량 불변: 한쪽 변경 → 다른쪽 자동 보정
  const handleDelivery203DChange = useCallback((data: DeliveryData) => {
    const round1Total = firstAllocationDelivery || 0;
    const currentWorkData = getWorkData(date);
    const newAllocated203D = data.allocated;
    
    // 할당량이 변경되었으면 206A를 자동 보정
    if (newAllocated203D !== currentWorkData.routes['203D'].allocated && round1Total > 0) {
      const new206AAllocated = Math.max(0, round1Total - newAllocated203D);
      updateWorkData(date, {
        routes: {
          ...currentWorkData.routes,
          '203D': data,
          '206A': { ...currentWorkData.routes['206A'], allocated: new206AAllocated },
        },
      });
    } else {
      updateWorkData(date, {
        routes: {
          ...currentWorkData.routes,
          '203D': data,
        },
      });
    }
  }, [date, firstAllocationDelivery, getWorkData, updateWorkData]);

  const handleDelivery206AChange = useCallback((data: DeliveryData) => {
    const round1Total = firstAllocationDelivery || 0;
    const currentWorkData = getWorkData(date);
    const newAllocated206A = data.allocated;
    
    // 할당량이 변경되었으면 203D를 자동 보정
    if (newAllocated206A !== currentWorkData.routes['206A'].allocated && round1Total > 0) {
      const new203DAllocated = Math.max(0, round1Total - newAllocated206A);
      updateWorkData(date, {
        routes: {
          ...currentWorkData.routes,
          '203D': { ...currentWorkData.routes['203D'], allocated: new203DAllocated },
          '206A': data,
        },
      });
    } else {
      updateWorkData(date, {
        routes: {
          ...currentWorkData.routes,
          '206A': data,
        },
      });
    }
  }, [date, firstAllocationDelivery, getWorkData, updateWorkData]);

  // 1차 할당 반품 입력
  const handleFirstAllocationReturnsChange = (value: string) => {
    const total = parseInt(value) || 0;
    updateWorkData(date, {
      firstAllocationReturns: total,
      returns: { ...returns, allocated: total },
    });
  };

  // 프레시백 변경
  const handleFreshBagChange = useCallback((data: typeof freshBag) => {
    updateWorkData(date, { freshBag: data });
  }, [date, updateWorkData]);

  // 반품 변경
  const handleReturnsChange = useCallback((data: typeof returns) => {
    updateWorkData(date, { returns: data });
  }, [date, updateWorkData]);

  // 오늘 총 물량 = 1차 할당 + 1회전 잔여분 (원본 기준값 사용)
  const round1Total = firstAllocationDelivery || 0;
  const firstRoundRemainingTotal = (delivery203D.firstRoundRemaining || 0) + (delivery206A.firstRoundRemaining || 0);
  const todayTotalDelivery = round1Total + firstRoundRemainingTotal;

  // 오늘 예상 수입 실시간 계산
  const todayRecords = records.filter(r => r.date === date);
  const currentInputAsRecords: WorkRecord[] = [];
  
  if (delivery203D.allocated > 0 || delivery203D.completed > 0) {
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
  
  if (delivery206A.allocated > 0 || delivery206A.completed > 0) {
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

  const resetToRatio = () => {
    const total = firstAllocationDelivery || 0;
    if (total > 0) {
      const suggested203D = Math.round((total * ratio['203D']) / 100);
      const suggested206A = total - suggested203D;
      updateWorkData(date, {
        routes: {
          ...workData.routes,
          '203D': { ...delivery203D, allocated: suggested203D },
          '206A': { ...delivery206A, allocated: suggested206A },
        },
      });
    }
  };

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
    
    // 저장 후에도 입력값 유지 - 사용자가 즉시 수정 후 다시 저장 가능
    // clearWorkData 호출 제거 (사용자 요청)
    
    onComplete?.();
  };

  // 프레시백 회수율 계산 (진행률용: 전체 기준)
  const totalFBAllocated = (freshBag.regularAllocated || 0) + (freshBag.standaloneAllocated || 0) 
                           + (freshBag.regularAdjustment || 0) 
                           - (freshBag.transferred || 0) + (freshBag.added || 0);
  const totalFBFailed = (freshBag.failedAbsent || 0) + (freshBag.failedWithProducts || 0);
  const progressFBRate = totalFBAllocated > 0 
    ? ((totalFBAllocated - totalFBFailed) / totalFBAllocated * 100).toFixed(1) 
    : '0.0';
  
  // 단독 회수율 (평가용: 단독 기준)
  const standaloneAllocated = Math.max(0, (freshBag.standaloneAllocated || 0) - (freshBag.regularAdjustment || 0));
  const standaloneFBRate = standaloneAllocated > 0 ? '100.0' : '0.0'; // 단독은 미회수 따로 집계 안함

  return (
    <div className="space-y-5 animate-slide-up">
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

      {/* 1차 할당 섹션 (배송 + 반품 + 프레시백 할당) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">1차 할당 (출발 전)</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            학습 비중: {ratio['203D']}% / {ratio['206A']}%
          </span>
        </div>

        {/* 1차 할당 배송 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              배송 할당
            </label>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={firstAllocationDelivery || ''}
            onChange={(e) => handleFirstAllocationDeliveryChange(e.target.value.replace(/\D/g, ''))}
            placeholder="전체 배송 할당량 입력"
            className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* 1차 할당 반품 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              반품 할당
            </label>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={firstAllocationReturns || ''}
            onChange={(e) => handleFirstAllocationReturnsChange(e.target.value.replace(/\D/g, ''))}
            placeholder="전체 반품 할당량 입력"
            className="w-full h-12 px-4 text-lg font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
          />
        </div>

        {/* 프레시백 할당 (1차 할당과 동일 레벨) */}
        <div className="mb-4 p-4 bg-success/5 rounded-xl border border-success/20">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-success" />
            <label className="text-xs font-semibold text-success">
              프레시백 할당 (오늘 전량)
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">일반(연계)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={freshBag.regularAllocated || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  handleFreshBagChange({ ...freshBag, regularAllocated: val });
                }}
                placeholder="0"
                className="w-full h-12 px-3 text-lg font-bold text-center bg-background rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">단독</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={freshBag.standaloneAllocated || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  handleFreshBagChange({ ...freshBag, standaloneAllocated: val });
                }}
                placeholder="0"
                className="w-full h-12 px-3 text-lg font-bold text-center bg-background rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* 프레시백 라우트 분배 (206A 입력, 203D 자동 계산) - 항상 표시 */}
          <div className="mt-4 pt-3 border-t border-success/20">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              라우트별 분배
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">206A</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={freshBag.route206ACount || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                    handleFreshBagChange({ ...freshBag, route206ACount: val });
                  }}
                  placeholder="직접 입력"
                  className="w-full h-10 px-3 text-base font-bold text-center bg-background rounded-xl border-2 border-primary/30 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">203D (자동)</label>
                <div className={`w-full h-10 px-3 text-base font-bold text-center rounded-xl border-2 flex items-center justify-center ${
                  totalFBAllocated - (freshBag.route206ACount || 0) < 0 
                    ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                    : 'bg-muted border-border/30 text-foreground'
                }`}>
                  {totalFBAllocated - (freshBag.route206ACount || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* 회수율 2층 표시 */}
          <div className="flex justify-between mt-3 text-xs">
            <span className="text-muted-foreground">
              진행률: <span className="font-bold text-success">{progressFBRate}%</span>
            </span>
            <span className="text-muted-foreground">
              단독 회수율: <span className="font-bold text-primary">{standaloneFBRate}%</span>
            </span>
          </div>
        </div>

        {/* 1회전 잔여 포함 전체 남은 물량 */}
        <div className="mb-4 p-3 bg-accent/30 rounded-xl border-2 border-dashed border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-primary">
              1회전 잔여 포함 전체 남은 물량
            </label>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={totalRemainingAfterFirstRound || ''}
            onChange={(e) => handleTotalRemainingChange(e.target.value.replace(/\D/g, ''))}
            placeholder="1회전 후 잔여 포함 물량"
            className="w-full h-12 px-4 text-lg font-bold text-center bg-background rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
          />
          {(delivery203D.firstRoundRemaining > 0 || delivery206A.firstRoundRemaining > 0) && (
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>203D 잔여: <span className="font-bold text-primary">{delivery203D.firstRoundRemaining || 0}</span></span>
              <span>206A 잔여: <span className="font-bold text-primary">{delivery206A.firstRoundRemaining || 0}</span></span>
            </div>
          )}
        </div>

        {/* 오늘 총 물량 표시 */}
        <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
          <span className="text-sm font-medium text-success">오늘 총 물량</span>
          <span className="text-xl font-bold text-success">{todayTotalDelivery}</span>
        </div>

        {/* 라우트별 분배 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {(['203D', '206A'] as const).map((route) => {
            const data = route === '203D' ? delivery203D : delivery206A;
            return (
              <div
                key={route}
                className="p-4 rounded-xl border-2 border-border/50 bg-background"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {route}
                  </label>
                  <span className="text-xs text-muted-foreground">{ratio[route]}%</span>
                </div>
                <div className="text-2xl font-bold text-center text-primary">{data.allocated}</div>
                {(data.firstRoundRemaining || 0) > 0 && (
                  <div className="text-xs text-center text-warning mt-1">
                    +잔여 {data.firstRoundRemaining}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 리셋 버튼 */}
        <button
          type="button"
          onClick={resetToRatio}
          className="flex items-center justify-center gap-2 w-full py-2 mt-3 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          학습 비중으로 재계산
        </button>
      </div>

      {/* Route Cards */}
      <RouteCard
        route="203D"
        data={delivery203D}
        onChange={handleDelivery203DChange}
        unitPrice={settings.routes['203D']}
      />
      <RouteCard
        route="206A"
        data={delivery206A}
        onChange={handleDelivery206AChange}
        unitPrice={settings.routes['206A']}
      />

      {/* Returns Card */}
      <ReturnsCard
        data={returns}
        onChange={handleReturnsChange}
        unitPrice={settings.routes['203D']}
      />

      {/* Fresh Bag Card - 2회전 이후 조정/미회수 입력용 */}
      <FreshBagCard
        data={freshBag}
        onChange={handleFreshBagChange}
        regularRate={settings.freshBag.regular}
        standaloneRate={settings.freshBag.standalone}
      />

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full touch-target h-14 text-base font-semibold rounded-xl shadow-lg"
        size="lg"
      >
        <Check className="w-5 h-5 mr-2" />
        저장하기
      </Button>
    </div>
  );
}
