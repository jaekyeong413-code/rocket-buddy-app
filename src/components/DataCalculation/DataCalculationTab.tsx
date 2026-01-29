/**
 * 데이터 계산 탭 (ReadOnly Derived 값 표시)
 * 
 * 이 탭은 엑셀의 "수식 셀 영역"과 동일한 역할
 * - 모든 값은 ReadOnly (편집 불가)
 * - Input 탭 Source 값이 바뀌면 즉시 재계산되어 반영
 */

import { Calculator, Table, TrendingUp, Truck, Package, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { 
  extractUnifiedSourceInputs, 
  calculateUnifiedDerived,
  RATE_203D,
  RATE_206A,
  FB_GEN_UNIT,
  FB_SOLO_UNIT,
} from '@/lib/unifiedCalculations';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DataCalculationTab() {
  const { getWorkData, getCurrentInputDate } = useStore();
  
  // 현재 입력 날짜
  const date = getCurrentInputDate();
  const workData = getWorkData(date);
  
  // 통합 엑셀식 계산
  const sources = extractUnifiedSourceInputs(workData);
  const derived = calculateUnifiedDerived(sources);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-4 border border-primary/30">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-primary">데이터 계산 (엑셀/넘버스식)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          모든 Derived 값은 ReadOnly - Source 입력만으로 실시간 계산
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
              {/* Stage A */}
              <TableRow><TableCell className="font-medium text-primary">A</TableCell><TableCell className="font-mono text-xs">A_FB_GEN</TableCell><TableCell className="text-xs text-muted-foreground">일반 프레시백</TableCell><TableCell className="text-right font-bold">{sources.A_FB_GEN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">A</TableCell><TableCell className="font-mono text-xs">A_FB_SOLO</TableCell><TableCell className="text-xs text-muted-foreground">단독 프레시백</TableCell><TableCell className="text-right font-bold">{sources.A_FB_SOLO}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">A</TableCell><TableCell className="font-mono text-xs">A_FB_206A</TableCell><TableCell className="text-xs text-muted-foreground">206A 프레시백</TableCell><TableCell className="text-right font-bold">{sources.A_FB_206A}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">A</TableCell><TableCell className="font-mono text-xs">A_GIFT_R1_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">1회전 기프트 전체</TableCell><TableCell className="text-right font-bold">{sources.A_GIFT_R1_TOTAL}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">A</TableCell><TableCell className="font-mono text-xs">A_RET_R1_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">1회전 반품 전체</TableCell><TableCell className="text-right font-bold">{sources.A_RET_R1_TOTAL}</TableCell></TableRow>
              {/* Stage B */}
              <TableRow><TableCell className="font-medium text-primary">B</TableCell><TableCell className="font-mono text-xs">B_FB_203D_UNVISITED</TableCell><TableCell className="text-xs text-muted-foreground">203D FB 미방문</TableCell><TableCell className="text-right font-bold">{sources.B_FB_203D_UNVISITED}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">B</TableCell><TableCell className="font-mono text-xs">B_GIFT_203D_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">203D 기프트 잔여</TableCell><TableCell className="text-right font-bold">{sources.B_GIFT_203D_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">B</TableCell><TableCell className="font-mono text-xs">B_GIFT_TOTAL_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">전체 기프트 잔여</TableCell><TableCell className="text-right font-bold">{sources.B_GIFT_TOTAL_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">B</TableCell><TableCell className="font-mono text-xs">B_RET_203D_UNVISITED</TableCell><TableCell className="text-xs text-muted-foreground">203D 반품 잔여</TableCell><TableCell className="text-right font-bold">{sources.B_RET_203D_UNVISITED}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">B</TableCell><TableCell className="font-mono text-xs">B_RET_206A_UNVISITED</TableCell><TableCell className="text-xs text-muted-foreground">206A 1회전 반품 할당</TableCell><TableCell className="text-right font-bold">{sources.B_RET_206A_UNVISITED}</TableCell></TableRow>
              {/* Stage C */}
              <TableRow><TableCell className="font-medium text-primary">C</TableCell><TableCell className="font-mono text-xs">C_GIFT_206A_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">206A 기프트 잔여</TableCell><TableCell className="text-right font-bold">{sources.C_GIFT_206A_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">C</TableCell><TableCell className="font-mono text-xs">C_RET_206A_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">206A 반품 잔여</TableCell><TableCell className="text-right font-bold">{sources.C_RET_206A_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">C</TableCell><TableCell className="font-mono text-xs">C_FB_GEN_UNVISITED</TableCell><TableCell className="text-xs text-muted-foreground">일반 FB 미방문</TableCell><TableCell className="text-right font-bold">{sources.C_FB_GEN_UNVISITED}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">C</TableCell><TableCell className="font-mono text-xs">C_FB_SOLO_UNVISITED</TableCell><TableCell className="text-xs text-muted-foreground">단독 FB 미방문</TableCell><TableCell className="text-right font-bold">{sources.C_FB_SOLO_UNVISITED}</TableCell></TableRow>
              {/* Stage D */}
              <TableRow><TableCell className="font-medium text-primary">D</TableCell><TableCell className="font-mono text-xs">D_FB_GEN_INCREASE</TableCell><TableCell className="text-xs text-muted-foreground">일반 FB 증가분</TableCell><TableCell className="text-right font-bold">{sources.D_FB_GEN_INCREASE}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">D</TableCell><TableCell className="font-mono text-xs">D_GIFT_TOTAL_NOW</TableCell><TableCell className="text-xs text-muted-foreground">현재 전체 기프트</TableCell><TableCell className="text-right font-bold">{sources.D_GIFT_TOTAL_NOW}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">D</TableCell><TableCell className="font-mono text-xs">D_RET_TOTAL_NOW</TableCell><TableCell className="text-xs text-muted-foreground">현재 전체 반품</TableCell><TableCell className="text-right font-bold">{sources.D_RET_TOTAL_NOW}</TableCell></TableRow>
              {/* Stage E */}
              <TableRow><TableCell className="font-medium text-primary">E</TableCell><TableCell className="font-mono text-xs">E_GIFT_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">기프트 잔여 (=206A)</TableCell><TableCell className="text-right font-bold">{sources.E_GIFT_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">E</TableCell><TableCell className="font-mono text-xs">E_RET_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">반품 잔여 (=206A)</TableCell><TableCell className="text-right font-bold">{sources.E_RET_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">E</TableCell><TableCell className="font-mono text-xs">E_FB_203D_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">203D FB 잔여 (미회수)</TableCell><TableCell className="text-right font-bold">{sources.E_FB_203D_REMAIN}</TableCell></TableRow>
              {/* Stage F */}
              <TableRow><TableCell className="font-medium text-primary">F</TableCell><TableCell className="font-mono text-xs">F_FB_206A_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">206A FB 잔여 (미회수)</TableCell><TableCell className="text-right font-bold">{sources.F_FB_206A_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">F</TableCell><TableCell className="font-mono text-xs">F_FB_GEN_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">일반 FB 미방문</TableCell><TableCell className="text-right font-bold">{sources.F_FB_GEN_REMAIN}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-primary">F</TableCell><TableCell className="font-mono text-xs">F_FB_SOLO_REMAIN</TableCell><TableCell className="text-xs text-muted-foreground">단독 FB 미방문</TableCell><TableCell className="text-right font-bold">{sources.F_FB_SOLO_REMAIN}</TableCell></TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* 기프트 Derived */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">기프트 Derived</h3>
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
              <TableRow><TableCell className="font-mono text-xs">GIFT_R1_DONE_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">A_GIFT_R1_TOTAL - B_GIFT_TOTAL_REMAIN</TableCell><TableCell className="text-right font-bold">{derived.GIFT_R1_DONE_TOTAL}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">GIFT_R1_203D_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">GIFT_R1_DONE_TOTAL + B_GIFT_203D_REMAIN</TableCell><TableCell className="text-right font-bold">{derived.GIFT_R1_203D_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">GIFT_R1_206A_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">A_GIFT_R1_TOTAL - GIFT_R1_203D_ASSIGNED</TableCell><TableCell className="text-right font-bold">{derived.GIFT_R1_206A_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">GIFT_R1_REMAIN_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">C_GIFT_206A_REMAIN + B_GIFT_203D_REMAIN</TableCell><TableCell className="text-right font-bold">{derived.GIFT_R1_REMAIN_TOTAL}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">GIFT_R2_NEW_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">D_GIFT_TOTAL_NOW - GIFT_R1_REMAIN_TOTAL</TableCell><TableCell className="text-right font-bold">{derived.GIFT_R2_NEW_TOTAL}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">GIFT_R2_NEW_206A</TableCell><TableCell className="text-xs text-muted-foreground">E_GIFT_REMAIN - C_GIFT_206A_REMAIN</TableCell><TableCell className="text-right font-bold">{derived.GIFT_R2_NEW_206A}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">GIFT_R2_NEW_203D</TableCell><TableCell className="text-xs text-muted-foreground">GIFT_R2_NEW_TOTAL - GIFT_R2_NEW_206A</TableCell><TableCell className="text-right font-bold">{derived.GIFT_R2_NEW_203D}</TableCell></TableRow>
              <TableRow className="bg-success/5"><TableCell className="font-mono text-xs font-semibold">GIFT_DAY_203D</TableCell><TableCell className="text-xs text-muted-foreground">R1_203D + R2_NEW_203D</TableCell><TableCell className="text-right font-bold text-success text-lg">{derived.GIFT_DAY_203D}</TableCell></TableRow>
              <TableRow className="bg-success/5"><TableCell className="font-mono text-xs font-semibold">GIFT_DAY_206A</TableCell><TableCell className="text-xs text-muted-foreground">R1_206A + R2_NEW_206A</TableCell><TableCell className="text-right font-bold text-success text-lg">{derived.GIFT_DAY_206A}</TableCell></TableRow>
              <TableRow className="bg-success/10"><TableCell className="font-mono text-xs font-semibold">GIFT_DAY_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">A_GIFT_R1_TOTAL + GIFT_R2_NEW_TOTAL</TableCell><TableCell className="text-right font-bold text-success text-lg">{derived.GIFT_DAY_TOTAL}</TableCell></TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* 반품 Derived */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-warning/30">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-warning" />
          <h3 className="text-base font-semibold text-warning">반품 Derived</h3>
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
              <TableRow><TableCell className="font-mono text-xs">RET_R1_206A_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">= B_RET_206A_UNVISITED</TableCell><TableCell className="text-right font-bold">{derived.RET_R1_206A_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">RET_R1_203D_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">A_RET_R1_TOTAL - RET_R1_206A_ASSIGNED</TableCell><TableCell className="text-right font-bold">{derived.RET_R1_203D_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">RET_R1_REMAIN_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">B_RET_203D_UNVISITED + C_RET_206A_REMAIN</TableCell><TableCell className="text-right font-bold">{derived.RET_R1_REMAIN_TOTAL}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">RET_R2_NEW_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">D_RET_TOTAL_NOW - RET_R1_REMAIN_TOTAL</TableCell><TableCell className="text-right font-bold">{derived.RET_R2_NEW_TOTAL}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">RET_R2_NEW_206A</TableCell><TableCell className="text-xs text-muted-foreground">E_RET_REMAIN - C_RET_206A_REMAIN</TableCell><TableCell className="text-right font-bold">{derived.RET_R2_NEW_206A}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">RET_R2_NEW_203D</TableCell><TableCell className="text-xs text-muted-foreground">RET_R2_NEW_TOTAL - RET_R2_NEW_206A</TableCell><TableCell className="text-right font-bold">{derived.RET_R2_NEW_203D}</TableCell></TableRow>
              <TableRow className="bg-warning/5"><TableCell className="font-mono text-xs font-semibold">RET_DAY_203D</TableCell><TableCell className="text-xs text-muted-foreground">R1_203D + R2_NEW_203D</TableCell><TableCell className="text-right font-bold text-warning text-lg">{derived.RET_DAY_203D}</TableCell></TableRow>
              <TableRow className="bg-warning/5"><TableCell className="font-mono text-xs font-semibold">RET_DAY_206A</TableCell><TableCell className="text-xs text-muted-foreground">R1_206A + R2_NEW_206A</TableCell><TableCell className="text-right font-bold text-warning text-lg">{derived.RET_DAY_206A}</TableCell></TableRow>
              <TableRow className="bg-warning/10"><TableCell className="font-mono text-xs font-semibold">RET_DAY_TOTAL</TableCell><TableCell className="text-xs text-muted-foreground">RET_DAY_203D + RET_DAY_206A</TableCell><TableCell className="text-right font-bold text-warning text-lg">{derived.RET_DAY_TOTAL}</TableCell></TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* 프레시백 Derived */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-success" />
          <h3 className="text-base font-semibold text-success">프레시백 Derived</h3>
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
              <TableRow><TableCell className="font-mono text-xs">FB_TOTAL_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">A_FB_GEN + A_FB_SOLO</TableCell><TableCell className="text-right font-bold">{derived.FB_TOTAL_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_206A_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">= A_FB_206A</TableCell><TableCell className="text-right font-bold">{derived.FB_206A_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_203D_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">FB_TOTAL - FB_206A</TableCell><TableCell className="text-right font-bold">{derived.FB_203D_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_GEN_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">A_FB_GEN + D_FB_GEN_INCREASE</TableCell><TableCell className="text-right font-bold">{derived.FB_GEN_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_SOLO_ASSIGNED</TableCell><TableCell className="text-xs text-muted-foreground">= A_FB_SOLO</TableCell><TableCell className="text-right font-bold">{derived.FB_SOLO_ASSIGNED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_203D_UNCOLLECTED</TableCell><TableCell className="text-xs text-muted-foreground">= E_FB_203D_REMAIN</TableCell><TableCell className="text-right font-bold text-destructive">{derived.FB_203D_UNCOLLECTED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_206A_UNCOLLECTED</TableCell><TableCell className="text-xs text-muted-foreground">= F_FB_206A_REMAIN</TableCell><TableCell className="text-right font-bold text-destructive">{derived.FB_206A_UNCOLLECTED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_GEN_UNCOLLECTED</TableCell><TableCell className="text-xs text-muted-foreground">= F_FB_GEN_REMAIN</TableCell><TableCell className="text-right font-bold text-destructive">{derived.FB_GEN_UNCOLLECTED}</TableCell></TableRow>
              <TableRow><TableCell className="font-mono text-xs">FB_SOLO_UNCOLLECTED</TableCell><TableCell className="text-xs text-muted-foreground">E_FB_203D + F_FB_SOLO</TableCell><TableCell className="text-right font-bold text-destructive">{derived.FB_SOLO_UNCOLLECTED}</TableCell></TableRow>
              <TableRow className="bg-success/5"><TableCell className="font-mono text-xs font-semibold">FB_GEN_RATE</TableCell><TableCell className="text-xs text-muted-foreground">(할당-미회수)/할당</TableCell><TableCell className="text-right font-bold text-success">{(derived.FB_GEN_RATE * 100).toFixed(1)}%</TableCell></TableRow>
              <TableRow className="bg-success/5"><TableCell className="font-mono text-xs font-semibold">FB_SOLO_RATE</TableCell><TableCell className="text-xs text-muted-foreground">(할당-미회수)/할당</TableCell><TableCell className="text-right font-bold text-success">{(derived.FB_SOLO_RATE * 100).toFixed(1)}%</TableCell></TableRow>
            </TableBody>
          </UITable>
        </div>
      </div>

      {/* 수입 계산 */}
      <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">오늘 예상 수입 (Derived)</h3>
          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">ReadOnly</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">기프트 수입</span>
            <span className="text-xl font-bold text-success">{derived.INCOME_GIFT.toLocaleString()}원</span>
            <span className="text-xs text-muted-foreground block mt-1">
              203D:{derived.GIFT_DAY_203D}×{RATE_203D} + 206A:{derived.GIFT_DAY_206A}×{RATE_206A}
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">반품 수입</span>
            <span className="text-xl font-bold text-warning">{derived.INCOME_RET.toLocaleString()}원</span>
            <span className="text-xs text-muted-foreground block mt-1">
              203D:{derived.RET_DAY_203D}×{RATE_203D} + 206A:{derived.RET_DAY_206A}×{RATE_206A}
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">FB 할당 수입</span>
            <span className="text-xl font-bold text-success">{derived.INCOME_FB_ASSIGNED.toLocaleString()}원</span>
            <span className="text-xs text-muted-foreground block mt-1">
              일반:{sources.A_FB_GEN}×{FB_GEN_UNIT} + 단독:{sources.A_FB_SOLO}×{FB_SOLO_UNIT}
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl text-center shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">FB 차감</span>
            <span className="text-xl font-bold text-destructive">-{derived.INCOME_FB_DEDUCT.toLocaleString()}원</span>
            <span className="text-xs text-muted-foreground block mt-1">
              미회수 확정분만 차감
            </span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl text-center shadow-sm">
          <span className="text-sm text-muted-foreground block mb-1">TODAY_EST_INCOME_BASE</span>
          <span className="text-3xl font-bold text-primary">{derived.TODAY_EST_INCOME_BASE.toLocaleString()}원</span>
          <p className="text-xs text-muted-foreground mt-2">
            = INCOME_GIFT + INCOME_RET + INCOME_FB_ASSIGNED - INCOME_FB_DEDUCT
          </p>
        </div>
      </div>
    </div>
  );
}
