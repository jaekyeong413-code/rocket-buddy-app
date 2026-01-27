/**
 * 기프트(배송) 엑셀/넘버스식 계산 엔진
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
export interface GiftSourceInputs {
  // Stage A: 1회전 할당 기프트 전체
  A_GIFT1_TOTAL: number;
  
  // Stage B: 203D 잔여 기프트
  B_GIFT_REM_203D_R1: number;
  
  // Stage B: 전체 잔여 기프트
  B_GIFT_REM_TOT_R1: number;
  
  // Stage C: 206A 잔여 기프트 (선택 - 없으면 B에서 자동 계산)
  C_GIFT_REM_206A_R1: number | undefined;
  
  // Stage D: 2회전 시작 전 전체 기프트 (잔여 + 신규)
  D_GIFT_TOT_BEFORE_R2: number;
  
  // Stage E: 203D 2회전 종료 후 전체 잔여 (= 206A 잔여)
  E_GIFT_REM_TOT_AFTER_203D_R2: number;
}

// ================================
// Derived 계산 결과 인터페이스
// ================================
export interface GiftDerivedValues {
  // Source 정규화
  A1: number;
  Btot: number;
  B203: number;
  C206: number | undefined;
  D2tot: number;
  Erem: number;
  
  // 1회전 206A 잔여 (B에서 계산 또는 C에서 입력)
  REM_206A_R1_FROM_B: number;
  REM_206A_R1: number;
  
  // 1차 기프트 (라우트별)
  GIFT1_203D: number;
  GIFT1_206A: number;
  
  // 2회전 신규 할당
  GIFT2_NEW_TOTAL: number;
  GIFT2_NEW_206A: number;
  GIFT2_NEW_203D: number;
  
  // 2차 기프트 (라우트별)
  GIFT2_203D: number;
  GIFT2_206A: number;
  
  // 하루 합계
  GIFT_TOTAL_203D: number;
  GIFT_TOTAL_206A: number;
  GIFT_TOTAL_ALL: number;
}

// ================================
// Source Input 추출 함수
// ================================
export function extractGiftSourceInputs(workData: TodayWorkData): GiftSourceInputs {
  return {
    // Stage A: 1회전 할당 기프트 전체
    A_GIFT1_TOTAL: NZ(workData.firstAllocationDelivery),
    
    // Stage B: 203D 잔여 기프트
    B_GIFT_REM_203D_R1: NZ(workData.routes?.['203D']?.firstRoundRemaining),
    
    // Stage B: 전체 잔여 기프트
    B_GIFT_REM_TOT_R1: NZ(workData.totalRemainingAfterFirstRound),
    
    // Stage C: 206A 잔여 기프트 (선택)
    // 현재 UI에서는 별도 필드가 없으므로 round1EndRemaining 값이 있으면 B값과 동일하게 취급
    // 차후 Stage C에 206A 입력칸 추가 시 사용
    C_GIFT_REM_206A_R1: undefined, // 현재는 undefined (B값에서 자동 계산)
    
    // Stage D: 2회전 시작 전 전체 기프트
    D_GIFT_TOT_BEFORE_R2: NZ(workData.round2TotalRemaining),
    
    // Stage E: 203D 2회전 종료 후 전체 잔여
    E_GIFT_REM_TOT_AFTER_203D_R2: NZ(workData.round2EndRemaining),
  };
}

// ================================
// 기프트 Derived 계산 함수 (엑셀/넘버스 수식)
// ================================
export function calculateGiftDerived(sources: GiftSourceInputs): GiftDerivedValues {
  // (3-0) Source 정규화
  const A1 = NZ(sources.A_GIFT1_TOTAL);
  const Btot = NZ(sources.B_GIFT_REM_TOT_R1);
  const B203 = NZ(sources.B_GIFT_REM_203D_R1);
  const C206 = sources.C_GIFT_REM_206A_R1; // undefined 가능
  const D2tot = NZ(sources.D_GIFT_TOT_BEFORE_R2);
  const Erem = NZ(sources.E_GIFT_REM_TOT_AFTER_203D_R2);

  // (3-1) 1회전 종료 시점 잔여 분해 (206A 잔여)
  const REM_206A_R1_FROM_B = Math.max(0, Btot - B203);
  const REM_206A_R1 = C206 !== undefined ? NZ(C206) : REM_206A_R1_FROM_B;

  // (3-2) 1차(1회전) 기프트 — 라우트별 분해
  // GIFT1_203D = A1 - Btot + B203
  // 해석: 1차 전체(A1)에서 전체잔여(Btot)를 빼고, 203D잔여(B203)를 더함
  // = 1차 전체 - 206A 완료 - 206A 잔여 + 203D 잔여 ... 간단히: 1차에서 배송 완료된 203D
  const GIFT1_203D = Math.max(0, A1 - Btot + B203);
  
  // GIFT1_206A = A1 - GIFT1_203D
  const GIFT1_206A = Math.max(0, A1 - GIFT1_203D);

  // (3-3) 2회전 "신규 할당 총합"
  // GIFT2_NEW_TOTAL = D2tot - Btot
  // 해석: 2회전 시작 전 전체(D2tot)에서 1회전 잔여(Btot)를 빼면 신규 추가분
  const GIFT2_NEW_TOTAL = Math.max(0, D2tot - Btot);

  // (3-4) 2회전 신규 할당(206A)
  // Stage E 정의: "203D 2회전 완전 종료 직후 전체 잔여 = 206A 잔여"
  // GIFT2_NEW_206A = Erem - REM_206A_R1
  // 해석: 최종 남은 것(Erem)에서 1회전 206A 잔여(REM_206A_R1)를 빼면 2회전에서 새로 추가된 206A
  const GIFT2_NEW_206A = Math.max(0, Erem - REM_206A_R1);

  // (3-5) 2회전 신규 할당(203D)
  // GIFT2_NEW_203D = GIFT2_NEW_TOTAL - GIFT2_NEW_206A
  const GIFT2_NEW_203D = Math.max(0, GIFT2_NEW_TOTAL - GIFT2_NEW_206A);

  // (3-6) 2차 기프트(라우트별) = 신규 할당
  const GIFT2_203D = GIFT2_NEW_203D;
  const GIFT2_206A = GIFT2_NEW_206A;

  // (3-7) 하루 합계(라우트별/전체)
  const GIFT_TOTAL_203D = GIFT1_203D + GIFT2_203D;
  const GIFT_TOTAL_206A = GIFT1_206A + GIFT2_206A;
  const GIFT_TOTAL_ALL = A1 + GIFT2_NEW_TOTAL; // 동치: GIFT_TOTAL_203D + GIFT_TOTAL_206A

  return {
    // Source 정규화
    A1,
    Btot,
    B203,
    C206,
    D2tot,
    Erem,
    
    // 1회전 206A 잔여
    REM_206A_R1_FROM_B,
    REM_206A_R1,
    
    // 1차 기프트
    GIFT1_203D,
    GIFT1_206A,
    
    // 2회전 신규 할당
    GIFT2_NEW_TOTAL,
    GIFT2_NEW_206A,
    GIFT2_NEW_203D,
    
    // 2차 기프트
    GIFT2_203D,
    GIFT2_206A,
    
    // 하루 합계
    GIFT_TOTAL_203D,
    GIFT_TOTAL_206A,
    GIFT_TOTAL_ALL,
  };
}

// ================================
// TodayWorkData에서 직접 계산하는 편의 함수
// ================================
export function calculateGiftFromWorkData(workData: TodayWorkData): GiftDerivedValues {
  const sources = extractGiftSourceInputs(workData);
  return calculateGiftDerived(sources);
}
