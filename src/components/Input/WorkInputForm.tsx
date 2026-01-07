import { useState, useEffect } from 'react';
import { Plus, Minus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { WorkRecord, RoundType } from '@/types';
import { formatDate } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import { SmartAllocationInput } from './SmartAllocationInput';
import { RouteCard } from './RouteCard';
import { toast } from 'sonner';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

function NumberInput({ label, value, onChange, min = 0 }: NumberInputProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-transform"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
          className="w-14 h-10 text-center text-lg font-semibold bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function WorkInputForm({ onComplete }: { onComplete?: () => void }) {
  const { addRecord, settings } = useStore();
  const [date, setDate] = useState(formatDate(new Date()));
  const [round, setRound] = useState<RoundType>(1);

  // 라우트별 배송 데이터
  const [delivery203D, setDelivery203D] = useState({
    allocated: 0,
    completed: 0,
    cancelled: 0,
    incomplete: 0,
    transferred: 0,
    added: 0,
  });

  const [delivery206A, setDelivery206A] = useState({
    allocated: 0,
    completed: 0,
    cancelled: 0,
    incomplete: 0,
    transferred: 0,
    added: 0,
  });

  const [returns, setReturns] = useState({
    completed: 0,
    notCollected: 0,
    numbered: 0,
    incomplete: 0,
  });

  const [freshBag, setFreshBag] = useState({
    regular: 0,
    standalone: 0,
    failedNotOut: 0,
    failedWithProducts: 0,
    incomplete: 0,
  });

  // 스마트 할당에서 값 받기
  const handleAllocationChange = (allocations: { '203D': number; '206A': number }) => {
    setDelivery203D(prev => ({ ...prev, allocated: allocations['203D'] }));
    setDelivery206A(prev => ({ ...prev, allocated: allocations['206A'] }));
  };

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
        returns: round === 1 ? returns : { completed: 0, notCollected: 0, numbered: 0, incomplete: 0 },
        freshBag: round === 1 ? freshBag : { regular: 0, standalone: 0, failedNotOut: 0, failedWithProducts: 0, incomplete: 0 },
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
        returns: { completed: 0, notCollected: 0, numbered: 0, incomplete: 0 },
        freshBag: { regular: 0, standalone: 0, failedNotOut: 0, failedWithProducts: 0, incomplete: 0 },
      };
      addRecord(record206A);
    }

    // Reset form
    setDelivery203D({ allocated: 0, completed: 0, cancelled: 0, incomplete: 0, transferred: 0, added: 0 });
    setDelivery206A({ allocated: 0, completed: 0, cancelled: 0, incomplete: 0, transferred: 0, added: 0 });
    setReturns({ completed: 0, notCollected: 0, numbered: 0, incomplete: 0 });
    setFreshBag({ regular: 0, standalone: 0, failedNotOut: 0, failedWithProducts: 0, incomplete: 0 });

    toast.success('작업 기록이 저장되었습니다!');
    onComplete?.();
  };

  return (
    <div className="space-y-5 animate-slide-up">
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
      <SmartAllocationInput onAllocationChange={handleAllocationChange} date={date} />

      {/* Route Cards */}
      <RouteCard
        route="203D"
        data={delivery203D}
        onChange={setDelivery203D}
        unitPrice={settings.routes['203D']}
      />
      <RouteCard
        route="206A"
        data={delivery206A}
        onChange={setDelivery206A}
        unitPrice={settings.routes['206A']}
      />

      {/* Returns Section */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
        <h3 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warning"></span>
          반품
        </h3>
        <NumberInput
          label="완료"
          value={returns.completed}
          onChange={(v) => setReturns({ ...returns, completed: v })}
        />
        <NumberInput
          label="미회수"
          value={returns.notCollected}
          onChange={(v) => setReturns({ ...returns, notCollected: v })}
        />
        <NumberInput
          label="채번"
          value={returns.numbered}
          onChange={(v) => setReturns({ ...returns, numbered: v })}
        />
        <NumberInput
          label="미완료"
          value={returns.incomplete}
          onChange={(v) => setReturns({ ...returns, incomplete: v })}
        />
      </div>

      {/* Fresh Bag Section */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
        <h3 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          프레시백
        </h3>
        <NumberInput
          label="일반(연계)"
          value={freshBag.regular}
          onChange={(v) => setFreshBag({ ...freshBag, regular: v })}
        />
        <NumberInput
          label="단독"
          value={freshBag.standalone}
          onChange={(v) => setFreshBag({ ...freshBag, standalone: v })}
        />
        <NumberInput
          label="미내놓음"
          value={freshBag.failedNotOut}
          onChange={(v) => setFreshBag({ ...freshBag, failedNotOut: v })}
        />
        <NumberInput
          label="상품잔존"
          value={freshBag.failedWithProducts}
          onChange={(v) => setFreshBag({ ...freshBag, failedWithProducts: v })}
        />
        <NumberInput
          label="미완료"
          value={freshBag.incomplete}
          onChange={(v) => setFreshBag({ ...freshBag, incomplete: v })}
        />
      </div>

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
