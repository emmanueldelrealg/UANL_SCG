import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertCircle, Download, Printer } from 'lucide-react';
import { ACCOUNT_GROUPS } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function BalanzaPage() {
  const { fiscalYear, period } = useStore();
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [level, setLevel] = useState('4');
  const [filterGroup, setFilterGroup] = useState('all');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    reportsApi.getBalanza({ fiscalYear, period: period || undefined, level }).then(r => {
      setData(r.data.data || []);
      setTotals(r.data.totals);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [fiscalYear, period, level]);

  const filtered = filterGroup === 'all' ? data : data.filter(r => r.groupNum === Number(filterGroup));

  const exportExcel = () => {
    const rows = filtered.map(r => ({
      'Código': r.accountCode, 'Nombre': r.accountName, 'Nivel': r.level,
      'Saldo Inicial': r.initialBalance, 'Cargos': r.debits, 'Abonos': r.credits, 'Saldo Final': r.finalBalance
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balanza');
    XLSX.writeFile(wb, `Balanza_${fiscalYear}_${period ? MONTHS[period-1] : 'Anual'}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Verifica la igualdad entre Cargos y Abonos (Partida Doble)</p>
          <p className="text-xs text-muted-foreground">Ref: LGCG Art. 48 • CONAC Manual de Contabilidad Gubernamental</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Imprimir</Button>
          <Button size="sm" variant="outline" onClick={exportExcel}><Download className="h-4 w-4 mr-1" />Excel</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-3 items-center flex-wrap">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Nivel 1 (Grupos)</SelectItem>
              <SelectItem value="2">Nivel 2 (Subgrupos)</SelectItem>
              <SelectItem value="3">Nivel 3 (Cuentas)</SelectItem>
              <SelectItem value="4">Nivel 4 (Subcuentas)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {Object.entries(ACCOUNT_GROUPS).map(([k, v]) => <SelectItem key={k} value={k}>{k} - {v}</SelectItem>)}
            </SelectContent>
          </Select>
          {totals && (
            <div className="ml-auto flex items-center gap-2">
              {totals.balanced
                ? <><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm text-green-700 font-medium">Balanceada</span></>
                : <><AlertCircle className="h-4 w-4 text-red-600" /><span className="text-sm text-red-700 font-medium">Desbalanceada</span></>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {/* Official Header */}
        <CardHeader className="border-b bg-muted/50 print-only">
          <p className="text-center font-bold">MUNICIPIO DE [NOMBRE] — EJERCICIO FISCAL {fiscalYear}</p>
          <p className="text-center font-semibold">BALANZA DE COMPROBACIÓN</p>
          <p className="text-center text-sm">{period ? `Período: ${MONTHS[period-1]} ${fiscalYear}` : `Enero - Diciembre ${fiscalYear}`}</p>
          <p className="text-center text-xs text-muted-foreground">Cifras expresadas en pesos mexicanos</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground text-xs">
                <TableHead className="text-primary-foreground w-32">Código</TableHead>
                <TableHead className="text-primary-foreground">Nombre de la Cuenta</TableHead>
                <TableHead className="text-primary-foreground w-16 text-center">Nivel</TableHead>
                <TableHead className="text-primary-foreground text-right w-36">Saldo Inicial</TableHead>
                <TableHead className="text-primary-foreground text-right w-36">Cargos</TableHead>
                <TableHead className="text-primary-foreground text-right w-36">Abonos</TableHead>
                <TableHead className="text-primary-foreground text-right w-36">Saldo Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Calculando balanza...</TableCell></TableRow>
                : filtered.filter(r => r.debits > 0 || r.credits > 0).map((r, i) => (
                  <TableRow key={i} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{r.accountCode}</TableCell>
                    <TableCell>{r.accountName}</TableCell>
                    <TableCell className="text-center">{r.level}</TableCell>
                    <TableCell className="text-right">{r.initialBalance !== 0 ? formatCurrency(r.initialBalance) : '-'}</TableCell>
                    <TableCell className="text-right text-blue-700">{r.debits !== 0 ? formatCurrency(r.debits) : '-'}</TableCell>
                    <TableCell className="text-right text-purple-700">{r.credits !== 0 ? formatCurrency(r.credits) : '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${r.finalBalance < 0 ? 'text-red-600' : ''}`}>{formatCurrency(r.finalBalance)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
            {totals && (
              <tfoot>
                <tr className="border-t-2 border-primary bg-primary/5 font-bold text-sm">
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold">SUMAS TOTALES</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(totals.debits)}</td>
                  <td className="px-4 py-3 text-right text-purple-700">{formatCurrency(totals.credits)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totals.debits - totals.credits)}</td>
                </tr>
                <tr className="bg-muted/30 text-xs">
                  <td colSpan={7} className="px-4 py-2 text-center text-muted-foreground">
                    {totals.balanced
                      ? '✅ Cargos = Abonos — Principio de Partida Doble verificado'
                      : `⚠️ Diferencia: ${formatCurrency(Math.abs(totals.debits - totals.credits))}`}
                  </td>
                </tr>
              </tfoot>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
