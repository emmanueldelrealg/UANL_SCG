import { useState } from 'react';
import { reportsApi, accountsApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';

export default function MayorPage() {
  const { fiscalYear, period } = useStore();
  const [code, setCode] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!code) return;
    setLoading(true);
    reportsApi.getMayor(code, { fiscalYear, period: period || undefined }).then(r => setData(r.data.data)).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Movimientos detallados por cuenta contable con saldo acumulado</p>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input className="max-w-xs" placeholder="Código de cuenta (e.g. 1112)" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
            <Button onClick={load} disabled={loading}><Search className="h-4 w-4 mr-1" />Consultar</Button>
          </div>
        </CardContent>
      </Card>
      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-mono">{data.account?.code} — {data.account?.name}</CardTitle>
                <p className="text-xs text-muted-foreground">Naturaleza: {data.account?.nature} | Tipo: {data.account?.account_type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Cargos</p>
                <p className="font-bold text-blue-700">{formatCurrency(data.totalDebits)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Abonos</p>
                <p className="font-bold text-purple-700">{formatCurrency(data.totalCredits)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo Final</p>
                <p className={`font-bold ${data.finalBalance < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(data.finalBalance)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* T-Account Visual */}
            <div className="p-4 bg-muted/30 border-b">
              <p className="text-xs font-semibold text-center mb-3 text-muted-foreground">REPRESENTACIÓN EN T</p>
              <div className="flex gap-0 border-2 border-foreground rounded-sm max-w-2xl mx-auto">
                <div className="flex-1 border-r-2 border-foreground">
                  <div className="bg-blue-100 text-blue-800 text-xs font-bold p-2 text-center">CARGO (Debe)</div>
                  <div className="p-2 space-y-1 min-h-20">
                    {data.movements?.filter((m:any)=>m.debit>0).slice(0,5).map((m:any,i:number)=>(
                      <div key={i} className="flex justify-between text-xs"><span className="truncate">{m.description?.slice(0,25)}</span><span className="font-mono ml-2">{formatCurrency(m.debit)}</span></div>
                    ))}
                  </div>
                  <div className="border-t p-2 font-bold text-xs text-right text-blue-700">{formatCurrency(data.totalDebits)}</div>
                </div>
                <div className="flex-1">
                  <div className="bg-purple-100 text-purple-800 text-xs font-bold p-2 text-center">ABONO (Haber)</div>
                  <div className="p-2 space-y-1 min-h-20">
                    {data.movements?.filter((m:any)=>m.credit>0).slice(0,5).map((m:any,i:number)=>(
                      <div key={i} className="flex justify-between text-xs"><span className="truncate">{m.description?.slice(0,25)}</span><span className="font-mono ml-2">{formatCurrency(m.credit)}</span></div>
                    ))}
                  </div>
                  <div className="border-t p-2 font-bold text-xs text-right text-purple-700">{formatCurrency(data.totalCredits)}</div>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader><TableRow className="text-xs">
                <TableHead>Folio</TableHead><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead>
                <TableHead className="text-right">Cargo</TableHead><TableHead className="text-right">Abono</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.movements?.map((m:any,i:number)=>(
                  <TableRow key={i} className="text-xs">
                    <TableCell className="font-mono">{m.folio}</TableCell>
                    <TableCell>{m.date}</TableCell>
                    <TableCell><p>{m.concept}</p><p className="text-muted-foreground">{m.description}</p></TableCell>
                    <TableCell className="text-right text-blue-700">{m.debit>0?formatCurrency(m.debit):''}</TableCell>
                    <TableCell className="text-right text-purple-700">{m.credit>0?formatCurrency(m.credit):''}</TableCell>
                    <TableCell className={`text-right font-medium ${m.balance<0?'text-red-600':''}`}>{formatCurrency(m.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
