import { create } from 'zustand';
import { Settings, WorkRecord, RouteAllocationHistory, TodayWorkData, DeliveryData, ReturnsData, FreshBagData } from '@/types';
import { formatDate, createDefaultDeliveryData, createDefaultReturnsData, createDefaultFreshBagData } from '@/lib/calculations';
import {
  getAllRecords,
  upsertRecord,
  deleteRecord as deleteRecordFromStorage,
  updateRecord as updateRecordInStorage,
  getRecordsByPeriod as getRecordsByPeriodFromStorage,
  getDraft,
  saveDraft,
  getCurrentInputDate as getStoredInputDate,
  setCurrentInputDate as setStoredInputDate,
  initializeStorage,
  RecordWithMeta,
} from '@/lib/storage';

interface AppState {
  settings: Settings;
  records: RecordWithMeta[];
  allocationHistory: RouteAllocationHistory[];
  // 날짜별 입력 데이터 (Draft - 탭 이동해도 유지)
  workDataByDate: Record<string, TodayWorkData>;
  // 현재 입력 중인 날짜
  currentInputDate: string;
  // 초기화 완료 여부
  initialized: boolean;
  
  // 초기화
  initialize: () => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
  addRecord: (record: WorkRecord) => void;
  updateRecord: (id: string, record: Partial<WorkRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByPeriod: (startDate: string, endDate: string) => WorkRecord[];
  addAllocationHistory: (history: RouteAllocationHistory) => void;
  getRouteRatio: () => { '203D': number; '206A': number };
  // 작업 데이터 관리 (Draft - 날짜별)
  updateWorkData: (date: string, data: Partial<TodayWorkData>) => void;
  getWorkData: (date: string) => TodayWorkData;
  setCurrentInputDate: (date: string) => void;
  getCurrentInputDate: () => string;
  // 저장 성공 시 호출 (Draft 유지)
  clearWorkData: (date: string) => void;
  // 오늘 입력 데이터 (대시보드용)
  getTodayWorkData: () => TodayWorkData;
  // Records 새로고침
  refreshRecords: () => void;
}

const defaultSettings: Settings = {
  routes: {
    '203D': 850,
    '206A': 750,
  },
  freshBag: {
    regular: 100,
    standalone: 200,
  },
  incentive: {
    regularThreshold: 90,
    regularBonus: 15,
    standaloneThreshold: 70,
    standaloneBonus: 10,
  },
  monthlyFee: 500000,
};

const createDefaultTodayWorkData = (date: string): TodayWorkData => ({
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
});

// 설정 로컬 저장
const SETTINGS_KEY = 'quickflex-settings';
const ALLOCATION_HISTORY_KEY = 'quickflex-allocation-history';

function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

function loadAllocationHistory(): RouteAllocationHistory[] {
  try {
    const data = localStorage.getItem(ALLOCATION_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load allocation history:', e);
  }
  return [];
}

function saveAllocationHistory(history: RouteAllocationHistory[]): void {
  try {
    localStorage.setItem(ALLOCATION_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save allocation history:', e);
  }
}

export const useStore = create<AppState>()((set, get) => ({
  settings: loadSettings(),
  records: [],
  allocationHistory: loadAllocationHistory(),
  workDataByDate: {},
  currentInputDate: getStoredInputDate(),
  initialized: false,
  
  // 앱 시작 시 호출 - 로컬 스토리지에서 데이터 로드 및 마이그레이션
  initialize: () => {
    const { records, drafts } = initializeStorage();
    set({
      records,
      workDataByDate: drafts,
      initialized: true,
    });
  },
  
  updateSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    saveSettings(updated);
    set({ settings: updated });
  },
  
  // Record 추가/업데이트 (같은 날짜+라우트+회차면 덮어쓰기)
  addRecord: (record) => {
    const newRecord = upsertRecord(record);
    const records = get().records;
    const existingIndex = records.findIndex(
      r => r.date === record.date && r.route === record.route && r.round === record.round
    );
    
    if (existingIndex >= 0) {
      const updated = [...records];
      updated[existingIndex] = newRecord;
      set({ records: updated });
    } else {
      set({ records: [...records, newRecord] });
    }
  },
  
  updateRecord: (id, updates) => {
    const result = updateRecordInStorage(id, updates);
    if (result) {
      set({
        records: get().records.map(r => r.id === id ? result : r),
      });
    }
  },
  
  deleteRecord: (id) => {
    deleteRecordFromStorage(id);
    set({
      records: get().records.filter(r => r.id !== id),
    });
  },
  
  getRecordsByPeriod: (startDate, endDate) => {
    return getRecordsByPeriodFromStorage(startDate, endDate);
  },

  addAllocationHistory: (history) => {
    const current = get().allocationHistory;
    const existingIndex = current.findIndex(h => h.date === history.date);
    
    let updated: RouteAllocationHistory[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = history;
    } else {
      updated = [...current, history];
    }
    
    saveAllocationHistory(updated);
    set({ allocationHistory: updated });
  },

  getRouteRatio: () => {
    const history = get().allocationHistory;
    if (history.length === 0) {
      return { '203D': 50, '206A': 50 };
    }

    let total203D = 0;
    let total206A = 0;

    for (const h of history) {
      total203D += h.allocations['203D'];
      total206A += h.allocations['206A'];
    }

    const totalAll = total203D + total206A;
    if (totalAll === 0) {
      return { '203D': 50, '206A': 50 };
    }

    return {
      '203D': Math.round((total203D / totalAll) * 100),
      '206A': Math.round((total206A / totalAll) * 100),
    };
  },

  // Draft 업데이트 (자동 저장은 useDraftAutoSave 훅에서 처리)
  updateWorkData: (date, data) => {
    const state = get();
    const existing = state.workDataByDate[date] || createDefaultTodayWorkData(date);
    
    const updated = {
      ...existing,
      ...data,
      date,
      routes: {
        '203D': { ...createDefaultDeliveryData(), ...(existing.routes?.['203D'] || {}), ...(data.routes?.['203D'] || {}) },
        '206A': { ...createDefaultDeliveryData(), ...(existing.routes?.['206A'] || {}), ...(data.routes?.['206A'] || {}) },
      },
      returns: { ...createDefaultReturnsData(), ...(existing.returns || {}), ...(data.returns || {}) },
      freshBag: { ...createDefaultFreshBagData(), ...(existing.freshBag || {}), ...(data.freshBag || {}) },
    };
    
    // 메모리 상태 업데이트
    set({
      workDataByDate: {
        ...state.workDataByDate,
        [date]: updated,
      },
    });
    
    // 로컬 스토리지에 저장 (debounce 없이 즉시)
    saveDraft(date, updated);
  },

  // Draft 조회 (안전한 기본값 보장)
  getWorkData: (date) => {
    const state = get();
    
    // 메모리에 있으면 메모리에서 반환
    const memoryData = state.workDataByDate[date];
    if (memoryData) {
      return {
        ...createDefaultTodayWorkData(date),
        ...memoryData,
        routes: {
          '203D': { ...createDefaultDeliveryData(), ...(memoryData.routes?.['203D'] || {}) },
          '206A': { ...createDefaultDeliveryData(), ...(memoryData.routes?.['206A'] || {}) },
        },
        returns: { ...createDefaultReturnsData(), ...(memoryData.returns || {}) },
        freshBag: { ...createDefaultFreshBagData(), ...(memoryData.freshBag || {}) },
      };
    }
    
    // 메모리에 없으면 로컬 스토리지에서 로드
    const storedDraft = getDraft(date);
    if (storedDraft) {
      // 메모리에 캐시
      set({
        workDataByDate: {
          ...state.workDataByDate,
          [date]: storedDraft,
        },
      });
      return storedDraft;
    }
    
    return createDefaultTodayWorkData(date);
  },

  // 현재 입력 날짜 설정
  setCurrentInputDate: (date) => {
    setStoredInputDate(date);
    set({ currentInputDate: date });
  },

  // 현재 입력 날짜 조회
  getCurrentInputDate: () => {
    return get().currentInputDate;
  },

  // 저장 후 - Draft 유지 (사용자 요청)
  clearWorkData: (_date) => {
    // 의도적으로 아무것도 하지 않음 - 저장 후에도 입력값 유지
  },

  // 오늘 Draft 조회 (대시보드 실시간 표시용)
  getTodayWorkData: () => {
    const today = formatDate(new Date());
    return get().getWorkData(today);
  },
  
  // Records 새로고침 (외부 변경 시)
  refreshRecords: () => {
    const records = getAllRecords();
    set({ records });
  },
}));
