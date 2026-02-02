/**
 * 기록탭 메인 컴포넌트 (조회 중심 MVP)
 * - 프리셋 + Query Builder + 즉시 집계 결과
 * - 날짜별 상세는 검증용으로만 숨김 제공
 */

import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { TodayWorkData } from '@/types';
import { RecordsQueryPanel } from './RecordsQueryPanel';
import { RecordsResults } from './RecordsResults';
import { RecordsDetailPanel } from './RecordsDetailPanel';
import { METRICS, METRIC_PRESETS } from '@/lib/recordsMetrics';
import { aggregateRecords } from '@/lib/recordsAggregator';
import { createDefaultQuery, resolveDateRange, RecordsQuery } from '@/lib/recordsQuery';

export function RecordsList() {
  const { workDataByDate } = useStore();

  const allDrafts = useMemo(() => {
    return Object.entries(workDataByDate)
      .filter(([_, draft]) => draft && (draft as TodayWorkData).date)
      .map(([date, draft]) => ({
        date,
        workData: draft as TodayWorkData,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [workDataByDate]);

  const defaultPreset = METRIC_PRESETS[0];
  const [query, setQuery] = useState<RecordsQuery>(
    createDefaultQuery(defaultPreset.metrics, defaultPreset.id)
  );

  const dateRange = resolveDateRange(query);

  const filteredRecords = useMemo(() => {
    return allDrafts.filter(r => r.date >= dateRange.startDate && r.date <= dateRange.endDate);
  }, [allDrafts, dateRange.startDate, dateRange.endDate]);

  const aggregates = useMemo(() => {
    return aggregateRecords(allDrafts, query);
  }, [allDrafts, query]);

  const handleApplyPreset = (preset: typeof METRIC_PRESETS[number]) => {
    setQuery({
      period: preset.period,
      route: preset.route,
      selectedMetricIds: preset.metrics,
      presetId: preset.id,
      customRange: preset.period === 'custom' ? query.customRange : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <RecordsQueryPanel
        query={query}
        presets={METRIC_PRESETS}
        metrics={METRICS}
        onChange={setQuery}
        onApplyPreset={handleApplyPreset}
      />

      <div className="bg-muted/50 rounded-xl p-3 text-center">
        <span className="text-sm font-medium">{dateRange.label}</span>
        <span className="text-xs text-muted-foreground ml-2">({filteredRecords.length}건)</span>
      </div>

      <RecordsResults aggregates={aggregates} metrics={METRICS} query={query} />

      <RecordsDetailPanel records={filteredRecords} label={dateRange.label} />
    </div>
  );
}
