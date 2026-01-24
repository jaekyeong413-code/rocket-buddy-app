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
  const delivery203D = workData.routes['203D'];
  
  // ================================
  // Stage B에서 입력된 값 (ReadOnly 표시)
  // ================================
  const G_totalRemaining = workData.totalRemainingAfterFirstRound ?? 0;
  const F_r1_203D_remain = delivery203D.firstRoundRemaining ?? 0;
  const E_r1_206A_alloc = Math.max(0, G_totalRemaining - F_r1_203D_remain);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          1회전 종료 시점에 차량에 남아 있는 잔여 입력
        </p>
      </div>

      {/* Stage B 입력값 요약 (ReadOnly) */}
      <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">Stage B 입력값 (참조)</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">ReadOnly</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">전체잔여(G)</span>
            <span className="text-lg font-bold text-foreground">{G_totalRemaining}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">203D잔여(F)</span>
            <span className="text-lg font-bold text-primary">{F_r1_203D_remain}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">206A할당(E)</span>
            <span className="text-lg font-bold text-success">{E_r1_206A_alloc}</span>
          </div>
        </div>
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

      {/* Source Input: (있으면) 1회전 종료 시점 잔여 물량 (H) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          (있으면) 1회전 종료 시점의 잔여 물량 (H)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round1EndRemaining || ''}
          onChange={(e) => onRound1EndRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="잔여 물량 입력 (없으면 미입력)"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          1회전이 끝난 직후 차에 남아있는 전체 잔여. 없으면 미입력(=0)
        </p>
      </div>

      {/* 안내 - 중복 입력 제거됨 */}
      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-xs text-muted-foreground text-center">
          ※ 기프트 라우트별 잔여는 Stage B에서 이미 입력됨 (중복 입력 제거)
        </p>
      </div>
    </div>
  );
}
