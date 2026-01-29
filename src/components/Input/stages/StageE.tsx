import { Truck, Package, RotateCcw } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageEProps {
  workData: TodayWorkData;
  onRound2RemainingChange: (value: string) => void;
  onRound2ReturnsRemainingChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
  onStageEUnvisitedFBSolo203DChange?: (value: string) => void;
  onStageE206AReturnRemainingChange?: (value: string) => void;
}

export function StageE({
  workData,
  onRound2RemainingChange,
  onRound2ReturnsRemainingChange,
  onFreshBagChange,
  onStageEUnvisitedFBSolo203DChange,
  onStageE206AReturnRemainingChange,
}: StageEProps) {

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          203D 완전 종료 (2회전까지) 후 입력
        </p>
      </div>

      {/* E_GIFT_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-primary" />
          <label className="text-sm font-semibold text-primary">
            E_GIFT_REMAIN
          </label>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round2EndRemaining || ''}
          onChange={(e) => onRound2RemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="기프트 잔여 (=206A)"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          기프트 잔여 (이 시점 = 206A 잔여)
        </p>
      </div>

      {/* E_RET_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-warning" />
          <label className="text-sm font-semibold text-warning">
            E_RET_REMAIN
          </label>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageE_206A_returnRemaining || ''}
          onChange={(e) => onStageE206AReturnRemainingChange?.(e.target.value.replace(/\D/g, ''))}
          placeholder="반품 잔여 (=206A)"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          반품 잔여 (이 시점 = 206A 잔여)
        </p>
      </div>

      {/* E_FB_203D_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-success" />
          <label className="text-sm font-semibold text-success">
            E_FB_203D_REMAIN
          </label>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageE_unvisitedFB_solo_203D || ''}
          onChange={(e) => onStageEUnvisitedFBSolo203DChange?.(e.target.value.replace(/\D/g, ''))}
          placeholder="203D 프레시백 잔여"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          203D 프레시백 잔여 (미회수 확정)
        </p>
      </div>
    </div>
  );
}
