import { useState, useEffect } from 'react';
import { Package, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageDProps {
  workData: TodayWorkData;
  onFreshBagChange: (data: FreshBagData) => void;
  onRound2TotalRemainingChange: (value: string) => void;
  onRound2TotalReturnsChange: (value: string) => void;
}

export function StageD({
  workData,
  onFreshBagChange,
  onRound2TotalRemainingChange,
  onRound2TotalReturnsChange,
}: StageDProps) {
  const freshBag = workData.freshBag;
  const delivery203D = workData.routes['203D'];

  // ================================
  // Stage B/C 입력값 (ReadOnly 참조)
  // ================================
  const C_firstTotal = workData.firstAllocationDelivery || 0;
  const G_totalRemaining = workData.totalRemainingAfterFirstRound ?? 0;
  const F_r1_203D_remain = delivery203D.firstRoundRemaining ?? 0;
  const E_r1_206A_alloc = Math.max(0, G_totalRemaining - F_r1_203D_remain);
  const H_round1EndRemaining = workData.round1EndRemaining ?? 0;
  
  // ================================
  // Source Input (원천값)
  // ================================
  // K: 2회전 출발 전 전체 남은 물량
  const K_round2TotalRemaining = workData.round2TotalRemaining ?? 0;

  // 1회전 종료 시점 기준값 (Stage C에서 입력 - freshBag에 저장됨)
  const baseRegular = freshBag.round1EndRegular || 0;
  const baseStandalone = freshBag.round1EndStandalone || 0;

  // 전환 입력값
  const [regularToStandalone, setRegularToStandalone] = useState(freshBag.regularToStandalone || 0);
  const [standaloneToRegular, setStandaloneToRegular] = useState(freshBag.standaloneToRegular || 0);

  // 최종 계산값
  const finalRegular = baseRegular - regularToStandalone + standaloneToRegular;
  const finalStandalone = baseStandalone + regularToStandalone - standaloneToRegular;

  // 음수 체크
  const hasError = finalRegular < 0 || finalStandalone < 0;

  // 전환값 변경 시 freshBag 업데이트
  useEffect(() => {
    if (!hasError) {
      onFreshBagChange({
        ...freshBag,
        regularToStandalone,
        standaloneToRegular,
        // 최종값 저장
        round2Regular: finalRegular,
        round2Standalone: finalStandalone,
      });
    }
  }, [regularToStandalone, standaloneToRegular, hasError]);

  const handleRegularToStandaloneChange = (value: string) => {
    const val = parseInt(value.replace(/\D/g, '')) || 0;
    setRegularToStandalone(val);
  };

  const handleStandaloneToRegularChange = (value: string) => {
    const val = parseInt(value.replace(/\D/g, '')) || 0;
    setStandaloneToRegular(val);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          2회전 출발 전 상차 완료 상태 입력 (프레시백은 전환 개수만 입력)
        </p>
      </div>

      {/* Stage A/B/C 입력값 요약 (ReadOnly) */}
      <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">이전 단계 입력값 (참조)</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">ReadOnly</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">1차전체(C)</span>
            <span className="font-bold">{C_firstTotal}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">206A할당(E)</span>
            <span className="font-bold text-success">{E_r1_206A_alloc}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">203D잔여(F)</span>
            <span className="font-bold text-primary">{F_r1_203D_remain}</span>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <span className="text-xs text-muted-foreground block">1회전종료잔여(H)</span>
            <span className="font-bold">{H_round1EndRemaining}</span>
          </div>
        </div>
      </div>

      {/* 프레시백 전환 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">프레시백 전환 (자동계산)</h3>
        </div>

        {/* 기준값 표시 */}
        <div className="mb-4 p-3 bg-muted rounded-xl">
          <p className="text-xs text-muted-foreground mb-2">1회전 종료 시점 기준값</p>
          <div className="flex justify-between">
            <span className="text-sm">일반: <span className="font-bold">{baseRegular}</span></span>
            <span className="text-sm">단독: <span className="font-bold">{baseStandalone}</span></span>
          </div>
        </div>

        {/* 전환 입력 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-xl">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">일반 → 단독</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={regularToStandalone || ''}
                onChange={(e) => handleRegularToStandaloneChange(e.target.value)}
                placeholder="0"
                className="w-full h-12 px-3 text-lg font-bold text-center bg-background rounded-xl border-2 border-warning/30 focus:border-warning focus:outline-none transition-colors"
              />
            </div>
            <ArrowRightLeft className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">단독 → 일반</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={standaloneToRegular || ''}
                onChange={(e) => handleStandaloneToRegularChange(e.target.value)}
                placeholder="0"
                className="w-full h-12 px-3 text-lg font-bold text-center bg-background rounded-xl border-2 border-warning/30 focus:border-warning focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* 에러 표시 */}
          {hasError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">전환 결과가 음수가 됩니다. 입력값을 확인하세요.</span>
            </div>
          )}

          {/* 최종값 표시 (읽기 전용) */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-success/20">
            <div className={`p-4 rounded-xl text-center ${hasError ? 'bg-destructive/10' : 'bg-success/10'}`}>
              <label className="text-xs text-muted-foreground mb-1 block">최종 일반</label>
              <span className={`text-2xl font-bold ${hasError && finalRegular < 0 ? 'text-destructive' : 'text-success'}`}>
                {finalRegular}
              </span>
            </div>
            <div className={`p-4 rounded-xl text-center ${hasError ? 'bg-destructive/10' : 'bg-success/10'}`}>
              <label className="text-xs text-muted-foreground mb-1 block">최종 단독</label>
              <span className={`text-2xl font-bold ${hasError && finalStandalone < 0 ? 'text-destructive' : 'text-success'}`}>
                {finalStandalone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Source Input: 2회전 출발 전 전체 남은 물량 (K) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          1회전 잔여 포함 '전체 남은 물량' (K)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={K_round2TotalRemaining || ''}
          onChange={(e) => onRound2TotalRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 남은 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          2회전 출발 전(신규 상차 포함) 현재 전체 남은 물량
        </p>
      </div>

      {/* 반품 1차 잔여 포함 전체 반품 개수 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <label className="text-xs font-medium text-warning mb-2 block">
          반품 1차 잔여 포함 '전체 반품 개수'
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round2TotalReturns || ''}
          onChange={(e) => onRound2TotalReturnsChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 반품 개수 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-transparent focus:border-warning focus:outline-none transition-colors"
        />
      </div>

      {/* 안내 - 206A 잔여 입력칸 제거됨 */}
      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-xs text-muted-foreground text-center">
          ※ 206A 잔여는 Stage E에서 자동 파생됩니다 (중복 입력 제거)
        </p>
      </div>
    </div>
  );
}
