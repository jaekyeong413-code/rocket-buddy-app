import { Truck, Package, RotateCcw } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageCProps {
  workData: TodayWorkData;
  onFreshBagChange: (data: FreshBagData) => void;
  onRound1EndRemainingChange: (value: string) => void;
  onStageC206AReturnRemainingChange?: (value: string) => void;
}

export function StageC({
  workData,
  onFreshBagChange,
  onRound1EndRemainingChange,
  onStageC206AReturnRemainingChange,
}: StageCProps) {
  const freshBag = workData.freshBag;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          1회전 종료 (206A까지) 후 입력
        </p>
      </div>

      {/* C_GIFT_206A_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-primary" />
          <label className="text-sm font-semibold text-primary">
            C_GIFT_206A_REMAIN
          </label>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round1EndRemaining || ''}
          onChange={(e) => onRound1EndRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="206A 기프트 잔여"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          1회전 종료 시점 206A 기프트 잔여 (미방문)
        </p>
      </div>

      {/* C_RET_206A_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-warning" />
          <label className="text-sm font-semibold text-warning">
            C_RET_206A_REMAIN
          </label>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageC_206A_returnRemaining || ''}
          onChange={(e) => onStageC206AReturnRemainingChange?.(e.target.value.replace(/\D/g, ''))}
          placeholder="206A 반품 잔여"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          1회전 종료 시점 206A 반품 잔여 (미방문)
        </p>
      </div>

      {/* 프레시백 미방문 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">프레시백 미방문</h3>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* C_FB_GEN_UNVISITED */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">C_FB_GEN_UNVISITED</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.round1EndRegular || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, round1EndRegular: val });
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">일반 FB 미방문</p>
          </div>
          {/* C_FB_SOLO_UNVISITED */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">C_FB_SOLO_UNVISITED</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.round1EndStandalone || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, round1EndStandalone: val });
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">단독 FB 미방문</p>
          </div>
        </div>
      </div>
    </div>
  );
}
