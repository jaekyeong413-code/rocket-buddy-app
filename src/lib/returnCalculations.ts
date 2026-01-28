/**
 * 반품(회수) 엑셀/넘버스식 계산 엔진 v2
 * 
 * 원칙:
 * 1. Source Input → Derived 단방향 흐름만 허용
 * 2. Derived는 저장하지 않음 - 항상 현재 Source 기준 실시간 계산
 * 3. 어떤 입력값을 언제/어떤 순서로 변경해도 동일한 결과
 * 4. NZ(x): 비어있으면 0, 아니면 x (null-safe)
 * 5. '완료(done)' 기반 계산 금지 - 할당 = 수입 기준
 * 6. 잔여/미방문은 라우트 분리용 Source, 차감용 아님
 */

import { TodayWorkData } from '@/types';

// Null-safe: 비어있으면 0 반환
const NZ = (value: number | undefined | null): number => value ?? 0;

// 단가 상수
const RATE_203D = 850;
const RATE_206A = 750;

// ================================
// Source Input 정규화 인터페이스
// ================================
export interface ReturnSourceInputs {
  // Stage A: 1회전 반품 전체 할당
  A_R1_RET_TOTAL: number;
  
  // Stage B: 203D 잔여(미방문) 반품 (203D 1회전 종료 시점)
  B_203_REM_R1: number;
  
  // Stage B: 206A 1회전 반품 물량 (이 시점에 203D만 종료, 206A는 진행 전)
  B_206_R1_ASSIGNED: number;
  
  // Stage C: 206A 잔여(미방문) 반품 (1회전 종료 - 206A까지)
  C_206_REM_R1: number;
  
  // Stage D: (1회전 잔여 + 2회전 신규 회수 지시) 반품 전체
  D_RET_TOTAL_NOW: number;
  
  // Stage E: 이 시점 206A 잔여 반품 (203D 완전 종료 시점)
  E_206_REM_NOW: number;
}

// ================================
// Derived 계산 결과 인터페이스
// ================================
export interface ReturnDerivedValues {
  // Source 정규화 (그대로 노출)
  A_R1_RET_TOTAL: number;
  B_203_REM_R1: number;
  B_206_R1_ASSIGNED: number;
  C_206_REM_R1: number;
  D_RET_TOTAL_NOW: number;
  E_206_REM_NOW: number;
  
  // [1] 1회전 회수 지시 반품
  R1_206_ASSIGNED: number;
  R1_203_ASSIGNED: number;
  
  // [2] 1회전 잔여 / 완료
  R1_203_REM: number;
  R1_203_DONE: number;
  R1_206_REM: number;
  R1_206_DONE: number;
  
  // [3] 1회전 종료 후 전체 잔여
  R1_REM_TOTAL: number;
  
  // [4] 2회전 신규 반품 총량
  R2_NEW_TOTAL: number;
  
  // [5] 2회전 신규 반품 라우트 분리
  R2_206_NEW: number;
  R2_203_NEW: number;
  
  // [6] 하루 반품 (라우트별 총 회수 지시)
  DAY_203_ASSIGNED: number;
  DAY_206_ASSIGNED: number;
  
  // 금액 계산
  RETURN_INCOME_203D: number;
  RETURN_INCOME_206A: number;
  RETURN_INCOME_TOTAL: number;
  
  // === 기존 호환용 (대시보드에서 사용) ===
  R1_RETURN_TOTAL: number;
  R1_RETURN_REM_203D: number;
  R1_RETURN_REM_206A: number;
  R1_RETURN_DONE_TOTAL: number;
  R1_RETURN_ASSIGNED_203D: number;
  R1_RETURN_ASSIGNED_206A: number;
}

// ================================
// Source Input 추출 함수
// ================================
export function extractReturnSourceInputs(workData: TodayWorkData): ReturnSourceInputs {
  return {
    // Stage A: 1회전 반품 전체 할당
    A_R1_RET_TOTAL: NZ(workData.firstAllocationReturns),
    
    // Stage B: 203D 잔여(미방문) 반품
    B_203_REM_R1: NZ(workData.stageB_returnRemaining_203D),
    
    // Stage B: 206A 1회전 반품 물량
    B_206_R1_ASSIGNED: NZ(workData.stageB_206A_R1_assigned),
    
    // Stage C: 206A 잔여(미방문) 반품
    C_206_REM_R1: NZ(workData.stageC_206A_returnRemaining),
    
    // Stage D: (1회전 잔여 + 2회전 신규) 반품 전체
    D_RET_TOTAL_NOW: NZ(workData.round2TotalReturns),
    
    // Stage E: 이 시점 206A 잔여 반품
    E_206_REM_NOW: NZ(workData.stageE_206A_returnRemaining),
  };
}

// ================================
// 반품 Derived 계산 함수 (엑셀/넘버스 수식)
// ================================
export function calculateReturnDerived(sources: ReturnSourceInputs): ReturnDerivedValues {
  // Source 정규화
  const A_R1_RET_TOTAL = NZ(sources.A_R1_RET_TOTAL);
  const B_203_REM_R1 = NZ(sources.B_203_REM_R1);
  const B_206_R1_ASSIGNED = NZ(sources.B_206_R1_ASSIGNED);
  const C_206_REM_R1 = NZ(sources.C_206_REM_R1);
  const D_RET_TOTAL_NOW = NZ(sources.D_RET_TOTAL_NOW);
  const E_206_REM_NOW = NZ(sources.E_206_REM_NOW);
  
  // ================================
  // [1] 1회전 회수 지시 반품
  // ================================
  const R1_206_ASSIGNED = B_206_R1_ASSIGNED;
  const R1_203_ASSIGNED = A_R1_RET_TOTAL - R1_206_ASSIGNED;
  
  // ================================
  // [2] 1회전 잔여 / 완료
  // ================================
  const R1_203_REM = B_203_REM_R1;
  const R1_203_DONE = Math.max(0, R1_203_ASSIGNED - R1_203_REM);
  
  const R1_206_REM = C_206_REM_R1;
  const R1_206_DONE = Math.max(0, R1_206_ASSIGNED - R1_206_REM);
  
  // ================================
  // [3] 1회전 종료 후 전체 잔여
  // ================================
  const R1_REM_TOTAL = R1_203_REM + R1_206_REM;
  
  // ================================
  // [4] 2회전 신규 반품 총량
  // ================================
  const R2_NEW_TOTAL = Math.max(0, D_RET_TOTAL_NOW - R1_REM_TOTAL);
  
  // ================================
  // [5] 2회전 신규 반품 라우트 분리
  // ================================
  const R2_206_NEW = Math.max(0, E_206_REM_NOW - R1_206_REM);
  const R2_203_NEW = Math.max(0, R2_NEW_TOTAL - R2_206_NEW);
  
  // ================================
  // [6] 하루 반품 (라우트별 총 회수 지시) - 수입 계산 기준!
  // ================================
  const DAY_203_ASSIGNED = R1_203_ASSIGNED + R2_203_NEW;
  const DAY_206_ASSIGNED = R1_206_ASSIGNED + R2_206_NEW;
  
  // ================================
  // 금액 계산 (할당 = 수입 기준, 잔여 차감 없음!)
  // ================================
  const RETURN_INCOME_203D = DAY_203_ASSIGNED * RATE_203D;
  const RETURN_INCOME_206A = DAY_206_ASSIGNED * RATE_206A;
  const RETURN_INCOME_TOTAL = RETURN_INCOME_203D + RETURN_INCOME_206A;
  
  // ================================
  // 기존 호환용 (대시보드/기타 컴포넌트에서 사용)
  // ================================
  const R1_RETURN_TOTAL = A_R1_RET_TOTAL;
  const R1_RETURN_REM_203D = R1_203_REM;
  const R1_RETURN_REM_206A = R1_206_REM;
  const R1_RETURN_DONE_TOTAL = R1_203_DONE + R1_206_DONE;
  const R1_RETURN_ASSIGNED_203D = DAY_203_ASSIGNED; // 하루 총 할당
  const R1_RETURN_ASSIGNED_206A = DAY_206_ASSIGNED; // 하루 총 할당
  
  return {
    // Source
    A_R1_RET_TOTAL,
    B_203_REM_R1,
    B_206_R1_ASSIGNED,
    C_206_REM_R1,
    D_RET_TOTAL_NOW,
    E_206_REM_NOW,
    
    // Derived
    R1_206_ASSIGNED,
    R1_203_ASSIGNED,
    R1_203_REM,
    R1_203_DONE,
    R1_206_REM,
    R1_206_DONE,
    R1_REM_TOTAL,
    R2_NEW_TOTAL,
    R2_206_NEW,
    R2_203_NEW,
    DAY_203_ASSIGNED,
    DAY_206_ASSIGNED,
    
    // 금액
    RETURN_INCOME_203D,
    RETURN_INCOME_206A,
    RETURN_INCOME_TOTAL,
    
    // 기존 호환용
    R1_RETURN_TOTAL,
    R1_RETURN_REM_203D,
    R1_RETURN_REM_206A,
    R1_RETURN_DONE_TOTAL,
    R1_RETURN_ASSIGNED_203D,
    R1_RETURN_ASSIGNED_206A,
  };
}

// ================================
// TodayWorkData에서 직접 계산하는 편의 함수
// ================================
export function calculateReturnFromWorkData(workData: TodayWorkData): ReturnDerivedValues {
  const sources = extractReturnSourceInputs(workData);
  return calculateReturnDerived(sources);
}
