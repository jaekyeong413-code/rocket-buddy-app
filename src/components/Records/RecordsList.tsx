import { useState } from 'react';
import { Edit2, Trash2, Package, Truck, ArrowRightLeft, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { WorkRecord } from '@/types';
import { formatCurrency, calculateActualDeliveries } from '@/lib/calculations';
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

  // Group records by date
  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, WorkRecord[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedRecords).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-slide-up">
        <Package className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">아직 기록이 없습니다</p>
        <p className="text-xs mt-1">작업 입력 탭에서 기록을 추가하세요</p>
      </div>
    );
  }

  return (
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
  );
}
