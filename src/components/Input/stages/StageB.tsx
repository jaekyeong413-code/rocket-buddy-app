import { TodayWorkData, FreshBagData } from '@/types';

interface StageBProps {
  workData: TodayWorkData;
  onTotalRemainingChange: (value: string) => void;
  on203DRemainingChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
  onStageBReturnRemaining206AChange?: (value: string) => void;
  onStageBUnvisitedFBTotal203DChange?: (value: string) => void;
}

export function StageB({
  workData,
  onTotalRemainingChange,
  on203DRemainingChange,
  onFreshBagChange,
  onStageBReturnRemaining206AChange,
  onStageBUnvisitedFBTotal203DChange,
}: StageBProps) {
  const freshBag = workData.freshBag;
  const delivery203D = workData.routes['203D'];
  
  // ================================
  // Source Input (원천값)
  // ================================
  // G: 1회전 현재 전체 잔여 물량
  const G_totalRemaining = workData.totalRemainingAfterFirstRound ?? 0;
  // F: 203D 잔여 물량
  const F_r1_203D_remain = delivery203D.firstRoundRemaining ?? 0;
  
  // ================================
  // Derived (파생값 - ReadOnly)
  // ================================
  // E: 206A 1차 할당 = max(0, G - F)
  const E_r1_206A_alloc = Math.max(0, G_totalRemaining - F_r1_203D_remain);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          203D 1회전 종료 직후 상태 입력
        </p>
      </div>

      {/* Source Input: 1회전 현재 전체 잔여 물량 (G) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          1회전 현재 '전체 잔여 물량' (G)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={G_totalRemaining !== 0 ? String(G_totalRemaining) : (workData.totalRemainingAfterFirstRound !== undefined ? String(workData.totalRemainingAfterFirstRound) : '')}
          onChange={(e) => onTotalRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 잔여 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Source Input: 203D 잔여 물량 (F) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <label className="text-xs font-medium text-primary mb-2 block">
          203D 잔여 물량 (F)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={F_r1_203D_remain !== 0 ? String(F_r1_203D_remain) : (delivery203D.firstRoundRemaining !== undefined ? String(delivery203D.firstRoundRemaining) : '')}
          onChange={(e) => on203DRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="203D 잔여 입력 (기본값: 0)"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-primary/10 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          입력하지 않으면 기본값 0 (203D에 남길 물량 없음)
        </p>
      </div>

      {/* Derived: 206A 1차 할당 (E) - ReadOnly 자동계산 */}
      <div className="bg-success/5 rounded-2xl p-5 border border-success/30">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-success">
            206A 1차 할당 (자동계산)
          </label>
          <span className="text-xs text-muted-foreground bg-success/10 px-2 py-0.5 rounded">
            ReadOnly
          </span>
        </div>
        <div className="w-full h-14 px-4 flex items-center justify-center bg-success/10 rounded-xl border-2 border-success/20">
          <span className="text-2xl font-bold text-success">
            {E_r1_206A_alloc}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          = 전체잔여(G:{G_totalRemaining}) - 203D잔여(F:{F_r1_203D_remain})
        </p>
      </div>

      {/* Source Input: 206A 잔여 반품 - 반품 수익/통계용 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <label className="text-xs font-medium text-warning mb-2 block">
          206A 잔여 반품
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageB_returnRemaining_206A ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageBReturnRemaining206AChange?.(val);
          }}
          placeholder="0"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          반품 수익/통계용. 배송 계산에 영향 없음
        </p>
      </div>

      {/* Source Input: 203D 미방문 프레시백 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <label className="text-xs font-medium text-success mb-2 block">
          203D 미방문 프레시백
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageB_unvisitedFB_total_203D ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageBUnvisitedFBTotal203DChange?.(val);
          }}
          placeholder="0"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Stage B 시점 기준 203D 미방문 프백 총량(일반+단독). 미입력=0
        </p>
      </div>

      {/* 203D 미확인 프레시백 (선택) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/20">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          (선택) 203D 미확인 프레시백
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={freshBag.failedAbsent !== undefined && freshBag.failedAbsent !== null ? String(freshBag.failedAbsent) : ''}
          onChange={(e) => {
            const inputValue = e.target.value.replace(/\D/g, '');
            const val = inputValue === '' ? 0 : parseInt(inputValue);
            onFreshBagChange({ ...freshBag, failedAbsent: val });
          }}
          placeholder="0"
          className="w-full h-12 px-4 text-lg font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          부재/상품남음 등 미확인 프레시백 수량
        </p>
      </div>
    </div>
  );
}
