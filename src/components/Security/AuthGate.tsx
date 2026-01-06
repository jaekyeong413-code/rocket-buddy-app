import { useEffect, useState } from 'react';
import { useSecurityStore } from '@/store/useSecurityStore';
import { PinInput } from './PinInput';
import { authenticateBiometric, isBiometricAvailable } from '@/lib/webauthn';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { settings, isAuthenticated, setAuthenticated } = useSecurityStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If security is not enabled, auto-authenticate
      if (!settings.isEnabled || !settings.pin) {
        setAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // If already authenticated this session, skip
      if (isAuthenticated) {
        setIsLoading(false);
        return;
      }

      // Try biometric if available and enabled
      if (settings.useBiometric && settings.biometricCredentialId) {
        const biometricSupported = await isBiometricAvailable();
        if (biometricSupported) {
          const success = await authenticateBiometric(settings.biometricCredentialId);
          if (success) {
            setAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
      }

      // Show PIN input
      setIsLoading(false);
    };

    checkAuth();
  }, [settings.isEnabled, settings.pin, settings.useBiometric, settings.biometricCredentialId, isAuthenticated, setAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If security is disabled or already authenticated, show the app
  if (!settings.isEnabled || !settings.pin || isAuthenticated) {
    return <>{children}</>;
  }

  // Show PIN input
  return <PinInput mode="login" onSuccess={() => {}} />;
}
