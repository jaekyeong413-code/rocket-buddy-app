/**
 * 반품(회수) 엑셀/넘버스식 계산 엔진
 * 
 * 원칙:
 * 1. Source Input → Derived 단방향 흐름만 허용
 * 2. Derived는 저장하지 않음 - 항상 현재 Source 기준 실시간 계산
 * 3. 어떤 입력값을 언제/어떤 순서로 변경해도 동일한 결과
 * 4. NZ(x): 비어있으면 0, 아니면 x (null-safe)
 */

import { TodayWorkData } from '@/types';

// Null-safe: 비어있으면 0 반환
const NZ = (value: number | undefined | null): number => value ?? 0;

// ================================
// Source Input 정규화 인터페이스
// ================================
export interface ReturnSourceInputs {
  // Stage A: 1회전 반품 전체 할당
  R1_RETURN_TOTAL: number;
  
  // Stage B: 203D 잔여 반품
  R1_RETURN_REM_203D: number;
  
  // Stage B: 206A 잔여 반품
  R1_RETURN_REM_206A: number;
}

// ================================
// Derived 계산 결과 인터페이스
// ================================
export interface ReturnDerivedValues {
  // Source 정규화
  R1_RETURN_TOTAL: number;
  R1_RETURN_REM_203D: number;
  R1_RETURN_REM_206A: number;
  
  // 1회전 반품 완료 총합
  R1_RETURN_DONE_TOTAL: number;
  
  // 1회전 라우트별 반품 할당(처리)
  R1_RETURN_ASSIGNED_203D: number;
  R1_RETURN_ASSIGNED_206A: number;
  
  // 라우트별 반품 수입 (단가 적용)
  RETURN_INCOME_203D: number;
  RETURN_INCOME_206A: number;
  RETURN_INCOME_TOTAL: number;
  
  // 경고: 잔여 합계가 전체보다 큰 경우
  hasOverflow: boolean;
}

// 단가 상수
const RATE_203D = 850;
const RATE_206A = 750;

// ================================
// Source Input 추출 함수
// ================================
export function extractReturnSourceInputs(workData: TodayWorkData): ReturnSourceInputs {
  return {
    // Stage A: 1회전 반품 전체 할당
    R1_RETURN_TOTAL: NZ(workData.firstAllocationReturns),
    
    // Stage B: 203D 잔여 반품
    R1_RETURN_REM_203D: NZ(workData.stageB_returnRemaining_203D),
    
    // Stage B: 206A 잔여 반품
    R1_RETURN_REM_206A: NZ(workData.stageB_returnRemaining_206A),
  };
}

// ================================
// 반품 Derived 계산 함수 (엑셀/넘버스 수식)
// ================================
export function calculateReturnDerived(sources: ReturnSourceInputs): ReturnDerivedValues {
  // Source 정규화
  const R1_RETURN_TOTAL = NZ(sources.R1_RETURN_TOTAL);
  const R1_RETURN_REM_203D = NZ(sources.R1_RETURN_REM_203D);
  const R1_RETURN_REM_206A = NZ(sources.R1_RETURN_REM_206A);
  
  // 잔여 합계
  const totalRemaining = R1_RETURN_REM_203D + R1_RETURN_REM_206A;
  
  // 경고: 잔여 합계가 전체보다 큰 경우
  const hasOverflow = totalRemaining > R1_RETURN_TOTAL;
  
  // 1회전 반품 완료 총합 (clamp to 0)
  // R1_RETURN_DONE_TOTAL = R1_RETURN_TOTAL - (R1_RETURN_REM_203D + R1_RETURN_REM_206A)
  const R1_RETURN_DONE_TOTAL = Math.max(0, R1_RETURN_TOTAL - totalRemaining);
  
  // 1회전 라우트별 반품 할당(처리)
  // R1_RETURN_ASSIGNED_203D = (전체 완료분) + (203D 잔여)
  // 해석: 203D가 처리한 반품 = 완료된 것 중 203D 몫 + 203D에 아직 남은 것
  // 단, 잔여가 전체보다 크면 clamp
  const R1_RETURN_ASSIGNED_203D = Math.max(0, R1_RETURN_DONE_TOTAL + R1_RETURN_REM_203D);
  
  // R1_RETURN_ASSIGNED_206A = R1_RETURN_TOTAL - R1_RETURN_ASSIGNED_203D
  const R1_RETURN_ASSIGNED_206A = Math.max(0, R1_RETURN_TOTAL - R1_RETURN_ASSIGNED_203D);
  
  // 라우트별 반품 완료 (잔여 제외)
  const RETURN_DONE_203D = Math.max(0, R1_RETURN_ASSIGNED_203D - R1_RETURN_REM_203D);
  const RETURN_DONE_206A = Math.max(0, R1_RETURN_ASSIGNED_206A - R1_RETURN_REM_206A);
  
  // 라우트별 반품 수입 (단가 적용)
  const RETURN_INCOME_203D = RETURN_DONE_203D * RATE_203D;
  const RETURN_INCOME_206A = RETURN_DONE_206A * RATE_206A;
  const RETURN_INCOME_TOTAL = RETURN_INCOME_203D + RETURN_INCOME_206A;
  
  return {
    // Source
    R1_RETURN_TOTAL,
    R1_RETURN_REM_203D,
    R1_RETURN_REM_206A,
    
    // Derived
    R1_RETURN_DONE_TOTAL,
    R1_RETURN_ASSIGNED_203D,
    R1_RETURN_ASSIGNED_206A,
    RETURN_INCOME_203D,
    RETURN_INCOME_206A,
    RETURN_INCOME_TOTAL,
    
    // Warning
    hasOverflow,
  };
}

// ================================
// TodayWorkData에서 직접 계산하는 편의 함수
// ================================
export function calculateReturnFromWorkData(workData: TodayWorkData): ReturnDerivedValues {
  const sources = extractReturnSourceInputs(workData);
  return calculateReturnDerived(sources);
}
