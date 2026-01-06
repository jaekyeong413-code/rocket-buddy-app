import { Settings, WorkRecord, PeriodSummary } from '@/types';

export function getCurrentPeriod(): { startDate: string; endDate: string } {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let startDate: Date;
  let endDate: Date;

  if (currentDay >= 26) {
    startDate = new Date(currentYear, currentMonth, 26);
    endDate = new Date(currentYear, currentMonth + 1, 25);
  } else {
    startDate = new Date(currentYear, currentMonth - 1, 26);
    endDate = new Date(currentYear, currentMonth, 25);
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

export function calculateDailyIncome(
  records: WorkRecord[],
  settings: Settings
): number {
  let total = 0;

  for (const record of records) {
    const routeRate = settings.routes[record.route];

    // Delivery income
    total += record.delivery.completed * routeRate;

    // Returns income
    total += (record.returns.completed + record.returns.numbered) * routeRate;

    // Fresh bag income
    total += record.freshBag.regular * settings.freshBag.regular;
    total += record.freshBag.standalone * settings.freshBag.standalone;
  }

  return total;
}

export function calculateFBCollectionRate(
  records: WorkRecord[],
  type: 'regular' | 'standalone'
): number {
  let collected = 0;
  let total = 0;

  for (const record of records) {
    if (type === 'regular') {
      collected += record.freshBag.regular;
      total +=
        record.freshBag.regular +
        record.freshBag.failedNotOut +
        record.freshBag.failedWithProducts;
    } else {
      collected += record.freshBag.standalone;
      total += record.freshBag.standalone;
    }
  }

  if (total === 0) return 0;
  return (collected / total) * 100;
}

export function calculatePeriodSummary(
  records: WorkRecord[],
  settings: Settings
): PeriodSummary {
  const { startDate, endDate } = getCurrentPeriod();
  
  const periodRecords = records.filter(
    (r) => r.date >= startDate && r.date <= endDate
  );

  let totalDeliveries = 0;
  let totalFreshBags = 0;
  let totalIncome = 0;

  for (const record of periodRecords) {
    const routeRate = settings.routes[record.route];

    // Count deliveries
    totalDeliveries += record.delivery.completed;

    // Count fresh bags
    totalFreshBags +=
      record.freshBag.regular + record.freshBag.standalone;

    // Calculate income
    totalIncome += record.delivery.completed * routeRate;
    totalIncome += (record.returns.completed + record.returns.numbered) * routeRate;
    totalIncome += record.freshBag.regular * settings.freshBag.regular;
    totalIncome += record.freshBag.standalone * settings.freshBag.standalone;
  }

  const regularFBRate = calculateFBCollectionRate(periodRecords, 'regular');
  const standaloneFBRate = calculateFBCollectionRate(periodRecords, 'standalone');

  // Calculate incentives
  let regularIncentive = 0;
  let standaloneIncentive = 0;

  if (regularFBRate >= settings.incentive.regularThreshold) {
    regularIncentive = totalDeliveries * settings.incentive.regularBonus;
  }

  if (standaloneFBRate >= settings.incentive.standaloneThreshold) {
    standaloneIncentive = totalDeliveries * settings.incentive.standaloneBonus;
  }

  const totalBeforeFee = totalIncome + regularIncentive + standaloneIncentive;
  const afterFee = totalBeforeFee - settings.monthlyFee;
  const netIncome = afterFee * 1.1; // 부가세 10% 포함

  return {
    startDate,
    endDate,
    totalIncome,
    totalDeliveries,
    totalFreshBags,
    regularFBRate,
    standaloneFBRate,
    regularIncentive,
    standaloneIncentive,
    netIncome: Math.max(0, netIncome),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getTodayRecords(records: WorkRecord[]): WorkRecord[] {
  const today = formatDate(new Date());
  return records.filter((r) => r.date === today);
}
