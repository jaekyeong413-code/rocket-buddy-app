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

export interface WorkRecord {
  id: string;
  date: string;
  route: '203D' | '206A';
  round: 1 | 2;
  delivery: {
    allocated: number;
    completed: number;
    cancelled: number;
    incomplete: number;
    transferred: number; // 이관(-)
    added: number; // 추가(+)
  };
  returns: {
    completed: number;
    notCollected: number;
    numbered: number;
    incomplete: number;
  };
  freshBag: {
    regular: number;
    standalone: number;
    failedNotOut: number;
    failedWithProducts: number;
    incomplete: number;
  };
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

export type RouteType = '203D' | '206A';
export type RoundType = 1 | 2;
