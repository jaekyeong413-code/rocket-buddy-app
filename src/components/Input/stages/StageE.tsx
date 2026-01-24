import { TodayWorkData, FreshBagData } from '@/types';

interface StageEProps {
  workData: TodayWorkData;
  onRound2RemainingChange: (value: string) => void;
  onRound2ReturnsRemainingChange: (value: string) => void;
  onFreshBagChange: (data: FreshBagData) => void;
  onStageEUnvisitedFBSolo203DChange?: (value: string) => void;
}

export function StageE({
  workData,
  onRound2RemainingChange,
  onRound2ReturnsRemainingChange,
  onFreshBagChange,
  onStageEUnvisitedFBSolo203DChange,
}: StageEProps) {
  const freshBag = workData.freshBag;
  const delivery203D = workData.routes['203D'];

  // ================================
  // 이전 단계 값 (ReadOnly 참조)
  // ================================
  const C_firstTotal = workData.firstAllocationDelivery || 0;
  const G_totalRemaining = workData.totalRemainingAfterFirstRound ?? 0;
  const F_r1_203D_remain = delivery203D.firstRoundRemaining ?? 0;
  const E_r1_206A_alloc = Math.max(0, G_totalRemaining - F_r1_203D_remain);
  const K_round2TotalRemaining = workData.round2TotalRemaining ?? 0;
  
  // ================================
  // Source Input (원천값)
  // ================================
  // M: 203D 2회전 종료 후 '전체 남은 물량'
  const M_finalTotalRemaining = workData.round2EndRemaining ?? 0;
  
  // returnTotalFinal: 전체 남은 반품
  const returnTotalFinal = workData.round2EndReturnsRemaining ?? 0;
  
  // ================================
  // Derived (파생값 - 실시간 계산)
  // ================================
  // 203D 1차 할당 = C - E
  const D_r1_203D_alloc = Math.max(0, C_firstTotal - E_r1_206A_alloc);
  
  // 2회전 배분 (Stage B/C/D 값 기준으로 자동 계산)
  // Stage D의 K에서 1회전 잔여(F)를 빼면 2회전 신규 추가분
  const round2NewAllocation = Math.max(0, K_round2TotalRemaining - F_r1_203D_remain);
  
  // 최종 남은 물량(M)을 기준으로 라우트별 완료 계산
  // 206A 최종 잔여 = M (전체 남은) - 203D 잔여 (Stage B에서 입력된 F 참조, 단 2회전 종료 후이므로 새 계산 필요)
  // 간단화: 2회전 종료 후 전체 남은 = 203D 남은 + 206A 남은
  // 206A 남은은 Stage B의 E_r1_206A_alloc에서 배송 완료분을 뺀 값
  
  // 기프트 완료 계산 (실시간)
  const giftDelivered203D = D_r1_203D_alloc + Math.max(0, round2NewAllocation);
  const giftDelivered206A = E_r1_206A_alloc;
  const totalGiftDelivered = giftDelivered203D + giftDelivered206A - M_finalTotalRemaining;
  
  // 반품 라우트 분리 (파생)
  const stageB_returnRemaining_206A = workData.stageB_returnRemaining_206A ?? 0;
  const returnRemain203D = Math.max(0, returnTotalFinal - stageB_returnRemaining_206A);
  const returnRemain206A = stageB_returnRemaining_206A;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          203D 2회전 종료 직후 상태 입력
        </p>
      </div>

      {/* 이전 단계 값 요약 (ReadOnly) */}
      <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">이전 단계 입력값 (참조)</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">ReadOnly</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">1차전체(C)</span>
            <span className="font-bold">{C_firstTotal}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">206A할당(E)</span>
            <span className="font-bold text-success">{E_r1_206A_alloc}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">2차전체(K)</span>
            <span className="font-bold">{K_round2TotalRemaining}</span>
          </div>
        </div>
      </div>

      {/* Source Input: 현재 전체 남은 물량 (M) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          현재 '전체 남은 물량' (M)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={M_finalTotalRemaining || ''}
          onChange={(e) => onRound2RemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 남은 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          203D 2회전 종료 직후 남은 전체 물량 (최종 확정값)
        </p>
      </div>

      {/* Derived: 오늘 예상 배송 완료 (ReadOnly) */}
      <div className="bg-success/5 rounded-2xl p-4 border border-success/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-success">오늘 예상 배송 완료 (자동계산)</span>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">ReadOnly</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-success/10 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">203D</span>
            <span className="text-xl font-bold text-success">{Math.max(0, giftDelivered203D - M_finalTotalRemaining)}</span>
          </div>
          <div className="p-3 bg-success/10 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">206A</span>
            <span className="text-xl font-bold text-success">{giftDelivered206A}</span>
          </div>
          <div className="p-3 bg-success/20 rounded-xl">
            <span className="text-xs text-muted-foreground block mb-1">합계</span>
            <span className="text-xl font-bold text-success">{Math.max(0, totalGiftDelivered)}</span>
          </div>
        </div>
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

      {/* Derived: 반품 라우트 분리 (ReadOnly) */}
      <div className="bg-warning/5 rounded-2xl p-4 border border-warning/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-warning">반품 라우트 분리 (자동계산)</span>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">ReadOnly</span>
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
          203D잔여 = 전체남은반품 - 206A잔여반품(Stage B)
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
