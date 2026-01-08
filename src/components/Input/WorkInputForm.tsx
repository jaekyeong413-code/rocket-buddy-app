import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight, Lightbulb, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { WorkRecord, RoundType, DeliveryData, ReturnsData, FreshBagData } from '@/types';
import { 
  formatDate, 
  createDefaultDeliveryData, 
  createDefaultReturnsData, 
  createDefaultFreshBagData,
  calculateDailyIncome,
  formatCurrency,
} from '@/lib/calculations';
import { cn } from '@/lib/utils';
import { RouteCard } from './RouteCard';
import { ReturnsCard } from './ReturnsCard';
import { FreshBagCard } from './FreshBagCard';
import { toast } from 'sonner';

export function WorkInputForm({ onComplete }: { onComplete?: () => void }) {
  const { addRecord, records, settings, getRouteRatio, addAllocationHistory, getTodayWorkData, updateTodayWorkData } = useStore();
  const [date, setDate] = useState(formatDate(new Date()));
  const ratio = getRouteRatio();

  // 오늘 작업 데이터 불러오기 (저장 후에도 유지됨)
  const todayData = getTodayWorkData();

  // 1차 할당 배송
  const [firstAllocationDelivery, setFirstAllocationDelivery] = useState<string>(
    todayData.firstAllocationDelivery > 0 ? todayData.firstAllocationDelivery.toString() : ''
  );
  
  // 1차 할당 반품
  const [firstAllocationReturns, setFirstAllocationReturns] = useState<string>(
    todayData.firstAllocationReturns > 0 ? todayData.firstAllocationReturns.toString() : ''
  );
  
  // 1회전 잔여 포함 전체 남은 물량
  const [totalRemainingAfterFirstRound, setTotalRemainingAfterFirstRound] = useState<string>(
    todayData.totalRemainingAfterFirstRound > 0 ? todayData.totalRemainingAfterFirstRound.toString() : ''
  );

  // 라우트별 배송 데이터
  const [delivery203D, setDelivery203D] = useState<DeliveryData>(todayData.routes['203D']);
  const [delivery206A, setDelivery206A] = useState<DeliveryData>(todayData.routes['206A']);

  const [returns, setReturns] = useState<ReturnsData>(todayData.returns);
  const [freshBag, setFreshBag] = useState<FreshBagData>(todayData.freshBag);

  // 날짜가 바뀌면 데이터 새로 불러오기
  useEffect(() => {
    const today = formatDate(new Date());
    if (date === today) {
      const data = getTodayWorkData();
      setFirstAllocationDelivery(data.firstAllocationDelivery > 0 ? data.firstAllocationDelivery.toString() : '');
      setFirstAllocationReturns(data.firstAllocationReturns > 0 ? data.firstAllocationReturns.toString() : '');
      setTotalRemainingAfterFirstRound(data.totalRemainingAfterFirstRound > 0 ? data.totalRemainingAfterFirstRound.toString() : '');
      setDelivery203D(data.routes['203D']);
      setDelivery206A(data.routes['206A']);
      setReturns(data.returns);
      setFreshBag(data.freshBag);
    }
  }, [date, getTodayWorkData]);

  // 상태 변경 시 자동 저장
  useEffect(() => {
    const today = formatDate(new Date());
    if (date === today) {
      updateTodayWorkData({
        firstAllocationDelivery: parseInt(firstAllocationDelivery) || 0,
        firstAllocationReturns: parseInt(firstAllocationReturns) || 0,
        totalRemainingAfterFirstRound: parseInt(totalRemainingAfterFirstRound) || 0,
        routes: {
          '203D': delivery203D,
          '206A': delivery206A,
        },
        returns,
        freshBag,
      });
    }
  }, [date, firstAllocationDelivery, firstAllocationReturns, totalRemainingAfterFirstRound, delivery203D, delivery206A, returns, freshBag, updateTodayWorkData]);

  // 1차 할당 배송 입력 시 라우트별 자동 분배
  const handleFirstAllocationDeliveryChange = (value: string) => {
    setFirstAllocationDelivery(value);
    const total = parseInt(value) || 0;
    if (total > 0) {
      const suggested203D = Math.round((total * ratio['203D']) / 100);
      const suggested206A = total - suggested203D;
      setDelivery203D(prev => ({ ...prev, allocated: suggested203D }));
      setDelivery206A(prev => ({ ...prev, allocated: suggested206A }));
    }
  };

  // 1회전 잔여 포함 전체 남은 물량 입력 시 라우트별 잔여 자동 분배
  const handleTotalRemainingChange = (value: string) => {
    setTotalRemainingAfterFirstRound(value);
    const remaining = parseInt(value) || 0;
    const firstAlloc = parseInt(firstAllocationDelivery) || 0;
    
    if (remaining > 0 && remaining > firstAlloc) {
      const firstRoundRemaining = remaining - firstAlloc;
      const remaining203D = Math.round((firstRoundRemaining * ratio['203D']) / 100);
      const remaining206A = firstRoundRemaining - remaining203D;
      
      setDelivery203D(prev => ({ 
        ...prev, 
        firstRoundRemaining: remaining203D,
      }));
      setDelivery206A(prev => ({ 
        ...prev, 
        firstRoundRemaining: remaining206A,
      }));
    }
  };

  // 라우트별 할당 수정 시 전체 합계는 고정 (요청에 따라)
  const handleDelivery203DChange = useCallback((data: DeliveryData) => {
    setDelivery203D(data);
    // 하위 라우트 수정 시 상단 전체 합계 고정 유지
  }, []);

  const handleDelivery206AChange = useCallback((data: DeliveryData) => {
    setDelivery206A(data);
    // 하위 라우트 수정 시 상단 전체 합계 고정 유지
  }, []);

  // 1차 할당 반품 입력 시 반품 할당에 반영
  const handleFirstAllocationReturnsChange = (value: string) => {
    setFirstAllocationReturns(value);
    const total = parseInt(value) || 0;
    setReturns(prev => ({ ...prev, allocated: total }));
  };

  // 현재 총 할당량 계산
  const currentTotalAllocation = (delivery203D.allocated + delivery206A.allocated + 
    (delivery203D.firstRoundRemaining || 0) + (delivery206A.firstRoundRemaining || 0));

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

  const adjustDate = (days: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + days);
    setDate(formatDate(current));
  };

  const resetToRatio = () => {
    const total = parseInt(firstAllocationDelivery) || 0;
    if (total > 0) {
      const suggested203D = Math.round((total * ratio['203D']) / 100);
      const suggested206A = total - suggested203D;
      setDelivery203D(prev => ({ ...prev, allocated: suggested203D }));
      setDelivery206A(prev => ({ ...prev, allocated: suggested206A }));
    }
  };

  const handleTempSave = () => {
    toast.success('임시 저장됨');
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
    onComplete?.();
  };

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
            onChange={(e) => setDate(e.target.value)}
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

      {/* 1차 할당 섹션 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">1차 할당</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            학습 비중: {ratio['203D']}% / {ratio['206A']}%
          </span>
        </div>

        {/* 1차 할당 배송 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              1차 할당 배송
            </label>
            <button
              type="button"
              onClick={handleTempSave}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="임시 저장"
            >
              <Save className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={firstAllocationDelivery}
            onChange={(e) => handleFirstAllocationDeliveryChange(e.target.value.replace(/\D/g, ''))}
            placeholder="전체 배송 할당량 입력"
            className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* 1차 할당 반품 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              1차 할당 반품
            </label>
            <button
              type="button"
              onClick={handleTempSave}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="임시 저장"
            >
              <Save className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={firstAllocationReturns}
            onChange={(e) => handleFirstAllocationReturnsChange(e.target.value.replace(/\D/g, ''))}
            placeholder="전체 반품 할당량 입력"
            className="w-full h-12 px-4 text-lg font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
          />
        </div>

        {/* 1회전 잔여 포함 전체 남은 물량 */}
        <div className="mb-4 p-3 bg-accent/30 rounded-xl border-2 border-dashed border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-primary">
              1회전 잔여 포함 전체 남은 물량
            </label>
            <button
              type="button"
              onClick={handleTempSave}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="임시 저장"
            >
              <Save className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={totalRemainingAfterFirstRound}
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

        {/* 현재 총 할당량 표시 */}
        <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
          <span className="text-sm font-medium text-success">현재 총 할당량</span>
          <span className="text-xl font-bold text-success">{currentTotalAllocation}</span>
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
        onChange={setReturns}
        unitPrice={settings.routes['203D']}
      />

      {/* Fresh Bag Card */}
      <FreshBagCard
        data={freshBag}
        onChange={setFreshBag}
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
