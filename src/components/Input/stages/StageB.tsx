import { TodayWorkData, FreshBagData } from '@/types';

interface StageBProps {
  workData: TodayWorkData;
  onTotalRemainingChange: (value: string) => void;
  on203DRemainingChange: (value: string) => void;
  onStageBGiftAlloc206AChange?: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
  onStageBReturnRemaining203DChange?: (value: string) => void;
  onStageBUnvisitedFBTotal203DChange?: (value: string) => void;
}

export function StageB({
  workData,
  onTotalRemainingChange,
  on203DRemainingChange,
  onStageBGiftAlloc206AChange,
  onFreshBagChange,
  onStageBReturnRemaining203DChange,
  onStageBUnvisitedFBTotal203DChange,
}: StageBProps) {
  const freshBag = workData.freshBag;
  const delivery203D = workData.routes['203D'];
  
  // Stage B 값들
  const totalRemaining = workData.totalRemainingAfterFirstRound ?? 0;
  const remaining203D = delivery203D.firstRoundRemaining ?? 0;
  
  // 206A 1차 할당 = 전체 잔여 - 203D 잔여
  const allocated206A = Math.max(0, totalRemaining - remaining203D);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          203D 1회전 종료 직후 상태 입력
        </p>
      </div>

      {/* 1회전 현재 전체 잔여 물량 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          1회전 현재 '전체 잔여 물량'
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={totalRemaining !== 0 ? String(totalRemaining) : (workData.totalRemainingAfterFirstRound !== undefined ? String(workData.totalRemainingAfterFirstRound) : '')}
          onChange={(e) => onTotalRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 잔여 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* 203D 잔여 물량 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <label className="text-xs font-medium text-primary mb-2 block">
          203D 잔여 물량
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={remaining203D !== 0 ? String(remaining203D) : (delivery203D.firstRoundRemaining !== undefined ? String(delivery203D.firstRoundRemaining) : '')}
          onChange={(e) => on203DRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="203D 잔여 입력 (기본값: 0)"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-primary/10 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          입력하지 않으면 기본값 0 (203D에 남길 물량 없음)
        </p>

        {/* 206A 1차 할당 자동 계산 표시 */}
        {totalRemaining > 0 && (
          <div className="mt-3 p-3 bg-success/10 rounded-xl border border-success/20">
            <div className="flex justify-between items-center">
              <span className="text-xs text-success font-medium">206A 1차 할당 (자동계산)</span>
              <span className="text-lg font-bold text-success">
                {allocated206A}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              = 전체잔여({totalRemaining}) - 203D잔여({remaining203D})
            </p>
          </div>
        )}
      </div>

      {/* ★ 엑셀식 원본값: 206A 1차 할당 (사용자 입력) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <label className="text-xs font-medium text-success mb-2 block">
          206A 1차 할당
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageB_giftAlloc_206A ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageBGiftAlloc206AChange?.(val);
          }}
          placeholder="0"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          엑셀식 계산용 원본값(E). 미입력=0
        </p>
      </div>

      {/* ★ 신규: 203D 잔여 반품 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <label className="text-xs font-medium text-warning mb-2 block">
          203D 잔여 반품
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageB_returnRemaining_203D ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageBReturnRemaining203DChange?.(val);
          }}
          placeholder="0"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Stage B 시점 기준 203D 잔여 반품. 미입력=0
        </p>
      </div>

      {/* ★ 신규: 203D 미방문 프레시백 */}
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
