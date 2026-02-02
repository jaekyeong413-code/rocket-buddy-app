/**
 * 로컬 저장소 관리 모듈
 * Draft(임시 데이터)와 Records(확정 데이터)를 분리하여 관리
 */
import { WorkRecord, TodayWorkData, RecordWithMeta } from '@/types';
import { formatDate, createDefaultDeliveryData, createDefaultReturnsData, createDefaultFreshBagData } from './calculations';
import {
  deleteRecordRemote,
  fetchAllRecordsRemote,
  fetchRecordsByPeriodRemote,
  upsertRecordRemote,
} from './recordsApi';

// ===============================
// 상수 정의
// ===============================
const STORAGE_KEYS = {
  DRAFTS: 'quickflex-drafts',      // 날짜별 임시 저장 데이터
  RECORDS: 'quickflex-records',    // 확정된 작업 기록
  SETTINGS: 'quickflex-settings',  // 설정
  ALLOCATION_HISTORY: 'quickflex-allocation-history', // 할당 히스토리
  CURRENT_INPUT_DATE: 'quickflex-current-input-date', // 현재 입력 날짜
} as const;

const CURRENT_SCHEMA_VERSION = 1;

// ===============================
// 타입 정의
// ===============================
export interface DraftData extends TodayWorkData {
  updatedAt: string;
  schemaVersion: number;
}

export interface DraftsStore {
  [date: string]: DraftData;
}

export interface RecordsStore {
  records: RecordWithMeta[];
  schemaVersion: number;
}

// ===============================
// UUID 생성 (crypto.randomUUID 폴백)
// ===============================
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 간단한 UUID v4 폴백
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ===============================
// 기본값 생성
// ===============================
export function createDefaultDraft(date: string): DraftData {
  return {
    date,
    firstAllocationDelivery: 0,
    firstAllocationReturns: 0,
    totalRemainingAfterFirstRound: 0,
    routes: {
      '203D': createDefaultDeliveryData(),
      '206A': createDefaultDeliveryData(),
    },
    returns: createDefaultReturnsData(),
    freshBag: createDefaultFreshBagData(),
    // ★ 신규 반품 Source 필드 기본값
    stageB_206A_R1_assigned: 0,       // Stage B: 206A 1회전 반품 할당
    stageC_206A_returnRemaining: 0,   // Stage C: 206A 잔여 반품
    stageE_206A_returnRemaining: 0,   // Stage E: 206A 현재 잔여 반품
    // 프레시백 관련
    stageB_unvisitedFB_total_203D: 0,
    stageE_unvisitedFB_solo_203D: 0,
    stageF_unvisitedFB_solo_206A: 0,

    // Gift(배송) 엑셀식 원본 입력값 기본값
    stageB_giftAlloc_206A: 0,
    stageC_giftRemain_203D: 0,
    stageC_giftRemain_206A: 0,
    stageD_giftRemain_206A: 0,
    updatedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

// ===============================
// Draft 관리
// ===============================

/**
 * 모든 Draft 가져오기
 */
export function getAllDrafts(): DraftsStore {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    if (!data) return {};
    return JSON.parse(data) as DraftsStore;
  } catch (e) {
    console.error('Failed to load drafts:', e);
    return {};
  }
}

/**
 * 특정 날짜의 Draft 가져오기
 */
export function getDraft(date: string): DraftData | null {
  const drafts = getAllDrafts();
  const draft = drafts[date];
  
  if (!draft) return null;
  
  // schemaVersion 누락 시 채우기
  if (!draft.schemaVersion) {
    draft.schemaVersion = CURRENT_SCHEMA_VERSION;
  }
  if (!draft.updatedAt) {
    draft.updatedAt = new Date().toISOString();
  }
  
  // 기본값 병합 (구조 안전성)
  return {
    ...createDefaultDraft(date),
    ...draft,
    routes: {
      '203D': { ...createDefaultDeliveryData(), ...(draft.routes?.['203D'] || {}) },
      '206A': { ...createDefaultDeliveryData(), ...(draft.routes?.['206A'] || {}) },
    },
    returns: { ...createDefaultReturnsData(), ...(draft.returns || {}) },
    freshBag: { ...createDefaultFreshBagData(), ...(draft.freshBag || {}) },
  };
}

/**
 * Draft 저장 (debounce 없이 즉시 저장)
 */
export function saveDraft(date: string, data: Partial<TodayWorkData>): DraftData {
  const drafts = getAllDrafts();
  const existing = drafts[date] || createDefaultDraft(date);
  
  const updated: DraftData = {
    ...existing,
    ...data,
    date,
    updatedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    routes: {
      '203D': { ...createDefaultDeliveryData(), ...(existing.routes?.['203D'] || {}), ...(data.routes?.['203D'] || {}) },
      '206A': { ...createDefaultDeliveryData(), ...(existing.routes?.['206A'] || {}), ...(data.routes?.['206A'] || {}) },
    },
    returns: { ...createDefaultReturnsData(), ...(existing.returns || {}), ...(data.returns || {}) },
    freshBag: { ...createDefaultFreshBagData(), ...(existing.freshBag || {}), ...(data.freshBag || {}) },
  };
  
  drafts[date] = updated;
  
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
  
  return updated;
}

/**
 * Draft 삭제 (저장 후 정리용)
 */
export function deleteDraft(date: string): void {
  const drafts = getAllDrafts();
  delete drafts[date];
  
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  } catch (e) {
    console.error('Failed to delete draft:', e);
  }
}

// ===============================
// Records 관리
// ===============================

/**
 * 모든 Records 가져오기 (마이그레이션 포함)
 */
export function getAllRecords(): RecordWithMeta[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!data) {
      // 기존 zustand persist 데이터에서 마이그레이션 시도
      return migrateFromLegacyStorage();
    }
    
    const store = JSON.parse(data) as RecordsStore;
    return store.records.map(migrateRecord);
  } catch (e) {
    console.error('Failed to load records:', e);
    return migrateFromLegacyStorage();
  }
}

function mergeRecordsByIdentity(
  existing: RecordWithMeta[],
  incoming: RecordWithMeta[]
): RecordWithMeta[] {
  const map = new Map<string, RecordWithMeta>();
  for (const record of existing) {
    map.set(`${record.date}-${record.route}-${record.round}`, record);
  }
  for (const record of incoming) {
    map.set(`${record.date}-${record.route}-${record.round}`, record);
  }
  return Array.from(map.values());
}

export async function getAllRecordsRemoteFirst(): Promise<RecordWithMeta[]> {
  try {
    const remote = await fetchAllRecordsRemote();
    saveRecords(remote);
    return remote;
  } catch (e) {
    console.warn('Failed to fetch records from remote, using local fallback:', e);
    return getAllRecords();
  }
}

export async function getRecordsByPeriodRemoteFirst(
  startDate: string,
  endDate: string
): Promise<RecordWithMeta[]> {
  try {
    const remote = await fetchRecordsByPeriodRemote(startDate, endDate);
    const merged = mergeRecordsByIdentity(getAllRecords(), remote);
    saveRecords(merged);
    return remote;
  } catch (e) {
    console.warn('Failed to fetch records by period from remote, using local fallback:', e);
    return getRecordsByPeriod(startDate, endDate);
  }
}

/**
 * 기존 zustand persist 데이터에서 마이그레이션
 */
function migrateFromLegacyStorage(): RecordWithMeta[] {
  try {
    const legacyData = localStorage.getItem('quickflex-storage');
    if (!legacyData) return [];
    
    const parsed = JSON.parse(legacyData);
    const legacyRecords = parsed?.state?.records || [];
    
    return legacyRecords.map((record: WorkRecord) => migrateRecord(record as RecordWithMeta));
  } catch (e) {
    console.error('Failed to migrate from legacy storage:', e);
    return [];
  }
}

/**
 * 개별 Record 마이그레이션 (메타 필드 채우기)
 */
function migrateRecord(record: Partial<RecordWithMeta> & WorkRecord): RecordWithMeta {
  return {
    ...record,
    id: record.id || generateUUID(),
    updatedAt: record.updatedAt || new Date().toISOString(),
    syncedAt: record.syncedAt ?? null,
    schemaVersion: record.schemaVersion || CURRENT_SCHEMA_VERSION,
  };
}

/**
 * Records 저장
 */
function saveRecords(records: RecordWithMeta[]): void {
  const store: RecordsStore = {
    records,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
  
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save records:', e);
  }
}

function markRecordSynced(id: string, syncedAt: string): void {
  const records = getAllRecords();
  const index = records.findIndex(r => r.id === id);
  if (index < 0) return;
  records[index] = {
    ...records[index],
    syncedAt,
  };
  saveRecords(records);
}

/**
 * Record 추가/업데이트 (같은 날짜+라우트+회차면 덮어쓰기)
 */
export function upsertRecord(record: WorkRecord): RecordWithMeta {
  const records = getAllRecords();
  const now = new Date().toISOString();
  
  const existingIndex = records.findIndex(
    r => r.date === record.date && r.route === record.route && r.round === record.round
  );
  
  const newRecord: RecordWithMeta = {
    ...record,
    id: existingIndex >= 0 ? records[existingIndex].id : generateUUID(),
    updatedAt: now,
    syncedAt: null, // 수정 시 동기화 필요 표시
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
  
  if (existingIndex >= 0) {
    records[existingIndex] = newRecord;
  } else {
    records.push(newRecord);
  }
  
  saveRecords(records);

  void upsertRecordRemote(newRecord)
    .then((synced) => {
      if (synced?.syncedAt) {
        markRecordSynced(newRecord.id, synced.syncedAt);
      }
    })
    .catch((e) => {
      console.warn('Failed to upsert record to remote:', e);
    });

  return newRecord;
}

/**
 * Record 삭제
 */
export function deleteRecord(id: string): void {
  const records = getAllRecords();
  const filtered = records.filter(r => r.id !== id);
  saveRecords(filtered);

  void deleteRecordRemote(id).catch((e) => {
    console.warn('Failed to delete record from remote:', e);
  });
}

/**
 * Record 수정
 */
export function updateRecord(id: string, updates: Partial<WorkRecord>): RecordWithMeta | null {
  const records = getAllRecords();
  const index = records.findIndex(r => r.id === id);
  
  if (index < 0) return null;
  
  const updated: RecordWithMeta = {
    ...records[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    syncedAt: null, // 수정 시 동기화 필요 표시
  };
  
  records[index] = updated;
  saveRecords(records);

  void upsertRecordRemote(updated)
    .then((synced) => {
      if (synced?.syncedAt) {
        markRecordSynced(updated.id, synced.syncedAt);
      }
    })
    .catch((e) => {
      console.warn('Failed to update record on remote:', e);
    });
  
  return updated;
}

/**
 * 기간별 Records 조회
 */
export function getRecordsByPeriod(startDate: string, endDate: string): RecordWithMeta[] {
  const records = getAllRecords();
  return records.filter(r => r.date >= startDate && r.date <= endDate);
}

// ===============================
// 현재 입력 날짜 관리
// ===============================

export function getCurrentInputDate(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_INPUT_DATE);
    return stored || formatDate(new Date());
  } catch {
    return formatDate(new Date());
  }
}

export function setCurrentInputDate(date: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_INPUT_DATE, date);
  } catch (e) {
    console.error('Failed to save current input date:', e);
  }
}

// ===============================
// 초기 마이그레이션 실행
// ===============================

/**
 * 앱 시작 시 호출하여 기존 데이터 마이그레이션
 */
export async function initializeStorage(): Promise<{ records: RecordWithMeta[]; drafts: DraftsStore }> {
  // Records 마이그레이션 및 로드 (원격 우선)
  const records = await getAllRecordsRemoteFirst();
  
  // 기존 workDataByDate를 Drafts로 마이그레이션
  let drafts: DraftsStore = {};
  try {
    const legacyData = localStorage.getItem('quickflex-storage');
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      const workDataByDate = parsed?.state?.workDataByDate || {};
      
      for (const [date, data] of Object.entries(workDataByDate)) {
        drafts[date] = {
          ...createDefaultDraft(date),
          ...(data as TodayWorkData),
          updatedAt: new Date().toISOString(),
          schemaVersion: CURRENT_SCHEMA_VERSION,
        };
      }
      
      // 기존 Drafts와 병합
      const existingDrafts = getAllDrafts();
      drafts = { ...drafts, ...existingDrafts };
      
      // 저장
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } else {
      drafts = getAllDrafts();
    }
  } catch (e) {
    console.error('Failed to migrate workDataByDate:', e);
    drafts = getAllDrafts();
  }
  
  // 마이그레이션된 Records 저장 (메타 필드 추가된 버전)
  saveRecords(records);
  
  return { records, drafts };
}
