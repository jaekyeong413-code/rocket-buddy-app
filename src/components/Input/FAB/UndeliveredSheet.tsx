import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { UndeliveredReason } from '@/types';
import { QuantityStepper } from './QuantityStepper';
import { formatCurrency } from '@/lib/calculations';
import { toast } from '@/hooks/use-toast';

interface UndeliveredSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROUTES = ['203D', '206A'] as const;

const REASONS: { id: UndeliveredReason; label: string }[] = [
  { id: 'cancelled', label: '주문 취소' },
  { id: 'wrongAddress', label: '주소 상이' },
  { id: 'doorClosed', label: '문 닫음' },
  { id: 'noAccessCode', label: '진입 불가' },
];

export function UndeliveredSheet({ isOpen, onClose }: UndeliveredSheetProps) {
  const { getCurrentInputDate, getWorkData, updateWorkData, settings } = useStore();
  
  const [selectedRoute, setSelectedRoute] = useState<'203D' | '206A'>('203D');
  const [selectedReason, setSelectedReason] = useState<UndeliveredReason>('cancelled');
  const [quantity, setQuantity] = useState(1);

  // 선택된 라우트의 단가
  const routeRate = settings.routes[selectedRoute];
  const deductedIncome = routeRate * quantity;

  const handleSave = () => {
    const date = getCurrentInputDate();
    const workData = getWorkData(date);
    
    const newEntry = {
      route: selectedRoute,
      reason: selectedReason,
      quantity,
      createdAt: new Date().toISOString(),
    };
    
    const existingEntries = workData.undelivered || [];
    
    updateWorkData(date, {
      undelivered: [...existingEntries, newEntry],
    });
    
    toast({ 
      title: `미배송 ${quantity}건 저장`,
      description: `수입에서 ${formatCurrency(deductedIncome)} 차감됩니다`,
    });
    
    // 초기화 및 닫기
    setSelectedRoute('203D');
    setSelectedReason('cancelled');
    setQuantity(1);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRoute('203D');
      setSelectedReason('cancelled');
      setQuantity(1);
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">미배송</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-6">
          {/* 라우트 선택 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">라우트</span>
            <div className="flex gap-2">
              {ROUTES.map((route) => (
                <button
                  key={route}
                  onClick={() => setSelectedRoute(route)}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-semibold text-sm
                    transition-all duration-150
                    ${selectedRoute === route
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {route}
                </button>
              ))}
            </div>
          </div>

          {/* 사유 선택 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">사유</span>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`
                    py-3 px-3 rounded-xl font-medium text-sm
                    transition-all duration-150
                    ${selectedReason === reason.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          {/* 수량 */}
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            label="수량"
          />
          
          {/* 차감 금액 표시 */}
          <div className="bg-destructive/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">수입 차감 금액</span>
              <span className="text-lg font-bold text-destructive">
                -{formatCurrency(deductedIncome)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ※ 할당 물량은 변경되지 않습니다
            </p>
          </div>
        </div>
        
        <DrawerFooter>
          <Button onClick={handleSave} className="w-full h-12 text-base font-semibold">
            저장
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
