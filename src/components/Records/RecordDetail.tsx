/**
 * 기록 상세 화면 컴포넌트
 * 
 * 섹션 1: 입력값(raw) - Stage A~F 입력값
 * 섹션 2: 도출값(derived) - 모든 계산된 파생값
 * 섹션 3: 가격/수입 breakdown
 * 섹션 4: 공유/내보내기
 */

import { useState } from 'react';
import { ArrowLeft, Download, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { TodayWorkData } from '@/types';
import { 
  calculateFromWorkData, 
  formatRate, 
  formatCurrency,
  RATE_203D,
  RATE_206A,
  FB_GEN_UNIT,
  FB_SOLO_UNIT,
} from '@/lib/recordDerived';
import { toExportRecord, exportToJSON, exportToCSV, downloadFile } from '@/lib/recordExport';
import { toast } from '@/hooks/use-toast';

interface RecordDetailProps {
  date: string;
  workData: TodayWorkData;
  onBack: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function DataRow({ label, value, unit = '', highlight = false }: { 
  label: string; 
  value: string | number; 
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${highlight ? 'text-primary font-medium' : ''}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}{unit}</span>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="text-xs font-semibold text-primary/70 uppercase tracking-wide pt-3 pb-1 border-b border-border/50 mb-2">
      {label}
    </div>
  );
}

export function RecordDetail({ date, workData, onBack }: RecordDetailProps) {
  const { sources, derived } = calculateFromWorkData(workData);
  
  // 날짜 포맷팅
  const displayDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  
  // 내보내기 핸들러
  const handleExportJSON = () => {
    const record = toExportRecord(workData);
    const content = exportToJSON([record]);
    downloadFile(content, `퀵플렉스_${date}.json`, 'application/json');
    toast({ title: 'JSON 파일이 다운로드되었습니다' });
  };
  
  const handleExportCSV = () => {
    const record = toExportRecord(workData);
    const content = exportToCSV([record]);
    downloadFile(content, `퀵플렉스_${date}.csv`, 'text/csv');
    toast({ title: 'CSV 파일이 다운로드되었습니다' });
  };
  
  const handleShare = async () => {
    const record = toExportRecord(workData);
    const text = `📦 ${date} 작업 기록\n` +
      `기프트: ${derived.GIFT_DAY_TOTAL}건 (203D:${derived.GIFT_DAY_203D} / 206A:${derived.GIFT_DAY_206A})\n` +
      `반품: ${derived.RET_DAY_TOTAL}건\n` +
      `FB 회수율: 일반 ${formatRate(derived.FB_GEN_RATE)}% / 단독 ${formatRate(derived.FB_SOLO_RATE)}%\n` +
      `예상 수입: ${formatCurrency(derived.TODAY_EST_INCOME_BASE)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: `${date} 작업 기록`, text });
      } catch {
        // 취소됨
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: '클립보드에 복사되었습니다' });
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold">{displayDate}</h2>
          <p className="text-xs text-muted-foreground">기록 상세</p>
        </div>
      </div>
      
      {/* 섹션 1: 입력값 (Source Inputs) */}
      <CollapsibleSection title="📝 입력값 (Source)">
        <SectionDivider label="Stage A: 1회전 상차" />
        <DataRow label="1회전 기프트 전체" value={sources.A_GIFT_R1_TOTAL} unit="건" />
        <DataRow label="1회전 반품 전체" value={sources.A_RET_R1_TOTAL} unit="건" />
        <DataRow label="일반 FB 할당" value={sources.A_FB_GEN} unit="건" />
        <DataRow label="단독 FB 할당" value={sources.A_FB_SOLO} unit="건" />
        <DataRow label="206A FB" value={sources.A_FB_206A} unit="건" />
        
        <SectionDivider label="Stage B: 203D 1회전 종료" />
        <DataRow label="전체 기프트 잔여" value={sources.B_GIFT_TOTAL_REMAIN} unit="건" />
        <DataRow label="203D 기프트 잔여" value={sources.B_GIFT_203D_REMAIN} unit="건" />
        <DataRow label="203D 반품 미방문" value={sources.B_RET_203D_UNVISITED} unit="건" />
        <DataRow label="206A 반품 할당" value={sources.B_RET_206A_ASSIGNED} unit="건" />
        <DataRow label="203D FB 미방문" value={sources.B_FB_203D_UNVISITED} unit="건" />
        
        <SectionDivider label="Stage C: 1회전 종료" />
        <DataRow label="206A 기프트 잔여" value={sources.C_GIFT_206A_REMAIN} unit="건" />
        <DataRow label="206A 반품 잔여" value={sources.C_RET_206A_REMAIN} unit="건" />
        <DataRow label="일반 FB 미방문(예정)" value={sources.C_FB_GEN_UNVISITED} unit="건" />
        <DataRow label="단독 FB 미방문(예정)" value={sources.C_FB_SOLO_UNVISITED} unit="건" />
        
        <SectionDivider label="Stage D: 2회전 상차" />
        <DataRow label="2회전 기프트 전체" value={sources.D_GIFT_TOTAL_NOW} unit="건" />
        <DataRow label="2회전 반품 전체" value={sources.D_RET_TOTAL_NOW} unit="건" />
        <DataRow label="일반 FB 증가" value={sources.D_FB_GEN_INCREASE} unit="건" />
        
        <SectionDivider label="Stage E: 203D 완전 종료" />
        <DataRow label="기프트 잔여(206A)" value={sources.E_GIFT_REMAIN} unit="건" />
        <DataRow label="반품 잔여(206A)" value={sources.E_RET_REMAIN} unit="건" />
        <DataRow label="203D FB 잔여(미회수)" value={sources.E_FB_203D_REMAIN} unit="건" />
        
        <SectionDivider label="Stage F: 업무 종료" />
        <DataRow label="206A FB 미방문" value={sources.F_FB_206A_REMAIN} unit="건" />
        <DataRow label="일반 FB 미방문" value={sources.F_FB_GEN_REMAIN} unit="건" />
        <DataRow label="단독 FB 미방문" value={sources.F_FB_SOLO_REMAIN} unit="건" />
      </CollapsibleSection>
      
      {/* 섹션 2: 도출값 (Derived) */}
      <CollapsibleSection title="📊 도출값 (Derived)">
        <SectionDivider label="프레시백 할당" />
        <DataRow label="FB 전체 할당" value={derived.FB_TOTAL_ASSIGNED} unit="건" />
        <DataRow label="203D FB 할당" value={derived.FB_203D_ASSIGNED} unit="건" highlight />
        <DataRow label="206A FB 할당" value={derived.FB_206A_ASSIGNED} unit="건" />
        
        <SectionDivider label="1회전 기프트 라우트별" />
        <DataRow label="1R 203D 기프트" value={derived.GIFT_R1_203D_ASSIGNED} unit="건" highlight />
        <DataRow label="1R 206A 기프트" value={derived.GIFT_R1_206A_ASSIGNED} unit="건" highlight />
        <DataRow label="1R 잔여 전체" value={derived.GIFT_R1_REMAIN_TOTAL} unit="건" />
        
        <SectionDivider label="2회전 신규 기프트" />
        <DataRow label="2R 신규 전체" value={derived.GIFT_R2_NEW_TOTAL} unit="건" />
        <DataRow label="2R 203D 신규" value={derived.GIFT_R2_NEW_203D} unit="건" highlight />
        <DataRow label="2R 206A 신규" value={derived.GIFT_R2_NEW_206A} unit="건" highlight />
        
        <SectionDivider label="오늘 기프트 합계" />
        <DataRow label="오늘 기프트 합계" value={derived.GIFT_DAY_TOTAL} unit="건" highlight />
        <DataRow label="오늘 203D 기프트" value={derived.GIFT_DAY_203D} unit="건" highlight />
        <DataRow label="오늘 206A 기프트" value={derived.GIFT_DAY_206A} unit="건" highlight />
        <DataRow label="203D 기프트 비중" value={formatRate(derived.GIFT_RATE_203D)} unit="%" highlight />
        <DataRow label="206A 기프트 비중" value={formatRate(derived.GIFT_RATE_206A)} unit="%" highlight />
        
        <SectionDivider label="1회전 반품 라우트별" />
        <DataRow label="1R 203D 반품" value={derived.RET_R1_203D_ASSIGNED} unit="건" highlight />
        <DataRow label="1R 206A 반품" value={derived.RET_R1_206A_ASSIGNED} unit="건" highlight />
        <DataRow label="1R 잔여 전체" value={derived.RET_R1_REMAIN_TOTAL} unit="건" />
        
        <SectionDivider label="2회전 신규 반품" />
        <DataRow label="2R 신규 전체" value={derived.RET_R2_NEW_TOTAL} unit="건" />
        <DataRow label="2R 203D 신규" value={derived.RET_R2_NEW_203D} unit="건" highlight />
        <DataRow label="2R 206A 신규" value={derived.RET_R2_NEW_206A} unit="건" highlight />
        
        <SectionDivider label="오늘 반품 합계" />
        <DataRow label="오늘 반품 합계" value={derived.RET_DAY_TOTAL} unit="건" highlight />
        <DataRow label="오늘 203D 반품" value={derived.RET_DAY_203D} unit="건" highlight />
        <DataRow label="오늘 206A 반품" value={derived.RET_DAY_206A} unit="건" highlight />
        <DataRow label="203D 반품 비중" value={formatRate(derived.RET_RATE_203D)} unit="%" highlight />
        <DataRow label="206A 반품 비중" value={formatRate(derived.RET_RATE_206A)} unit="%" highlight />
        
        <SectionDivider label="프레시백 회수율" />
        <DataRow label="203D FB 회수" value={derived.FB_203D_COLLECTED} unit="건" />
        <DataRow label="203D FB 미회수" value={derived.FB_203D_UNCOLLECTED} unit="건" />
        <DataRow label="203D FB 회수율" value={formatRate(derived.FB_203D_RATE)} unit="%" highlight />
        
        <DataRow label="206A FB 회수" value={derived.FB_206A_COLLECTED} unit="건" />
        <DataRow label="206A FB 미회수" value={derived.FB_206A_UNCOLLECTED} unit="건" />
        <DataRow label="206A FB 회수율" value={formatRate(derived.FB_206A_RATE)} unit="%" highlight />
        
        <DataRow label="일반 FB 할당" value={derived.FB_GEN_ASSIGNED} unit="건" />
        <DataRow label="일반 FB 미회수" value={derived.FB_GEN_UNCOLLECTED} unit="건" />
        <DataRow label="일반 FB 회수율" value={formatRate(derived.FB_GEN_RATE)} unit="%" highlight />
        
        <DataRow label="단독 FB 할당" value={derived.FB_SOLO_ASSIGNED} unit="건" />
        <DataRow label="단독 FB 미회수" value={derived.FB_SOLO_UNCOLLECTED} unit="건" />
        <DataRow label="단독 FB 회수율" value={formatRate(derived.FB_SOLO_RATE)} unit="%" highlight />
      </CollapsibleSection>
      
      {/* 섹션 3: 가격/수입 Breakdown */}
      <CollapsibleSection title="💰 수입 상세 (Breakdown)">
        <SectionDivider label="단가 기준" />
        <DataRow label="203D 단가" value={formatCurrency(RATE_203D)} />
        <DataRow label="206A 단가" value={formatCurrency(RATE_206A)} />
        <DataRow label="일반 FB 단가" value={formatCurrency(FB_GEN_UNIT)} />
        <DataRow label="단독 FB 단가" value={formatCurrency(FB_SOLO_UNIT)} />
        
        <SectionDivider label="기프트 수입" />
        <DataRow label="203D 기프트" value={formatCurrency(derived.INCOME_GIFT_203D)} />
        <DataRow label="206A 기프트" value={formatCurrency(derived.INCOME_GIFT_206A)} />
        <DataRow label="기프트 소계" value={formatCurrency(derived.INCOME_GIFT)} highlight />
        
        <SectionDivider label="반품 수입" />
        <DataRow label="203D 반품" value={formatCurrency(derived.INCOME_RET_203D)} />
        <DataRow label="206A 반품" value={formatCurrency(derived.INCOME_RET_206A)} />
        <DataRow label="반품 소계" value={formatCurrency(derived.INCOME_RET)} highlight />
        
        <SectionDivider label="프레시백 수입" />
        <DataRow label="일반 FB" value={formatCurrency(derived.INCOME_FB_GEN)} />
        <DataRow label="단독 FB" value={formatCurrency(derived.INCOME_FB_SOLO)} />
        <DataRow label="FB 할당 소계" value={formatCurrency(derived.INCOME_FB_ASSIGNED)} highlight />
        
        <SectionDivider label="프레시백 차감" />
        <DataRow label="일반 FB 차감" value={`-${formatCurrency(derived.INCOME_FB_DEDUCT_GEN)}`} />
        <DataRow label="단독 FB 차감" value={`-${formatCurrency(derived.INCOME_FB_DEDUCT_SOLO)}`} />
        <DataRow label="FB 차감 소계" value={`-${formatCurrency(derived.INCOME_FB_DEDUCT)}`} highlight />
        
        <div className="mt-4 pt-3 border-t-2 border-primary/30">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">오늘 예상 수입</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(derived.TODAY_EST_INCOME_BASE)}
            </span>
          </div>
        </div>
      </CollapsibleSection>
      
      {/* 섹션 4: 공유/내보내기 */}
      <CollapsibleSection title="📤 공유/내보내기" defaultOpen={false}>
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            공유하기
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 py-3 bg-muted rounded-xl font-medium hover:bg-muted/80 transition-colors"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 py-3 bg-muted rounded-xl font-medium hover:bg-muted/80 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
