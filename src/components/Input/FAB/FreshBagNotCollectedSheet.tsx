import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { FreshBagNotCollectedReason } from '@/types';
import { QuantityStepper } from './QuantityStepper';
import { toast } from '@/hooks/use-toast';

interface FreshBagNotCollectedSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const REASONS: { id: FreshBagNotCollectedReason; label: string }[] = [
  { id: 'absent', label: '프백 부재' },
  { id: 'hasProducts', label: '상품 남아 있음' },
];

export function FreshBagNotCollectedSheet({ isOpen, onClose }: FreshBagNotCollectedSheetProps) {
  const { getCurrentInputDate, getWorkData, updateWorkData } = useStore();
  
  const [selectedReason, setSelectedReason] = useState<FreshBagNotCollectedReason>('absent');
  const [quantity, setQuantity] = useState(1);

  const handleSave = () => {
    const date = getCurrentInputDate();
    const workData = getWorkData(date);
    
    const newEntry = {
      reason: selectedReason,
      quantity,
      createdAt: new Date().toISOString(),
    };
    
    const existingEntries = workData.freshBagNotCollected || [];
    
    // FreshBag에도 반영 (failedAbsent 또는 failedWithProducts)
    const freshBag = { ...workData.freshBag };
    if (selectedReason === 'absent') {
      freshBag.failedAbsent = (freshBag.failedAbsent || 0) + quantity;
    } else {
      freshBag.failedWithProducts = (freshBag.failedWithProducts || 0) + quantity;
    }
    
    updateWorkData(date, {
      freshBagNotCollected: [...existingEntries, newEntry],
      freshBag,
    });
    
    toast({ title: `프백 미회수 ${quantity}건 저장` });
    
    // 초기화 및 닫기
    setSelectedReason('absent');
    setQuantity(1);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // 초기화
      setSelectedReason('absent');
      setQuantity(1);
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">프백 미회수</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-6">
          {/* 사유 선택 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">사유</span>
            <div className="flex gap-2">
              {REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-medium text-sm
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
