/**
 * 데이터 계산 탭 (ReadOnly Derived 값 표시)
 * 
 * 이 탭은 엑셀의 "수식 셀 영역"과 동일한 역할
 * - 모든 값은 ReadOnly (편집 불가)
 * - Input 탭 Source 값이 바뀌면 즉시 재계산되어 반영
 */

import { Calculator, Table, TrendingUp, Truck, Package } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/calculations';
import { calculateGiftFromWorkData, extractGiftSourceInputs, GiftDerivedValues } from '@/lib/giftCalculations';
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
  const sources = extractGiftSourceInputs(workData);
  const derived = calculateGiftFromWorkData(workData);
  
  // 단가
  const rate203D = settings.routes['203D'];
  const rate206A = settings.routes['206A'];
  
  // 수입 계산 (Derived * 단가)
  const income203D = derived.GIFT_TOTAL_203D * rate203D;
  const income206A = derived.GIFT_TOTAL_206A * rate206A;
  const incomeTotal = income203D + income206A;

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
                <TableCell className="text-right font-bold">{sources.A_GIFT1_TOTAL}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">B</TableCell>
                <TableCell className="font-mono text-xs">B_GIFT_REM_203D_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">203D 잔여 기프트</TableCell>
                <TableCell className="text-right font-bold">{sources.B_GIFT_REM_203D_R1}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">B</TableCell>
                <TableCell className="font-mono text-xs">B_GIFT_REM_TOT_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">전체 잔여 기프트</TableCell>
                <TableCell className="text-right font-bold">{sources.B_GIFT_REM_TOT_R1}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">C</TableCell>
                <TableCell className="font-mono text-xs">C_GIFT_REM_206A_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">206A 잔여 기프트 (선택)</TableCell>
                <TableCell className="text-right font-bold">{sources.C_GIFT_REM_206A_R1 ?? '(B에서 계산)'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">D</TableCell>
                <TableCell className="font-mono text-xs">D_GIFT_TOT_BEFORE_R2</TableCell>
                <TableCell className="text-xs text-muted-foreground">2회전 시작 전 전체</TableCell>
                <TableCell className="text-right font-bold">{sources.D_GIFT_TOT_BEFORE_R2}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-primary">E</TableCell>
                <TableCell className="font-mono text-xs">E_GIFT_REM_TOT_AFTER_203D_R2</TableCell>
                <TableCell className="text-xs text-muted-foreground">203D 2회전 종료 후 잔여</TableCell>
                <TableCell className="text-right font-bold">{sources.E_GIFT_REM_TOT_AFTER_203D_R2}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* Derived 계산 결과 - 1회전 */}
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
                <TableCell className="text-right font-bold">{derived.REM_206A_R1_FROM_B}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">REM_206A_R1</TableCell>
                <TableCell className="text-xs text-muted-foreground">C206 입력시 C206, 아니면 위 값</TableCell>
                <TableCell className="text-right font-bold text-primary">{derived.REM_206A_R1}</TableCell>
              </TableRow>
              <TableRow className="bg-success/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT1_203D</TableCell>
                <TableCell className="text-xs text-muted-foreground">A1 - Btot + B203</TableCell>
                <TableCell className="text-right font-bold text-success text-lg">{derived.GIFT1_203D}</TableCell>
              </TableRow>
              <TableRow className="bg-success/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT1_206A</TableCell>
                <TableCell className="text-xs text-muted-foreground">A1 - GIFT1_203D</TableCell>
                <TableCell className="text-right font-bold text-success text-lg">{derived.GIFT1_206A}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* Derived 계산 결과 - 2회전 */}
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
                <TableCell className="text-right font-bold">{derived.GIFT2_NEW_TOTAL}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">GIFT2_NEW_206A</TableCell>
                <TableCell className="text-xs text-muted-foreground">Erem - REM_206A_R1</TableCell>
                <TableCell className="text-right font-bold">{derived.GIFT2_NEW_206A}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">GIFT2_NEW_203D</TableCell>
                <TableCell className="text-xs text-muted-foreground">GIFT2_NEW_TOTAL - GIFT2_NEW_206A</TableCell>
                <TableCell className="text-right font-bold">{derived.GIFT2_NEW_203D}</TableCell>
              </TableRow>
              <TableRow className="bg-warning/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT2_203D</TableCell>
                <TableCell className="text-xs text-muted-foreground">= GIFT2_NEW_203D</TableCell>
                <TableCell className="text-right font-bold text-warning text-lg">{derived.GIFT2_203D}</TableCell>
              </TableRow>
              <TableRow className="bg-warning/5">
                <TableCell className="font-mono text-xs font-semibold">GIFT2_206A</TableCell>
                <TableCell className="text-xs text-muted-foreground">= GIFT2_NEW_206A</TableCell>
                <TableCell className="text-right font-bold text-warning text-lg">{derived.GIFT2_206A}</TableCell>
              </TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* 하루 합계 */}
      <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">하루 합계 (Final)</h3>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">ReadOnly</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">203D 합계</span>
            <span className="text-2xl font-bold text-primary">{derived.GIFT_TOTAL_203D}</span>
            <span className="text-xs text-muted-foreground block mt-1">
              × {rate203D}원 = {income203D.toLocaleString()}원
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">206A 합계</span>
            <span className="text-2xl font-bold text-success">{derived.GIFT_TOTAL_206A}</span>
            <span className="text-xs text-muted-foreground block mt-1">
              × {rate206A}원 = {income206A.toLocaleString()}원
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">전체 합계</span>
            <span className="text-2xl font-bold">{derived.GIFT_TOTAL_ALL}</span>
            <span className="text-xs text-muted-foreground block mt-1">
              = {incomeTotal.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 수식 설명 */}
        <div className="bg-muted/50 p-3 rounded-xl">
          <p className="text-xs text-muted-foreground font-mono">
            GIFT_TOTAL_203D = GIFT1_203D({derived.GIFT1_203D}) + GIFT2_203D({derived.GIFT2_203D}) = {derived.GIFT_TOTAL_203D}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            GIFT_TOTAL_206A = GIFT1_206A({derived.GIFT1_206A}) + GIFT2_206A({derived.GIFT2_206A}) = {derived.GIFT_TOTAL_206A}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            GIFT_TOTAL_ALL = A1({derived.A1}) + GIFT2_NEW_TOTAL({derived.GIFT2_NEW_TOTAL}) = {derived.GIFT_TOTAL_ALL}
          </p>
        </div>
      </div>

      {/* 대시보드 연동 안내 */}
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-xs text-muted-foreground text-center">
          ※ 대시보드의 '오늘 예상 수입(기프트 부분)'은 위 GIFT_TOTAL_203D, GIFT_TOTAL_206A 값을 참조합니다.
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          ※ 입력탭에서 어떤 값을 변경하면 이 탭의 모든 Derived 값이 즉시 재계산됩니다.
        </p>
      </div>
    </div>
  );
}
