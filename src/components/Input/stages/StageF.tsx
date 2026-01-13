import { Package, CheckCircle } from 'lucide-react';
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

      {/* 최종 프레시백 확인값 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">최종 프레시백 확인값</h3>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          206A 프레시백 포함, 하루 종료 시점에서 확인된 프레시백 상태를 입력하세요.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">일반(연계) 완료</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.finalRegularCompleted || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, finalRegularCompleted: val } as FreshBagData);
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">단독 완료</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={freshBag.finalStandaloneCompleted || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onFreshBagChange({ ...freshBag, finalStandaloneCompleted: val } as FreshBagData);
              }}
              placeholder="0"
              className="w-full h-14 px-3 text-xl font-bold text-center bg-success/10 rounded-xl border-2 border-success/30 focus:border-success focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* 미회수 요약 */}
        <div className="p-4 bg-muted rounded-xl">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">미회수 사유 요약</h4>
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
            <span className="text-xl font-bold text-success">
              {(freshBag.regularAllocated || 0) + (freshBag.standaloneAllocated || 0)}
            </span>
          </div>
          <div className="bg-background/80 rounded-xl p-3 text-center">
            <span className="text-xs text-muted-foreground block">프레시백 완료</span>
            <span className="text-xl font-bold text-success">
              {(freshBag.finalRegularCompleted || 0) + (freshBag.finalStandaloneCompleted || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
