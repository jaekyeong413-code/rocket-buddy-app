import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, WorkRecord, RouteAllocationHistory } from '@/types';

interface AppState {
  settings: Settings;
  records: WorkRecord[];
  allocationHistory: RouteAllocationHistory[];
  updateSettings: (settings: Partial<Settings>) => void;
  addRecord: (record: WorkRecord) => void;
  updateRecord: (id: string, record: Partial<WorkRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByPeriod: (startDate: string, endDate: string) => WorkRecord[];
  addAllocationHistory: (history: RouteAllocationHistory) => void;
  getRouteRatio: () => { '203D': number; '206A': number };
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      records: [],
      allocationHistory: [],
      
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
          // 같은 날짜가 있으면 업데이트, 없으면 추가
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
    }),
    {
      name: 'quickflex-storage',
    }
  )
);
