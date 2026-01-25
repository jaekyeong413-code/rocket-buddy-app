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
  
  // ================================
  // Stage B에서 입력된 값 (ReadOnly 표시)
  // ================================
  const firstDeliveryTotal = workData.firstAllocationDelivery || 0;
  const G_totalRemaining = workData.totalRemainingAfterFirstRound ?? 0;
  
  // Derived: 1회전 배송 완료
  const firstRoundDelivered = Math.max(0, firstDeliveryTotal - G_totalRemaining);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          1회전 종료 시점에 차량에 남아 있는 잔여 확인
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
            <span className="text-xs text-muted-foreground block">1차전체</span>
            <span className="text-lg font-bold text-foreground">{firstDeliveryTotal}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">전체잔여</span>
            <span className="text-lg font-bold text-primary">{G_totalRemaining}</span>
          </div>
          <div className="p-2 bg-success/10 rounded-lg">
            <span className="text-xs text-muted-foreground block">1회전 완료</span>
            <span className="text-lg font-bold text-success">{firstRoundDelivered}</span>
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
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-muted-foreground">
            (수정) 1회전 종료 시점 잔여 물량
          </label>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">선택</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round1EndRemaining || ''}
          onChange={(e) => onRound1EndRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="Stage B 값과 다를 경우만 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Stage B의 전체잔여({G_totalRemaining})와 다를 경우만 입력. 없으면 미입력
        </p>
      </div>

      {/* 안내 - 중복 입력 제거됨 */}
      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-xs text-muted-foreground text-center">
          ※ 1회전 배송 완료는 Stage B 입력값에서 자동 계산됨 (중복 입력 불필요)
        </p>
      </div>
    </div>
  );
}