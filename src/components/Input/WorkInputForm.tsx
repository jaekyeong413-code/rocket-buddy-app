import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { SmartAllocationInput } from './SmartAllocationInput';
import { RouteCard } from './RouteCard';
import { ReturnsCard } from './ReturnsCard';
import { FreshBagCard } from './FreshBagCard';
import { toast } from 'sonner';

export function WorkInputForm({ onComplete }: { onComplete?: () => void }) {
  const { addRecord, updateRecord, records, settings } = useStore();
  const [date, setDate] = useState(formatDate(new Date()));
  const [round, setRound] = useState<RoundType>(1);

  // 라우트별 할당 (스마트 할당용)
  const [allocations, setAllocations] = useState({
    '203D': 0,
    '206A': 0,
  });

  // 라우트별 배송 데이터
  const [delivery203D, setDelivery203D] = useState<DeliveryData>(createDefaultDeliveryData());
  const [delivery206A, setDelivery206A] = useState<DeliveryData>(createDefaultDeliveryData());

  const [returns, setReturns] = useState<ReturnsData>(createDefaultReturnsData());
  const [freshBag, setFreshBag] = useState<FreshBagData>(createDefaultFreshBagData());

  // 할당 변경 시 라우트 데이터에 반영
  const handleAllocationChange = useCallback((newAllocations: { '203D': number; '206A': number }) => {
    setAllocations(newAllocations);
    setDelivery203D(prev => ({ ...prev, allocated: newAllocations['203D'] }));
    setDelivery206A(prev => ({ ...prev, allocated: newAllocations['206A'] }));
  }, []);

  // 개별 라우트 할당 변경 시 전체 할당에도 반영 (양방향 연동)
  const handleDelivery203DChange = useCallback((data: DeliveryData) => {
    setDelivery203D(data);
    setAllocations(prev => ({ ...prev, '203D': data.allocated }));
  }, []);

  const handleDelivery206AChange = useCallback((data: DeliveryData) => {
    setDelivery206A(data);
    setAllocations(prev => ({ ...prev, '206A': data.allocated }));
  }, []);

  // 오늘 예상 수입 실시간 계산
  const todayRecords = records.filter(r => r.date === date);
  const currentInputAsRecords: WorkRecord[] = [];
  
  if (delivery203D.allocated > 0 || delivery203D.added > 0) {
    currentInputAsRecords.push({
      id: 'temp-203d',
      date,
      route: '203D',
      round,
      delivery: delivery203D,
      returns,
      freshBag,
    });
  }
  
  if (delivery206A.allocated > 0 || delivery206A.added > 0) {
    currentInputAsRecords.push({
      id: 'temp-206a',
      date,
      route: '206A',
      round,
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

  const handleSubmit = () => {
    // 203D 라우트 저장
    if (delivery203D.allocated > 0 || delivery203D.added > 0) {
      const record203D: WorkRecord = {
        id: `${date}-203D-${round}-${Date.now()}`,
        date,
        route: '203D',
        round,
        delivery: delivery203D,
        returns: round === 1 ? returns : createDefaultReturnsData(),
        freshBag: round === 1 ? freshBag : createDefaultFreshBagData(),
      };
      addRecord(record203D);
    }

    // 206A 라우트 저장
    if (delivery206A.allocated > 0 || delivery206A.added > 0) {
      const record206A: WorkRecord = {
        id: `${date}-206A-${round}-${Date.now() + 1}`,
        date,
        route: '206A',
        round,
        delivery: delivery206A,
        returns: createDefaultReturnsData(),
        freshBag: createDefaultFreshBagData(),
      };
      addRecord(record206A);
    }

    // Reset form
    setAllocations({ '203D': 0, '206A': 0 });
    setDelivery203D(createDefaultDeliveryData());
    setDelivery206A(createDefaultDeliveryData());
    setReturns(createDefaultReturnsData());
    setFreshBag(createDefaultFreshBagData());

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

      {/* Round Selector */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          회차
        </label>
        <div className="flex gap-2">
          {([1, 2] as RoundType[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRound(r)}
              className={cn(
                'flex-1 touch-target py-3 rounded-xl font-semibold text-sm transition-all',
                round === r
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {r}회차
            </button>
          ))}
        </div>
      </div>

      {/* Smart Allocation Input */}
      <SmartAllocationInput 
        onAllocationChange={handleAllocationChange}
        allocations={allocations}
        date={date}
      />

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
        unitPrice={settings.routes['203D']} // 기본 단가 사용
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
