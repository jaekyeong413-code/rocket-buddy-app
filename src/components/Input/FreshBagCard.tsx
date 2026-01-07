import { useState } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp, Package, Save, UserX, PackageX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FreshBagData } from '@/types';
import { toast } from 'sonner';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  type?: 'default' | 'negative' | 'positive';
  showSave?: boolean;
}

function NumberField({ label, value, onChange, type = 'default', showSave = true }: NumberFieldProps) {
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
        {showSave && (
          <button
            type="button"
            onClick={() => toast.success('임시 저장됨')}
            className="p-1 rounded hover:bg-background/50 transition-colors"
          >
            <Save className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
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

interface FailedButtonProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onClick: () => void;
}

function FailedButton({ label, icon, value, onClick }: FailedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 p-3 bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-colors active:scale-95"
    >
      {icon}
      <span className="text-sm font-medium text-destructive">{label}</span>
      {value > 0 && (
        <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full font-bold">
          {value}
        </span>
      )}
    </button>
  );
}

interface FreshBagCardProps {
  data: FreshBagData;
  onChange: (data: FreshBagData) => void;
  regularRate: number;
  standaloneRate: number;
}

export function FreshBagCard({ data, onChange, regularRate, standaloneRate }: FreshBagCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateField = <K extends keyof FreshBagData>(field: K, value: FreshBagData[K]) => {
    const newData = { ...data, [field]: value };
    
    // 증감 로직: 일반 증감 입력 시 단독 FB가 일반으로 전환
    if (field === 'regularAdjustment') {
      const adjustment = value as number;
      // 양수면 단독에서 일반으로 전환
      if (adjustment > 0) {
        newData.regular = (data.regularAllocated || 0) + adjustment;
        newData.standalone = Math.max(0, (data.standaloneAllocated || 0) - adjustment);
      }
    }
    
    onChange(newData);
  };

  // 총 회수 수량
  const totalCollected = data.regular + data.standalone;
  
  // 총 미회수 수량
  const totalFailed = (data.failedAbsent || 0) + (data.failedNoProduct || 0);

  // 예상 수익
  const estimatedIncome = (data.regular * regularRate) + (data.standalone * standaloneRate);

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/30 overflow-hidden">
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-success/5 to-success/10"
      >
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-success" />
          <span className="text-lg font-bold text-success">프레시백</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">회수 {totalCollected}건</div>
            <div className="text-sm font-bold text-success">
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
        <div className="p-4 space-y-4">
          {/* 할당 섹션 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">할당</h4>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="일반"
                value={data.regularAllocated || 0}
                onChange={(v) => updateField('regularAllocated', v)}
              />
              <NumberField
                label="단독"
                value={data.standaloneAllocated || 0}
                onChange={(v) => updateField('standaloneAllocated', v)}
              />
            </div>
          </div>

          {/* 증감/이관/추가 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">조정</h4>
            <NumberField
              label="일반 증감 (단독→일반)"
              value={data.regularAdjustment || 0}
              onChange={(v) => updateField('regularAdjustment', v)}
              type="positive"
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="이관"
                value={data.transferred || 0}
                onChange={(v) => updateField('transferred', v)}
                type="negative"
              />
              <NumberField
                label="추가"
                value={data.added || 0}
                onChange={(v) => updateField('added', v)}
                type="positive"
              />
            </div>
          </div>

          {/* 회수 완료 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">회수 완료</h4>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="일반"
                value={data.regular}
                onChange={(v) => updateField('regular', v)}
              />
              <NumberField
                label="단독"
                value={data.standalone}
                onChange={(v) => updateField('standalone', v)}
              />
            </div>
          </div>

          {/* 미회수 사유 버튼 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">미회수 (사유별 클릭)</h4>
            <div className="flex gap-2">
              <FailedButton
                label="부재"
                icon={<UserX className="w-4 h-4 text-destructive" />}
                value={data.failedAbsent || 0}
                onClick={() => updateField('failedAbsent', (data.failedAbsent || 0) + 1)}
              />
              <FailedButton
                label="상품 없음"
                icon={<PackageX className="w-4 h-4 text-destructive" />}
                value={data.failedNoProduct || 0}
                onClick={() => updateField('failedNoProduct', (data.failedNoProduct || 0) + 1)}
              />
            </div>
            {totalFailed > 0 && (
              <div className="text-xs text-center text-muted-foreground">
                총 미회수: {totalFailed}건 (부재 {data.failedAbsent || 0}, 상품 없음 {data.failedNoProduct || 0})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
