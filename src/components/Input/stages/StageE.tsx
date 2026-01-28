import { TodayWorkData, FreshBagData } from '@/types';

interface StageEProps {
  workData: TodayWorkData;
  onRound2RemainingChange: (value: string) => void;
  onRound2ReturnsRemainingChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
  onStageEUnvisitedFBSolo203DChange?: (value: string) => void;
  onStageE206AReturnRemainingChange?: (value: string) => void;
}

export function StageE({
  workData,
  onRound2RemainingChange,
  onRound2ReturnsRemainingChange,
  onFreshBagChange,
  onStageEUnvisitedFBSolo203DChange,
  onStageE206AReturnRemainingChange,
}: StageEProps) {
  const freshBag = workData.freshBag;

  // ================================
  // Source Input (원천값)
  // ================================
  // 1차 배송 전체 물량
  const firstDeliveryTotal = workData.firstAllocationDelivery || 0;
  
  // 1회전 종료 시 전체 잔여 (Stage B 또는 Stage C)
  const firstRoundEndTotalRemaining = workData.round1EndRemaining ?? workData.totalRemainingAfterFirstRound ?? 0;
  
  // 2회전 출발 전 전체 (Stage D)
  const round2TotalRemaining = workData.round2TotalRemaining ?? 0;
  
  // 2회전 종료 후 전체 잔여 (현재 Stage - 최종 Source)
  const secondRoundEndTotalRemaining = workData.round2EndRemaining ?? 0;
  
  // 반품
  const returnTotalFinal = workData.round2EndReturnsRemaining ?? 0;
  
  // ================================
  // Derived (파생값 - 실시간 계산)
  // ================================
  // 1회전 배송 완료 = 1차전체 - 1회전종료잔여
  const firstRoundDeliveredTotal = Math.max(0, firstDeliveryTotal - firstRoundEndTotalRemaining);
  
  // 2회전 신규 추가분 = Stage D 전체 - 1회전 잔여
  const secondRoundNewAllocation = Math.max(0, round2TotalRemaining - firstRoundEndTotalRemaining);
  
  // 2회전 시작 물량 = 1회전 잔여 + 신규 추가
  const secondRoundTotalStart = firstRoundEndTotalRemaining + secondRoundNewAllocation;
  
  // 2회전 배송 완료 = 2회전시작 - 2회전종료잔여
  const secondRoundDeliveredTotal = Math.max(0, secondRoundTotalStart - secondRoundEndTotalRemaining);
  
  // 오늘 전체 배송 완료
  const todayDeliveredTotal = firstRoundDeliveredTotal + secondRoundDeliveredTotal;
  
  // 반품 라우트 분리 (파생) - 새 수식 기반
  const stageE_206A_rem = workData.stageE_206A_returnRemaining ?? 0;
  const returnRemain206A = stageE_206A_rem;
  const returnRemain203D = Math.max(0, returnTotalFinal - returnRemain206A);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          2회전 종료 직후 상태 입력
        </p>
      </div>

      {/* 이전 단계 값 요약 (ReadOnly) */}
      <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">이전 단계 입력값 (참조)</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">ReadOnly</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">1차전체</span>
            <span className="font-bold">{firstDeliveryTotal}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">1회전잔여</span>
            <span className="font-bold">{firstRoundEndTotalRemaining}</span>
          </div>
          <div className="p-2 bg-success/10 rounded-lg">
            <span className="text-xs text-muted-foreground block">1회전완료</span>
            <span className="font-bold text-success">{firstRoundDeliveredTotal}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">2회전시작</span>
            <span className="font-bold">{secondRoundTotalStart}</span>
          </div>
        </div>
      </div>

      {/* Source Input: 2회전 종료 후 전체 잔여 (M) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-primary/30">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-primary">
            2회전 종료 후 '전체 잔여 물량'
          </label>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={secondRoundEndTotalRemaining || ''}
          onChange={(e) => onRound2RemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 잔여 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          2회전 종료 직후 남은 전체 물량 (최종 확정값)
        </p>
      </div>

      {/* Derived: 오늘 예상 배송 완료 (ReadOnly) */}
      <div className="bg-success/5 rounded-2xl p-4 border border-success/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-success">오늘 배송 완료 (자동계산)</span>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">Derived</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-success/10 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">1회전</span>
            <span className="text-xl font-bold text-success">{firstRoundDeliveredTotal}</span>
          </div>
          <div className="p-3 bg-success/10 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">2회전</span>
            <span className="text-xl font-bold text-success">{secondRoundDeliveredTotal}</span>
          </div>
          <div className="p-3 bg-success/20 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">합계</span>
            <span className="text-xl font-bold text-success">{todayDeliveredTotal}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          = 1회전완료({firstRoundDeliveredTotal}) + 2회전완료({secondRoundDeliveredTotal})
        </p>
      </div>

      {/* Source Input: 현재 전체 남은 반품 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <label className="text-xs font-medium text-warning mb-2 block">
          현재 '전체 남은 반품'
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={returnTotalFinal || ''}
          onChange={(e) => onRound2ReturnsRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 남은 반품 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
      </div>

      {/* Source Input: 206A 현재 잔여 반품 (E_206_REM_NOW) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-warning">
            206A 현재 잔여 반품
          </label>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">Source</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageE_206A_returnRemaining ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageE206AReturnRemainingChange?.(val);
          }}
          placeholder="0"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Stage E (203D 완전 종료) 시점 기준 206A에 남아 있는 반품 수량
        </p>
      </div>

      {/* Derived: 반품 라우트 분리 (ReadOnly) */}
      <div className="bg-warning/5 rounded-2xl p-4 border border-warning/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-warning">반품 라우트 분리 (자동계산)</span>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">Derived</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-warning/10 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">203D 잔여</span>
            <span className="text-xl font-bold text-warning">{returnRemain203D}</span>
          </div>
          <div className="p-3 bg-warning/10 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">206A 잔여</span>
            <span className="text-xl font-bold text-warning">{returnRemain206A}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          203D잔여 = 전체남은반품 - 206A현재잔여
        </p>
      </div>

      {/* Source Input: 203D 미방문 단독 프레시백 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <label className="text-xs font-medium text-success mb-2 block">
          203D 미방문 단독 프레시백
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.stageE_unvisitedFB_solo_203D ?? ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            onStageEUnvisitedFBSolo203DChange?.(val);
          }}
          placeholder="0"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-transparent focus:border-success focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          203D 종료 시점 확정 미방문(단독). 미입력=0
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
    </div>
  );
}