import { useState } from 'react';
import { Plus, Minus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { WorkRecord, RouteType, RoundType } from '@/types';
import { formatDate } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

function NumberInput({ label, value, onChange, min = 0 }: NumberInputProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-transform"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-12 text-center text-lg font-semibold">{value}</span>
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
  const { addRecord } = useStore();
  const [date, setDate] = useState(formatDate(new Date()));
  const [route, setRoute] = useState<RouteType>('203D');
  const [round, setRound] = useState<RoundType>(1);

  const [delivery, setDelivery] = useState({
    completed: 0,
    cancelled: 0,
    incomplete: 0,
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

  const adjustDate = (days: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + days);
    setDate(formatDate(current));
  };

  const handleSubmit = () => {
    const record: WorkRecord = {
      id: `${date}-${route}-${round}-${Date.now()}`,
      date,
      route,
      round,
      delivery,
      returns,
      freshBag,
    };

    addRecord(record);

    // Reset form
    setDelivery({ completed: 0, cancelled: 0, incomplete: 0 });
    setReturns({ completed: 0, notCollected: 0, numbered: 0, incomplete: 0 });
    setFreshBag({
      regular: 0,
      standalone: 0,
      failedNotOut: 0,
      failedWithProducts: 0,
      incomplete: 0,
    });

    onComplete?.();
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Date Selector */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
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

      {/* Route & Round Selector */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              노선
            </label>
            <div className="flex gap-2">
              {(['203D', '206A'] as RouteType[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoute(r)}
                  className={cn(
                    'flex-1 touch-target py-3 rounded-xl font-semibold text-sm transition-all',
                    route === r
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
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
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {r}회차
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Section */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-primary mb-3">배송</h3>
        <NumberInput
          label="완료"
          value={delivery.completed}
          onChange={(v) => setDelivery({ ...delivery, completed: v })}
        />
        <NumberInput
          label="취소"
          value={delivery.cancelled}
          onChange={(v) => setDelivery({ ...delivery, cancelled: v })}
        />
        <NumberInput
          label="미완료"
          value={delivery.incomplete}
          onChange={(v) => setDelivery({ ...delivery, incomplete: v })}
        />
      </div>

      {/* Returns Section */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-warning mb-3">반품</h3>
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
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-success mb-3">프레시백</h3>
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
        className="w-full touch-target h-14 text-base font-semibold rounded-xl"
        size="lg"
      >
        <Check className="w-5 h-5 mr-2" />
        저장하기
      </Button>
    </div>
  );
}
