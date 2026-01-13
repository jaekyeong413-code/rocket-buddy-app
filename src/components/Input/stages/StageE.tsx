import { TodayWorkData, FreshBagData } from '@/types';

interface StageEProps {
  workData: TodayWorkData;
  onRound2RemainingChange: (value: string) => void;
  onRound2ReturnsRemainingChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
}

export function StageE({
  workData,
  onRound2RemainingChange,
  onRound2ReturnsRemainingChange,
  onFreshBagChange,
}: StageEProps) {
  const freshBag = workData.freshBag;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          203D 2회전 종료 직후 상태 입력
        </p>
      </div>

      {/* 현재 전체 남은 물량 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          현재 '전체 남은 물량'
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round2EndRemaining || ''}
          onChange={(e) => onRound2RemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 남은 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* 현재 전체 남은 반품 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <label className="text-xs font-medium text-warning mb-2 block">
          현재 '전체 남은 반품'
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round2EndReturnsRemaining || ''}
          onChange={(e) => onRound2ReturnsRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 남은 반품 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
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
          value={freshBag.round2FailedAbsent || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
            onFreshBagChange({ ...freshBag, round2FailedAbsent: val });
          }}
          placeholder="0"
          className="w-full h-12 px-4 text-lg font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          부재/상품남음 등 미확인 프레시백 수량
        </p>
      </div>

      {/* 안내 */}
      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-xs text-muted-foreground text-center">
          ※ 이 단계에서 203D 잔여 물량 입력은 기본적으로 0이며, 별도 입력 대상이 아닙니다.
        </p>
      </div>
    </div>
  );
}
