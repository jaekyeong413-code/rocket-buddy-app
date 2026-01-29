import { Package, Truck, RotateCcw } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageAProps {
  workData: TodayWorkData;
  onFirstAllocationDeliveryChange: (value: string) => void;
  onFirstAllocationReturnsChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
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
  // 203D 프레시백 (자동계산)
  const fb203D = totalFBAllocated - (freshBag.route206ACount || 0);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          아침 상차 완료 후, 1회전 출발 전에 입력
        </p>
      </div>

      {/* A_GIFT_R1_TOTAL: 1회전 기프트 전체 할당 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-primary" />
          <label className="text-sm font-semibold text-primary">
            A_GIFT_R1_TOTAL
          </label>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.firstAllocationDelivery || ''}
          onChange={(e) => onFirstAllocationDeliveryChange(e.target.value.replace(/\D/g, ''))}
          placeholder="1회전 기프트 전체 물량"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          1회전 기프트 전체 할당 (203D + 206A 합계)
        </p>
      </div>

      {/* 프레시백 입력 섹션 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">프레시백 할당</h3>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>

        {/* A_FB_GEN, A_FB_SOLO */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">A_FB_GEN (일반)</label>
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
            <label className="text-xs text-muted-foreground mb-1 block">A_FB_SOLO (단독)</label>
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

        {/* A_FB_206A 및 203D 자동계산 */}
        <div className="pt-3 border-t border-success/20">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            A_FB_206A (206A 프레시백)
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
                placeholder="206A"
                className="w-full h-12 px-3 text-lg font-bold text-center bg-background rounded-xl border-2 border-primary/30 focus:border-primary focus:outline-none transition-colors"
              />
              <span className="text-xs text-muted-foreground mt-1 block text-center">206A (입력)</span>
            </div>
            <div>
              <div className={`w-full h-12 px-3 text-lg font-bold text-center rounded-xl border-2 flex items-center justify-center ${
                fb203D < 0 
                  ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                  : 'bg-muted border-border/30 text-foreground'
              }`}>
                {fb203D}
              </div>
              <span className="text-xs text-muted-foreground mt-1 block text-center">203D (자동)</span>
            </div>
          </div>
        </div>
      </div>

      {/* A_RET_R1_TOTAL: 1회전 반품 전체 할당 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-warning" />
          <label className="text-sm font-semibold text-warning">
            A_RET_R1_TOTAL
          </label>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.firstAllocationReturns || ''}
          onChange={(e) => onFirstAllocationReturnsChange(e.target.value.replace(/\D/g, ''))}
          placeholder="1회전 반품 전체 물량"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          1회전 반품 전체 할당
        </p>
      </div>
    </div>
  );
}
