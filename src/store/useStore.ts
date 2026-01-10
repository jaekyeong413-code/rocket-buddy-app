import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, WorkRecord, RouteAllocationHistory, TodayWorkData, DeliveryData, ReturnsData, FreshBagData } from '@/types';
import { formatDate, createDefaultDeliveryData, createDefaultReturnsData, createDefaultFreshBagData } from '@/lib/calculations';

interface AppState {
  settings: Settings;
  records: WorkRecord[];
  allocationHistory: RouteAllocationHistory[];
  // 날짜별 입력 데이터 저장 (탭 이동해도 유지)
  workDataByDate: Record<string, TodayWorkData>;
  // 현재 입력 중인 날짜
  currentInputDate: string;
  updateSettings: (settings: Partial<Settings>) => void;
  addRecord: (record: WorkRecord) => void;
  updateRecord: (id: string, record: Partial<WorkRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByPeriod: (startDate: string, endDate: string) => WorkRecord[];
  addAllocationHistory: (history: RouteAllocationHistory) => void;
  getRouteRatio: () => { '203D': number; '206A': number };
  // 작업 데이터 관리 (날짜별)
  updateWorkData: (date: string, data: Partial<TodayWorkData>) => void;
  getWorkData: (date: string) => TodayWorkData;
  setCurrentInputDate: (date: string) => void;
  getCurrentInputDate: () => string;
  // 저장 성공 시 해당 날짜 데이터 초기화
  clearWorkData: (date: string) => void;
  // 오늘 입력 데이터 (대시보드용)
  getTodayWorkData: () => TodayWorkData;
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      records: [],
      allocationHistory: [],
      workDataByDate: {},
      currentInputDate: formatDate(new Date()),
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      addRecord: (record) =>
        set((state) => ({
          records: [...state.records, record],
        })),
      
      updateRecord: (id, updates) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      
      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
      
      getRecordsByPeriod: (startDate, endDate) => {
        const records = get().records;
        return records.filter(
          (r) => r.date >= startDate && r.date <= endDate
        );
      },

      addAllocationHistory: (history) =>
        set((state) => {
          const existingIndex = state.allocationHistory.findIndex(
            (h) => h.date === history.date
          );
          if (existingIndex >= 0) {
            const updated = [...state.allocationHistory];
            updated[existingIndex] = history;
            return { allocationHistory: updated };
          }
          return { allocationHistory: [...state.allocationHistory, history] };
        }),

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

      // 날짜별 작업 데이터 업데이트
      updateWorkData: (date, data) =>
        set((state) => {
          const existing = state.workDataByDate[date] || createDefaultTodayWorkData(date);
          return {
            workDataByDate: {
              ...state.workDataByDate,
              [date]: {
                ...existing,
                ...data,
                date,
              },
            },
          };
        }),

      // 날짜별 작업 데이터 조회
      getWorkData: (date) => {
        const state = get();
        return state.workDataByDate[date] || createDefaultTodayWorkData(date);
      },

      // 현재 입력 날짜 설정
      setCurrentInputDate: (date) =>
        set(() => ({
          currentInputDate: date,
        })),

      // 현재 입력 날짜 조회
      getCurrentInputDate: () => {
        return get().currentInputDate;
      },

      // 저장 성공 시 해당 날짜 데이터 초기화 + 날짜를 오늘로 변경
      clearWorkData: (date) =>
        set((state) => {
          const today = formatDate(new Date());
          const newWorkDataByDate = { ...state.workDataByDate };
          delete newWorkDataByDate[date];
          return {
            workDataByDate: newWorkDataByDate,
            currentInputDate: today,
          };
        }),

      // 오늘 입력 데이터 조회 (대시보드 실시간 표시용)
      getTodayWorkData: () => {
        const state = get();
        const today = formatDate(new Date());
        return state.workDataByDate[today] || createDefaultTodayWorkData(today);
      },
    }),
    {
      name: 'quickflex-storage',
    }
  )
);
