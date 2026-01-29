import { Package, CheckCircle } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageFProps {
  workData: TodayWorkData;
  onFreshBagChange: (data: FreshBagData) => void;
  onStageFUnvisitedFBSolo206AChange?: (value: string) => void;
}

export function StageF({
  workData,
  onFreshBagChange,
  onStageFUnvisitedFBSolo206AChange,
}: StageFProps) {
  const freshBag = workData.freshBag;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-success/10 rounded-xl p-3 border border-success/20">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <p className="text-sm font-medium text-success text-center">
            업무 종료 (206A까지 완전 종료) 후 입력
          </p>
        </div>
      </div>

      {/* F_FB_206A_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-success" />
          <label className="text-sm font-semibold text-success">
            F_FB_206A_REMAIN
          </label>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageF_unvisitedFB_solo_206A ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageFUnvisitedFBSolo206AChange?.(val);
          }}
          placeholder="206A 프레시백 잔여"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          206A 프레시백 미방문 (미회수 확정)
        </p>
      </div>

      {/* F_FB_GEN_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-success" />
          <label className="text-sm font-semibold text-success">
            F_FB_GEN_REMAIN
          </label>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={freshBag.undoneLinked ?? ''}
          onChange={(e) => {
            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
            onFreshBagChange({ ...freshBag, undoneLinked: val });
          }}
          placeholder="일반 프레시백 미방문"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          일반 프레시백 미방문 (잔여)
        </p>
      </div>

      {/* F_FB_SOLO_REMAIN */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-success" />
          <label className="text-sm font-semibold text-success">
            F_FB_SOLO_REMAIN
          </label>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={freshBag.undoneSolo ?? ''}
          onChange={(e) => {
            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
            onFreshBagChange({ ...freshBag, undoneSolo: val });
          }}
          placeholder="단독 프레시백 미방문"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          단독 프레시백 미방문 (잔여)
        </p>
      </div>
    </div>
  );
}
