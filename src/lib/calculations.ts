import { Settings, WorkRecord, PeriodSummary, WeeklyStats, FreshBagData, DeliveryData, ReturnsData, TodayWorkData } from '@/types';

// ================================
// 고정 단가 (참조용 - settings에서 가져옴)
// ================================
// 203D 기본단가 = 850원
// 206A 기본단가 = 750원
// 프레시백 일반 = 100원
// 프레시백 단독 = 200원

// ================================
// 정산 기간 (26일 ~ 익월 25일)
// ================================
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

// ================================
// Plan/Loss/Extra 기반 수입 계산
// ================================
// 핵심 원칙:
// - Plan: 완료로 간주되는 계획치 (할당 = 완료)
// - Loss: 미배송/미회수/미방문으로 인한 차감
// - Extra: 채번으로 인한 추가 수입
// - 예상 수입 = (Plan − Loss) + Extra + 인센티브

// ================================
// 오늘 예상 수입 계산 (TodayWorkData 기반 - Plan/Loss/Extra)
// ================================
export interface TodayIncomeBreakdown {
  // 기프트(배송) 수입
  giftPlan203D: number;
  giftPlan206A: number;
  giftLoss203D: number;  // 미배송
  giftLoss206A: number;  // 미배송
  giftIncome: number;
  
  // 반품 수입
  returnPlan203D: number;
  returnPlan206A: number;
  returnLoss203D: number;  // 미회수
  returnLoss206A: number;  // 미회수
  returnIncome: number;
  
  // 프레시백 수입
  fbPlanGeneral: number;
  fbPlanSolo: number;
  fbLossGeneral: number;  // 미방문
  fbLossSolo: number;     // 미방문
  fbIncome: number;
  
  // 채번 (Extra)
  chaebeon203D: number;
  chaebeon206A: number;
  chaebeonIncome: number;
  
  // 인센티브
  regularFBRate: number;
  standaloneFBRate: number;
  regularIncentive: number;
  standaloneIncentive: number;
  
  // 최종 합계
  totalIncome: number;
  
  // 상태 정보
  status: 'complete' | 'partial' | 'incomplete';
  statusMessage?: string;
}

export function calculateTodayIncome(
  workData: TodayWorkData,
  settings: Settings
): TodayIncomeBreakdown {
  const rate203D = settings.routes['203D'];  // 850원
  const rate206A = settings.routes['206A'];  // 750원
  const fbRegularRate = settings.freshBag.regular;    // 100원
  const fbStandaloneRate = settings.freshBag.standalone; // 200원

  // ================================
  // 1. 기프트(배송) 수입 계산
  // ================================
  // 핵심 불변 규칙:
  // - 오늘 배송 할당 수입은 Stage C/D/E 잔여 입력으로 절대 차감하지 않는다
  // - Stage C/D/E 잔여는 진행률/분배 확인용으로만 사용
  // - 수입 차감은 오직 Stage F의 "미배송 기프트" 입력만 사용
  //
  // 할당 계산 흐름:
  // - Stage A: 203D 1회전 할당 (firstAllocationDelivery)
  // - Stage B: 1회전 종료 시 전체 잔여/203D 잔여 → 206A 1회전 할당 역산
  // - Stage D: 2회전 상차 후 전체 잔여 → 2회전 할당 역산 (추가 할당)
  // - 2회전 할당 = Stage D 전체 잔여 - Stage B 전체 잔여 (C 잔여 아님!)
  
  const firstAllocation = workData.firstAllocationDelivery || 0;
  const totalRemainingAfterFirstRound = workData.totalRemainingAfterFirstRound || 0;
  const remaining203D = workData.routes['203D'].firstRoundRemaining || 0;
  
  // 206A 1회전 잔여 = 전체 잔여 - 203D 잔여 (Stage B 시점)
  const remaining206A = Math.max(0, totalRemainingAfterFirstRound - remaining203D);
  
  // Stage D: 2회전 상차 후 전체 잔여
  // 2회전 할당 = (Stage D 전체 잔여) - (Stage B 전체 잔여)
  // Stage C 잔여는 수입 계산에서 사용하지 않음! (진행률 표시용)
  const remainAfter2ndLoad = workData.round2TotalRemaining ?? totalRemainingAfterFirstRound;
  const secondAllocation = Math.max(0, remainAfter2ndLoad - totalRemainingAfterFirstRound);
  
  // 1차 기프트 계획: 
  // - 203D: Stage A 할당 전체 (203D가 1회전 전담)
  // - 206A: Stage B 시점 206A 잔여 (206A가 2회전 전담)
  const giftPlan203D = firstAllocation;
  const giftPlan206A = remaining206A + secondAllocation;
  
  // 오늘 전체 기프트 계획
  const todayGiftPlanTotal = giftPlan203D + giftPlan206A;
  
  // Loss: 미배송 (Stage F에서 플로팅 입력으로만 차감)
  // ⚠️ Stage C/D/E 잔여는 여기서 사용하지 않음!
  const undeliveredEntries = workData.undelivered || [];
  const giftLoss203D = undeliveredEntries
    .filter(e => e.route === '203D')
    .reduce((sum, e) => sum + e.quantity, 0);
  const giftLoss206A = undeliveredEntries
    .filter(e => e.route === '206A')
    .reduce((sum, e) => sum + e.quantity, 0);
  
  // 기프트 수입 = (Plan - Loss) * 단가
  // Loss는 오직 Stage F 미배송 입력(undeliveredEntries)만 사용
  const giftIncome = 
    (Math.max(0, giftPlan203D - giftLoss203D) * rate203D) +
    (Math.max(0, giftPlan206A - giftLoss206A) * rate206A);
  
  // 디버그 로그
  console.log('[calculateTodayIncome] Gift calculation (불변: C/D/E 잔여는 수입차감 사용안함):', {
    firstAllocation,
    totalRemainingAfterFirstRound,
    remaining203D,
    remaining206A,
    remainAfter2ndLoad,
    secondAllocation,
    giftPlan203D,
    giftPlan206A,
    todayGiftPlanTotal,
    'Loss(StageF only)': { giftLoss203D, giftLoss206A },
    giftIncome
  });

  // ================================
  // 2. 반품 수입 계산
  // ================================
  // Plan: 반품 할당 = 회수 지시 = 완료로 간주
  // 반품은 라우트 구분이 필요하지만 현재 구조상 통합 입력
  // 반품 할당: 현재 구조에서는 라우트 분해가 불가
  // 임의 분할 금지 원칙 → returnPlan203D에 전체 할당량 배정 (수입 계산과 동일)
  const returnAllocated = workData.returns?.allocated || 0;
  const returnPlan203D = returnAllocated; // 라우트 분해 불가 → 203D에 전체 배정
  const returnPlan206A = 0;
  
  // Loss: 반품 미회수 (플로팅 입력)
  const returnNotCollectedEntries = workData.returnNotCollected || [];
  const returnLoss203D = returnNotCollectedEntries
    .filter(e => e.route === '203D')
    .reduce((sum, e) => sum + e.quantity, 0);
  const returnLoss206A = returnNotCollectedEntries
    .filter(e => e.route === '206A')
    .reduce((sum, e) => sum + e.quantity, 0);
  
  // 반품 수입: 현재 구조에서는 라우트 구분 없이 평균 단가 적용
  // 반품 할당은 있지만 라우트 분해 불가 → 보수적으로 203D 단가 적용
  const returnIncome = 
    (returnAllocated * rate203D) -
    (returnLoss203D * rate203D) -
    (returnLoss206A * rate206A);

  // 디버그 로그: 반품 계산 확인 (TodayProgress와 일치해야 함)
  console.log('[calculateTodayIncome] 반품 계산:', {
    returnAllocated,
    returnPlan203D,
    returnPlan206A,
    returnLoss203D,
    returnLoss206A,
    returnIncome,
  });

  // ================================
  // 3. 프레시백 수입 계산
  // ================================
  // Plan: 프레시백 시작 = 할당 + 조정 - 이관 + 추가
  const freshBag = workData.freshBag;
  const fbPlanGeneral = (freshBag?.regularAllocated || 0) + (freshBag?.regularAdjustment || 0);
  const fbPlanSolo = Math.max(0, (freshBag?.standaloneAllocated || 0) - (freshBag?.regularAdjustment || 0));
  
  // Loss: 미방문 (Stage F 입력) + 미회수 (플로팅 입력)
  const fbLossGeneral = (freshBag?.undoneLinked || 0) + (freshBag?.failedAbsent || 0) + (freshBag?.failedWithProducts || 0);
  const fbLossSolo = freshBag?.undoneSolo || 0;
  
  // 프레시백 수입 = (Plan - Loss) * 단가
  const fbIncome = 
    (Math.max(0, fbPlanGeneral - fbLossGeneral) * fbRegularRate) +
    (Math.max(0, fbPlanSolo - fbLossSolo) * fbStandaloneRate);

  // ================================
  // 4. 채번 수입 계산 (Extra)
  // ================================
  const numberedEntries = workData.numbered || [];
  const chaebeon203D = numberedEntries
    .filter(e => e.route === '203D')
    .reduce((sum, e) => sum + e.quantity, 0);
  const chaebeon206A = numberedEntries
    .filter(e => e.route === '206A')
    .reduce((sum, e) => sum + e.quantity, 0);
  
  const chaebeonIncome = (chaebeon203D * rate203D) + (chaebeon206A * rate206A);

  // ================================
  // 5. 인센티브 계산 (정산기간 누적 기준)
  // ================================
  // 오늘 기준 회수율 계산
  const fbTotalPlan = fbPlanGeneral + fbPlanSolo;
  const fbTotalLoss = fbLossGeneral + fbLossSolo;
  const fbCompleted = Math.max(0, fbTotalPlan - fbTotalLoss);
  
  // 일반 FB 회수율
  const regularFBRate = fbPlanGeneral > 0 
    ? ((fbPlanGeneral - fbLossGeneral) / fbPlanGeneral) * 100 
    : 0;
  // 단독 FB 회수율
  const standaloneFBRate = fbPlanSolo > 0 
    ? ((fbPlanSolo - fbLossSolo) / fbPlanSolo) * 100 
    : 0;
  
  // 오늘 배송 기프트 누적
  const todayDeliveries = giftPlan203D + giftPlan206A;
  
  // 인센티브: 조건 충족 시 배송 기프트 * 보너스 단가
  const regularIncentive = (fbPlanGeneral > 0 && regularFBRate >= settings.incentive.regularThreshold)
    ? todayDeliveries * settings.incentive.regularBonus
    : 0;
  const standaloneIncentive = (fbPlanSolo > 0 && standaloneFBRate >= settings.incentive.standaloneThreshold)
    ? todayDeliveries * settings.incentive.standaloneBonus
    : 0;

  // ================================
  // 6. 최종 합계
  // ================================
  const totalIncome = giftIncome + returnIncome + fbIncome + chaebeonIncome + regularIncentive + standaloneIncentive;

  // 상태 판단
  let status: 'complete' | 'partial' | 'incomplete' = 'incomplete';
  let statusMessage: string | undefined;
  
  if (firstAllocation > 0 && totalRemainingAfterFirstRound > 0) {
    status = 'partial';
    if (giftPlan203D === 0 && giftPlan206A === 0) {
      statusMessage = 'Stage B 입력 필요';
    }
  }
  if (giftPlan203D > 0 || giftPlan206A > 0) {
    status = 'complete';
  }
  // Stage D 입력 감지 (Stage B 전체잔여와 비교)
  if (workData.round2TotalRemaining !== undefined && workData.round2TotalRemaining !== totalRemainingAfterFirstRound) {
    statusMessage = undefined; // Stage D 입력됨
  }

  // 디버그 로그
  console.log('[calculateTodayIncome] Plan/Loss/Extra 계산:', {
    gift: { plan203D: giftPlan203D, plan206A: giftPlan206A, loss203D: giftLoss203D, loss206A: giftLoss206A, income: giftIncome },
    return: { allocated: returnAllocated, loss203D: returnLoss203D, loss206A: returnLoss206A, income: returnIncome },
    fb: { planGeneral: fbPlanGeneral, planSolo: fbPlanSolo, lossGeneral: fbLossGeneral, lossSolo: fbLossSolo, income: fbIncome },
    chaebeon: { c203D: chaebeon203D, c206A: chaebeon206A, income: chaebeonIncome },
    incentive: { regularRate: regularFBRate, standaloneRate: standaloneFBRate, regular: regularIncentive, standalone: standaloneIncentive },
    total: totalIncome,
  });

  return {
    giftPlan203D,
    giftPlan206A,
    giftLoss203D,
    giftLoss206A,
    giftIncome,
    returnPlan203D,
    returnPlan206A,
    returnLoss203D,
    returnLoss206A,
    returnIncome,
    fbPlanGeneral,
    fbPlanSolo,
    fbLossGeneral,
    fbLossSolo,
    fbIncome,
    chaebeon203D,
    chaebeon206A,
    chaebeonIncome,
    regularFBRate,
    standaloneFBRate,
    regularIncentive,
    standaloneIncentive,
    totalIncome,
    status,
    statusMessage,
  };
}

// ================================
// 기존 함수들 (WorkRecord 기반 - 저장된 기록용)
// ================================

// 실제 배송 완료 수량 계산 (완료 입력값 기준)
export function calculateActualDeliveries(record: WorkRecord): number {
  return record.delivery.completed;
}

// 예상 배송 수량 계산 (할당 기준 - 실시간 예상 수입 계산용)
export function calculateExpectedDeliveries(record: WorkRecord): number {
  const allocated = record.delivery?.allocated ?? 0;
  const cancelled = record.delivery?.cancelled ?? 0;
  
  // 할당 - 취소(미배송) = 예상 완료량
  return Math.max(0, allocated - cancelled);
}

// 실제 반품 완료 수량 계산 (전체 할당 - 미회수 = 완료)
export function calculateActualReturns(record: WorkRecord): number {
  const allocated = record.returns.allocated || 0;
  const notCollected = record.returns.notCollected || 0;
  return Math.max(0, allocated - notCollected);
}

// 실제 FB 회수 수량 계산 (시작 - 미방문 = 완료)
export function calculateActualFreshBags(record: WorkRecord): number {
  // 프레시백 시작 = 할당 + 조정 - 이관 + 추가
  const freshbagStart = (record.freshBag.regularAllocated || 0) + 
                        (record.freshBag.standaloneAllocated || 0) +
                        (record.freshBag.regularAdjustment || 0) -
                        (record.freshBag.transferred || 0) +
                        (record.freshBag.added || 0);
  
  // 미방문 합계 (Stage F 입력값)
  const totalUndone = (record.freshBag.undoneLinked || 0) + (record.freshBag.undoneSolo || 0);
  
  // 완료 = 시작 - 미방문 (음수 방지)
  return Math.max(0, freshbagStart - totalUndone);
}

// 배송 진행률 계산 (완료 입력값 기준)
export function calculateDeliveryProgress(records: WorkRecord[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  
  for (const record of records) {
    const allocated = record.delivery.allocated || 0;
    const cancelled = record.delivery.cancelled || 0;
    total += allocated;
    completed += Math.max(0, allocated - cancelled);
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

// FB 진행률 계산 (시작 - 미방문 = 완료)
export function calculateFBProgress(records: WorkRecord[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  
  for (const record of records) {
    // 프레시백 시작
    const fbStart = (record.freshBag.regularAllocated || 0) + (record.freshBag.standaloneAllocated || 0) 
                    + (record.freshBag.regularAdjustment || 0)
                    - (record.freshBag.transferred || 0) + (record.freshBag.added || 0);
    
    // 미방문 합계
    const totalUndone = (record.freshBag.undoneLinked || 0) + (record.freshBag.undoneSolo || 0);
    
    total += fbStart;
    completed += Math.max(0, fbStart - totalUndone);
  }
  
  return { completed, total: Math.max(total, completed) };
}

// 오늘 기준 일반 FB 회수율 (시작 - 미방문 = 완료)
export function calculateTodayRegularFBRate(records: WorkRecord[]): number {
  let completed = 0;
  let total = 0;

  for (const record of records) {
    // 일반 시작 = 할당 + 조정
    const regularStart = (record.freshBag.regularAllocated || 0) + (record.freshBag.regularAdjustment || 0);
    // 일반 미방문
    const regularUndone = record.freshBag.undoneLinked || 0;
    total += regularStart;
    completed += Math.max(0, regularStart - regularUndone);
  }

  if (total === 0) return 0;
  return (completed / total) * 100;
}

// 오늘 기준 단독 FB 회수율 (시작 - 미방문 = 완료)
export function calculateTodayStandaloneFBRate(records: WorkRecord[]): number {
  let completed = 0;
  let total = 0;

  for (const record of records) {
    // 단독 시작 = 할당 - 조정 (일반으로 전환된 만큼 제외)
    const standaloneStart = Math.max(0, (record.freshBag.standaloneAllocated || 0) - (record.freshBag.regularAdjustment || 0));
    // 단독 미방문
    const standaloneUndone = record.freshBag.undoneSolo || 0;
    total += standaloneStart;
    completed += Math.max(0, standaloneStart - standaloneUndone);
  }

  if (total === 0) return 0;
  return (completed / total) * 100;
}

// 일일 수입 계산 (WorkRecord 기반 - 저장된 기록용)
export function calculateDailyIncome(
  records: WorkRecord[],
  settings: Settings
): number {
  let total = 0;

  for (const record of records) {
    const routeRate = settings.routes[record.route];

    // Delivery income = (할당 - 미배송) * 단가
    const allocated = record.delivery.allocated || 0;
    const cancelled = record.delivery.cancelled || 0;
    const deliveryCount = Math.max(0, allocated - cancelled);
    total += deliveryCount * routeRate;

    // Returns income = (할당 - 미회수) * 단가
    total += calculateActualReturns(record) * routeRate;

    // Fresh bag income = (시작 - 미방문) * 단가
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
    
    // 할당 - 미배송 = 배송 완료
    const allocated = record.delivery.allocated || 0;
    const cancelled = record.delivery.cancelled || 0;
    const deliveryCount = Math.max(0, allocated - cancelled);
    
    if (!routeIncomes[record.route]) {
      routeIncomes[record.route] = { income: 0, count: 0 };
    }
    routeIncomes[record.route].income += deliveryCount * routeRate;
    routeIncomes[record.route].count += deliveryCount;

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
  const totalDeliveries = records.reduce((sum, r) => {
    const allocated = r.delivery.allocated || 0;
    const cancelled = r.delivery.cancelled || 0;
    return sum + Math.max(0, allocated - cancelled);
  }, 0);
  
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
  let completed = 0;
  let total = 0;

  for (const record of records) {
    if (type === 'regular') {
      // 일반 시작 = 할당 + 조정
      const regularStart = (record.freshBag.regularAllocated || 0) + (record.freshBag.regularAdjustment || 0);
      const regularUndone = record.freshBag.undoneLinked || 0;
      total += regularStart;
      completed += Math.max(0, regularStart - regularUndone);
    } else {
      // 단독 시작 = 할당 - 조정
      const standaloneStart = Math.max(0, (record.freshBag.standaloneAllocated || 0) - (record.freshBag.regularAdjustment || 0));
      const standaloneUndone = record.freshBag.undoneSolo || 0;
      total += standaloneStart;
      completed += Math.max(0, standaloneStart - standaloneUndone);
    }
  }

  if (total === 0) return 0;
  return (completed / total) * 100;
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

    // 할당 - 미배송 = 배송 완료
    const allocated = record.delivery.allocated || 0;
    const cancelled = record.delivery.cancelled || 0;
    const actualDeliveries = Math.max(0, allocated - cancelled);
    
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
        totalDeliveries: weekRecords.reduce((sum, r) => {
          const allocated = r.delivery.allocated || 0;
          const cancelled = r.delivery.cancelled || 0;
          return sum + Math.max(0, allocated - cancelled);
        }, 0),
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
