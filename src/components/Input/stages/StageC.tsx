import { Package } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageCProps {
  workData: TodayWorkData;
  onFreshBagChange: (data: FreshBagData) => void;
  onRound1EndRemainingChange: (value: string) => void;
}

export function StageC({
  workData,
  onFreshBagChange,
  onRound1EndRemainingChange,
}: StageCProps) {
  const freshBag = workData.freshBag;

  // 1회전 종료 시점 프레시백 잔여 (별도 필드 사용 - 기존 필드 재활용)
  // regularAdjustment를 일반 잔여로, transferred를 단독 잔여로 임시 사용
  // 실제로는 새 필드를 추가해야 하지만 기존 구조 활용

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
              value={workData.freshBagRound1EndRegular || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                // workData에 직접 저장 (store 확장 필요)
                onFreshBagChange({ ...freshBag, round1EndRegular: val } as FreshBagData);
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
              value={workData.freshBagRound1EndStandalone || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, round1EndStandalone: val } as FreshBagData);
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
    </div>
  );
}
