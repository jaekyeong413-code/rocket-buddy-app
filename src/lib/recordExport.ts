/**
 * 기록 내보내기/가져오기 모듈
 * 
 * JSON, CSV 형식 지원
 * 서버 없이 파일 기반 공유/백업
 */

import { TodayWorkData } from '@/types';
import { RecordSourceInputs, RecordDerivedValues, extractSourceInputs, calculateDerived, formatRate } from './recordDerived';
import { DraftData, getAllDrafts } from './storage';

// ================================
// 내보내기용 레코드 타입
// ================================
export interface ExportRecord {
  date: string;
  updatedAt: string;
  sources: RecordSourceInputs;
  derived: RecordDerivedValues;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  records: ExportRecord[];
}

// ================================
// TodayWorkData → ExportRecord 변환
// ================================
export function toExportRecord(workData: TodayWorkData, updatedAt?: string): ExportRecord {
  const sources = extractSourceInputs(workData);
  const derived = calculateDerived(sources);
  
  return {
    date: workData.date,
    updatedAt: updatedAt || new Date().toISOString(),
    sources,
    derived,
  };
}

// ================================
// JSON 내보내기
// ================================
export function exportToJSON(records: ExportRecord[]): string {
  const data: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    records,
  };
  
  return JSON.stringify(data, null, 2);
}

// ================================
// CSV 내보내기 (일자별 요약)
// ================================
export function exportToCSV(records: ExportRecord[]): string {
  const headers = [
    '날짜',
    '기프트_합계',
    '기프트_203D',
    '기프트_206A',
    '기프트_203D비중(%)',
    '기프트_206A비중(%)',
    '반품_합계',
    '반품_203D',
    '반품_206A',
    '반품_203D비중(%)',
    '반품_206A비중(%)',
    'FB_203D_할당',
    'FB_203D_미회수',
    'FB_203D_회수율(%)',
    'FB_206A_할당',
    'FB_206A_미회수',
    'FB_206A_회수율(%)',
    'FB_일반_할당',
    'FB_일반_미회수',
    'FB_일반_회수율(%)',
    'FB_단독_할당',
    'FB_단독_미회수',
    'FB_단독_회수율(%)',
    '수입_기프트',
    '수입_반품',
    '수입_FB할당',
    '수입_FB차감',
    '예상수입_합계',
  ];
  
  const rows = records.map(r => {
    const d = r.derived;
    return [
      r.date,
      d.GIFT_DAY_TOTAL,
      d.GIFT_DAY_203D,
      d.GIFT_DAY_206A,
      formatRate(d.GIFT_RATE_203D),
      formatRate(d.GIFT_RATE_206A),
      d.RET_DAY_TOTAL,
      d.RET_DAY_203D,
      d.RET_DAY_206A,
      formatRate(d.RET_RATE_203D),
      formatRate(d.RET_RATE_206A),
      d.FB_203D_ASSIGNED,
      d.FB_203D_UNCOLLECTED,
      formatRate(d.FB_203D_RATE),
      d.FB_206A_ASSIGNED,
      d.FB_206A_UNCOLLECTED,
      formatRate(d.FB_206A_RATE),
      d.FB_GEN_ASSIGNED,
      d.FB_GEN_UNCOLLECTED,
      formatRate(d.FB_GEN_RATE),
      d.FB_SOLO_ASSIGNED,
      d.FB_SOLO_UNCOLLECTED,
      formatRate(d.FB_SOLO_RATE),
      d.INCOME_GIFT,
      d.INCOME_RET,
      d.INCOME_FB_ASSIGNED,
      d.INCOME_FB_DEDUCT,
      d.TODAY_EST_INCOME_BASE,
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

// ================================
// 파일 다운로드 헬퍼
// ================================
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// ================================
// Draft에서 모든 기록 내보내기
// ================================
export function exportAllDrafts(format: 'json' | 'csv'): void {
  const drafts = getAllDrafts();
  const records: ExportRecord[] = Object.values(drafts)
    .filter(d => d && d.date)
    .map(d => toExportRecord(d as TodayWorkData, d.updatedAt))
    .sort((a, b) => b.date.localeCompare(a.date));
  
  const now = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    const content = exportToJSON(records);
    downloadFile(content, `퀵플렉스_기록_${now}.json`, 'application/json');
  } else {
    const content = exportToCSV(records);
    downloadFile(content, `퀵플렉스_기록_${now}.csv`, 'text/csv');
  }
}

// ================================
// 기간별 내보내기
// ================================
export function exportByPeriod(
  startDate: string,
  endDate: string,
  format: 'json' | 'csv'
): void {
  const drafts = getAllDrafts();
  const records: ExportRecord[] = Object.values(drafts)
    .filter(d => d && d.date && d.date >= startDate && d.date <= endDate)
    .map(d => toExportRecord(d as TodayWorkData, d.updatedAt))
    .sort((a, b) => b.date.localeCompare(a.date));
  
  const filename = `퀵플렉스_기록_${startDate}_${endDate}`;
  
  if (format === 'json') {
    const content = exportToJSON(records);
    downloadFile(content, `${filename}.json`, 'application/json');
  } else {
    const content = exportToCSV(records);
    downloadFile(content, `${filename}.csv`, 'text/csv');
  }
}

// ================================
// JSON 가져오기 (Import)
// ================================
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export function parseImportJSON(content: string): ExportData | null {
  try {
    const data = JSON.parse(content) as ExportData;
    if (!data.records || !Array.isArray(data.records)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// ================================
// Source Inputs → TodayWorkData 역변환
// ================================
export function sourcesToWorkData(date: string, sources: RecordSourceInputs): TodayWorkData {
  return {
    date,
    firstAllocationDelivery: sources.A_GIFT_R1_TOTAL,
    firstAllocationReturns: sources.A_RET_R1_TOTAL,
    totalRemainingAfterFirstRound: sources.B_GIFT_TOTAL_REMAIN,
    routes: {
      '203D': {
        allocated: 0,
        completed: 0,
        cancelled: 0,
        incomplete: 0,
        transferred: 0,
        added: 0,
        firstRoundRemaining: sources.B_GIFT_203D_REMAIN,
      },
      '206A': {
        allocated: 0,
        completed: 0,
        cancelled: 0,
        incomplete: 0,
        transferred: 0,
        added: 0,
        firstRoundRemaining: 0,
      },
    },
    returns: {
      allocated: sources.A_RET_R1_TOTAL,
      completed: 0,
      notCollected: 0,
      numbered: 0,
      incomplete: 0,
    },
    freshBag: {
      regularAllocated: sources.A_FB_GEN,
      standaloneAllocated: sources.A_FB_SOLO,
      route206ACount: sources.A_FB_206A,
      regularAdjustment: 0,
      transferred: 0,
      added: sources.D_FB_GEN_INCREASE,
      undoneLinked: sources.F_FB_GEN_REMAIN,
      undoneSolo: sources.F_FB_SOLO_REMAIN,
      failedAbsent: 0,
      failedNoProduct: 0,
      failedWithProducts: 0,
      incomplete: 0,
    },
    stageB_returnRemaining_203D: sources.B_RET_203D_UNVISITED,
    stageB_206A_R1_assigned: sources.B_RET_206A_ASSIGNED,
    stageC_206A_returnRemaining: sources.C_RET_206A_REMAIN,
    stageE_206A_returnRemaining: sources.E_RET_REMAIN,
    round1EndRemaining: sources.C_GIFT_206A_REMAIN,
    round2TotalRemaining: sources.D_GIFT_TOTAL_NOW,
    round2TotalReturns: sources.D_RET_TOTAL_NOW,
    round2EndRemaining: sources.E_GIFT_REMAIN,
    freshBagRound1EndRegular: sources.C_FB_GEN_UNVISITED,
    freshBagRound1EndStandalone: sources.C_FB_SOLO_UNVISITED,
    stageB_unvisitedFB_total_203D: sources.B_FB_203D_UNVISITED,
    stageE_unvisitedFB_solo_203D: sources.E_FB_203D_REMAIN,
    stageF_unvisitedFB_solo_206A: sources.F_FB_206A_REMAIN,
  };
}
