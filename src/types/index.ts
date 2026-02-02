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

  // 최종 미방문 (Stage F) - 방문 못한/남은 프레시백 수
  undoneLinked?: number;      // 일반(연계) 미방문
  undoneSolo?: number;        // 단독 미방문

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

export interface RecordWithMeta extends WorkRecord {
  updatedAt: string;
  syncedAt: string | null;
  schemaVersion: number;
}

// 프백 미회수 사유
export type FreshBagNotCollectedReason = 'absent' | 'hasProducts';

// 반품 미회수 사유
export type ReturnNotCollectedReason = 'absent' | 'customerNotReceived' | 'alreadyCollected' | 'cancelled';

// 미배송 사유
export type UndeliveredReason = 'cancelled' | 'wrongAddress' | 'doorClosed' | 'noAccessCode';

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

// 미배송 항목
export interface UndeliveredEntry {
  route: '203D' | '206A';
  reason: UndeliveredReason;
  quantity: number;
  createdAt: string;
}

// 채번 항목
export interface NumberedEntry {
  route: '203D' | '206A';
  quantity: number;
  createdAt: string;
}

// ================================
// 오늘의 작업 데이터 (TodayWorkData)
// ================================
// 엑셀/넘버스 강제 원칙:
// 1) Source Input: 각 의미당 1개 입력칸만 존재
// 2) Derived: 전부 ReadOnly, 실시간 계산
// 3) 같은 의미의 값을 다른 스테이지에서 다시 입력 금지
// ================================
export interface TodayWorkData {
  date: string;
  
  // ================================
  // Source Input (원천값) - 사용자가 직접 입력
  // ================================
  
  // [Stage A] 배송/기프트 1차 전체 물량 (= C_firstTotal)
  firstAllocationDelivery: number;
  
  // [Stage A] 반품 1차 할당
  firstAllocationReturns: number;
  
  // [Stage B] 1회전 현재 '전체 잔여 물량' (= G_totalRemainingR1)
  totalRemainingAfterFirstRound: number;
  
  // [Stage B] 203D 잔여 물량 (= F_r1_203D_remain)
  // → routes['203D'].firstRoundRemaining에 저장
  
  // [Stage B] 203D 잔여(미방문) 반품 (203D 1회전 종료 시점)
  stageB_returnRemaining_203D?: number;
  
  // [Stage B] 206A 1회전 반품 물량 (이 시점에 203D만 종료, 206A는 진행 전)
  stageB_206A_R1_assigned?: number;
  
  // [Stage C] 206A 잔여(미방문) 반품 (1회전 종료 - 206A까지)
  stageC_206A_returnRemaining?: number;
  
  // [Stage E] 이 시점 206A 잔여 반품 (203D 완전 종료 시점)
  stageE_206A_returnRemaining?: number;
  
  // [Stage C] 1회전 종료 시점 잔여 물량 (= H_round1EndRemaining) - 있으면 입력
  round1EndRemaining?: number;
  
  // [Stage D] 2회전 출발 전 '전체 남은 물량' (= K_round2TotalRemaining)
  round2TotalRemaining?: number;
  
  // [Stage D] 2회전 전체 반품
  round2TotalReturns?: number;
  
  // [Stage E] 203D 2회전 종료 후 '전체 남은 물량' (= M_finalTotalRemaining)
  round2EndRemaining?: number;
  
  // [Stage E] 전체 남은 반품 (= returnTotalFinal)
  round2EndReturnsRemaining?: number;
  
  // ================================
  // 라우트 데이터 (내부 저장용)
  // ================================
  routes: {
    '203D': DeliveryData;
    '206A': DeliveryData;
  };
  returns: ReturnsData;
  freshBag: FreshBagData;
  
  // ================================
  // 단계 추적
  // ================================
  currentStage?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  
  // ================================
  // 프레시백 관련 Source Input
  // ================================
  freshBagRound1EndRegular?: number;    // Stage C: 1회전 종료 일반 잔여
  freshBagRound1EndStandalone?: number; // Stage C: 1회전 종료 단독 잔여
  stageB_unvisitedFB_total_203D?: number;    // Stage B: 203D 미방문 프레시백 총량
  stageE_unvisitedFB_solo_203D?: number;     // Stage E: 203D 미방문 단독 프레시백
  stageF_unvisitedFB_solo_206A?: number;     // Stage F: 206A 미방문 단독 프레시백
  
  // ================================
  // 플로팅 메뉴 입력 (FAB) - Loss/Extra
  // ================================
  freshBagNotCollected?: FreshBagNotCollectedEntry[];  // 프백 미회수 목록
  returnNotCollected?: ReturnNotCollectedEntry[];      // 반품 미회수 목록
  undelivered?: UndeliveredEntry[];                    // 미배송 목록 (Loss)
  numbered?: NumberedEntry[];                          // 채번 목록 (Extra)
  
  // ================================
  // DEPRECATED (제거 예정 - 엑셀식으로 대체됨)
  // ================================
  stageB_giftAlloc_206A?: number;      // 제거됨: Derived로 대체
  stageC_giftRemain_203D?: number;     // 제거됨: 중복 입력 금지
  stageC_giftRemain_206A?: number;     // 제거됨: 중복 입력 금지
  stageD_giftRemain_206A?: number;     // 제거됨: Stage E에서 파생
  
  // 구버전 호환용 (제거 예정)
  stageB_returnRemaining_206A?: number; // 제거됨: stageB_206A_R1_assigned로 대체
  stageC_returnRemaining_206A?: number; // 제거됨: stageC_206A_returnRemaining으로 대체
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
