import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { ReturnNotCollectedReason } from '@/types';
import { QuantityStepper } from './QuantityStepper';
import { toast } from 'sonner';

interface ReturnNotCollectedSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROUTES = ['203D', '206A'] as const;

const REASONS: { id: ReturnNotCollectedReason; label: string }[] = [
  { id: 'absent', label: '반품 부재' },
  { id: 'customerNotReceived', label: '고객 상품 미수령' },
  { id: 'alreadyCollected', label: '쿠팡 이미 회수' },
  { id: 'cancelled', label: '반품 취소' },
];

export function ReturnNotCollectedSheet({ isOpen, onClose }: ReturnNotCollectedSheetProps) {
  const { getCurrentInputDate, getWorkData, updateWorkData } = useStore();
  
  const [selectedRoute, setSelectedRoute] = useState<'203D' | '206A'>('203D');
  const [selectedReason, setSelectedReason] = useState<ReturnNotCollectedReason>('absent');
  const [quantity, setQuantity] = useState(1);

  const handleSave = () => {
    const date = getCurrentInputDate();
    const workData = getWorkData(date);
    
    const newEntry = {
      route: selectedRoute,
      reason: selectedReason,
      quantity,
      createdAt: new Date().toISOString(),
    };
    
    const existingEntries = workData.returnNotCollected || [];
    
    // Returns에도 반영
    // 사유가 'absent' (반품 부재)인 경우에만 회수율 차감 없음
    // 그 외 사유는 수량만큼 회수율 차감 (notCollected에 추가)
    const returns = { ...workData.returns };
    if (selectedReason !== 'absent') {
      // 회수율 차감: notCollected에 추가
      returns.notCollected = (returns.notCollected || 0) + quantity;
    }
    // 'absent'인 경우: 회수율에 영향 없음 (notCollected에 추가하지 않음)
    
    updateWorkData(date, {
      returnNotCollected: [...existingEntries, newEntry],
      returns,
    });
    
    const rateMessage = selectedReason === 'absent' 
      ? '(회수율 차감 없음)' 
      : '(회수율 차감)';
    toast.success(`반품 미회수 ${quantity}건 저장 ${rateMessage}`);
    
    // 초기화 및 닫기
    setSelectedRoute('203D');
    setSelectedReason('absent');
    setQuantity(1);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRoute('203D');
      setSelectedReason('absent');
      setQuantity(1);
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">반품 미회수</DrawerTitle>
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
            {selectedReason === 'absent' && (
              <p className="text-xs text-success mt-1">✓ 반품 부재는 회수율 차감 없음</p>
            )}
          </div>

          {/* 수량 */}
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            label="수량"
          />
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
