import { useState } from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import { TodayWorkData } from '@/types';
import { RecordCard } from './RecordCard';
import { RecordDetail } from './RecordDetail';

interface RecordsDetailPanelProps {
  records: Array<{ date: string; workData: TodayWorkData }>;
  label: string;
}

export function RecordsDetailPanel({ records, label }: RecordsDetailPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleBack = () => {
    setSelectedDate(null);
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div>
          <div className="text-sm font-semibold">검증용 상세 보기</div>
          <div className="text-xs text-muted-foreground">{label} · {records.length}건</div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 pt-0">
          {selectedDate ? (
            records.find(r => r.date === selectedDate) ? (
              <RecordDetail
                date={selectedDate}
                workData={records.find(r => r.date === selectedDate)!.workData}
                onBack={handleBack}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">선택한 기록을 찾을 수 없습니다</p>
              </div>
            )
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm">선택한 기간에 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(({ date, workData }) => (
                <RecordCard
                  key={date}
                  date={date}
                  workData={workData}
                  onClick={() => setSelectedDate(date)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
