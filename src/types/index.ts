export interface Settings {
  routes: {
    '203D': number;
    '206A': number;
  };
  freshBag: {
    regular: number;
    standalone: number;
  };
  incentive: {
    regularThreshold: number;
    regularBonus: number;
    standaloneThreshold: number;
    standaloneBonus: number;
  };
  monthlyFee: number;
}

export interface DeliveryData {
  allocated: number;
  completed: number;
  cancelled: number;
  incomplete: number;
  transferred: number; // 이관(-)
  added: number; // 추가(+)
  firstRoundRemaining: number; // 1회전 잔여
}

export interface ReturnsData {
  allocated: number;
  completed: number;
  notCollected: number; // 미회수 수량 (숫자만)
  numbered: number;
  incomplete: number;
}

export interface FreshBagData {
  regularAllocated: number; // 일반 할당
  standaloneAllocated: number; // 단독 할당
  regularAdjustment: number; // 일반 증감 (+/-)
  transferred: number; // 이관(-)
  added: number; // 추가(+)
  regular: number; // 일반 회수 완료
  standalone: number; // 단독 회수 완료
  failedAbsent: number; // 미회수 - 부재
  failedNoProduct: number; // 미회수 - 상품 없음
  failedNotOut: number; // 기존 호환용
  failedWithProducts: number; // 기존 호환용
  incomplete: number;
}

export interface WorkRecord {
  id: string;
  date: string;
  route: '203D' | '206A';
  round: 1 | 2;
  delivery: DeliveryData;
  returns: ReturnsData;
  freshBag: FreshBagData;
}

// 오늘의 작업 데이터 (저장 전 상태 - 항상 표시)
export interface TodayWorkData {
  date: string;
  firstAllocationDelivery: number; // 1차 할당 배송
  firstAllocationReturns: number; // 1차 할당 반품
  totalRemainingAfterFirstRound: number; // 1회전 잔여 포함 전체 남은 물량
  routes: {
    '203D': DeliveryData;
    '206A': DeliveryData;
  };
  returns: ReturnsData;
  freshBag: FreshBagData;
}

export interface DailyStats {
  date: string;
  totalDeliveries: number;
  totalReturns: number;
  totalFreshBags: number;
  regularFBCollectionRate: number;
  standaloneFBCollectionRate: number;
  dailyIncome: number;
}

export interface PeriodSummary {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalDeliveries: number;
  totalReturns: number;
  totalFreshBags: number;
  regularFBRate: number;
  standaloneFBRate: number;
  regularIncentive: number;
  standaloneIncentive: number;
  netIncome: number;
}

// 라우트 비중 학습 데이터
export interface RouteAllocationHistory {
  date: string;
  allocations: {
    '203D': number;
    '206A': number;
  };
}

// 주간 통계
export interface WeeklyStats {
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  regularFBRate: number;
  standaloneFBRate: number;
  totalDeliveries: number;
  totalIncome: number;
}

export type RouteType = '203D' | '206A';
export type RoundType = 1 | 2;
export type FilterType = 'daily' | 'weekly' | 'monthly';
