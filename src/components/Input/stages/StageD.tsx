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

  // 1회전 종료 시점 기준값 (Stage C에서 입력)
  const baseRegular = workData.freshBagRound1EndRegular || 0;
  const baseStandalone = workData.freshBagRound1EndStandalone || 0;

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
      } as FreshBagData);
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

      {/* 1회전 잔여 포함 전체 남은 물량 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          1회전 잔여 포함 '전체 남은 물량'
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={workData.round2TotalRemaining || ''}
          onChange={(e) => onRound2TotalRemainingChange(e.target.value.replace(/\D/g, ''))}
          placeholder="전체 남은 물량 입력"
          className="w-full h-14 px-4 text-xl font-bold text-center bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
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
    </div>
  );
}
