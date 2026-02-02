import { getCurrentPeriod, formatDate } from '@/lib/calculations';

export type PeriodPreset = 'today' | 'week' | 'settlement' | 'custom';
export type RouteScope = 'all' | '203D' | '206A';

export interface CustomRange {
  startDate: string;
  endDate: string;
}

export interface RecordsQuery {
  period: PeriodPreset;
  route: RouteScope;
  selectedMetricIds: string[];
  customRange?: CustomRange;
  presetId?: string;
}

export interface DateRangeResult {
  startDate: string;
  endDate: string;
  label: string;
}

function getTodayDate(): string {
  return formatDate(new Date());
}

function getWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

export function resolveDateRange(query: RecordsQuery): DateRangeResult {
  switch (query.period) {
    case 'today': {
      const today = getTodayDate();
      return { startDate: today, endDate: today, label: '오늘' };
    }
    case 'week': {
      const range = getWeekRange();
      return { ...range, label: '이번 주' };
    }
    case 'settlement': {
      const range = getCurrentPeriod();
      return { ...range, label: '이번 정산' };
    }
    case 'custom':
    default: {
      const startDate = query.customRange?.startDate || getTodayDate();
      const endDate = query.customRange?.endDate || startDate;
      return {
        startDate,
        endDate,
        label: `${startDate} ~ ${endDate}`,
      };
    }
  }
}

export function createDefaultQuery(metricIds: string[], presetId?: string): RecordsQuery {
  return {
    period: 'settlement',
    route: 'all',
    selectedMetricIds: metricIds,
    presetId,
  };
}
