import { useState, useRef, useEffect } from 'react';
import { Shield, Fingerprint, X, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurityStore } from '@/store/useSecurityStore';
import { authenticateBiometric, isBiometricAvailable } from '@/lib/webauthn';
import { useToast } from '@/hooks/use-toast';

interface PinInputProps {
  mode: 'login' | 'setup' | 'change';
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PinInput({ mode, onSuccess, onCancel }: PinInputProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { settings, setAuthenticated, setPin: savePin } = useSecurityStore();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const handleNumberPress = (num: string) => {
    if (step === 'enter' && pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      if (newPin.length === 4) {
        if (mode === 'login') {
          validateLogin(newPin);
        } else if (mode === 'setup' || mode === 'change') {
          setTimeout(() => {
            setStep('confirm');
            setConfirmPin('');
          }, 200);
        }
      }
    } else if (step === 'confirm' && confirmPin.length < 4) {
      const newConfirm = confirmPin + num;
      setConfirmPin(newConfirm);
      setError('');
      
      if (newConfirm.length === 4) {
        validateSetup(newConfirm);
      }
    }
  };

  const handleDelete = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const validateLogin = (inputPin: string) => {
    if (inputPin === settings.pin) {
      setAuthenticated(true);
      onSuccess();
    } else {
      setError('비밀번호가 일치하지 않습니다');
      setPin('');
    }
  };

  const validateSetup = (confirmValue: string) => {
    if (pin === confirmValue) {
      savePin(pin);
      toast({
        title: '비밀번호 설정 완료',
        description: '보안 잠금이 활성화되었습니다.',
      });
      setAuthenticated(true);
      onSuccess();
    } else {
      setError('비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
      setStep('enter');
      setPin('');
      setConfirmPin('');
    }
  };

  const handleBiometric = async () => {
    if (!settings.biometricCredentialId) return;
    
    const success = await authenticateBiometric(settings.biometricCredentialId);
    if (success) {
      setAuthenticated(true);
      onSuccess();
    } else {
      setError('생체 인증에 실패했습니다. PIN을 입력해주세요.');
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;

  const getTitle = () => {
    if (mode === 'login') return '비밀번호 입력';
    if (mode === 'setup') return step === 'enter' ? '새 비밀번호 설정' : '비밀번호 확인';
    return step === 'enter' ? '새 비밀번호 입력' : '비밀번호 확인';
  };

  const getSubtitle = () => {
    if (mode === 'login') return '앱에 접근하려면 4자리 PIN을 입력하세요';
    if (step === 'enter') return '4자리 숫자를 입력하세요';
    return '비밀번호를 다시 입력하세요';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{getTitle()}</h1>
        <p className="text-sm text-muted-foreground mt-1">{getSubtitle()}</p>
      </div>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              index < currentPin.length
                ? 'bg-primary scale-110'
                : 'bg-muted border-2 border-border'
            }`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive mb-4 text-center animate-shake">
          {error}
        </p>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="w-16 h-16 text-2xl font-semibold rounded-full hover:bg-primary/10 active:scale-95 transition-transform"
            onClick={() => handleNumberPress(num)}
          >
            {num}
          </Button>
        ))}
        
        {/* Biometric / Cancel */}
        <Button
          variant="ghost"
          className="w-16 h-16 rounded-full"
          onClick={mode === 'login' && biometricAvailable && settings.useBiometric ? handleBiometric : onCancel}
          disabled={mode === 'login' && (!biometricAvailable || !settings.useBiometric) && !onCancel}
        >
          {mode === 'login' && biometricAvailable && settings.useBiometric ? (
            <Fingerprint className="w-6 h-6 text-primary" />
          ) : onCancel ? (
            <X className="w-6 h-6" />
          ) : null}
        </Button>
        
        {/* Zero */}
        <Button
          variant="outline"
          className="w-16 h-16 text-2xl font-semibold rounded-full hover:bg-primary/10 active:scale-95 transition-transform"
          onClick={() => handleNumberPress('0')}
        >
          0
        </Button>
        
        {/* Delete */}
        <Button
          variant="ghost"
          className="w-16 h-16 rounded-full"
          onClick={handleDelete}
          disabled={currentPin.length === 0}
        >
          <Delete className="w-6 h-6" />
        </Button>
      </div>

      {/* Hidden input for accessibility */}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        className="sr-only"
        value={currentPin}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
          if (step === 'enter') {
            setPin(value);
          } else {
            setConfirmPin(value);
          }
        }}
      />
    </div>
  );
}
