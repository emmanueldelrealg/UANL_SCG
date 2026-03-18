import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDateShort, getMomentoColor } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function DiarioPage() {
  const { fiscalYear, period } = useStore();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    reportsApi.getDiario({ fiscalYear, period: period || undefined, search: search || undefined, page, limit: 100 }).then(r => {
      setData(r.data.data || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [fiscalYear, period, page, search]);

  // Group by folio
  const grouped: Record<string, any[]> = {};
  data.forEach(row => {
    if (!grouped[row.folio]) grouped[row.folio] = [];
    grouped[row.folio].push(row);
  });

  const exportExcel = () => {
    const rows = data.map(r => ({ Folio: r.folio, Fecha: r.date, Concepto: r.concept, Cuenta: r.account_code, 'Nombre Cuenta': r.account_name, Descripción: r.description, Cargo: r.debit, Abono: r.credit }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Diario');
    XLSX.writeFile(wb, `LibroDiario_${fiscalYear}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Registro cronológico de todas las pólizas y movimientos contables</p>
          <p className="text-xs text-muted-foreground">Ref: CONAC Manual de Contabilidad Gubernamental — Libro Diario</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Imprimir</Button>
          <Button size="sm" variant="outline" onClick={exportExcel}><Download className="h-4 w-4 mr-1" />Excel</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar folio, cuenta, concepto..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="text-center py-8 text-muted-foreground">Cargando...</div> :
            <div className="divide-y">
              {Object.entries(grouped).map(([folio, lines]) => {
                const first = lines[0];
                const totalD = lines.reduce((s, l) => s + l.debit, 0);
                const totalC = lines.reduce((s, l) => s + l.credit, 0);
                return (
                  <div key={folio} className="p-4 hover:bg-muted/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold">{folio}</span>
                      <span className="text-sm text-muted-foreground">{formatDateShort(first.date)}</span>
                      {first.momento && <Badge className={cn('text-xs', getMomentoColor(first.momento))}>{first.momento}</Badge>}
                      <span className="text-sm flex-1 truncate">{first.concept}</span>
                      <span className="text-sm font-medium">{formatCurrency(totalD)}</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {lines.map((l, i) => (
                        <div key={i} className="flex gap-4 text-xs">
                          <span className="font-mono w-24 text-muted-foreground">{l.account_code}</span>
                          <span className="flex-1">{l.account_name} — {l.description}</span>
                          <span className="w-28 text-right text-blue-700">{l.debit > 0 ? formatCurrency(l.debit) : ''}</span>
                          <span className="w-28 text-right text-purple-700">{l.credit > 0 ? formatCurrency(l.credit) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.keys(grouped).length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No hay movimientos para este período</div>}
            </div>
          }
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-xs text-muted-foreground">{total} movimientos totales</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Anterior</Button>
              <span className="text-sm px-2 py-1">Pág. {page}</span>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p+1)} disabled={data.length < 100}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
