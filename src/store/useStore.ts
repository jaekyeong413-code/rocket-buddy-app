import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, WorkRecord } from '@/types';

interface AppState {
  settings: Settings;
  records: WorkRecord[];
  updateSettings: (settings: Partial<Settings>) => void;
  addRecord: (record: WorkRecord) => void;
  updateRecord: (id: string, record: Partial<WorkRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByPeriod: (startDate: string, endDate: string) => WorkRecord[];
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
    }),
    {
      name: 'quickflex-storage',
    }
  )
);
