import { Truck, Package, RotateCcw } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageBProps {
  workData: TodayWorkData;
  onTotalRemainingChange: (value: string) => void;
  on203DRemainingChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
  onStageBReturnRemaining203DChange?: (value: string) => void;
  onStageBReturnRemaining206AChange?: (value: string) => void;
  onStageBUnvisitedFBTotal203DChange?: (value: string) => void;
}

export function StageB({
  workData,
  onTotalRemainingChange,
  on203DRemainingChange,
  onFreshBagChange,
  onStageBReturnRemaining203DChange,
  onStageBReturnRemaining206AChange,
  onStageBUnvisitedFBTotal203DChange,
}: StageBProps) {
  const delivery203D = workData.routes['203D'];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          203D 1회전 종료 후 입력 (206A는 아직 진행 중)
        </p>
      </div>

      {/* B_GIFT_TOTAL_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-primary" />
          <label className="text-sm font-semibold text-primary">
            B_GIFT_TOTAL_REMAIN
          </label>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.totalRemainingAfterFirstRound || ''}
          onChange={(e) => onTotalRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 기프트 잔여"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          전체 기프트 잔여 (미방문)
        </p>
      </div>

      {/* B_GIFT_203D_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-primary" />
          <label className="text-sm font-semibold text-primary">
            B_GIFT_203D_REMAIN
          </label>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={delivery203D.firstRoundRemaining || ''}
          onChange={(e) => on203DRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="203D 기프트 잔여"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          203D 기프트 잔여 (미방문)
        </p>
      </div>

      {/* B_FB_203D_UNVISITED */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-success" />
          <label className="text-sm font-semibold text-success">
            B_FB_203D_UNVISITED
          </label>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageB_unvisitedFB_total_203D || ''}
          onChange={(e) => onStageBUnvisitedFBTotal203DChange?.(e.target.value.replace(/\D/g, ''))}
          placeholder="203D 프레시백 미방문"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          203D 프레시백 미방문 (잔여)
        </p>
      </div>

      {/* 반품 입력 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold text-warning">반품 잔여/할당</h3>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">Source</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* B_RET_203D_UNVISITED */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">B_RET_203D_UNVISITED</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={workData.stageB_returnRemaining_203D || ''}
              onChange={(e) => onStageBReturnRemaining203DChange?.(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-warning/30 focus:border-warning focus:outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">203D 반품 잔여</p>
          </div>
          {/* B_RET_206A_UNVISITED (사실상 1회전 206A 반품 할당) */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">B_RET_206A_UNVISITED</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={workData.stageB_206A_R1_assigned || ''}
              onChange={(e) => onStageBReturnRemaining206AChange?.(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-warning/30 focus:border-warning focus:outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">206A 1회전 반품 할당</p>
          </div>
        </div>
      </div>
    </div>
  );
}
