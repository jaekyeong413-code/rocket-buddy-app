import { useState, useMemo } from 'react';
import { Edit2, Trash2, Package, Truck, ArrowRightLeft, Plus, Download, Filter, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { WorkRecord, FilterType } from '@/types';
import { 
  formatCurrency, 
  calculateActualDeliveries, 
  getCurrentPeriod,
  calculateWeeklyStats,
  getWeekNumber,
} from '@/lib/calculations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface RecordItemProps {
  record: WorkRecord;
  onEdit: (record: WorkRecord) => void;
  onDelete: (id: string) => void;
  routeRate: number;
  fbRates: { regular: number; standalone: number };
}

function RecordItem({ record, onEdit, onDelete, routeRate, fbRates }: RecordItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  
  const actualDeliveries = calculateActualDeliveries(record);
  const income =
    actualDeliveries * routeRate +
    (record.returns.completed + record.returns.numbered) * routeRate +
    record.freshBag.regular * fbRates.regular +
    record.freshBag.standalone * fbRates.standalone;

  return (
    <>
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{record.route}</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
              {record.round}회차
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                toast.info('수정 기능은 곧 추가됩니다');
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        </div>

        {/* 배송 상세 */}
        <div className="bg-accent/30 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>할당 {record.delivery.allocated}</span>
            {record.delivery.transferred > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <ArrowRightLeft className="w-3 h-3" />
                이관 -{record.delivery.transferred}
              </span>
            )}
            {record.delivery.added > 0 && (
              <span className="flex items-center gap-1 text-success">
                <Plus className="w-3 h-3" />
                추가 +{record.delivery.added}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span className="text-2xl font-bold text-primary">{actualDeliveries}</span>
            <span className="text-sm text-muted-foreground">건 완료</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center mb-3">
          <div className="bg-warning/10 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1 text-warning">
              <Package className="w-3 h-3" />
              <span className="text-xs">반품</span>
            </div>
            <div className="text-lg font-bold">{record.returns.completed}</div>
          </div>
          <div className="bg-success/10 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1 text-success">
              <Package className="w-3 h-3" />
              <span className="text-xs">FB</span>
            </div>
            <div className="text-lg font-bold">
              {record.freshBag.regular + record.freshBag.standalone}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">예상 수입</span>
          <span className="text-sm font-bold text-primary">
            {formatCurrency(income)}
          </span>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(record.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function RecordsList({ onEdit }: { onEdit: (record: WorkRecord) => void }) {
  const { records, settings, deleteRecord } = useStore();
  const [filterType, setFilterType] = useState<FilterType>('daily');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 필터링된 기록
  const filteredRecords = useMemo(() => {
    const now = new Date();
    
    switch (filterType) {
      case 'daily':
        return records;
      case 'weekly': {
        const { week, year } = getWeekNumber(now);
        return records.filter(r => {
          const recordDate = new Date(r.date);
          const recordWeek = getWeekNumber(recordDate);
          return recordWeek.week === week && recordWeek.year === year;
        });
      }
      case 'monthly': {
        const [year, month] = selectedMonth.split('-');
        return records.filter(r => {
          const [recordYear, recordMonth] = r.date.split('-');
          return recordYear === year && recordMonth === month;
        });
      }
      default:
        return records;
    }
  }, [records, filterType, selectedMonth]);

  // 날짜별 그룹화
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, WorkRecord[]>);

  const sortedDates = Object.keys(groupedRecords).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // 주간 통계
  const weeklyStats = useMemo(() => 
    calculateWeeklyStats(records, settings), 
    [records, settings]
  );

  // 엑셀 내보내기
  const exportToExcel = () => {
    const data = filteredRecords.map(record => {
      const actualDeliveries = calculateActualDeliveries(record);
      const income =
        actualDeliveries * settings.routes[record.route] +
        (record.returns.completed + record.returns.numbered) * settings.routes[record.route] +
        record.freshBag.regular * settings.freshBag.regular +
        record.freshBag.standalone * settings.freshBag.standalone;

      return {
        '날짜': record.date,
        '노선': record.route,
        '회차': record.round,
        '할당': record.delivery.allocated,
        '취소': record.delivery.cancelled,
        '미완료': record.delivery.incomplete,
        '이관': record.delivery.transferred,
        '추가': record.delivery.added,
        '실제완료': actualDeliveries,
        '반품완료': record.returns.completed,
        '반품채번': record.returns.numbered,
        'FB일반': record.freshBag.regular,
        'FB단독': record.freshBag.standalone,
        'FB미회수_부재': record.freshBag.failedAbsent || 0,
        'FB미회수_상품없음': record.freshBag.failedNoProduct || 0,
        '예상수입': income,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '작업기록');
    
    const fileName = `퀵플렉스_기록_${filterType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('엑셀 파일이 다운로드되었습니다');
  };

  return (
    <div className="space-y-4">
      {/* 필터 및 내보내기 */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">필터</span>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            엑셀 내보내기
          </button>
        </div>
        
        <div className="flex gap-2 mb-3">
          {(['daily', 'weekly', 'monthly'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type === 'daily' ? '일간' : type === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>

        {filterType === 'monthly' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
      </div>

      {/* 주간 통계 (주간 필터 선택 시) */}
      {filterType === 'weekly' && weeklyStats.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            주간 FB 회수율 통계
          </h3>
          <div className="space-y-2">
            {weeklyStats.slice(0, 5).map((week) => (
              <div key={`${week.year}-${week.weekNumber}`} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div>
                  <span className="text-sm font-medium">{week.year}년 {week.weekNumber}주차</span>
                  <p className="text-xs text-muted-foreground">
                    {week.startDate.slice(5)} ~ {week.endDate.slice(5)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    일반 <span className={week.regularFBRate >= 90 ? 'text-success font-bold' : ''}>{week.regularFBRate.toFixed(1)}%</span>
                  </div>
                  <div className="text-sm">
                    단독 <span className={week.standaloneFBRate >= 70 ? 'text-success font-bold' : ''}>{week.standaloneFBRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 기록 리스트 */}
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-slide-up">
          <Package className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">선택한 기간에 기록이 없습니다</p>
          <p className="text-xs mt-1">작업 입력 탭에서 기록을 추가하세요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dateRecords = groupedRecords[date];
            const displayDate = new Date(date).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            });

            return (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {displayDate}
                </h3>
                {dateRecords.map((record) => (
                  <RecordItem
                    key={record.id}
                    record={record}
                    onEdit={onEdit}
                    onDelete={deleteRecord}
                    routeRate={settings.routes[record.route]}
                    fbRates={settings.freshBag}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
