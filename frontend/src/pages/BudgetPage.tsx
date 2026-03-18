import { useEffect, useState } from 'react';
import { budgetApi } from '@/lib/api';
import { useStore, useToast } from '@/store/useStore';
import { formatCurrency, MOMENTOS_EGRESO } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function MomentoBar({ aprobado, comprometido, devengado, ejercido, pagado }: any) {
  const steps = [
    { label: 'Aprobado', val: aprobado, color: 'bg-blue-500' },
    { label: 'Comprometido', val: comprometido, color: 'bg-yellow-500' },
    { label: 'Devengado', val: devengado, color: 'bg-orange-500' },
    { label: 'Ejercido', val: ejercido, color: 'bg-purple-500' },
    { label: 'Pagado', val: pagado, color: 'bg-green-500' },
  ];
  return (
    <div className="flex gap-1 h-2 rounded overflow-hidden w-full">
      {steps.map(s => (
        <div key={s.label} title={`${s.label}: ${formatCurrency(s.val)}`}
          className={cn(s.color, 'transition-all')}
          style={{ width: aprobado > 0 ? `${Math.min(s.val/aprobado*100,100)}%` : '0%', minWidth: s.val > 0 ? '2px' : 0 }} />
      ))}
    </div>
  );
}

export default function BudgetPage() {
  const { fiscalYear } = useStore();
  const { success } = useToast();
  const [lines, setLines] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [ingresoLines, setIngresoLines] = useState<any[]>([]);
  const [mods, setMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      budgetApi.getLines({ fiscalYear }),
      budgetApi.getLinesSummary({ fiscalYear }),
      budgetApi.getIncome({ fiscalYear }),
      budgetApi.getModifications({ fiscalYear }),
    ]).then(([l, s, i, m]) => {
      setLines(l.data.data || []);
      setSummary(s.data.data || []);
      setIngresoLines(i.data.data || []);
      setMods(m.data.data || []);
    }).finally(() => setLoading(false));
  }, [fiscalYear]);

  const totalAprobado = summary.reduce((s, r) => s + r.aprobado, 0);
  const totalEjercido = summary.reduce((s, r) => s + r.ejercido, 0);
  const totalDisponible = summary.reduce((s, r) => s + r.disponible, 0);
  const pct = totalAprobado > 0 ? (totalEjercido / totalAprobado * 100) : 0;

  const chartData = summary.map(r => ({
    cap: r.cog_capitulo,
    Aprobado: r.aprobado,
    Comprometido: r.comprometido,
    Devengado: r.devengado,
    Ejercido: r.ejercido,
    Pagado: r.pagado,
    Disponible: r.disponible,
  }));

  const capituloNames: Record<string,string> = {
    '1000':'Serv. Personales','2000':'Materiales','3000':'Servicios',
    '4000':'Transferencias','5000':'Bienes Muebles','6000':'Inversión','9000':'Deuda'
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Control de los 5 Momentos del Gasto: Aprobado → Comprometido → Devengado → Ejercido → Pagado | Ref: CONAC — Momentos Contables</p>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Presupuesto Aprobado', val: totalAprobado, cls: 'text-blue-700' },
          { label: 'Presupuesto Ejercido', val: totalEjercido, cls: 'text-green-700', sub: `${pct.toFixed(1)}%` },
          { label: 'Disponible', val: totalDisponible, cls: 'text-yellow-700' },
          { label: '% Avance', val: `${pct.toFixed(1)}%`, cls: pct >= 80 ? 'text-green-700' : 'text-yellow-700', isText: true },
        ].map((k, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={cn('text-xl font-bold mt-1', k.cls)}>{(k as any).isText ? k.val : formatCurrency(k.val as number)}</p>
              {(k as any).sub && <p className="text-xs text-muted-foreground">{(k as any).sub} del aprobado</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="egresos">
        <TabsList>
          <TabsTrigger value="egresos">Presupuesto de Egresos</TabsTrigger>
          <TabsTrigger value="ingresos">Presupuesto de Ingresos</TabsTrigger>
          <TabsTrigger value="grafica">Gráfica</TabsTrigger>
          <TabsTrigger value="modificaciones">Modificaciones</TabsTrigger>
        </TabsList>

        {/* EGRESOS */}
        <TabsContent value="egresos">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capítulo</TableHead>
                    <TableHead>Concepto / Partida</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-right">Aprobado</TableHead>
                    <TableHead className="text-right">Comprometido</TableHead>
                    <TableHead className="text-right">Devengado</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead>Avance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, i) => {
                    const alertLow = l.disponible < l.aprobado * 0.1 && l.aprobado > 0;
                    return (
                      <TableRow key={i} className={alertLow ? 'bg-red-50' : ''}>
                        <TableCell className="text-xs font-mono">{l.cog_capitulo}</TableCell>
                        <TableCell className="text-xs">{l.cog_concepto}<br/><span className="text-muted-foreground">{l.cog_partida_generica}</span></TableCell>
                        <TableCell className="text-xs">{l.programa || '-'}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(l.aprobado)}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(l.comprometido)}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(l.devengado)}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(l.pagado)}</TableCell>
                        <TableCell className={cn("text-right text-xs font-medium", alertLow ? 'text-red-600' : '')}>
                          {formatCurrency(l.disponible)}
                          {alertLow && <AlertCircle className="h-3 w-3 inline ml-1 text-red-500" />}
                        </TableCell>
                        <TableCell className="w-24">
                          <MomentoBar {...l} />
                          <p className="text-xs text-muted-foreground mt-0.5 text-right">
                            {l.aprobado > 0 ? `${(l.ejercido/l.aprobado*100).toFixed(0)}%` : '-'}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INGRESOS */}
        <TabsContent value="ingresos">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubro</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead className="text-right">Estimado</TableHead>
                    <TableHead className="text-right">Modificado</TableHead>
                    <TableHead className="text-right">Devengado</TableHead>
                    <TableHead className="text-right">Recaudado</TableHead>
                    <TableHead className="text-right">% Recaudado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingresoLines.map((il, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">{il.rubro}</TableCell>
                      <TableCell className="text-xs">{il.rubro_nombre}<br/><span className="text-muted-foreground">{il.concepto_nombre}</span></TableCell>
                      <TableCell className="text-xs">{il.fuente_financiamiento || '-'}</TableCell>
                      <TableCell className="text-right text-xs">{formatCurrency(il.estimado)}</TableCell>
                      <TableCell className="text-right text-xs">{formatCurrency(il.modificado)}</TableCell>
                      <TableCell className="text-right text-xs">{formatCurrency(il.devengado || 0)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatCurrency(il.recaudado || 0)}</TableCell>
                      <TableCell className="text-right text-xs">
                        {il.estimado > 0 ? `${((il.recaudado||0)/il.estimado*100).toFixed(1)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted text-xs">
                    <TableCell colSpan={3}>TOTAL</TableCell>
                    <TableCell className="text-right">{formatCurrency(ingresoLines.reduce((s,r)=>s+r.estimado,0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ingresoLines.reduce((s,r)=>s+r.modificado,0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ingresoLines.reduce((s,r)=>s+(r.devengado||0),0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ingresoLines.reduce((s,r)=>s+(r.recaudado||0),0))}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GRÁFICA */}
        <TabsContent value="grafica">
          <Card>
            <CardHeader><CardTitle className="text-sm">Comportamiento Presupuestal por Capítulo — Todos los Momentos</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.map(d => ({ ...d, name: capituloNames[d.cap] || d.cap }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Aprobado" fill="#3b82f6" />
                  <Bar dataKey="Comprometido" fill="#eab308" />
                  <Bar dataKey="Devengado" fill="#f97316" />
                  <Bar dataKey="Ejercido" fill="#a855f7" />
                  <Bar dataKey="Pagado" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODIFICACIONES */}
        <TabsContent value="modificaciones">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mods.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">No hay modificaciones presupuestales</TableCell></TableRow>
                    : mods.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{m.folio}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{m.type}</Badge></TableCell>
                        <TableCell className="text-xs">{m.date}</TableCell>
                        <TableCell className="text-xs">{m.concept}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{formatCurrency(m.amount)}</TableCell>
                        <TableCell><Badge variant={m.status==='Autorizada'?'success':m.status==='Rechazada'?'destructive':'warning'} className="text-xs">{m.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
