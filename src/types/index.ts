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
  // 할당
  regularAllocated: number;
  standaloneAllocated: number;

  // 라우트별 분배 (206A만 입력, 203D는 자동 계산)
  route206ACount: number;

  // 조정
  regularAdjustment: number; // 단독 → 일반 전환
  transferred: number;       // 이관(-)
  added: number;             // 추가(+)

  // 1회전 종료 시점 잔여 (Stage C)
  round1EndRegular?: number;
  round1EndStandalone?: number;

  // 2회전 전환 (Stage D)
  regularToStandalone?: number;
  standaloneToRegular?: number;
  round2Regular?: number;
  round2Standalone?: number;

  // 2회전 미확인 (Stage E)
  round2FailedAbsent?: number;

  // 최종 완료 (Stage F)
  finalRegularCompleted?: number;
  finalStandaloneCompleted?: number;

  // 미회수 (회수율 인정, 단가 미지급)
  failedAbsent: number;        // 부재
  failedNoProduct: number;     // 프레시백 없음
  failedWithProducts: number;  // 프레시백 내 상품 남아 있음

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

// 프백 미회수 사유
export type FreshBagNotCollectedReason = 'absent' | 'hasProducts';

// 반품 미회수 사유
export type ReturnNotCollectedReason = 'absent' | 'customerNotReceived' | 'alreadyCollected' | 'cancelled';

// 프백 미회수 항목
export interface FreshBagNotCollectedEntry {
  reason: FreshBagNotCollectedReason;
  quantity: number;
  createdAt: string;
}

// 반품 미회수 항목
export interface ReturnNotCollectedEntry {
  route: '203D' | '206A';
  reason: ReturnNotCollectedReason;
  quantity: number;
  createdAt: string;
}

// 채번 항목
export interface NumberedEntry {
  route: '203D' | '206A';
  quantity: number;
  createdAt: string;
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
  
  // 단계별 추가 필드
  currentStage?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  freshBagRound1EndRegular?: number;    // Stage C: 1회전 종료 일반 잔여
  freshBagRound1EndStandalone?: number; // Stage C: 1회전 종료 단독 잔여
  round1EndRemaining?: number;          // Stage C: 1회전 종료 잔여 물량
  round2TotalRemaining?: number;        // Stage D: 2회전 전체 잔여
  round2TotalReturns?: number;          // Stage D: 2회전 전체 반품
  round2EndRemaining?: number;          // Stage E: 2회전 종료 잔여
  round2EndReturnsRemaining?: number;   // Stage E: 2회전 종료 반품 잔여
  
  // 플로팅 메뉴 입력 (FAB)
  freshBagNotCollected?: FreshBagNotCollectedEntry[];  // 프백 미회수 목록
  returnNotCollected?: ReturnNotCollectedEntry[];      // 반품 미회수 목록
  numbered?: NumberedEntry[];                          // 채번 목록
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
// FreshBag 미회수 사유 타입
export type FreshBagFailedReason =
  | 'failedAbsent'
  | 'failedNoProduct'
  | 'failedWithProducts';
