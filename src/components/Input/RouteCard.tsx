import { useState } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp, Award, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteType, DeliveryData } from '@/types';
import { toast } from 'sonner';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  type?: 'default' | 'negative' | 'positive';
}

function NumberField({ label, value, onChange, type = 'default' }: NumberFieldProps) {
  const colors = {
    default: 'text-foreground',
    negative: 'text-destructive',
    positive: 'text-success',
  };

  const bgColors = {
    default: 'bg-muted',
    negative: 'bg-destructive/10',
    positive: 'bg-success/10',
  };

  const handleTempSave = () => {
    toast.success('임시 저장됨');
  };

  return (
    <div className={cn('flex items-center justify-between gap-2 p-2 rounded-xl min-w-0 overflow-hidden', bgColors[type])}>
      {/* Label - shrinks if needed */}
      <div className="flex items-center gap-1 min-w-0 flex-shrink">
        <span className={cn('text-sm font-medium truncate', colors[type])}>
          {type === 'negative' && '−'}
          {type === 'positive' && '+'}
          {label}
        </span>
        <button
          type="button"
          onClick={handleTempSave}
          className="p-1 rounded hover:bg-background/50 transition-colors flex-shrink-0"
        >
          <Save className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      {/* Stepper controls - never shrink, always 44px touch targets */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-11 h-11 rounded-full bg-background flex items-center justify-center hover:bg-muted transition-colors touch-target"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
          className={cn(
            'w-12 h-11 text-center font-bold bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50',
            colors[type]
          )}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors touch-target"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface RouteCardProps {
  route: RouteType;
  data: DeliveryData;
  onChange: (data: DeliveryData) => void;
  unitPrice: number;
}

export function RouteCard({ route, data, onChange, unitPrice }: RouteCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 배송 완료 수량 기준 예상 수익 계산
  const estimatedIncome = data.completed * unitPrice;

  const updateField = (field: keyof DeliveryData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  // 현재 총 할당 (1차 할당 + 1회전 잔여 + 추가 - 이관)
  const currentTotalAllocation = data.allocated + (data.firstRoundRemaining || 0) + data.added - data.transferred;

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/30 overflow-hidden">
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">{route}</span>
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
            {unitPrice.toLocaleString()}원/건
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">예상 수익</div>
            <div className="text-sm font-bold text-primary">
              {estimatedIncome.toLocaleString()}원
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* 상세 입력 필드 */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {/* 현재 총 할당 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-primary/20 mb-3">
            <span className="text-sm font-medium text-primary">현재 총 할당</span>
            <span className="text-lg font-bold text-primary">{currentTotalAllocation}</span>
          </div>

          {/* 할당 수량 */}
          <NumberField
            label="1차 할당"
            value={data.allocated}
            onChange={(v) => updateField('allocated', v)}
          />

          {/* 1회전 잔여 (있을 경우만 표시) */}
          {(data.firstRoundRemaining || 0) > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-warning/10">
              <span className="text-sm font-medium text-warning">1회전 잔여</span>
              <span className="text-lg font-bold text-warning">{data.firstRoundRemaining}</span>
            </div>
          )}

          {/* 완료 입력 (핵심 입력) */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-success/10 border-2 border-success/30 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <Award className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-base font-semibold text-success truncate">완료</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => updateField('completed', Math.max(0, data.completed - 1))}
                className="w-11 h-11 rounded-full bg-background flex items-center justify-center hover:bg-muted transition-colors touch-target"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={data.completed || ''}
                onChange={(e) => updateField('completed', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                className="w-14 h-11 text-center text-xl font-bold bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-success/50 text-success"
              />
              <button
                type="button"
                onClick={() => updateField('completed', data.completed + 1)}
                className="w-11 h-11 rounded-full bg-success text-success-foreground flex items-center justify-center hover:bg-success/90 transition-colors touch-target"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 차감 항목들 */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="취소"
              value={data.cancelled}
              onChange={(v) => updateField('cancelled', v)}
              type="negative"
            />
            <NumberField
              label="미완료"
              value={data.incomplete}
              onChange={(v) => updateField('incomplete', v)}
              type="negative"
            />
          </div>

          {/* 이관/추가 */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="이관"
              value={data.transferred}
              onChange={(v) => updateField('transferred', v)}
              type="negative"
            />
            <NumberField
              label="추가"
              value={data.added}
              onChange={(v) => updateField('added', v)}
              type="positive"
            />
          </div>
        </div>
      )}
    </div>
  );
}
