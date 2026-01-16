import { Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { TodayWorkData, FreshBagData } from '@/types';

interface StageFProps {
  workData: TodayWorkData;
  onFreshBagChange: (data: FreshBagData) => void;
}

export function StageF({
  workData,
  onFreshBagChange,
}: StageFProps) {
  const freshBag = workData.freshBag;

  // 프레시백 시작 = 할당 + 조정 - 이관 + 추가
  const freshbagStart = 
    (freshBag.regularAllocated || 0) + 
    (freshBag.standaloneAllocated || 0) + 
    (freshBag.regularAdjustment || 0) - 
    (freshBag.transferred || 0) + 
    (freshBag.added || 0);

  // 미방문 합계
  const totalUndone = (freshBag.undoneLinked || 0) + (freshBag.undoneSolo || 0);

  // 프레시백 완료 = 시작 - 미방문 (음수 방지)
  const freshbagCompleted = Math.max(0, freshbagStart - totalUndone);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* 단계 설명 */}
      <div className="bg-success/10 rounded-xl p-3 border border-success/20">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <p className="text-sm font-medium text-success text-center">
            하루 업무 종료 후 최종 확인
          </p>
        </div>
      </div>

      {/* 미방문 프레시백 최종 확인 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold text-warning">미방문 프레시백 최종 확인</h3>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          하루 종료 시점 기준, 아직 방문하지 못한(남아 있는) 프레시백 수를 입력하세요.
          입력한 값으로 '프레시백 완료'가 자동 계산됩니다.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">일반(연계) 미방문</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.undoneLinked ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, undoneLinked: val });
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-warning/30 focus:border-warning focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">단독 미방문</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.undoneSolo ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, undoneSolo: val });
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-warning/10 rounded-xl border-2 border-warning/30 focus:border-warning focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* 자동 계산 결과 */}
        <div className="p-4 bg-success/10 rounded-xl border border-success/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">프레시백 완료 (자동계산)</span>
            </div>
            <span className="text-2xl font-bold text-success">{freshbagCompleted}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            시작({freshbagStart}) - 미방문({totalUndone}) = 완료({freshbagCompleted})
          </p>
        </div>
      </div>

      {/* 미회수 요약 (기존 유지) */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-destructive/30">
        <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          미회수 사유 요약
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">부재</label>
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
              className="w-full h-12 px-3 text-lg font-bold text-center bg-destructive/10 rounded-xl border-2 border-destructive/30 focus:border-destructive focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">상품 남아 있음</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.failedWithProducts || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, failedWithProducts: val });
              }}
              placeholder="0"
              className="w-full h-12 px-3 text-lg font-bold text-center bg-destructive/10 rounded-xl border-2 border-destructive/30 focus:border-destructive focus:outline-none transition-colors"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          확인 완료, 단가 미지급
        </p>
      </div>

      {/* 하루 요약 */}
      <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-5 border border-primary/20">
        <h3 className="text-sm font-semibold text-primary mb-3 text-center">오늘 하루 요약</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/80 rounded-xl p-3 text-center">
            <span className="text-xs text-muted-foreground block">배송 할당</span>
            <span className="text-xl font-bold text-primary">{workData.firstAllocationDelivery || 0}</span>
          </div>
          <div className="bg-background/80 rounded-xl p-3 text-center">
            <span className="text-xs text-muted-foreground block">반품 할당</span>
            <span className="text-xl font-bold text-warning">{workData.firstAllocationReturns || 0}</span>
          </div>
          <div className="bg-background/80 rounded-xl p-3 text-center">
            <span className="text-xs text-muted-foreground block">프레시백 시작</span>
            <span className="text-xl font-bold text-success">{freshbagStart}</span>
          </div>
          <div className="bg-background/80 rounded-xl p-3 text-center">
            <span className="text-xs text-muted-foreground block">프레시백 완료</span>
            <span className="text-xl font-bold text-success">{freshbagCompleted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
