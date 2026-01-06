import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { Settings } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';

interface SettingItemProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  description?: string;
}

function SettingItem({ label, value, onChange, suffix, description }: SettingItemProps) {
  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 text-right h-10"
          />
          {suffix && (
            <span className="text-sm text-muted-foreground w-8">{suffix}</span>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: '설정이 저장되었습니다',
      description: '변경된 설정이 적용되었습니다.',
    });
  };

  const handleReset = () => {
    const defaultSettings: Settings = {
      routes: { '203D': 850, '206A': 750 },
      freshBag: { regular: 100, standalone: 200 },
      incentive: {
        regularThreshold: 90,
        regularBonus: 15,
        standaloneThreshold: 70,
        standaloneBonus: 10,
      },
      monthlyFee: 500000,
    };
    setLocalSettings(defaultSettings);
    toast({
      title: '기본값으로 초기화됨',
      description: '저장 버튼을 눌러 적용하세요.',
    });
  };

  return (
    <div className="space-y-5 animate-slide-up pb-6">
      {/* Route Rates */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-primary mb-2">노선 단가</h3>
        <SettingItem
          label="203D"
          value={localSettings.routes['203D']}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              routes: { ...localSettings.routes, '203D': v },
            })
          }
          suffix="원"
        />
        <SettingItem
          label="206A"
          value={localSettings.routes['206A']}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              routes: { ...localSettings.routes, '206A': v },
            })
          }
          suffix="원"
        />
      </div>

      {/* Fresh Bag Rates */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-success mb-2">프레시백 회수 단가</h3>
        <SettingItem
          label="일반(연계)"
          value={localSettings.freshBag.regular}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              freshBag: { ...localSettings.freshBag, regular: v },
            })
          }
          suffix="원"
        />
        <SettingItem
          label="단독"
          value={localSettings.freshBag.standalone}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              freshBag: { ...localSettings.freshBag, standalone: v },
            })
          }
          suffix="원"
        />
      </div>

      {/* Incentive Conditions */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-warning mb-2">인센티브 조건</h3>
        <SettingItem
          label="일반 FB 목표 회수율"
          value={localSettings.incentive.regularThreshold}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              incentive: { ...localSettings.incentive, regularThreshold: v },
            })
          }
          suffix="%"
          description="달성 시 배송 건당 보너스 지급"
        />
        <SettingItem
          label="일반 FB 보너스"
          value={localSettings.incentive.regularBonus}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              incentive: { ...localSettings.incentive, regularBonus: v },
            })
          }
          suffix="원"
        />
        <SettingItem
          label="단독 FB 목표 회수율"
          value={localSettings.incentive.standaloneThreshold}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              incentive: { ...localSettings.incentive, standaloneThreshold: v },
            })
          }
          suffix="%"
          description="달성 시 배송 건당 보너스 지급"
        />
        <SettingItem
          label="단독 FB 보너스"
          value={localSettings.incentive.standaloneBonus}
          onChange={(v) =>
            setLocalSettings({
              ...localSettings,
              incentive: { ...localSettings.incentive, standaloneBonus: v },
            })
          }
          suffix="원"
        />
      </div>

      {/* Monthly Fee */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-destructive mb-2">월 고정 수수료</h3>
        <SettingItem
          label="수수료"
          value={localSettings.monthlyFee}
          onChange={(v) =>
            setLocalSettings({ ...localSettings, monthlyFee: v })
          }
          suffix="원"
          description="매월 수입에서 차감되는 금액"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex-1 touch-target h-12"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          초기화
        </Button>
        <Button onClick={handleSave} className="flex-1 touch-target h-12">
          <Save className="w-4 h-4 mr-2" />
          저장
        </Button>
      </div>
    </div>
  );
}
