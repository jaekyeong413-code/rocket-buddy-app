import { Settings, WorkRecord, PeriodSummary, WeeklyStats, FreshBagData, DeliveryData, ReturnsData } from '@/types';

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

// 실제 배송 완료 수량 계산 (완료 입력값 기준)
export function calculateActualDeliveries(record: WorkRecord): number {
  return record.delivery.completed;
}

// 실제 반품 완료 수량 계산 (전체 할당 - 미회수 = 완료)
export function calculateActualReturns(record: WorkRecord): number {
  const allocated = record.returns.allocated || 0;
  const notCollected = record.returns.notCollected || 0;
  return Math.max(0, allocated - notCollected);
}

// 실제 FB 회수 수량 계산 (전체 할당 - 미회수 = 완료)
export function calculateActualFreshBags(record: WorkRecord): number {
  const totalAllocated = (record.freshBag.regularAllocated || 0) + 
                         (record.freshBag.standaloneAllocated || 0) +
                         (record.freshBag.regularAdjustment || 0) -
                         (record.freshBag.transferred || 0) +
                         (record.freshBag.added || 0);
  const totalFailed = (record.freshBag.failedAbsent || 0) + (record.freshBag.failedNoProduct || 0);
  return Math.max(0, totalAllocated - totalFailed);
}

// 배송 진행률 계산 (완료 입력값 기준)
export function calculateDeliveryProgress(records: WorkRecord[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  
  for (const record of records) {
    total += record.delivery.allocated - record.delivery.transferred + record.delivery.added + (record.delivery.firstRoundRemaining || 0);
    completed += record.delivery.completed;
  }
  
  return { completed, total: Math.max(total, completed) };
}

// 반품 진행률 계산 (전체 할당 - 미회수 = 완료)
export function calculateReturnsProgress(records: WorkRecord[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  
  for (const record of records) {
    const allocated = record.returns.allocated || 0;
    const notCollected = record.returns.notCollected || 0;
    total += allocated;
    completed += Math.max(0, allocated - notCollected);
  }
  
  return { completed, total: Math.max(total, completed) };
}

// FB 진행률 계산 (전체 할당 - 미회수 = 완료)
export function calculateFBProgress(records: WorkRecord[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  
  for (const record of records) {
    const fbAllocated = (record.freshBag.regularAllocated || 0) + (record.freshBag.standaloneAllocated || 0) 
                        + (record.freshBag.regularAdjustment || 0)
                        - (record.freshBag.transferred || 0) + (record.freshBag.added || 0);
const totalFailed =
  (record.freshBag.failedAbsent || 0) +
  (record.freshBag.failedNoProduct || 0) +
  (record.freshBag.failedWithProducts || 0);
    total += fbAllocated;
    completed += Math.max(0, fbAllocated - totalFailed);
  }
  
  return { completed, total: Math.max(total, completed) };
}

// 오늘 기준 일반 FB 회수율
export function calculateTodayRegularFBRate(records: WorkRecord[]): number {
  let collected = 0;
  let total = 0;

  for (const record of records) {
    const regularAllocated = (record.freshBag.regularAllocated || 0) + (record.freshBag.regularAdjustment || 0);
    const regularFailed = (record.freshBag.failedAbsent || 0) + (record.freshBag.failedNoProduct || 0);
    collected += Math.max(0, regularAllocated - regularFailed);
    total += regularAllocated;
  }

  if (total === 0) return 0;
  return (collected / total) * 100;
}

// 오늘 기준 단독 FB 회수율
export function calculateTodayStandaloneFBRate(records: WorkRecord[]): number {
  let collected = 0;
  let total = 0;

  for (const record of records) {
    const standaloneAllocated = (record.freshBag.standaloneAllocated || 0) - (record.freshBag.regularAdjustment || 0);
    total += Math.max(0, standaloneAllocated);
    collected += Math.max(0, standaloneAllocated); // 단독은 미회수 사유가 별도로 없음
  }

  if (total === 0) return 0;
  return (collected / total) * 100;
}

// 일일 수입 계산
export function calculateDailyIncome(
  records: WorkRecord[],
  settings: Settings
): number {
  let total = 0;

  for (const record of records) {
    const routeRate = settings.routes[record.route];

    // Delivery income - 완료 수량 기준
    const actualDeliveries = calculateActualDeliveries(record);
    total += actualDeliveries * routeRate;

    // Returns income - 할당 - 미회수 = 완료
    total += calculateActualReturns(record) * routeRate;

    // Fresh bag income - 할당 - 미회수 = 완료
    const fbCompleted = calculateActualFreshBags(record);
    // 일반과 단독 비율로 분배
    const regularRatio = (record.freshBag.regularAllocated || 0) / 
      ((record.freshBag.regularAllocated || 0) + (record.freshBag.standaloneAllocated || 0) || 1);
    const regularCompleted = Math.round(fbCompleted * regularRatio);
    const standaloneCompleted = fbCompleted - regularCompleted;
    
    total += regularCompleted * settings.freshBag.regular;
    total += standaloneCompleted * settings.freshBag.standalone;
  }

  return total;
}

// 일일 수입 상세 내역
export function calculateDailyIncomeDetails(
  records: WorkRecord[],
  settings: Settings
): {
  routeIncomes: { route: string; income: number; count: number }[];
  returnsIncome: number;
  returnsCount: number;
  fbIncome: { regular: number; standalone: number };
  fbCount: { regular: number; standalone: number };
  fbIncentive: { regular: number; standalone: number };
  totalIncome: number;
} {
  const routeIncomes: { [key: string]: { income: number; count: number } } = {};
  let returnsIncome = 0;
  let returnsCount = 0;
  let regularFBIncome = 0;
  let standaloneFBIncome = 0;
  let regularFBCount = 0;
  let standaloneFBCount = 0;

  for (const record of records) {
    const routeRate = settings.routes[record.route];
    const actualDeliveries = calculateActualDeliveries(record);
    
    if (!routeIncomes[record.route]) {
      routeIncomes[record.route] = { income: 0, count: 0 };
    }
    routeIncomes[record.route].income += actualDeliveries * routeRate;
    routeIncomes[record.route].count += actualDeliveries;

    const actualReturns = calculateActualReturns(record);
    returnsIncome += actualReturns * routeRate;
    returnsCount += actualReturns;

    // FB 수입 계산
    const fbCompleted = calculateActualFreshBags(record);
    const regularRatio = (record.freshBag.regularAllocated || 0) / 
      ((record.freshBag.regularAllocated || 0) + (record.freshBag.standaloneAllocated || 0) || 1);
    const regularCompleted = Math.round(fbCompleted * regularRatio);
    const standaloneCompleted = fbCompleted - regularCompleted;
    
    regularFBIncome += regularCompleted * settings.freshBag.regular;
    standaloneFBIncome += standaloneCompleted * settings.freshBag.standalone;
    regularFBCount += regularCompleted;
    standaloneFBCount += standaloneCompleted;
  }

  // 오늘 FB 인센티브 계산
  const regularRate = calculateTodayRegularFBRate(records);
  const standaloneRate = calculateTodayStandaloneFBRate(records);
  const totalDeliveries = records.reduce((sum, r) => sum + calculateActualDeliveries(r), 0);
  
  const regularIncentive = regularRate >= settings.incentive.regularThreshold 
    ? totalDeliveries * settings.incentive.regularBonus : 0;
  const standaloneIncentive = standaloneRate >= settings.incentive.standaloneThreshold 
    ? totalDeliveries * settings.incentive.standaloneBonus : 0;

  const totalIncome = Object.values(routeIncomes).reduce((sum, r) => sum + r.income, 0) +
                      returnsIncome + regularFBIncome + standaloneFBIncome;

  return {
    routeIncomes: Object.entries(routeIncomes).map(([route, data]) => ({
      route,
      income: data.income,
      count: data.count,
    })),
    returnsIncome,
    returnsCount,
    fbIncome: { regular: regularFBIncome, standalone: standaloneFBIncome },
    fbCount: { regular: regularFBCount, standalone: standaloneFBCount },
    fbIncentive: { regular: regularIncentive, standalone: standaloneIncentive },
    totalIncome,
  };
}

export function calculateFBCollectionRate(
  records: WorkRecord[],
  type: 'regular' | 'standalone'
): number {
  let collected = 0;
  let total = 0;

  for (const record of records) {
    if (type === 'regular') {
      const regularAllocated = (record.freshBag.regularAllocated || 0) + (record.freshBag.regularAdjustment || 0);
      const regularFailed = (record.freshBag.failedAbsent || 0) + (record.freshBag.failedNoProduct || 0);
      total += regularAllocated;
      collected += Math.max(0, regularAllocated - regularFailed);
    } else {
      const standaloneAllocated = Math.max(0, (record.freshBag.standaloneAllocated || 0) - (record.freshBag.regularAdjustment || 0));
      total += standaloneAllocated;
      collected += standaloneAllocated;
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
  let totalReturns = 0;
  let totalFreshBags = 0;
  let totalIncome = 0;

  for (const record of periodRecords) {
    const routeRate = settings.routes[record.route];

    const actualDeliveries = calculateActualDeliveries(record);
    totalDeliveries += actualDeliveries;
    totalReturns += calculateActualReturns(record);
    totalFreshBags += calculateActualFreshBags(record);

    totalIncome += actualDeliveries * routeRate;
    totalIncome += calculateActualReturns(record) * routeRate;
    
    const fbCompleted = calculateActualFreshBags(record);
    const regularRatio = (record.freshBag.regularAllocated || 0) / 
      ((record.freshBag.regularAllocated || 0) + (record.freshBag.standaloneAllocated || 0) || 1);
    const regularCompleted = Math.round(fbCompleted * regularRatio);
    const standaloneCompleted = fbCompleted - regularCompleted;
    
    totalIncome += regularCompleted * settings.freshBag.regular;
    totalIncome += standaloneCompleted * settings.freshBag.standalone;
  }

  const regularFBRate = calculateFBCollectionRate(periodRecords, 'regular');
  const standaloneFBRate = calculateFBCollectionRate(periodRecords, 'standalone');

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
  const netIncome = afterFee * 1.1;

  return {
    startDate,
    endDate,
    totalIncome,
    totalDeliveries,
    totalReturns,
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

// 주차 계산 (일~토 기준)
export function getWeekNumber(date: Date): { week: number; year: number } {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return { week: weekNumber, year: date.getFullYear() };
}

// 주간 통계 계산
export function calculateWeeklyStats(records: WorkRecord[], settings: Settings): WeeklyStats[] {
  const weeklyData: { [key: string]: WorkRecord[] } = {};
  
  for (const record of records) {
    const date = new Date(record.date);
    const { week, year } = getWeekNumber(date);
    const key = `${year}-${week}`;
    
    if (!weeklyData[key]) {
      weeklyData[key] = [];
    }
    weeklyData[key].push(record);
  }
  
  return Object.entries(weeklyData)
    .map(([key, weekRecords]) => {
      const [yearStr, weekStr] = key.split('-');
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      
      const dates = weekRecords.map(r => r.date).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      return {
        weekNumber: week,
        year,
        startDate,
        endDate,
        regularFBRate: calculateFBCollectionRate(weekRecords, 'regular'),
        standaloneFBRate: calculateFBCollectionRate(weekRecords, 'standalone'),
        totalDeliveries: weekRecords.reduce((sum, r) => sum + calculateActualDeliveries(r), 0),
        totalIncome: calculateDailyIncome(weekRecords, settings),
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });
}

// 기본 DeliveryData 생성
export function createDefaultDeliveryData(): DeliveryData {
  return {
    allocated: 0,
    completed: 0,
    cancelled: 0,
    incomplete: 0,
    transferred: 0,
    added: 0,
    firstRoundRemaining: 0,
  };
}

// 기본 ReturnsData 생성
export function createDefaultReturnsData(): ReturnsData {
  return {
    allocated: 0,
    completed: 0,
    notCollected: 0,
    numbered: 0,
    incomplete: 0,
  };
}

// 기본 FreshBagData 생성
export function createDefaultFreshBagData(): FreshBagData {
  return {
    regularAllocated: 0,
    standaloneAllocated: 0,
    route206ACount: 0,
    regularAdjustment: 0,
    transferred: 0,
    added: 0,
    failedAbsent: 0,
    failedNoProduct: 0,
    failedWithProducts: 0,
    incomplete: 0,
  };
}
