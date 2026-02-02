import { RecordsQuery, resolveDateRange, RouteScope } from '@/lib/recordsQuery';
import { MetricDefinition, MetricPreset, METRIC_GROUP_LABELS, MetricGroup } from '@/lib/recordsMetrics';

interface RecordsQueryPanelProps {
  query: RecordsQuery;
  presets: MetricPreset[];
  metrics: MetricDefinition[];
  onChange: (next: RecordsQuery) => void;
  onApplyPreset: (preset: MetricPreset) => void;
}

const periodOptions: Array<{ id: RecordsQuery['period']; label: string }> = [
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
  { id: 'settlement', label: '이번 정산' },
  { id: 'custom', label: '기간 지정' },
];

const routeOptions: Array<{ id: RouteScope; label: string }> = [
  { id: 'all', label: '전체' },
  { id: '203D', label: '203D' },
  { id: '206A', label: '206A' },
];

function groupMetrics(metrics: MetricDefinition[]): Record<MetricGroup, MetricDefinition[]> {
  return metrics.reduce((acc, metric) => {
    acc[metric.group] = acc[metric.group] || [];
    acc[metric.group].push(metric);
    return acc;
  }, {} as Record<MetricGroup, MetricDefinition[]>);
}

export function RecordsQueryPanel({
  query,
  presets,
  metrics,
  onChange,
  onApplyPreset,
}: RecordsQueryPanelProps) {
  const dateRange = resolveDateRange(query);
  const grouped = groupMetrics(metrics);

  const toggleMetric = (id: string) => {
    const exists = query.selectedMetricIds.includes(id);
    const next = exists
      ? query.selectedMetricIds.filter(m => m !== id)
      : [...query.selectedMetricIds, id];
    onChange({ ...query, selectedMetricIds: next });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
        <h3 className="text-sm font-semibold mb-3">빠른 조회 프리셋</h3>
        <div className="grid grid-cols-2 gap-2">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                query.presetId === preset.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30 space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">기간 선택</h3>
          <div className="grid grid-cols-4 gap-2">
            {periodOptions.map(option => (
              <button
                key={option.id}
                onClick={() => onChange({ ...query, period: option.id })}
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                  query.period === option.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {query.period === 'custom' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="date"
                value={query.customRange?.startDate || ''}
                onChange={(e) =>
                  onChange({
                    ...query,
                    customRange: {
                      startDate: e.target.value,
                      endDate: query.customRange?.endDate || e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-muted rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="date"
                value={query.customRange?.endDate || ''}
                onChange={(e) =>
                  onChange({
                    ...query,
                    customRange: {
                      startDate: query.customRange?.startDate || e.target.value,
                      endDate: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-muted rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-2">{dateRange.label}</div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">라우트 선택</h3>
          <div className="grid grid-cols-3 gap-2">
            {routeOptions.map(option => (
              <button
                key={option.id}
                onClick={() => onChange({ ...query, route: option.id })}
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                  query.route === option.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">지표 선택</h3>
          <div className="space-y-3">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="text-xs font-semibold text-primary/70 mb-2">{METRIC_GROUP_LABELS[group as MetricGroup]}</div>
                <div className="grid grid-cols-2 gap-2">
                  {items.map(metric => (
                    <label
                      key={metric.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        query.selectedMetricIds.includes(metric.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={query.selectedMetricIds.includes(metric.id)}
                        onChange={() => toggleMetric(metric.id)}
                        className="accent-primary"
                      />
                      {metric.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
