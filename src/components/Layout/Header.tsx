import { Truck } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">퀵플렉스</h1>
            <p className="text-xs text-muted-foreground">수입 관리</p>
          </div>
        </div>
      </div>
    </header>
  );
}
