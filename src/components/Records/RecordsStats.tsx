/**
 * 기록 통계 화면 컴포넌트
 * 
 * 주간/월간 통계를 표시
 * - 기프트: 합계/라우트별/비율
 * - 반품: 합계/라우트별/비율
 * - 프레시백: 할당/미회수/회수율(가중평균)
 * - 수입: 총합/일평균/항목별
 */

import { useMemo } from 'react';
import { TrendingUp, Package, Leaf, Wallet, Calendar } from 'lucide-react';
import { TodayWorkData } from '@/types';
import { calculateFromWorkData, formatRate, formatCurrency } from '@/lib/recordDerived';

interface RecordsStatsProps {
  records: Array<{ date: string; workData: TodayWorkData }>;
  periodLabel: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}

function StatCard({ icon, title, children, accentColor = 'primary' }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/30 p-4">
      <div className={`flex items-center gap-2 text-${accentColor} mb-3`}>
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatRow({ label, value, subValue }: { label: string; value: string | number; subValue?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium">{value}</span>
        {subValue && <span className="text-xs text-muted-foreground ml-1">({subValue})</span>}
      </div>
    </div>
  );
}

export function RecordsStats({ records, periodLabel }: RecordsStatsProps) {
  // 통계 계산
  const stats = useMemo(() => {
    if (records.length === 0) {
      return null;
    }
    
    // 각 레코드의 derived 값 계산
    const derivedList = records.map(r => calculateFromWorkData(r.workData).derived);
    
    // 합계
    const totals = {
      giftTotal: 0,
      gift203D: 0,
      gift206A: 0,
      retTotal: 0,
      ret203D: 0,
      ret206A: 0,
      fb203DAssigned: 0,
      fb203DUncollected: 0,
      fb206AAssigned: 0,
      fb206AUncollected: 0,
      fbGenAssigned: 0,
      fbGenUncollected: 0,
      fbSoloAssigned: 0,
      fbSoloUncollected: 0,
      incomeGift: 0,
      incomeRet: 0,
      incomeFBAssigned: 0,
      incomeFBDeduct: 0,
      incomeTotal: 0,
    };
    
    derivedList.forEach(d => {
      totals.giftTotal += d.GIFT_DAY_TOTAL;
      totals.gift203D += d.GIFT_DAY_203D;
      totals.gift206A += d.GIFT_DAY_206A;
      totals.retTotal += d.RET_DAY_TOTAL;
      totals.ret203D += d.RET_DAY_203D;
      totals.ret206A += d.RET_DAY_206A;
      totals.fb203DAssigned += d.FB_203D_ASSIGNED;
      totals.fb203DUncollected += d.FB_203D_UNCOLLECTED;
      totals.fb206AAssigned += d.FB_206A_ASSIGNED;
      totals.fb206AUncollected += d.FB_206A_UNCOLLECTED;
      totals.fbGenAssigned += d.FB_GEN_ASSIGNED;
      totals.fbGenUncollected += d.FB_GEN_UNCOLLECTED;
      totals.fbSoloAssigned += d.FB_SOLO_ASSIGNED;
      totals.fbSoloUncollected += d.FB_SOLO_UNCOLLECTED;
      totals.incomeGift += d.INCOME_GIFT;
      totals.incomeRet += d.INCOME_RET;
      totals.incomeFBAssigned += d.INCOME_FB_ASSIGNED;
      totals.incomeFBDeduct += d.INCOME_FB_DEDUCT;
      totals.incomeTotal += d.TODAY_EST_INCOME_BASE;
    });
    
    const days = records.length;
    
    // 가중 평균 회수율
    const fb203DRate = totals.fb203DAssigned > 0 
      ? (totals.fb203DAssigned - totals.fb203DUncollected) / totals.fb203DAssigned 
      : 0;
    const fb206ARate = totals.fb206AAssigned > 0 
      ? (totals.fb206AAssigned - totals.fb206AUncollected) / totals.fb206AAssigned 
      : 0;
    const fbGenRate = totals.fbGenAssigned > 0 
      ? (totals.fbGenAssigned - totals.fbGenUncollected) / totals.fbGenAssigned 
      : 0;
    const fbSoloRate = totals.fbSoloAssigned > 0 
      ? (totals.fbSoloAssigned - totals.fbSoloUncollected) / totals.fbSoloAssigned 
      : 0;
    
    // 비율 평균
    const gift203DRate = totals.giftTotal > 0 ? totals.gift203D / totals.giftTotal : 0;
    const gift206ARate = totals.giftTotal > 0 ? totals.gift206A / totals.giftTotal : 0;
    const ret203DRate = totals.retTotal > 0 ? totals.ret203D / totals.retTotal : 0;
    const ret206ARate = totals.retTotal > 0 ? totals.ret206A / totals.retTotal : 0;
    
    return {
      days,
      ...totals,
      fb203DRate,
      fb206ARate,
      fbGenRate,
      fbSoloRate,
      gift203DRate,
      gift206ARate,
      ret203DRate,
      ret206ARate,
      dailyAvgIncome: totals.incomeTotal / days,
      dailyAvgGift: totals.giftTotal / days,
      dailyAvgRet: totals.retTotal / days,
    };
  }, [records]);
  
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">선택한 기간에 기록이 없습니다</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 기간 정보 */}
      <div className="bg-muted/50 rounded-xl p-3 text-center">
        <span className="text-sm font-medium">{periodLabel}</span>
        <span className="text-xs text-muted-foreground ml-2">({stats.days}일)</span>
      </div>
      
      {/* 기프트 통계 */}
      <StatCard icon={<TrendingUp className="w-4 h-4" />} title="기프트 통계" accentColor="primary">
        <StatRow label="합계" value={`${stats.giftTotal}건`} />
        <StatRow label="일평균" value={`${stats.dailyAvgGift.toFixed(1)}건`} />
        <div className="h-px bg-border/50 my-2" />
        <StatRow label="203D 합계" value={`${stats.gift203D}건`} subValue={`${formatRate(stats.gift203DRate)}%`} />
        <StatRow label="206A 합계" value={`${stats.gift206A}건`} subValue={`${formatRate(stats.gift206ARate)}%`} />
      </StatCard>
      
      {/* 반품 통계 */}
      <StatCard icon={<Package className="w-4 h-4" />} title="반품 통계" accentColor="warning">
        <StatRow label="합계" value={`${stats.retTotal}건`} />
        <StatRow label="일평균" value={`${stats.dailyAvgRet.toFixed(1)}건`} />
        <div className="h-px bg-border/50 my-2" />
        <StatRow label="203D 합계" value={`${stats.ret203D}건`} subValue={`${formatRate(stats.ret203DRate)}%`} />
        <StatRow label="206A 합계" value={`${stats.ret206A}건`} subValue={`${formatRate(stats.ret206ARate)}%`} />
      </StatCard>
      
      {/* 프레시백 통계 */}
      <StatCard icon={<Leaf className="w-4 h-4" />} title="프레시백 통계" accentColor="success">
        <StatRow label="203D 할당" value={`${stats.fb203DAssigned}건`} />
        <StatRow label="203D 미회수" value={`${stats.fb203DUncollected}건`} />
        <StatRow label="203D 회수율 (가중)" value={`${formatRate(stats.fb203DRate)}%`} />
        <div className="h-px bg-border/50 my-2" />
        <StatRow label="206A 할당" value={`${stats.fb206AAssigned}건`} />
        <StatRow label="206A 미회수" value={`${stats.fb206AUncollected}건`} />
        <StatRow label="206A 회수율 (가중)" value={`${formatRate(stats.fb206ARate)}%`} />
        <div className="h-px bg-border/50 my-2" />
        <StatRow label="일반 FB 할당" value={`${stats.fbGenAssigned}건`} />
        <StatRow label="일반 FB 미회수" value={`${stats.fbGenUncollected}건`} />
        <StatRow 
          label="일반 FB 회수율 (가중)" 
          value={`${formatRate(stats.fbGenRate)}%`} 
        />
        <div className="h-px bg-border/50 my-2" />
        <StatRow label="단독 FB 할당" value={`${stats.fbSoloAssigned}건`} />
        <StatRow label="단독 FB 미회수" value={`${stats.fbSoloUncollected}건`} />
        <StatRow 
          label="단독 FB 회수율 (가중)" 
          value={`${formatRate(stats.fbSoloRate)}%`} 
        />
      </StatCard>
      
      {/* 수입 통계 */}
      <StatCard icon={<Wallet className="w-4 h-4" />} title="수입 통계" accentColor="primary">
        <StatRow label="총 수입" value={formatCurrency(stats.incomeTotal)} />
        <StatRow label="일평균" value={formatCurrency(stats.dailyAvgIncome)} />
        <div className="h-px bg-border/50 my-2" />
        <StatRow label="기프트 수입" value={formatCurrency(stats.incomeGift)} />
        <StatRow label="반품 수입" value={formatCurrency(stats.incomeRet)} />
        <StatRow label="FB 할당 수입" value={formatCurrency(stats.incomeFBAssigned)} />
        <StatRow label="FB 차감" value={`-${formatCurrency(stats.incomeFBDeduct)}`} />
      </StatCard>
    </div>
  );
}
