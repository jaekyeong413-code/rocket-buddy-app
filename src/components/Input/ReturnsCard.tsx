import { useState } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReturnsData } from '@/types';
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

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-xl', bgColors[type])}>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm font-medium', colors[type])}>
          {type === 'negative' && '- '}
          {type === 'positive' && '+ '}
          {label}
        </span>
        <button
          type="button"
          onClick={() => toast.success('임시 저장됨')}
          className="p-1 rounded hover:bg-background/50 transition-colors"
        >
          <Save className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
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

interface ReturnsCardProps {
  data: ReturnsData;
  onChange: (data: ReturnsData) => void;
  unitPrice: number;
}

export function ReturnsCard({ data, onChange, unitPrice }: ReturnsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateField = (field: keyof ReturnsData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  // 실제 완료 수량 (완료 + 채번)
  const actualCompleted = data.completed + data.numbered;
  
  // 예상 수익
  const estimatedIncome = actualCompleted * unitPrice;

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/30 overflow-hidden">
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-warning/5 to-warning/10"
      >
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-warning" />
          <span className="text-lg font-bold text-warning">반품</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">완료 {actualCompleted}건</div>
            <div className="text-sm font-bold text-warning">
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
            value={data.allocated || 0}
            onChange={(v) => updateField('allocated', v)}
          />

          {/* 완료 항목 */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="완료"
              value={data.completed}
              onChange={(v) => updateField('completed', v)}
              type="positive"
            />
            <NumberField
              label="채번"
              value={data.numbered}
              onChange={(v) => updateField('numbered', v)}
              type="positive"
            />
          </div>

          {/* 미완료 항목 */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="미회수"
              value={data.notCollected}
              onChange={(v) => updateField('notCollected', v)}
              type="negative"
            />
            <NumberField
              label="미완료"
              value={data.incomplete}
              onChange={(v) => updateField('incomplete', v)}
              type="negative"
            />
          </div>
        </div>
      )}
    </div>
  );
}
