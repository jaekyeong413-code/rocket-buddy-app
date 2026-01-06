import { useState, useEffect } from 'react';
import { Shield, Fingerprint, Key, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurityStore } from '@/store/useSecurityStore';
import { isBiometricAvailable, registerBiometric } from '@/lib/webauthn';
import { useToast } from '@/hooks/use-toast';
import { PinInput } from './PinInput';

export function SecuritySettings() {
  const { settings, clearPin, setBiometricCredential } = useSecurityStore();
  const { toast } = useToast();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const handleToggleSecurity = () => {
    if (settings.isEnabled) {
      clearPin();
      toast({
        title: '보안 잠금 해제',
        description: '앱 잠금이 비활성화되었습니다.',
      });
    } else {
      setShowPinSetup(true);
    }
  };

  const handleToggleBiometric = async () => {
    if (settings.useBiometric) {
      setBiometricCredential(null);
      toast({
        title: '생체 인증 해제',
        description: '생체 인증이 비활성화되었습니다.',
      });
    } else {
      const credentialId = await registerBiometric();
      if (credentialId) {
        setBiometricCredential(credentialId);
        toast({
          title: '생체 인증 활성화',
          description: 'Face ID / 지문 인증이 등록되었습니다.',
        });
      } else {
        toast({
          title: '생체 인증 실패',
          description: '생체 인증을 등록할 수 없습니다.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleChangePIN = () => {
    setShowPinSetup(true);
  };

  if (showPinSetup) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <PinInput
          mode={settings.isEnabled ? 'change' : 'setup'}
          onSuccess={() => setShowPinSetup(false)}
          onCancel={() => setShowPinSetup(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-primary">보안 설정</h3>
      </div>

      {/* Security Lock Toggle */}
      <div className="py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">앱 잠금</p>
              <p className="text-xs text-muted-foreground">
                앱 실행 시 비밀번호 입력 필요
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSecurity}
            className="p-0 h-auto"
          >
            {settings.isEnabled ? (
              <ToggleRight className="w-10 h-10 text-primary" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Change PIN - Only shown when security is enabled */}
      {settings.isEnabled && (
        <div className="py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">비밀번호 변경</p>
                <p className="text-xs text-muted-foreground">
                  새로운 4자리 PIN 설정
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleChangePIN}>
              변경
            </Button>
          </div>
        </div>
      )}

      {/* Biometric Toggle - Only shown when security is enabled and biometric is available */}
      {settings.isEnabled && biometricAvailable && (
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">생체 인증</p>
                <p className="text-xs text-muted-foreground">
                  Face ID / 지문으로 잠금 해제
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleBiometric}
              className="p-0 h-auto"
            >
              {settings.useBiometric ? (
                <ToggleRight className="w-10 h-10 text-primary" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Info when security is disabled */}
      {!settings.isEnabled && (
        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground">
            앱 잠금을 활성화하여 수입 정보를 보호하세요
          </p>
        </div>
      )}
    </div>
  );
}
