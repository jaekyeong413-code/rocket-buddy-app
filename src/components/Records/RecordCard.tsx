/**
 * 기록 목록용 카드 컴포넌트
 * 날짜별 요약 정보를 표시
 */

import { ChevronRight, TrendingUp, Package, Leaf, AlertCircle } from 'lucide-react';
import { TodayWorkData } from '@/types';
import { calculateFromWorkData, formatRate, formatCurrency } from '@/lib/recordDerived';

interface RecordCardProps {
  date: string;
  workData: TodayWorkData;
  onClick: () => void;
}

export function RecordCard({ date, workData, onClick }: RecordCardProps) {
  const { derived } = calculateFromWorkData(workData);
  
  // 날짜 포맷팅
  const displayDate = new Date(date).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  
  // 데이터 입력 여부 확인
  const hasData = derived.GIFT_DAY_TOTAL > 0 || derived.RET_DAY_TOTAL > 0 || derived.FB_TOTAL_ASSIGNED > 0;
  
  // FB 회수율 경고 (90%/70% 미만)
  const fbGenWarning = derived.FB_GEN_ASSIGNED > 0 && derived.FB_GEN_RATE < 0.9;
  const fbSoloWarning = derived.FB_SOLO_ASSIGNED > 0 && derived.FB_SOLO_RATE < 0.7;
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-2xl p-4 shadow-card border border-border/30 hover:border-primary/30 transition-all text-left group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">{displayDate}</span>
          {!hasData && (
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              미입력
            </span>
          )}
          {(fbGenWarning || fbSoloWarning) && (
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              FB 주의
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      
      {/* 요약 정보 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* 기프트 */}
        <div className="bg-primary/10 rounded-xl p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs font-medium">기프트</span>
          </div>
          <div className="text-lg font-bold">{derived.GIFT_DAY_TOTAL}</div>
          <div className="text-[10px] text-muted-foreground">
            203D:{derived.GIFT_DAY_203D} / 206A:{derived.GIFT_DAY_206A}
          </div>
        </div>
        
        {/* 반품 */}
        <div className="bg-warning/10 rounded-xl p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-warning mb-1">
            <Package className="w-3 h-3" />
            <span className="text-xs font-medium">반품</span>
          </div>
          <div className="text-lg font-bold">{derived.RET_DAY_TOTAL}</div>
          <div className="text-[10px] text-muted-foreground">
            203D:{derived.RET_DAY_203D} / 206A:{derived.RET_DAY_206A}
          </div>
        </div>
        
        {/* 프레시백 */}
        <div className="bg-success/10 rounded-xl p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-success mb-1">
            <Leaf className="w-3 h-3" />
            <span className="text-xs font-medium">FB</span>
          </div>
          <div className="text-lg font-bold">{derived.FB_TOTAL_ASSIGNED}</div>
          <div className="text-[10px] text-muted-foreground">
            {formatRate(derived.FB_203D_RATE)}% / {formatRate(derived.FB_206A_RATE)}%
          </div>
        </div>
      </div>
      
      {/* 예상 수입 */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground">오늘 예상 수입</span>
        <span className="text-sm font-bold text-primary">
          {formatCurrency(derived.TODAY_EST_INCOME_BASE)}
        </span>
      </div>
    </button>
  );
}
