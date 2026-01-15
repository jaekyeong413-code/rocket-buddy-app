import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { QuantityStepper } from './QuantityStepper';
import { formatCurrency } from '@/lib/calculations';
import { toast } from '@/hooks/use-toast';

interface NumberedSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROUTES = ['203D', '206A'] as const;

export function NumberedSheet({ isOpen, onClose }: NumberedSheetProps) {
  const { getCurrentInputDate, getWorkData, updateWorkData, settings } = useStore();
  
  const [selectedRoute, setSelectedRoute] = useState<'203D' | '206A'>('203D');
  const [quantity, setQuantity] = useState(1);

  // 선택된 라우트의 단가
  const routeRate = settings.routes[selectedRoute];
  const estimatedIncome = routeRate * quantity;

  const handleSave = () => {
    const date = getCurrentInputDate();
    const workData = getWorkData(date);
    
    const newEntry = {
      route: selectedRoute,
      quantity,
      createdAt: new Date().toISOString(),
    };
    
    const existingEntries = workData.numbered || [];
    
    // Returns의 numbered에도 반영
    const returns = { ...workData.returns };
    returns.numbered = (returns.numbered || 0) + quantity;
    
    updateWorkData(date, {
      numbered: [...existingEntries, newEntry],
      returns,
    });
    
    toast({ title: `채번 ${quantity}건 저장 (+${formatCurrency(estimatedIncome)})` });
    
    // 초기화 및 닫기
    setSelectedRoute('203D');
    setQuantity(1);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRoute('203D');
      setQuantity(1);
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">채번</DrawerTitle>
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
                    transition-all duration-150 flex flex-col items-center gap-1
                    ${selectedRoute === route
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  <span>{route}</span>
                  <span className={`text-xs ${selectedRoute === route ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {formatCurrency(settings.routes[route])}/건
                  </span>
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
          
          {/* 예상 추가 수입 표시 */}
          <div className="bg-accent rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">추가 예상 수입</span>
              <span className="text-lg font-bold text-primary">
                +{formatCurrency(estimatedIncome)}
              </span>
            </div>
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
