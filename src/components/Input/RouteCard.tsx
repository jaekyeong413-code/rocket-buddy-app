import { useState } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteType } from '@/types';

interface DeliveryData {
  allocated: number;
  completed: number;
  cancelled: number;
  incomplete: number;
  transferred: number;
  added: number;
}

interface RouteCardProps {
  route: RouteType;
  data: DeliveryData;
  onChange: (data: DeliveryData) => void;
  unitPrice: number;
}

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

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-xl', bgColors[type])}>
      <span className={cn('text-sm font-medium', colors[type])}>
        {type === 'negative' && '- '}
        {type === 'positive' && '+ '}
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full bg-background flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
          className={cn(
            'w-14 h-8 text-center font-bold bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50',
            colors[type]
          )}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function RouteCard({ route, data, onChange, unitPrice }: RouteCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 실제 배송 완료 수량 계산
  const actualCompleted = Math.max(
    0,
    data.allocated - data.cancelled - data.incomplete - data.transferred + data.added
  );

  // 예상 수익 계산
  const estimatedIncome = actualCompleted * unitPrice;

  const updateField = (field: keyof DeliveryData, value: number) => {
    onChange({ ...data, [field]: value });
  };

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
          {/* 할당 수량 */}
          <NumberField
            label="할당"
            value={data.allocated}
            onChange={(v) => updateField('allocated', v)}
          />

          {/* 실제 완료 (자동 계산, 표시용) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border-2 border-success/20">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-success">실제 완료</span>
            </div>
            <span className="text-xl font-bold text-success">{actualCompleted}</span>
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
