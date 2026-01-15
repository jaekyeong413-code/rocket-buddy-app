import { Package } from 'lucide-react';
import { TodayWorkData } from '@/types';

interface StageAProps {
  workData: TodayWorkData;
  onFirstAllocationDeliveryChange: (value: string) => void;
  onFirstAllocationReturnsChange: (value: string) => void;
  onFreshBagChange: (data: TodayWorkData['freshBag']) => void;
}

export function StageA({
  workData,
  onFirstAllocationDeliveryChange,
  onFirstAllocationReturnsChange,
  onFreshBagChange,
}: StageAProps) {
  const freshBag = workData.freshBag;

  // 프레시백 총 할당
  const totalFBAllocated = (freshBag.regularAllocated || 0) + (freshBag.standaloneAllocated || 0);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          아침 상차 완료 후, 1회전 출발 전에 입력
        </p>
      </div>

      {/* 프레시백 시작값 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">프레시백 시작값</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">일반(연계)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.regularAllocated || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, regularAllocated: val });
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-muted rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">단독</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.standaloneAllocated || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, standaloneAllocated: val });
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-muted rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* 206A 프레시백 분배 */}
        <div className="pt-3 border-t border-success/20">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            206A 프레시백 총 개수
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={freshBag.route206ACount || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  onFreshBagChange({ ...freshBag, route206ACount: val });
                }}
                placeholder="206A 개수"
                className="w-full h-12 px-3 text-lg font-bold text-center bg-background rounded-xl border-2 border-primary/30 focus:border-primary focus:outline-none transition-colors"
              />
              <span className="text-xs text-muted-foreground mt-1 block text-center">206A</span>
            </div>
            <div>
              <div className={`w-full h-12 px-3 text-lg font-bold text-center rounded-xl border-2 flex items-center justify-center ${
                totalFBAllocated - (freshBag.route206ACount || 0) < 0 
                  ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                  : 'bg-muted border-border/30 text-foreground'
              }`}>
                {totalFBAllocated - (freshBag.route206ACount || 0)}
              </div>
              <span className="text-xs text-muted-foreground mt-1 block text-center">203D (자동)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 배송 1차 전체 물량 - 203D 1회전 할당으로 간주 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <label className="text-xs font-medium text-primary mb-2 block">
          배송 1차 전체 물량 (= 203D 1회전 할당)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.firstAllocationDelivery || ''}
          onChange={(e) => onFirstAllocationDeliveryChange(e.target.value.replace(/\D/g, ''))}
          placeholder="203D 1회전 배송 할당량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          이 값이 203D 1회전 할당 물량으로 사용됩니다
        </p>
      </div>

      {/* 반품 1차 전체 물량 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <label className="text-xs font-medium text-warning mb-2 block">
          반품 1차 전체 물량
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.firstAllocationReturns || ''}
          onChange={(e) => onFirstAllocationReturnsChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 반품 할당량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
