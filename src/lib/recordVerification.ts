/**
 * 기록탭 계산 검증 테스트
 * 
 * 지시서에 명시된 예시 입력값으로 결과 검증
 * 
 * Stage A: 일반20, 단독90, 206A_FB30, 1R기프트230, 1R반품30
 * Stage B: 203D_FB미방문5, 203D기프트잔여2, 기프트잔여전체108, 203D반품미방문1, 206A반품할당10
 * Stage C: 206A기프트잔여50, 206A반품잔여4, 일반FB미방문10, 단독FB미방문20
 * Stage D: 일반FB증가2, 2R기프트195, 2R반품7
 * Stage E: 기프트잔여90, 반품잔여5, 203D_FB잔여3
 * Stage F: 206A_FB미방문2, 일반FB미방문0, 단독FB미방문8
 * 
 * 예상 결과 (지시서 기준):
 * - 203D FB 할당=80
 * - 1R 203D 기프트=124, 1R 206A 기프트=106
 * - 1R 203D 반품=20, 1R 206A 반품=10
 * - 2R 203D 신규 기프트=103, 2R 206A 신규 기프트=40
 * - 오늘 기프트 합계=373, 오늘 203D 기프트=227, 오늘 206A 기프트=146
 * - 2R 203D 신규 반품=1, 2R 206A 신규 반품=1
 * - 오늘 반품 합계=32, 오늘 203D 반품=21, 오늘 206A 반품=11
 * - 203D 기프트비중=60.85%, 206A 기프트비중=39.14%
 * - 203D 반품비중=65.62%, 206A 반품비중=34.37%
 * - 203D FB 회수율=96.25%
 * - 206A FB 회수율=93.33%, 일반 FB 회수율=100%, 단독 FB 회수율=87.78%
 */

import { RecordSourceInputs, calculateDerived, formatRate } from './recordDerived';

export function runVerificationTest(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;
  
  // 테스트 입력값
  const testInputs: RecordSourceInputs = {
    // Stage A
    A_FB_GEN: 20,
    A_FB_SOLO: 90,
    A_FB_206A: 30,
    A_GIFT_R1_TOTAL: 230,
    A_RET_R1_TOTAL: 30,
    
    // Stage B
    B_FB_203D_UNVISITED: 5,
    B_GIFT_203D_REMAIN: 2,
    B_GIFT_TOTAL_REMAIN: 108,
    B_RET_203D_UNVISITED: 1,
    B_RET_206A_ASSIGNED: 10,
    
    // Stage C
    C_GIFT_206A_REMAIN: 50,
    C_RET_206A_REMAIN: 4,
    C_FB_GEN_UNVISITED: 10,
    C_FB_SOLO_UNVISITED: 20,
    
    // Stage D
    D_FB_GEN_INCREASE: 2,
    D_GIFT_TOTAL_NOW: 195,
    D_RET_TOTAL_NOW: 7,
    
    // Stage E
    E_GIFT_REMAIN: 90,
    E_RET_REMAIN: 5,
    E_FB_203D_REMAIN: 3,
    
    // Stage F
    F_FB_206A_REMAIN: 2,
    F_FB_GEN_REMAIN: 0,
    F_FB_SOLO_REMAIN: 8,
  };
  
  // 계산 실행
  const derived = calculateDerived(testInputs);
  
  // 검증 함수
  const check = (name: string, actual: number, expected: number, isRate = false) => {
    const passed = isRate 
      ? Math.abs(actual - expected) < 0.01  // 비율은 1% 오차 허용
      : actual === expected;
    
    const actualStr = isRate ? formatRate(actual) + '%' : String(actual);
    const expectedStr = isRate ? expected.toFixed(2) + '%' : String(expected);
    
    if (!passed) {
      allPassed = false;
      results.push(`❌ ${name}: ${actualStr} (예상: ${expectedStr})`);
    } else {
      results.push(`✅ ${name}: ${actualStr}`);
    }
  };
  
  // 검증 실행
  results.push('=== 프레시백 할당 ===');
  check('203D FB 할당', derived.FB_203D_ASSIGNED, 80);
  
  results.push('\n=== 1회전 기프트 ===');
  check('1R 203D 기프트', derived.GIFT_R1_203D_ASSIGNED, 124);
  check('1R 206A 기프트', derived.GIFT_R1_206A_ASSIGNED, 106);
  
  results.push('\n=== 1회전 반품 ===');
  check('1R 203D 반품', derived.RET_R1_203D_ASSIGNED, 20);
  check('1R 206A 반품', derived.RET_R1_206A_ASSIGNED, 10);
  
  results.push('\n=== 2회전 신규 기프트 ===');
  // 지시서 수식: D_2R기프트 - (B_203D잔여 + C_206A잔여) = 195 - (2+50) = 143
  check('2R 신규 기프트 전체', derived.GIFT_R2_NEW_TOTAL, 143);
  check('2R 203D 신규 기프트', derived.GIFT_R2_NEW_203D, 103);  // 143 - 40 = 103
  check('2R 206A 신규 기프트', derived.GIFT_R2_NEW_206A, 40);   // 90 - 50 = 40
  
  results.push('\n=== 오늘 기프트 합계 ===');
  check('오늘 기프트 합계', derived.GIFT_DAY_TOTAL, 373);  // 230 + 143 = 373
  check('오늘 203D 기프트', derived.GIFT_DAY_203D, 227);   // 124 + 103 = 227
  check('오늘 206A 기프트', derived.GIFT_DAY_206A, 146);   // 106 + 40 = 146
  
  results.push('\n=== 2회전 신규 반품 ===');
  check('2R 신규 반품 전체', derived.RET_R2_NEW_TOTAL, 2);   // 7 - (1+4) = 2
  check('2R 203D 신규 반품', derived.RET_R2_NEW_203D, 1);    // 2 - 1 = 1
  check('2R 206A 신규 반품', derived.RET_R2_NEW_206A, 1);    // 5 - 4 = 1
  
  results.push('\n=== 오늘 반품 합계 ===');
  check('오늘 반품 합계', derived.RET_DAY_TOTAL, 32);   // 30 + 2 = 32
  check('오늘 203D 반품', derived.RET_DAY_203D, 21);    // 20 + 1 = 21
  check('오늘 206A 반품', derived.RET_DAY_206A, 11);    // 10 + 1 = 11
  
  results.push('\n=== 기프트 비중 ===');
  check('203D 기프트비중', derived.GIFT_RATE_203D, 0.6085, true);  // 227/373 = 60.85%
  check('206A 기프트비중', derived.GIFT_RATE_206A, 0.3914, true);  // 146/373 = 39.14%
  
  results.push('\n=== 반품 비중 ===');
  check('203D 반품비중', derived.RET_RATE_203D, 0.6562, true);  // 21/32 = 65.62%
  check('206A 반품비중', derived.RET_RATE_206A, 0.3437, true);  // 11/32 = 34.38%
  
  results.push('\n=== 프레시백 회수율 ===');
  check('203D FB 회수율', derived.FB_203D_RATE, 0.9625, true);  // (80-3)/80 = 96.25%
  check('206A FB 회수율', derived.FB_206A_RATE, 0.9333, true);  // (30-2)/30 = 93.33%
  check('일반 FB 회수율', derived.FB_GEN_RATE, 1.0, true);      // (22-0)/22 = 100%
  check('단독 FB 회수율', derived.FB_SOLO_RATE, 0.8778, true);  // (90-11)/90 = 87.78%
  
  return { passed: allPassed, results };
}

// 콘솔에서 테스트 실행
if (typeof window !== 'undefined') {
  (window as any).runRecordVerificationTest = runVerificationTest;
}
