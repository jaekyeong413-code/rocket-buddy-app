import { TodayWorkData, FreshBagData } from '@/types';

interface StageBProps {
  workData: TodayWorkData;
  onTotalRemainingChange: (value: string) => void;
  on203DRemainingChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
}

export function StageB({
  workData,
  onTotalRemainingChange,
  on203DRemainingChange,
  onFreshBagChange,
}: StageBProps) {
  const freshBag = workData.freshBag;
  const delivery203D = workData.routes['203D'];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          203D 종료 직후 상태 입력 (전체 잔여와 203D 잔여를 그대로 입력)
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
          value={workData.totalRemainingAfterFirstRound || ''}
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
          value={delivery203D.firstRoundRemaining || ''}
          onChange={(e) => on203DRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="203D 잔여 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-primary/10 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />

        {/* 206A 자동 계산 표시 */}
        {(workData.totalRemainingAfterFirstRound || 0) > 0 && (
          <div className="mt-3 p-3 bg-muted rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">206A 잔여 (자동계산)</span>
              <span className="text-lg font-bold text-primary">
                {Math.max(0, (workData.totalRemainingAfterFirstRound || 0) - (delivery203D.firstRoundRemaining || 0))}
              </span>
            </div>
          </div>
        )}
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
          value={freshBag.failedAbsent || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
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
