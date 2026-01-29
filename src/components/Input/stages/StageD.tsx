import { Truck, Package, RotateCcw } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageDProps {
  workData: TodayWorkData;
  onFreshBagChange: (data: FreshBagData) => void;
  onRound2TotalRemainingChange: (value: string) => void;
  onRound2TotalReturnsChange: (value: string) => void;
}

export function StageD({
  workData,
  onFreshBagChange,
  onRound2TotalRemainingChange,
  onRound2TotalReturnsChange,
}: StageDProps) {
  const freshBag = workData.freshBag;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          2회전 상차 완료 후, 2회전 출발 전에 입력
        </p>
      </div>

      {/* D_GIFT_TOTAL_NOW */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-primary" />
          <label className="text-sm font-semibold text-primary">
            D_GIFT_TOTAL_NOW
          </label>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round2TotalRemaining || ''}
          onChange={(e) => onRound2TotalRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="현재 전체 기프트"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          잔여+신규 합친 '현재 전체 기프트'
        </p>
      </div>

      {/* D_RET_TOTAL_NOW */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-warning" />
          <label className="text-sm font-semibold text-warning">
            D_RET_TOTAL_NOW
          </label>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round2TotalReturns || ''}
          onChange={(e) => onRound2TotalReturnsChange(e.target.value.replace(/\D/g, ''))}
          placeholder="현재 전체 반품"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          잔여+신규 합친 '현재 전체 반품'
        </p>
      </div>

      {/* D_FB_GEN_INCREASE */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-success" />
          <label className="text-sm font-semibold text-success">
            D_FB_GEN_INCREASE
          </label>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={freshBag.added || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
            onFreshBagChange({ ...freshBag, added: val });
          }}
          placeholder="일반 FB 증가분"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          일반 프레시백 증가분 (2회전 신규)
        </p>
      </div>
    </div>
  );
}
