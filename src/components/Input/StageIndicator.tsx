import { cn } from '@/lib/utils';

export type StageKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

interface StageIndicatorProps {
  currentStage: StageKey;
  onStageChange: (stage: StageKey) => void;
}

const stages: { key: StageKey; label: string; shortLabel: string }[] = [
  { key: 'A', label: '아침 상차', shortLabel: 'A' },
  { key: 'B', label: '203D 1회전', shortLabel: 'B' },
  { key: 'C', label: '1회전 종료', shortLabel: 'C' },
  { key: 'D', label: '2회전 상차', shortLabel: 'D' },
  { key: 'E', label: '203D 2회전', shortLabel: 'E' },
  { key: 'F', label: '하루 종료', shortLabel: 'F' },
];

export function StageIndicator({ currentStage, onStageChange }: StageIndicatorProps) {
  const currentIndex = stages.findIndex(s => s.key === currentStage);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
      <div className="flex items-center justify-between gap-1">
        {stages.map((stage, index) => {
          const isActive = stage.key === currentStage;
          const isPast = index < currentIndex;
          
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onStageChange(stage.key)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all',
                isActive && 'bg-primary text-primary-foreground',
                isPast && !isActive && 'bg-success/20 text-success',
                !isActive && !isPast && 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <span className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                isActive && 'bg-primary-foreground text-primary',
                isPast && !isActive && 'bg-success text-success-foreground',
                !isActive && !isPast && 'bg-background'
              )}>
                {stage.shortLabel}
              </span>
              <span className="text-[10px] font-medium truncate w-full text-center">
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
