import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = '수량',
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            transition-colors duration-150
            ${value <= min 
              ? 'bg-muted text-muted-foreground/50 cursor-not-allowed' 
              : 'bg-muted hover:bg-muted/80 active:bg-muted/60 text-foreground'
            }
          `}
        >
          <Minus className="w-5 h-5" />
        </button>
        
        <span className="text-2xl font-bold text-foreground min-w-[3rem] text-center">
          {value}
        </span>
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            transition-colors duration-150
            ${value >= max 
              ? 'bg-muted text-muted-foreground/50 cursor-not-allowed' 
              : 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80'
            }
          `}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
