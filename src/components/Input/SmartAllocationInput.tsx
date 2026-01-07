import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, RefreshCw, Save } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SmartAllocationInputProps {
  onAllocationChange: (allocations: { '203D': number; '206A': number }) => void;
  allocations: { '203D': number; '206A': number };
  date: string;
}

export function SmartAllocationInput({ onAllocationChange, allocations, date }: SmartAllocationInputProps) {
  const { getRouteRatio, addAllocationHistory } = useStore();
  const ratio = getRouteRatio();
  
  const [totalAllocation, setTotalAllocation] = useState<string>('');
  const [isEditing, setIsEditing] = useState<'203D' | '206A' | null>(null);

  // 하위 라우트 값 변경 시 전체 합계 자동 갱신 (양방향 연동)
  useEffect(() => {
    const total = allocations['203D'] + allocations['206A'];
    if (total > 0 && !isEditing) {
      setTotalAllocation(total.toString());
    }
  }, [allocations, isEditing]);

  // 전체 할당량 입력 시 비중에 따라 자동 분배
  const handleTotalChange = (value: string) => {
    setTotalAllocation(value);
    const total = parseInt(value) || 0;
    if (total > 0) {
      const suggested203D = Math.round((total * ratio['203D']) / 100);
      const suggested206A = total - suggested203D;
      onAllocationChange({
        '203D': suggested203D,
        '206A': suggested206A,
      });
    }
  };

  // 개별 라우트 수정 시 나머지 자동 조정 + 전체 합계 갱신
  const handleRouteChange = (route: '203D' | '206A', value: number) => {
    const total = parseInt(totalAllocation) || 0;
    const otherRoute = route === '203D' ? '206A' : '203D';
    
    if (total > 0) {
      // 전체 합계가 있으면 나머지 자동 조정
      const otherValue = Math.max(0, total - value);
      onAllocationChange({
        [route]: value,
        [otherRoute]: otherValue,
      } as { '203D': number; '206A': number });
    } else {
      // 전체 합계가 없으면 개별 업데이트 후 합계 갱신
      const newAllocations = {
        ...allocations,
        [route]: value,
      };
      onAllocationChange(newAllocations);
      setTotalAllocation((newAllocations['203D'] + newAllocations['206A']).toString());
    }
    setIsEditing(route);
  };

  // 할당량 확정 및 학습 데이터 저장
  const confirmAllocation = useCallback(() => {
    if (allocations['203D'] > 0 || allocations['206A'] > 0) {
      addAllocationHistory({
        date,
        allocations,
      });
    }
    setIsEditing(null);
  }, [allocations, date, addAllocationHistory]);

  const resetSuggestion = () => {
    const total = parseInt(totalAllocation) || 0;
    if (total > 0) {
      const suggested203D = Math.round((total * ratio['203D']) / 100);
      const suggested206A = total - suggested203D;
      onAllocationChange({
        '203D': suggested203D,
        '206A': suggested206A,
      });
    }
    setIsEditing(null);
  };

  const handleTempSave = () => {
    localStorage.setItem('tempAllocation', JSON.stringify({
      date,
      totalAllocation,
      allocations,
    }));
    toast.success('임시 저장됨');
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">스마트 할당</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          학습 비중: {ratio['203D']}% / {ratio['206A']}%
        </span>
      </div>

      {/* 전체 할당량 입력 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground">
            1차 할당 전체 수량 입력
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
          value={totalAllocation}
          onChange={(e) => handleTotalChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 할당량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* 라우트별 분배 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(['203D', '206A'] as const).map((route) => (
          <div
            key={route}
            className={cn(
              'p-4 rounded-xl border-2 transition-all',
              isEditing === route
                ? 'border-primary bg-primary/5'
                : 'border-border/50 bg-background'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                {route}
              </label>
              <button
                type="button"
                onClick={handleTempSave}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <Save className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={allocations[route] || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                handleRouteChange(route, value);
              }}
              onBlur={confirmAllocation}
              className="w-full h-12 text-2xl font-bold text-center bg-transparent focus:outline-none"
            />
            <div className="text-xs text-center text-muted-foreground mt-1">
              예상 {ratio[route]}%
            </div>
          </div>
        ))}
      </div>

      {/* 리셋 버튼 */}
      {isEditing && (
        <button
          type="button"
          onClick={resetSuggestion}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          학습 비중으로 재계산
        </button>
      )}
    </div>
  );
}
