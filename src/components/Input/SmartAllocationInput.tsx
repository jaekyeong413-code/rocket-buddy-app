import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface SmartAllocationInputProps {
  onAllocationChange: (allocations: { '203D': number; '206A': number }) => void;
  date: string;
}

export function SmartAllocationInput({ onAllocationChange, date }: SmartAllocationInputProps) {
  const { getRouteRatio, addAllocationHistory } = useStore();
  const ratio = getRouteRatio();
  
  const [totalAllocation, setTotalAllocation] = useState<string>('');
  const [allocations, setAllocations] = useState({
    '203D': 0,
    '206A': 0,
  });
  const [isEditing, setIsEditing] = useState<'203D' | '206A' | null>(null);

  // 전체 할당량 입력 시 비중에 따라 자동 분배
  useEffect(() => {
    const total = parseInt(totalAllocation) || 0;
    if (total > 0 && !isEditing) {
      const suggested203D = Math.round((total * ratio['203D']) / 100);
      const suggested206A = total - suggested203D;
      setAllocations({
        '203D': suggested203D,
        '206A': suggested206A,
      });
    }
  }, [totalAllocation, ratio, isEditing]);

  // 개별 라우트 수정 시 나머지 자동 조정
  const handleRouteChange = (route: '203D' | '206A', value: number) => {
    const total = parseInt(totalAllocation) || 0;
    if (total > 0) {
      const otherRoute = route === '203D' ? '206A' : '203D';
      const otherValue = Math.max(0, total - value);
      setAllocations({
        [route]: value,
        [otherRoute]: otherValue,
      } as { '203D': number; '206A': number });
    } else {
      setAllocations(prev => ({
        ...prev,
        [route]: value,
      }));
    }
    setIsEditing(route);
  };

  // 할당량 확정
  const confirmAllocation = () => {
    if (allocations['203D'] > 0 || allocations['206A'] > 0) {
      addAllocationHistory({
        date,
        allocations,
      });
      onAllocationChange(allocations);
    }
    setIsEditing(null);
  };

  const resetSuggestion = () => {
    const total = parseInt(totalAllocation) || 0;
    if (total > 0) {
      const suggested203D = Math.round((total * ratio['203D']) / 100);
      const suggested206A = total - suggested203D;
      setAllocations({
        '203D': suggested203D,
        '206A': suggested206A,
      });
    }
    setIsEditing(null);
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
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          오늘 전체 할당량
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={totalAllocation}
          onChange={(e) => setTotalAllocation(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 배송 수량 입력"
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
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {route}
            </label>
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
