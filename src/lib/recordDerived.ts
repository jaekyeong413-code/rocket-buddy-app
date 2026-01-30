/**
 * Records용 파생값 계산 엔진
 * 
 * 입력값(Source)으로부터 모든 파생값(Derived)을 계산합니다.
 * 엑셀/넘버스 고정 수식과 100% 동일한 결과를 보장합니다.
 * 
 * 원칙:
 * R0. Source(사용자 입력)와 Derived(계산 결과)를 완전히 분리
 * R1. 할당 = 수입 (완료 기준 계산 금지)
 * R2. 입력하지 않은 Source는 0으로 간주
 * R3. 미회수/미방문 확정은 Stage E/F 시점에만 차감
 */

import { TodayWorkData } from '@/types';

// Null-safe: 비어있으면 0 반환
const NZ = (value: number | undefined | null): number => value ?? 0;

// ================================
// 단가 상수
// ================================
export const RATE_203D = 850;
export const RATE_206A = 750;
export const FB_GEN_UNIT = 100;
export const FB_SOLO_UNIT = 200;

// ================================
// Source Input 인터페이스 (사용자가 직접 입력하는 값만)
// ================================
export interface RecordSourceInputs {
  // Stage A: 1회전 상차
  A_FB_GEN: number;              // 일반 프레시백(전체)
  A_FB_SOLO: number;             // 단독 프레시백(전체)
  A_FB_206A: number;             // 206A 프레시백(전체)
  A_GIFT_R1_TOTAL: number;       // 1회전 기프트 전체 할당
  A_RET_R1_TOTAL: number;        // 1회전 반품 전체 할당
  
  // Stage B: 203D 1회전 종료
  B_FB_203D_UNVISITED: number;   // 203D 프레시백 미방문(잔여)
  B_GIFT_203D_REMAIN: number;    // 203D 기프트 잔여(미방문)
  B_GIFT_TOTAL_REMAIN: number;   // 전체 기프트 잔여(미방문)
  B_RET_203D_UNVISITED: number;  // 203D 반품 미방문(잔여)
  B_RET_206A_ASSIGNED: number;   // 206A 1회전 반품 할당 (진입 전이므로 사실상 할당)
  
  // Stage C: 1회전 종료 (206A까지)
  C_GIFT_206A_REMAIN: number;    // 206A 기프트 잔여(미방문)
  C_RET_206A_REMAIN: number;     // 206A 반품 미방문(잔여)
  C_FB_GEN_UNVISITED: number;    // 일반 프레시백 미방문(전체) - 예정, 차감 아님
  C_FB_SOLO_UNVISITED: number;   // 단독 프레시백 미방문(전체) - 예정, 차감 아님
  
  // Stage D: 2회전 상차
  D_FB_GEN_INCREASE: number;     // 일반 프레시백 증가분
  D_GIFT_TOTAL_NOW: number;      // 잔여+신규 합친 '현재 전체 기프트'
  D_RET_TOTAL_NOW: number;       // 잔여+신규 합친 '현재 전체 반품'
  
  // Stage E: 203D 완전 종료
  E_GIFT_REMAIN: number;         // 기프트 잔여 (=206A 잔여)
  E_RET_REMAIN: number;          // 반품 잔여 (=206A 잔여)
  E_FB_203D_REMAIN: number;      // 203D 프레시백 잔여 (미회수 확정)
  
  // Stage F: 업무 종료
  F_FB_206A_REMAIN: number;      // 206A 프레시백 미방문 (미회수 확정)
  F_FB_GEN_REMAIN: number;       // 일반 프레시백 미방문
  F_FB_SOLO_REMAIN: number;      // 단독 프레시백 미방문
}

// ================================
// Derived 계산 결과 인터페이스
// ================================
export interface RecordDerivedValues {
  // 프레시백 할당
  FB_TOTAL_ASSIGNED: number;
  FB_206A_ASSIGNED: number;
  FB_203D_ASSIGNED: number;
  
  // 1회전 기프트 라우트별 할당
  GIFT_R1_DONE_TOTAL: number;
  GIFT_R1_203D_ASSIGNED: number;
  GIFT_R1_206A_ASSIGNED: number;
  
  // 1회전 종료 시점 전체 잔여
  GIFT_R1_REMAIN_TOTAL: number;
  
  // 2회전 신규 기프트
  GIFT_R2_NEW_TOTAL: number;
  GIFT_R2_NEW_206A: number;
  GIFT_R2_NEW_203D: number;
  
  // 하루 기프트 합계 및 비율
  GIFT_DAY_TOTAL: number;
  GIFT_DAY_203D: number;
  GIFT_DAY_206A: number;
  GIFT_RATE_203D: number;  // 0~1 사이 비율
  GIFT_RATE_206A: number;  // 0~1 사이 비율
  
  // 1회전 반품 라우트별 할당
  RET_R1_206A_ASSIGNED: number;
  RET_R1_203D_ASSIGNED: number;
  
  // 1회전 종료 반품 잔여
  RET_R1_REMAIN_TOTAL: number;
  
  // 2회전 신규 반품
  RET_R2_NEW_TOTAL: number;
  RET_R2_NEW_206A: number;
  RET_R2_NEW_203D: number;
  
  // 하루 반품 합계 및 비율
  RET_DAY_203D: number;
  RET_DAY_206A: number;
  RET_DAY_TOTAL: number;
  RET_RATE_203D: number;  // 0~1 사이 비율
  RET_RATE_206A: number;  // 0~1 사이 비율
  
  // 프레시백 회수율
  FB_203D_COLLECTED: number;
  FB_203D_UNCOLLECTED: number;
  FB_203D_RATE: number;
  
  FB_206A_COLLECTED: number;
  FB_206A_UNCOLLECTED: number;
  FB_206A_RATE: number;
  
  FB_GEN_ASSIGNED: number;
  FB_GEN_COLLECTED: number;
  FB_GEN_UNCOLLECTED: number;
  FB_GEN_RATE: number;
  
  FB_SOLO_ASSIGNED: number;
  FB_SOLO_COLLECTED: number;
  FB_SOLO_UNCOLLECTED: number;
  FB_SOLO_RATE: number;
  
  // 수입 계산
  INCOME_GIFT_203D: number;
  INCOME_GIFT_206A: number;
  INCOME_GIFT: number;
  
  INCOME_RET_203D: number;
  INCOME_RET_206A: number;
  INCOME_RET: number;
  
  INCOME_FB_GEN: number;
  INCOME_FB_SOLO: number;
  INCOME_FB_ASSIGNED: number;
  
  INCOME_FB_DEDUCT_GEN: number;
  INCOME_FB_DEDUCT_SOLO: number;
  INCOME_FB_DEDUCT: number;
  
  TODAY_EST_INCOME_BASE: number;
}

// ================================
// TodayWorkData에서 Source Input 추출
// ================================
export function extractSourceInputs(workData: TodayWorkData): RecordSourceInputs {
  const freshBag = workData.freshBag;
  
  return {
    // Stage A
    A_FB_GEN: NZ(freshBag?.regularAllocated),
    A_FB_SOLO: NZ(freshBag?.standaloneAllocated),
    A_FB_206A: NZ(freshBag?.route206ACount),
    A_GIFT_R1_TOTAL: NZ(workData.firstAllocationDelivery),
    A_RET_R1_TOTAL: NZ(workData.firstAllocationReturns),
    
    // Stage B
    B_FB_203D_UNVISITED: NZ(workData.stageB_unvisitedFB_total_203D),
    B_GIFT_203D_REMAIN: NZ(workData.routes?.['203D']?.firstRoundRemaining),
    B_GIFT_TOTAL_REMAIN: NZ(workData.totalRemainingAfterFirstRound),
    B_RET_203D_UNVISITED: NZ(workData.stageB_returnRemaining_203D),
    B_RET_206A_ASSIGNED: NZ(workData.stageB_206A_R1_assigned),
    
    // Stage C
    C_GIFT_206A_REMAIN: NZ(workData.round1EndRemaining),
    C_RET_206A_REMAIN: NZ(workData.stageC_206A_returnRemaining),
    C_FB_GEN_UNVISITED: NZ(workData.freshBagRound1EndRegular),
    C_FB_SOLO_UNVISITED: NZ(workData.freshBagRound1EndStandalone),
    
    // Stage D
    D_FB_GEN_INCREASE: NZ(freshBag?.added),
    D_GIFT_TOTAL_NOW: NZ(workData.round2TotalRemaining),
    D_RET_TOTAL_NOW: NZ(workData.round2TotalReturns),
    
    // Stage E
    E_GIFT_REMAIN: NZ(workData.round2EndRemaining),
    E_RET_REMAIN: NZ(workData.stageE_206A_returnRemaining),
    E_FB_203D_REMAIN: NZ(workData.stageE_unvisitedFB_solo_203D),
    
    // Stage F
    F_FB_206A_REMAIN: NZ(workData.stageF_unvisitedFB_solo_206A),
    F_FB_GEN_REMAIN: NZ(freshBag?.undoneLinked),
    F_FB_SOLO_REMAIN: NZ(freshBag?.undoneSolo),
  };
}

// ================================
// Derived 계산 함수 (엑셀/넘버스 고정 수식)
// ================================
export function calculateDerived(s: RecordSourceInputs): RecordDerivedValues {
  // ========================
  // 1) 프레시백 할당(아침 기준)
  // ========================
  const FB_TOTAL_ASSIGNED = s.A_FB_GEN + s.A_FB_SOLO;
  const FB_206A_ASSIGNED = s.A_FB_206A;
  const FB_203D_ASSIGNED = FB_TOTAL_ASSIGNED - FB_206A_ASSIGNED;
  
  // ========================
  // 2) 1회전 기프트 라우트별 할당
  // ========================
  const GIFT_R1_DONE_TOTAL = s.A_GIFT_R1_TOTAL - s.B_GIFT_TOTAL_REMAIN;
  const GIFT_R1_203D_ASSIGNED = GIFT_R1_DONE_TOTAL + s.B_GIFT_203D_REMAIN;
  const GIFT_R1_206A_ASSIGNED = s.A_GIFT_R1_TOTAL - GIFT_R1_203D_ASSIGNED;
  
  // ========================
  // 3) 1회전 종료 시점 '전체 잔여'
  // ========================
  const GIFT_R1_REMAIN_TOTAL = s.C_GIFT_206A_REMAIN + s.B_GIFT_203D_REMAIN;
  
  // ========================
  // 4) 2회전 신규 기프트 (★ 지시서 정식 수식)
  // GIFT_R2_NEW_TOTAL = D_GIFT_TOTAL_NOW - (B_GIFT_203D_REMAIN + C_GIFT_206A_REMAIN)
  // ========================
  const GIFT_R1_REMAIN_TOTAL_FOR_R2 = s.B_GIFT_203D_REMAIN + s.C_GIFT_206A_REMAIN;
  const GIFT_R2_NEW_TOTAL = Math.max(0, s.D_GIFT_TOTAL_NOW - GIFT_R1_REMAIN_TOTAL_FOR_R2);
  const GIFT_R2_NEW_206A = Math.max(0, s.E_GIFT_REMAIN - s.C_GIFT_206A_REMAIN);
  const GIFT_R2_NEW_203D = Math.max(0, GIFT_R2_NEW_TOTAL - GIFT_R2_NEW_206A);
  
  // ========================
  // 5) 하루(1+2회전) 기프트 합계 및 비율
  // ========================
  const GIFT_DAY_TOTAL = s.A_GIFT_R1_TOTAL + GIFT_R2_NEW_TOTAL;
  const GIFT_DAY_203D = GIFT_R1_203D_ASSIGNED + GIFT_R2_NEW_203D;
  const GIFT_DAY_206A = GIFT_R1_206A_ASSIGNED + GIFT_R2_NEW_206A;
  
  const GIFT_RATE_203D = GIFT_DAY_TOTAL > 0 ? GIFT_DAY_203D / GIFT_DAY_TOTAL : 0;
  const GIFT_RATE_206A = GIFT_DAY_TOTAL > 0 ? GIFT_DAY_206A / GIFT_DAY_TOTAL : 0;
  
  // ========================
  // 6) 1회전 반품 라우트별 할당
  // ========================
  const RET_R1_206A_ASSIGNED = s.B_RET_206A_ASSIGNED;
  const RET_R1_203D_ASSIGNED = s.A_RET_R1_TOTAL - RET_R1_206A_ASSIGNED;
  
  // ========================
  // 7) 1회전 종료 반품 잔여
  // ========================
  const RET_R1_REMAIN_TOTAL = s.B_RET_203D_UNVISITED + s.C_RET_206A_REMAIN;
  
  // ========================
  // 8) 2회전 신규 반품
  // ========================
  const RET_R2_NEW_TOTAL = Math.max(0, s.D_RET_TOTAL_NOW - RET_R1_REMAIN_TOTAL);
  const RET_R2_NEW_206A = Math.max(0, s.E_RET_REMAIN - s.C_RET_206A_REMAIN);
  const RET_R2_NEW_203D = Math.max(0, RET_R2_NEW_TOTAL - RET_R2_NEW_206A);
  
  // ========================
  // 9) 하루(1+2회전) 반품 합계 및 비율
  // ========================
  const RET_DAY_203D = RET_R1_203D_ASSIGNED + RET_R2_NEW_203D;
  const RET_DAY_206A = RET_R1_206A_ASSIGNED + RET_R2_NEW_206A;
  const RET_DAY_TOTAL = RET_DAY_203D + RET_DAY_206A;
  
  const RET_RATE_203D = RET_DAY_TOTAL > 0 ? RET_DAY_203D / RET_DAY_TOTAL : 0;
  const RET_RATE_206A = RET_DAY_TOTAL > 0 ? RET_DAY_206A / RET_DAY_TOTAL : 0;
  
  // ========================
  // 10) 프레시백 회수율
  // ========================
  // 203D 프레시백 (Stage E에서 확정)
  const FB_203D_UNCOLLECTED = s.E_FB_203D_REMAIN;
  const FB_203D_COLLECTED = Math.max(0, FB_203D_ASSIGNED - FB_203D_UNCOLLECTED);
  const FB_203D_RATE = FB_203D_ASSIGNED > 0 
    ? FB_203D_COLLECTED / FB_203D_ASSIGNED 
    : 0;
  
  // 206A 프레시백 (Stage F에서 확정)
  const FB_206A_UNCOLLECTED = s.F_FB_206A_REMAIN;
  const FB_206A_COLLECTED = Math.max(0, FB_206A_ASSIGNED - FB_206A_UNCOLLECTED);
  const FB_206A_RATE = FB_206A_ASSIGNED > 0 
    ? FB_206A_COLLECTED / FB_206A_ASSIGNED 
    : 0;
  
  // 일반 프레시백 회수율 (Stage F에서 확정)
  // 할당 = A + D 증가분
  const FB_GEN_ASSIGNED = s.A_FB_GEN + s.D_FB_GEN_INCREASE;
  const FB_GEN_UNCOLLECTED = s.F_FB_GEN_REMAIN;
  const FB_GEN_COLLECTED = Math.max(0, FB_GEN_ASSIGNED - FB_GEN_UNCOLLECTED);
  const FB_GEN_RATE = FB_GEN_ASSIGNED > 0 
    ? FB_GEN_COLLECTED / FB_GEN_ASSIGNED 
    : 0;
  
  // 단독 프레시백 회수율
  // 미회수 = E_203D잔여(단독취급) + F_단독미방문
  const FB_SOLO_ASSIGNED = s.A_FB_SOLO;
  const FB_SOLO_UNCOLLECTED = s.E_FB_203D_REMAIN + s.F_FB_SOLO_REMAIN;
  const FB_SOLO_COLLECTED = Math.max(0, FB_SOLO_ASSIGNED - FB_SOLO_UNCOLLECTED);
  const FB_SOLO_RATE = FB_SOLO_ASSIGNED > 0 
    ? FB_SOLO_COLLECTED / FB_SOLO_ASSIGNED 
    : 0;
  
  // ========================
  // 11) 수입 계산
  // ========================
  // 기프트 수입 (라우트별)
  const INCOME_GIFT_203D = GIFT_DAY_203D * RATE_203D;
  const INCOME_GIFT_206A = GIFT_DAY_206A * RATE_206A;
  const INCOME_GIFT = INCOME_GIFT_203D + INCOME_GIFT_206A;
  
  // 반품 수입 (라우트별)
  const INCOME_RET_203D = RET_DAY_203D * RATE_203D;
  const INCOME_RET_206A = RET_DAY_206A * RATE_206A;
  const INCOME_RET = INCOME_RET_203D + INCOME_RET_206A;
  
  // 프레시백 수입 (할당 기준)
  const INCOME_FB_GEN = s.A_FB_GEN * FB_GEN_UNIT;
  const INCOME_FB_SOLO = s.A_FB_SOLO * FB_SOLO_UNIT;
  const INCOME_FB_ASSIGNED = INCOME_FB_GEN + INCOME_FB_SOLO;
  
  // 프레시백 차감 (미회수 확정만)
  const INCOME_FB_DEDUCT_GEN = s.F_FB_GEN_REMAIN * FB_GEN_UNIT;
  const INCOME_FB_DEDUCT_SOLO = (s.E_FB_203D_REMAIN + s.F_FB_SOLO_REMAIN) * FB_SOLO_UNIT;
  const INCOME_FB_DEDUCT = INCOME_FB_DEDUCT_GEN + INCOME_FB_DEDUCT_SOLO;
  
  // 오늘 예상 수입 기본값
  const TODAY_EST_INCOME_BASE = INCOME_GIFT + INCOME_RET + INCOME_FB_ASSIGNED - INCOME_FB_DEDUCT;
  
  return {
    FB_TOTAL_ASSIGNED,
    FB_206A_ASSIGNED,
    FB_203D_ASSIGNED,
    GIFT_R1_DONE_TOTAL,
    GIFT_R1_203D_ASSIGNED,
    GIFT_R1_206A_ASSIGNED,
    GIFT_R1_REMAIN_TOTAL,
    GIFT_R2_NEW_TOTAL,
    GIFT_R2_NEW_206A,
    GIFT_R2_NEW_203D,
    GIFT_DAY_TOTAL,
    GIFT_DAY_203D,
    GIFT_DAY_206A,
    GIFT_RATE_203D,
    GIFT_RATE_206A,
    RET_R1_206A_ASSIGNED,
    RET_R1_203D_ASSIGNED,
    RET_R1_REMAIN_TOTAL,
    RET_R2_NEW_TOTAL,
    RET_R2_NEW_206A,
    RET_R2_NEW_203D,
    RET_DAY_203D,
    RET_DAY_206A,
    RET_DAY_TOTAL,
    RET_RATE_203D,
    RET_RATE_206A,
    FB_203D_COLLECTED,
    FB_203D_UNCOLLECTED,
    FB_203D_RATE,
    FB_206A_COLLECTED,
    FB_206A_UNCOLLECTED,
    FB_206A_RATE,
    FB_GEN_ASSIGNED,
    FB_GEN_COLLECTED,
    FB_GEN_UNCOLLECTED,
    FB_GEN_RATE,
    FB_SOLO_ASSIGNED,
    FB_SOLO_COLLECTED,
    FB_SOLO_UNCOLLECTED,
    FB_SOLO_RATE,
    INCOME_GIFT_203D,
    INCOME_GIFT_206A,
    INCOME_GIFT,
    INCOME_RET_203D,
    INCOME_RET_206A,
    INCOME_RET,
    INCOME_FB_GEN,
    INCOME_FB_SOLO,
    INCOME_FB_ASSIGNED,
    INCOME_FB_DEDUCT_GEN,
    INCOME_FB_DEDUCT_SOLO,
    INCOME_FB_DEDUCT,
    TODAY_EST_INCOME_BASE,
  };
}

// ================================
// TodayWorkData에서 직접 계산하는 편의 함수
// ================================
export function calculateFromWorkData(workData: TodayWorkData): {
  sources: RecordSourceInputs;
  derived: RecordDerivedValues;
} {
  const sources = extractSourceInputs(workData);
  const derived = calculateDerived(sources);
  return { sources, derived };
}

// ================================
// 비율 포맷팅 (소수점 2자리)
// ================================
export function formatRate(rate: number): string {
  return (rate * 100).toFixed(2);
}

// ================================
// 금액 포맷팅
// ================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원';
}
