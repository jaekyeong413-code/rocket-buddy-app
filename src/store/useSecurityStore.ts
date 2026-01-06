import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SecuritySettings {
  isEnabled: boolean;
  pin: string | null;
  useBiometric: boolean;
  biometricCredentialId: string | null;
}

interface SecurityState {
  settings: SecuritySettings;
  isAuthenticated: boolean;
  updateSettings: (settings: Partial<SecuritySettings>) => void;
  setAuthenticated: (value: boolean) => void;
  setPin: (pin: string) => void;
  clearPin: () => void;
  setBiometricCredential: (credentialId: string | null) => void;
}

const defaultSettings: SecuritySettings = {
  isEnabled: false,
  pin: null,
  useBiometric: false,
  biometricCredentialId: null,
};

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      isAuthenticated: false, // Not persisted - resets on browser close
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      setAuthenticated: (value) =>
        set({ isAuthenticated: value }),
      
      setPin: (pin) =>
        set((state) => ({
          settings: { ...state.settings, pin, isEnabled: true },
        })),
      
      clearPin: () =>
        set((state) => ({
          settings: { 
            ...state.settings, 
            pin: null, 
            isEnabled: false,
            useBiometric: false,
            biometricCredentialId: null,
          },
        })),
      
      setBiometricCredential: (credentialId) =>
        set((state) => ({
          settings: { 
            ...state.settings, 
            biometricCredentialId: credentialId,
            useBiometric: credentialId !== null,
          },
        })),
    }),
    {
      name: 'quickflex-security',
      partialize: (state) => ({ settings: state.settings }), // Only persist settings, not auth state
    }
  )
);
