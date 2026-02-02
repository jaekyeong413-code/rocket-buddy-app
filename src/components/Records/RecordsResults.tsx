import { RecordsAggregate } from '@/lib/recordsAggregator';
import { MetricDefinition, METRIC_GROUP_LABELS, MetricGroup, MetricResult } from '@/lib/recordsMetrics';
import { RecordsQuery } from '@/lib/recordsQuery';
import { formatCurrency, formatRate } from '@/lib/recordDerived';

interface RecordsResultsProps {
  aggregates: RecordsAggregate;
  metrics: MetricDefinition[];
  query: RecordsQuery;
}

function formatValue(result: MetricResult, metric: MetricDefinition): string {
  if (result.kind !== 'value') return '';

  const value = result.value;
  const isNegative = metric.negative || result.negative;
  const sign = isNegative && value > 0 ? '-' : '';

  switch (result.format) {
    case 'percent':
      return `${sign}${formatRate(value)}%`;
    case 'currency':
      return `${sign}${formatCurrency(value)}`;
    case 'count':
    default:
      return `${sign}${value}건`;
  }
}

function groupMetrics(metrics: MetricDefinition[], selected: string[]): Record<MetricGroup, MetricDefinition[]> {
  return metrics
    .filter(metric => selected.includes(metric.id))
    .reduce((acc, metric) => {
      acc[metric.group] = acc[metric.group] || [];
      acc[metric.group].push(metric);
      return acc;
    }, {} as Record<MetricGroup, MetricDefinition[]>);
}

export function RecordsResults({ aggregates, metrics, query }: RecordsResultsProps) {
  const grouped = groupMetrics(metrics, query.selectedMetricIds);
  const hasSelected = query.selectedMetricIds.length > 0;

  if (!hasSelected) {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground">
        지표를 선택하면 결과가 바로 표시됩니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="space-y-2">
          <div className="text-xs font-semibold text-primary/70">{METRIC_GROUP_LABELS[group as MetricGroup]}</div>
          <div className="grid grid-cols-2 gap-3">
            {items.map(metric => {
              const result = metric.compute(aggregates, query);

              if (result.kind === 'table') {
                return (
                  <div
                    key={metric.id}
                    className="col-span-2 bg-card rounded-2xl p-4 shadow-card border border-border/30"
                  >
                    <div className="text-sm font-semibold mb-3">{metric.label}</div>
                    <div className="space-y-2">
                      {result.rows.map(row => (
                        <div key={row.label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={metric.id}
                  className="bg-card rounded-2xl p-4 shadow-card border border-border/30"
                >
                  <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                  <div className={`text-lg font-bold ${metric.negative ? 'text-destructive' : 'text-primary'}`}>
                    {formatValue(result, metric)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
