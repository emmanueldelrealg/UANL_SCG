import { useStore } from '@/store/useStore';
import { MONTHS } from '@/lib/utils';
import { Moon, Sun, Bell } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Header({ title }: { title?: string }) {
  const { fiscalYear, setFiscalYear, period, setPeriod, darkMode, toggleDarkMode, user } = useStore();
  return (
    <header className="h-14 border-b bg-background flex items-center gap-4 px-6 no-print">
      <h1 className="font-semibold text-lg text-primary truncate flex-1">{title || 'Sistema de Contabilidad Gubernamental'}</h1>
      <div className="flex items-center gap-2">
        {/* Fiscal Year */}
        <Select value={String(fiscalYear)} onValueChange={v => setFiscalYear(Number(v))}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2023,2024,2025,2026].map(y => <SelectItem key={y} value={String(y)}>EF {y}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* Period */}
        <Select value={period ? String(period) : 'all'} onValueChange={v => setPeriod(v === 'all' ? null : Number(v))}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anual</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={toggleDarkMode} className="p-2 hover:bg-muted rounded-md text-muted-foreground">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-2 pl-2 border-l">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium leading-tight">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
