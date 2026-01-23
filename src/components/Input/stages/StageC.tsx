import { Package } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageCProps {
  workData: TodayWorkData;
  onFreshBagChange: (data: FreshBagData) => void;
  onRound1EndRemainingChange: (value: string) => void;
  onStageCReturnRemaining206AChange?: (value: string) => void;
  onStageCGiftRemain203DChange?: (value: string) => void;
  onStageCGiftRemain206AChange?: (value: string) => void;
}

export function StageC({
  workData,
  onFreshBagChange,
  onRound1EndRemainingChange,
  onStageCReturnRemaining206AChange,
  onStageCGiftRemain203DChange,
  onStageCGiftRemain206AChange,
}: StageCProps) {
  const freshBag = workData.freshBag;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          1회전 종료 시점에 차량에 남아 있는 잔여 입력
        </p>
      </div>

      {/* 1회전 종료 시점 프레시백 잔여 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">1회전 종료 시점 프레시백 잔여</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">일반 잔여</label>
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
              className="w-full h-14 px-3 text-xl font-bold text-center bg-muted rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">단독 잔여</label>
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
              className="w-full h-14 px-3 text-xl font-bold text-center bg-muted rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* (있으면) 1회전 종료 시점 잔여 물량 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          (있으면) 1회전 종료 시점의 잔여 물량
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round1EndRemaining || ''}
          onChange={(e) => onRound1EndRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="잔여 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* ★ 엑셀식 원본값: 1회전 종료 잔여(203D/206A) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <label className="text-xs font-medium text-primary mb-2 block">
          1회전 종료 잔여 기프트 (203D/206A)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">203D 잔여</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={workData.stageC_giftRemain_203D ?? ''}
              onChange={(e) => onStageCGiftRemain203DChange?.(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-primary/10 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">206A 잔여</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={workData.stageC_giftRemain_206A ?? ''}
              onChange={(e) => onStageCGiftRemain206AChange?.(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          엑셀식 계산용 원본값(F/G). 미입력=0
        </p>
      </div>

      {/* ★ 신규: 206A 잔여 반품 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <label className="text-xs font-medium text-warning mb-2 block">
          206A 잔여 반품
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageC_returnRemaining_206A ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageCReturnRemaining206AChange?.(val);
          }}
          placeholder="0"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Stage C 시점 기준 206A 잔여 반품. 미입력=0
        </p>
      </div>
    </div>
  );
}
