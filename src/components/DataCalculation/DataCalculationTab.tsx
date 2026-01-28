/**
 * 데이터 계산 탭 (ReadOnly Derived 값 표시)
 * 
 * 이 탭은 엑셀의 "수식 셀 영역"과 동일한 역할
 * - 모든 값은 ReadOnly (편집 불가)
 * - Input 탭 Source 값이 바뀌면 즉시 재계산되어 반영
 */

import { Calculator, Table, TrendingUp, Truck, Package, RotateCcw, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/calculations';
import { calculateGiftFromWorkData, extractGiftSourceInputs } from '@/lib/giftCalculations';
import { calculateReturnFromWorkData, extractReturnSourceInputs } from '@/lib/returnCalculations';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DataCalculationTab() {
  const { getWorkData, settings, getCurrentInputDate } = useStore();
  
  // 현재 입력 날짜
  const date = getCurrentInputDate();
  const workData = getWorkData(date);
  
  // 엑셀식 기프트 계산
  const giftSources = extractGiftSourceInputs(workData);
  const giftDerived = calculateGiftFromWorkData(workData);
  
  // 엑셀식 반품 계산
  const returnSources = extractReturnSourceInputs(workData);
  const returnDerived = calculateReturnFromWorkData(workData);
  
  // 단가
  const rate203D = settings.routes['203D'];
  const rate206A = settings.routes['206A'];
  
  // 기프트 수입 계산 (Derived * 단가)
  const giftIncome203D = giftDerived.GIFT_TOTAL_203D * rate203D;
  const giftIncome206A = giftDerived.GIFT_TOTAL_206A * rate206A;
  const giftIncomeTotal = giftIncome203D + giftIncome206A;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-4 border border-primary/30">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-primary">데이터 계산 (Derived)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          엑셀/넘버스식 실시간 계산 결과 (모든 값 ReadOnly)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          기준일: {date}
        </p>
      </div>

      {/* Source Input 요약 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/30">
        <div className="flex items-center gap-2 mb-4">
          <Table className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Source Input (원천값)</h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">입력탭에서 수정</span>
        </div>
        
        <div className="overflow-x-auto">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">변수</TableHead>
                <TableHead className="text-xs">설명</TableHead>
                <TableHead className="text-xs text-right">값</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-primary">A</TableCell>
                <TableCell className="font-mono text-xs">A_GIFT1_TOTAL</TableCell>
                <TableCell className="text-xs text-muted-foreground">1회전 할당 기프트 전체</TableCell>
                <TableCell className="text-right font-bold">{giftSources.A_GIFT1_TOTAL}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">B</TableCell>
                <TableCell className="font-mono text-xs">B_GIFT_REM_203D_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">203D 잔여 기프트</TableCell>
                <TableCell className="text-right font-bold">{giftSources.B_GIFT_REM_203D_R1}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">B</TableCell>
                <TableCell className="font-mono text-xs">B_GIFT_REM_TOT_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">전체 잔여 기프트</TableCell>
                <TableCell className="text-right font-bold">{giftSources.B_GIFT_REM_TOT_R1}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">C</TableCell>
                <TableCell className="font-mono text-xs">C_GIFT_REM_206A_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">206A 잔여 기프트 (선택)</TableCell>
                <TableCell className="text-right font-bold">{giftSources.C_GIFT_REM_206A_R1 ?? '(B에서 계산)'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">D</TableCell>
                <TableCell className="font-mono text-xs">D_GIFT_TOT_BEFORE_R2</TableCell>
                <TableCell className="text-xs text-muted-foreground">2회전 시작 전 전체</TableCell>
                <TableCell className="text-right font-bold">{giftSources.D_GIFT_TOT_BEFORE_R2}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">E</TableCell>
                <TableCell className="font-mono text-xs">E_GIFT_REM_TOT_AFTER_203D_R2</TableCell>
                <TableCell className="text-xs text-muted-foreground">203D 2회전 종료 후 잔여</TableCell>
                <TableCell className="text-right font-bold">{giftSources.E_GIFT_REM_TOT_AFTER_203D_R2}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* Derived 계산 결과 - 1회전 기프트 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">1차 기프트 (Derived)</h3>
          <span className="text-xs bg-success/10 px-2 py-0.5 rounded text-success">ReadOnly</span>
        </div>
        
        <div className="overflow-x-auto">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">변수</TableHead>
                <TableHead className="text-xs">수식</TableHead>
                <TableHead className="text-xs text-right">값</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">REM_206A_R1_FROM_B</TableCell>
                <TableCell className="text-xs text-muted-foreground">Btot - B203</TableCell>
                <TableCell className="text-right font-bold">{giftDerived.REM_206A_R1_FROM_B}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">REM_206A_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">C206 입력시 C206, 아니면 위 값</TableCell>
                <TableCell className="text-right font-bold text-primary">{giftDerived.REM_206A_R1}</TableCell>
              </TableRow>
              <TableRow className="bg-success/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT1_203D</TableCell>
                <TableCell className="text-xs text-muted-foreground">A1 - Btot + B203</TableCell>
                <TableCell className="text-right font-bold text-success text-lg">{giftDerived.GIFT1_203D}</TableCell>
              </TableRow>
              <TableRow className="bg-success/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT1_206A</TableCell>
                <TableCell className="text-xs text-muted-foreground">A1 - GIFT1_203D</TableCell>
                <TableCell className="text-right font-bold text-success text-lg">{giftDerived.GIFT1_206A}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* Derived 계산 결과 - 2회전 기프트 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold text-warning">2차 기프트 (Derived)</h3>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">ReadOnly</span>
        </div>
        
        <div className="overflow-x-auto">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">변수</TableHead>
                <TableHead className="text-xs">수식</TableHead>
                <TableHead className="text-xs text-right">값</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">GIFT2_NEW_TOTAL</TableCell>
                <TableCell className="text-xs text-muted-foreground">D2tot - Btot</TableCell>
                <TableCell className="text-right font-bold">{giftDerived.GIFT2_NEW_TOTAL}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">GIFT2_NEW_206A</TableCell>
                <TableCell className="text-xs text-muted-foreground">Erem - REM_206A_R1</TableCell>
                <TableCell className="text-right font-bold">{giftDerived.GIFT2_NEW_206A}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">GIFT2_NEW_203D</TableCell>
                <TableCell className="text-xs text-muted-foreground">GIFT2_NEW_TOTAL - GIFT2_NEW_206A</TableCell>
                <TableCell className="text-right font-bold">{giftDerived.GIFT2_NEW_203D}</TableCell>
              </TableRow>
              <TableRow className="bg-warning/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT2_203D</TableCell>
                <TableCell className="text-xs text-muted-foreground">= GIFT2_NEW_203D</TableCell>
                <TableCell className="text-right font-bold text-warning text-lg">{giftDerived.GIFT2_203D}</TableCell>
              </TableRow>
              <TableRow className="bg-warning/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT2_206A</TableCell>
                <TableCell className="text-xs text-muted-foreground">= GIFT2_NEW_206A</TableCell>
                <TableCell className="text-right font-bold text-warning text-lg">{giftDerived.GIFT2_206A}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* 기프트 하루 합계 */}
      <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">기프트 하루 합계 (Final)</h3>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">ReadOnly</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">203D 합계</span>
            <span className="text-2xl font-bold text-primary">{giftDerived.GIFT_TOTAL_203D}</span>
            <span className="text-xs text-muted-foreground block mt-1">
              × {rate203D}원 = {giftIncome203D.toLocaleString()}원
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">206A 합계</span>
            <span className="text-2xl font-bold text-success">{giftDerived.GIFT_TOTAL_206A}</span>
            <span className="text-xs text-muted-foreground block mt-1">
              × {rate206A}원 = {giftIncome206A.toLocaleString()}원
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">전체 합계</span>
            <span className="text-2xl font-bold">{giftDerived.GIFT_TOTAL_ALL}</span>
            <span className="text-xs text-muted-foreground block mt-1">
              = {giftIncomeTotal.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 수식 설명 */}
        <div className="bg-muted/50 p-3 rounded-xl">
          <p className="text-xs text-muted-foreground font-mono">
            GIFT_TOTAL_203D = GIFT1_203D({giftDerived.GIFT1_203D}) + GIFT2_203D({giftDerived.GIFT2_203D}) = {giftDerived.GIFT_TOTAL_203D}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            GIFT_TOTAL_206A = GIFT1_206A({giftDerived.GIFT1_206A}) + GIFT2_206A({giftDerived.GIFT2_206A}) = {giftDerived.GIFT_TOTAL_206A}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            GIFT_TOTAL_ALL = A1({giftDerived.A1}) + GIFT2_NEW_TOTAL({giftDerived.GIFT2_NEW_TOTAL}) = {giftDerived.GIFT_TOTAL_ALL}
          </p>
        </div>
      </div>

      {/* 반품 Source Input */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold">반품 Source Input</h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">입력탭에서 수정</span>
        </div>
        
        <div className="overflow-x-auto">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">변수</TableHead>
                <TableHead className="text-xs">설명</TableHead>
                <TableHead className="text-xs text-right">값</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-warning">A</TableCell>
                <TableCell className="font-mono text-xs">A_R1_RET_TOTAL</TableCell>
                <TableCell className="text-xs text-muted-foreground">1회전 반품 전체 할당</TableCell>
                <TableCell className="text-right font-bold">{returnSources.A_R1_RET_TOTAL}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-warning">B</TableCell>
                <TableCell className="font-mono text-xs">B_203_REM_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">203D 잔여(미방문) 반품</TableCell>
                <TableCell className="text-right font-bold">{returnSources.B_203_REM_R1}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-warning">B</TableCell>
                <TableCell className="font-mono text-xs">B_206_R1_ASSIGNED</TableCell>
                <TableCell className="text-xs text-muted-foreground">206A 1회전 반품 할당</TableCell>
                <TableCell className="text-right font-bold">{returnSources.B_206_R1_ASSIGNED}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-warning">C</TableCell>
                <TableCell className="font-mono text-xs">C_206_REM_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">206A 잔여(미방문) 반품</TableCell>
                <TableCell className="text-right font-bold">{returnSources.C_206_REM_R1}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-warning">D</TableCell>
                <TableCell className="font-mono text-xs">D_RET_TOTAL_NOW</TableCell>
                <TableCell className="text-xs text-muted-foreground">1회전잔여 + 2회전신규 반품</TableCell>
                <TableCell className="text-right font-bold">{returnSources.D_RET_TOTAL_NOW}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-warning">E</TableCell>
                <TableCell className="font-mono text-xs">E_206_REM_NOW</TableCell>
                <TableCell className="text-xs text-muted-foreground">현시점 206A 잔여 반품</TableCell>
                <TableCell className="text-right font-bold">{returnSources.E_206_REM_NOW}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* 반품 Derived 계산 결과 */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold text-warning">반품 라우트 분리 (Derived)</h3>
          <span className="text-xs bg-warning/10 px-2 py-0.5 rounded text-warning">ReadOnly</span>
        </div>
        
        <div className="overflow-x-auto">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">변수</TableHead>
                <TableHead className="text-xs">수식</TableHead>
                <TableHead className="text-xs text-right">값</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 1회전 할당 */}
              <TableRow>
                <TableCell className="font-mono text-xs">R1_203_ASSIGNED</TableCell>
                <TableCell className="text-xs text-muted-foreground">A_R1_RET_TOTAL - B_206_R1_ASSIGNED</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R1_203_ASSIGNED}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">R1_206_ASSIGNED</TableCell>
                <TableCell className="text-xs text-muted-foreground">B_206_R1_ASSIGNED</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R1_206_ASSIGNED}</TableCell>
              </TableRow>
              {/* 1회전 완료 */}
              <TableRow>
                <TableCell className="font-mono text-xs">R1_203_DONE</TableCell>
                <TableCell className="text-xs text-muted-foreground">R1_203_ASSIGNED - B_203_REM_R1</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R1_203_DONE}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">R1_206_DONE</TableCell>
                <TableCell className="text-xs text-muted-foreground">R1_206_ASSIGNED - C_206_REM_R1</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R1_206_DONE}</TableCell>
              </TableRow>
              {/* 1회전 잔여 합계 */}
              <TableRow>
                <TableCell className="font-mono text-xs">R1_REM_TOTAL</TableCell>
                <TableCell className="text-xs text-muted-foreground">B_203_REM_R1 + C_206_REM_R1</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R1_REM_TOTAL}</TableCell>
              </TableRow>
              {/* 2회전 신규 */}
              <TableRow>
                <TableCell className="font-mono text-xs">R2_NEW_TOTAL</TableCell>
                <TableCell className="text-xs text-muted-foreground">D_RET_TOTAL_NOW - R1_REM_TOTAL</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R2_NEW_TOTAL}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">R2_206_NEW</TableCell>
                <TableCell className="text-xs text-muted-foreground">E_206_REM_NOW - C_206_REM_R1</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R2_206_NEW}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">R2_203_NEW</TableCell>
                <TableCell className="text-xs text-muted-foreground">R2_NEW_TOTAL - R2_206_NEW</TableCell>
                <TableCell className="text-right font-bold">{returnDerived.R2_203_NEW}</TableCell>
              </TableRow>
              {/* 하루 총 할당 (수입 기준) */}
              <TableRow className="bg-warning/5">
                <TableCell className="font-mono text-xs font-semibold">DAY_203_ASSIGNED</TableCell>
                <TableCell className="text-xs text-muted-foreground">R1_203_ASSIGNED + R2_203_NEW</TableCell>
                <TableCell className="text-right font-bold text-warning text-lg">{returnDerived.DAY_203_ASSIGNED}</TableCell>
              </TableRow>
              <TableRow className="bg-warning/5">
                <TableCell className="font-mono text-xs font-semibold">DAY_206_ASSIGNED</TableCell>
                <TableCell className="text-xs text-muted-foreground">R1_206_ASSIGNED + R2_206_NEW</TableCell>
                <TableCell className="text-right font-bold text-warning text-lg">{returnDerived.DAY_206_ASSIGNED}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>

        {/* 반품 수입 */}
        <div className="mt-4 pt-4 border-t border-warning/20">
          <h4 className="text-sm font-medium mb-3">반품 수입 (할당 = 수입 기준, 라우트별 단가 적용)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 p-3 rounded-xl text-center">
              <span className="text-xs text-muted-foreground block mb-1">203D 반품</span>
              <span className="text-lg font-bold text-primary">{returnDerived.DAY_203_ASSIGNED}건</span>
              <span className="text-xs text-muted-foreground block mt-1">
                × {rate203D}원 = {returnDerived.RETURN_INCOME_203D.toLocaleString()}원
              </span>
            </div>
            <div className="bg-muted/50 p-3 rounded-xl text-center">
              <span className="text-xs text-muted-foreground block mb-1">206A 반품</span>
              <span className="text-lg font-bold text-success">{returnDerived.DAY_206_ASSIGNED}건</span>
              <span className="text-xs text-muted-foreground block mt-1">
                × {rate206A}원 = {returnDerived.RETURN_INCOME_206A.toLocaleString()}원
              </span>
            </div>
            <div className="bg-muted/50 p-3 rounded-xl text-center">
              <span className="text-xs text-muted-foreground block mb-1">반품 수입 합계</span>
              <span className="text-lg font-bold">{returnDerived.RETURN_INCOME_TOTAL.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 대시보드 연동 안내 */}
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-xs text-muted-foreground text-center">
          ※ 대시보드의 '오늘 예상 수입'은 위 GIFT_TOTAL, RETURN 값을 참조합니다.
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          ※ 입력탭에서 어떤 값을 변경하면 이 탭의 모든 Derived 값이 즉시 재계산됩니다.
        </p>
      </div>
    </div>
  );
}
