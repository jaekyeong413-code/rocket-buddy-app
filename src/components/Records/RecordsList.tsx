/**
 * 기록탭 메인 컴포넌트 (전면 개편)
 * 
 * 3개 뷰:
 * 1. Records List (일자 목록)
 * 2. Record Detail (일자 상세)
 * 3. Stats (주/월 통계)
 */

import { useState, useMemo, useRef } from 'react';
import { 
  Filter, 
  Download, 
  Upload, 
  Calendar, 
  BarChart3, 
  List,
  ChevronLeft,
  ChevronRight,
  Package,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TodayWorkData } from '@/types';
import { getAllDrafts, saveDraft, DraftData } from '@/lib/storage';
import { exportAllDrafts, exportByPeriod, parseImportJSON, sourcesToWorkData } from '@/lib/recordExport';
import { RecordCard } from './RecordCard';
import { RecordDetail } from './RecordDetail';
import { RecordsStats } from './RecordsStats';
import { toast } from '@/hooks/use-toast';

type ViewMode = 'list' | 'detail' | 'stats';
type FilterPeriod = 'week' | 'month' | 'all';

export function RecordsList() {
  const { getWorkData } = useStore();
  
  // 뷰 상태
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('week');
  
  // 월 선택 (월간 필터용)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // 파일 업로드 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 모든 Draft 가져오기
  const allDrafts = useMemo(() => {
    const drafts = getAllDrafts();
    return Object.entries(drafts)
      .filter(([_, draft]) => draft && draft.date)
      .map(([date, draft]) => ({
        date,
        workData: draft as TodayWorkData,
        updatedAt: (draft as DraftData).updatedAt,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [viewMode]); // viewMode 변경 시 새로고침
  
  // 필터링된 기록
  const filteredRecords = useMemo(() => {
    const now = new Date();
    
    switch (filterPeriod) {
      case 'week': {
        // 현재 주 (월~일)
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const startDate = monday.toISOString().split('T')[0];
        const endDate = sunday.toISOString().split('T')[0];
        
        return allDrafts.filter(r => r.date >= startDate && r.date <= endDate);
      }
      case 'month': {
        const [year, month] = selectedMonth.split('-');
        return allDrafts.filter(r => {
          const [recordYear, recordMonth] = r.date.split('-');
          return recordYear === year && recordMonth === month;
        });
      }
      case 'all':
      default:
        return allDrafts;
    }
  }, [allDrafts, filterPeriod, selectedMonth]);
  
  // 기간 라벨
  const periodLabel = useMemo(() => {
    const now = new Date();
    
    switch (filterPeriod) {
      case 'week': {
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        return `${monday.getMonth() + 1}/${monday.getDate()} ~ ${sunday.getMonth() + 1}/${sunday.getDate()}`;
      }
      case 'month': {
        const [year, month] = selectedMonth.split('-');
        return `${year}년 ${parseInt(month)}월`;
      }
      case 'all':
      default:
        return '전체 기간';
    }
  }, [filterPeriod, selectedMonth]);
  
  // 레코드 상세 보기
  const handleRecordClick = (date: string) => {
    setSelectedDate(date);
    setViewMode('detail');
  };
  
  // 상세에서 돌아오기
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDate(null);
  };
  
  // 내보내기 핸들러
  const handleExport = (format: 'json' | 'csv') => {
    if (filterPeriod === 'all') {
      exportAllDrafts(format);
    } else if (filterPeriod === 'week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      exportByPeriod(
        monday.toISOString().split('T')[0],
        sunday.toISOString().split('T')[0],
        format
      );
    } else {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      exportByPeriod(startDate, endDate, format);
    }
    
    toast({ title: `${format.toUpperCase()} 파일이 다운로드되었습니다` });
  };
  
  // 가져오기 핸들러
  const handleImport = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const content = await file.text();
      const data = parseImportJSON(content);
      
      if (!data) {
        toast({ 
          title: '가져오기 실패', 
          description: '유효하지 않은 JSON 파일입니다',
          variant: 'destructive',
        });
        return;
      }
      
      let imported = 0;
      let skipped = 0;
      
      const existingDrafts = getAllDrafts();
      
      for (const record of data.records) {
        // 기존 레코드가 있고, 더 최신이면 스킵
        const existing = existingDrafts[record.date];
        if (existing && existing.updatedAt && record.updatedAt) {
          if (new Date(existing.updatedAt) >= new Date(record.updatedAt)) {
            skipped++;
            continue;
          }
        }
        
        // Source → WorkData 변환 후 저장
        const workData = sourcesToWorkData(record.date, record.sources);
        saveDraft(record.date, workData);
        imported++;
      }
      
      toast({ 
        title: '가져오기 완료', 
        description: `${imported}건 가져옴, ${skipped}건 스킵 (더 최신 데이터 있음)`,
      });
      
      // 목록 새로고침
      setViewMode('list');
    } catch (err) {
      toast({ 
        title: '가져오기 실패', 
        description: '파일을 읽는 중 오류가 발생했습니다',
        variant: 'destructive',
      });
    }
    
    // 파일 입력 초기화
    e.target.value = '';
  };
  
  // 상세 뷰
  if (viewMode === 'detail' && selectedDate) {
    const workData = getWorkData(selectedDate);
    return (
      <RecordDetail
        date={selectedDate}
        workData={workData}
        onBack={handleBackToList}
      />
    );
  }
  
  // 통계 뷰
  if (viewMode === 'stats') {
    return (
      <div className="space-y-4">
        {/* 뷰 전환 버튼 */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('list')}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className="p-2 rounded-xl bg-primary text-primary-foreground"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
        
        {/* 필터 */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
          <div className="flex gap-2 mb-3">
            {(['week', 'month', 'all'] as FilterPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterPeriod === period
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {period === 'week' ? '주간' : period === 'month' ? '월간' : '전체'}
              </button>
            ))}
          </div>
          
          {filterPeriod === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>
        
        <RecordsStats records={filteredRecords} periodLabel={periodLabel} />
      </div>
    );
  }
  
  // 목록 뷰
  return (
    <div className="space-y-4">
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* 상단 툴바 */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
        {/* 뷰 전환 + 내보내기/가져오기 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-xl bg-primary text-primary-foreground"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('json')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="JSON 내보내기"
            >
              <FileJson className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="CSV 내보내기"
            >
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleImport}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="가져오기"
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* 필터 */}
        <div className="flex gap-2 mb-3">
          {(['week', 'month', 'all'] as FilterPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterPeriod === period
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {period === 'week' ? '주간' : period === 'month' ? '월간' : '전체'}
            </button>
          ))}
        </div>
        
        {filterPeriod === 'month' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
        
        {/* 기간 표시 */}
        <div className="text-center text-sm text-muted-foreground">
          {periodLabel} ({filteredRecords.length}건)
        </div>
      </div>
      
      {/* 기록 목록 */}
      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-slide-up">
          <Package className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">선택한 기간에 기록이 없습니다</p>
          <p className="text-xs mt-1">입력 탭에서 작업 기록을 추가하세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(({ date, workData }) => (
            <RecordCard
              key={date}
              date={date}
              workData={workData}
              onClick={() => handleRecordClick(date)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
