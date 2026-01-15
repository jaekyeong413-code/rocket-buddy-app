import { useState, useRef, useEffect } from 'react';
import { Plus, X, Package, RefreshCcw, Hash, Truck } from 'lucide-react';
import { FreshBagNotCollectedSheet } from './FreshBagNotCollectedSheet';
import { ReturnNotCollectedSheet } from './ReturnNotCollectedSheet';
import { UndeliveredSheet } from './UndeliveredSheet';
import { NumberedSheet } from './NumberedSheet';

type SheetType = 'freshBag' | 'return' | 'undelivered' | 'numbered' | null;

export function QuickActionFAB() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        fabRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !fabRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuItemClick = (type: SheetType) => {
    setIsMenuOpen(false);
    setActiveSheet(type);
  };

  const menuItems = [
    {
      id: 'freshBag' as const,
      label: '프백 미회수',
      icon: Package,
    },
    {
      id: 'return' as const,
      label: '반품 미회수',
      icon: RefreshCcw,
    },
    {
      id: 'undelivered' as const,
      label: '미배송',
      icon: Truck,
    },
    {
      id: 'numbered' as const,
      label: '채번',
      icon: Hash,
    },
  ];

  return (
    <>
      {/* Overlay for menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 animate-scale-in"
          style={{
            bottom: 'calc(5rem + 56px + 8px)', // nav(5rem) + FAB(56px) + gap(8px)
            right: '1rem',
          }}
        >
          <div 
            className="rounded-2xl overflow-hidden shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5
                  text-foreground font-medium text-sm
                  transition-colors duration-150
                  hover:bg-white/20 active:bg-white/30
                  ${index !== menuItems.length - 1 ? 'border-b border-white/20' : ''}
                `}
                style={{ minWidth: '140px' }}
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        ref={fabRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`
          fixed z-50 w-14 h-14 rounded-full
          flex items-center justify-center
          shadow-lg transition-all duration-200
          ${isMenuOpen 
            ? 'bg-muted text-muted-foreground rotate-45' 
            : 'bg-gradient-primary text-white'
          }
        `}
        style={{
          bottom: 'calc(5rem + 8px)', // nav height(5rem) + gap(8px)
          right: '1rem',
        }}
      >
        {isMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Bottom Sheets */}
      <FreshBagNotCollectedSheet
        isOpen={activeSheet === 'freshBag'}
        onClose={() => setActiveSheet(null)}
      />
      <ReturnNotCollectedSheet
        isOpen={activeSheet === 'return'}
        onClose={() => setActiveSheet(null)}
      />
      <UndeliveredSheet
        isOpen={activeSheet === 'undelivered'}
        onClose={() => setActiveSheet(null)}
      />
      <NumberedSheet
        isOpen={activeSheet === 'numbered'}
        onClose={() => setActiveSheet(null)}
      />
    </>
  );
}
