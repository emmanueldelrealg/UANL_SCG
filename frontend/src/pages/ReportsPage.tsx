import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Estado de Situación Financiera ──────────────────────────
function SituacionFinanciera({ data }: { data: any }) {
  if (!data) return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
  const activo = data[1000] || [];
  const pasivo = data[2000] || [];
  const patrimonio = data[3000] || [];
  const totalActivo = activo.reduce((s: number, r: any) => s + r.balance, 0);
  const totalPasivo = pasivo.reduce((s: number, r: any) => s + r.balance, 0);
  const totalPatrimonio = patrimonio.reduce((s: number, r: any) => s + r.balance, 0);
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="font-bold text-center text-sm bg-primary text-primary-foreground p-2 rounded mb-2">ACTIVO</h3>
        {activo.filter((r:any)=>Math.abs(r.balance)>0).map((r:any,i:number)=>(
          <div key={i} className="flex justify-between py-1 border-b text-xs" style={{paddingLeft:`${(r.level-2)*12}px`}}>
            <span className={r.level===2?'font-semibold':''}>{r.code} {r.name}</span>
            <span className="font-mono">{formatCurrency(r.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 font-bold border-t-2 text-sm mt-2">
          <span>TOTAL ACTIVO</span><span className="font-mono">{formatCurrency(totalActivo)}</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-center text-sm bg-red-700 text-white p-2 rounded mb-2">PASIVO</h3>
        {pasivo.filter((r:any)=>Math.abs(r.balance)>0).map((r:any,i:number)=>(
          <div key={i} className="flex justify-between py-1 border-b text-xs" style={{paddingLeft:`${(r.level-2)*12}px`}}>
            <span className={r.level===2?'font-semibold':''}>{r.code} {r.name}</span>
            <span className="font-mono">{formatCurrency(r.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 font-bold border-t text-sm">
          <span>TOTAL PASIVO</span><span className="font-mono">{formatCurrency(totalPasivo)}</span>
        </div>
        <h3 className="font-bold text-center text-sm bg-green-700 text-white p-2 rounded my-2">HACIENDA PÚBLICA/PATRIMONIO</h3>
        {patrimonio.filter((r:any)=>Math.abs(r.balance)>0).map((r:any,i:number)=>(
          <div key={i} className="flex justify-between py-1 border-b text-xs" style={{paddingLeft:`${(r.level-2)*12}px`}}>
            <span>{r.code} {r.name}</span><span className="font-mono">{formatCurrency(r.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 font-bold border-t text-sm">
          <span>TOTAL PATRIMONIO</span><span className="font-mono">{formatCurrency(totalPatrimonio)}</span>
        </div>
        <div className="flex justify-between py-2 font-bold border-t-2 text-sm bg-muted px-2 rounded">
          <span>TOTAL PASIVO + PATRIMONIO</span><span className="font-mono">{formatCurrency(totalPasivo+totalPatrimonio)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Estado de Actividades ────────────────────────────────────
function EstadoActividades({ data }: { data: any }) {
  if (!data) return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
  const ingresos = (data[4000] || []).filter((r:any)=>Math.abs(r.balance)>0);
  const gastos = (data[5000] || []).filter((r:any)=>Math.abs(r.balance)>0);
  const resultado = (data[6000] || []);
  const totalIngresos = ingresos.reduce((s:number,r:any)=>s+r.credits,0);
  const totalGastos = gastos.reduce((s:number,r:any)=>s+r.debits,0);
  const ahorro = totalIngresos - totalGastos;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-sm bg-green-700 text-white p-2 rounded mb-2">INGRESOS DE GESTIÓN</h3>
        {ingresos.map((r:any,i:number)=>(
          <div key={i} className="flex justify-between py-1 border-b text-xs" style={{paddingLeft:`${(r.level-2)*12}px`}}>
            <span className={r.level===2?'font-semibold':''}>{r.code} {r.name}</span>
            <span className="font-mono text-green-700">{formatCurrency(r.credits)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 font-bold border-t-2 text-sm"><span>TOTAL INGRESOS</span><span className="font-mono text-green-700">{formatCurrency(totalIngresos)}</span></div>
      </div>
      <div>
        <h3 className="font-bold text-sm bg-red-700 text-white p-2 rounded mb-2">GASTOS DE FUNCIONAMIENTO</h3>
        {gastos.map((r:any,i:number)=>(
          <div key={i} className="flex justify-between py-1 border-b text-xs" style={{paddingLeft:`${(r.level-2)*12}px`}}>
            <span className={r.level===2?'font-semibold':''}>{r.code} {r.name}</span>
            <span className="font-mono text-red-700">{formatCurrency(r.debits)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 font-bold border-t-2 text-sm"><span>TOTAL GASTOS</span><span className="font-mono text-red-700">{formatCurrency(totalGastos)}</span></div>
      </div>
      <div className={`flex justify-between py-3 font-bold text-sm p-3 rounded ${ahorro>=0?'bg-green-50 text-green-800':'bg-red-50 text-red-800'}`}>
        <span>{ahorro >= 0 ? 'AHORRO DEL EJERCICIO' : 'DESAHORRO DEL EJERCICIO'}</span>
        <span className="font-mono">{formatCurrency(Math.abs(ahorro))}</span>
      </div>
    </div>
  );
}

export default function ReportsPage({ reportType }: { reportType?: string }) {
  const { fiscalYear, period } = useStore();
  const [sfData, setSfData] = useState<any>(null);
  const [actData, setActData] = useState<any>(null);
  const [eaepe, setEaepe] = useState<any>(null);
  const [eai, setEai] = useState<any>(null);
  const [eaepeClasif, setEaepeClasif] = useState('objeto');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { fiscalYear, period: period || undefined };
    Promise.all([
      reportsApi.getSituacionFinanciera(params),
      reportsApi.getActividades(params),
      reportsApi.getEAEPE({ fiscalYear, clasificacion: eaepeClasif }),
      reportsApi.getEAI({ fiscalYear }),
    ]).then(([sf, act, ea, ei]) => {
      setSfData(sf.data.data);
      setActData(act.data.data);
      setEaepe(ea.data);
      setEai(ei.data);
    }).finally(() => setLoading(false));
  }, [fiscalYear, period, eaepeClasif]);

  const ReportHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="mb-6 text-center border-b pb-4">
      <p className="font-bold text-sm">MUNICIPIO / ENTIDAD PÚBLICA</p>
      <h2 className="text-lg font-bold mt-1">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <p className="text-xs text-muted-foreground">Cifras en pesos mexicanos | Ref: LGCG Art. 48</p>
      <div className="flex justify-end gap-2 mt-2 no-print">
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Imprimir</Button>
      </div>
    </div>
  );

  const type = reportType || 'situacion';

  return (
    <div className="space-y-4">
      {type === 'situacion' && (
        <Card>
          <CardContent className="p-6">
            <ReportHeader title="ESTADO DE SITUACIÓN FINANCIERA" subtitle={`Al ${period ? `${new Date(fiscalYear, (period||1)-1, 1).toLocaleString('es-MX',{month:'long'})} de ${fiscalYear}` : `31 de Diciembre de ${fiscalYear}`}`} />
            {loading ? <div className="text-center py-8">Cargando...</div> : <SituacionFinanciera data={sfData} />}
          </CardContent>
        </Card>
      )}
      {type === 'actividades' && (
        <Card>
          <CardContent className="p-6">
            <ReportHeader title="ESTADO DE ACTIVIDADES" subtitle={`Del 1 de Enero al ${period ? `${new Date(fiscalYear, (period||12)-1, 28).toLocaleString('es-MX',{month:'long',day:'numeric'})}` : '31 de Diciembre'} de ${fiscalYear}`} />
            {loading ? <div className="text-center py-8">Cargando...</div> : <EstadoActividades data={actData} />}
          </CardContent>
        </Card>
      )}
      {type === 'eaepe' && (
        <Card>
          <CardContent className="p-6">
            <ReportHeader title="ESTADO ANALÍTICO DEL EJERCICIO DEL PRESUPUESTO DE EGRESOS (EAEPE)" subtitle={`Ejercicio Fiscal ${fiscalYear} | Ref: LGCG Art. 53 Fracc. I`} />
            <div className="mb-4 flex gap-2">
              {['objeto','programa','unidad'].map(c => (
                <button key={c} onClick={() => setEaepeClasif(c)} className={`px-3 py-1 text-xs rounded-full border ${eaepeClasif===c?'bg-primary text-primary-foreground':'bg-background'}`}>
                  {c==='objeto'?'Por Objeto del Gasto':c==='programa'?'Por Programa':'Por Unidad Responsable'}
                </button>
              ))}
            </div>
            {eaepe && (
              <Table>
                <TableHeader><TableRow className="bg-muted text-xs">
                  <TableHead>Clasificación</TableHead>
                  <TableHead className="text-right">Aprobado</TableHead>
                  <TableHead className="text-right">Modificado</TableHead>
                  <TableHead className="text-right">Comprometido</TableHead>
                  <TableHead className="text-right">Devengado</TableHead>
                  <TableHead className="text-right">Ejercido</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {eaepe.data?.map((r:any,i:number)=>(
                    <TableRow key={i} className="text-xs">
                      <TableCell>{eaepeClasif==='objeto'?r.cog_capitulo:eaepeClasif==='programa'?r.programa:r.unidad_responsable}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.ap)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.mo)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.co)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.de)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.ej)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.pa)}</TableCell>
                      <TableCell className="text-right text-green-700">{formatCurrency(r.di)}</TableCell>
                    </TableRow>
                  ))}
                  {eaepe.totals && <TableRow className="font-bold bg-muted text-xs">
                    <TableCell>TOTALES</TableCell>
                    <TableCell className="text-right">{formatCurrency(eaepe.totals.ap)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eaepe.totals.mo)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eaepe.totals.co)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eaepe.totals.de)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eaepe.totals.ej)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eaepe.totals.pa)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eaepe.totals.di)}</TableCell>
                  </TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      {type === 'eai' && (
        <Card>
          <CardContent className="p-6">
            <ReportHeader title="ESTADO ANALÍTICO DE INGRESOS (EAI)" subtitle={`Ejercicio Fiscal ${fiscalYear} | Ref: LGCG Art. 53 Fracc. II`} />
            {eai && (
              <Table>
                <TableHeader><TableRow className="bg-muted text-xs">
                  <TableHead>Rubro</TableHead><TableHead>Concepto</TableHead><TableHead>Fuente</TableHead>
                  <TableHead className="text-right">Estimado</TableHead><TableHead className="text-right">Modificado</TableHead>
                  <TableHead className="text-right">Devengado</TableHead><TableHead className="text-right">Recaudado</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {eai.data?.lines?.map((r:any,i:number)=>(
                    <TableRow key={i} className="text-xs">
                      <TableCell>{r.rubro}</TableCell><TableCell>{r.rubro_nombre}</TableCell>
                      <TableCell>{r.fuente_financiamiento||'-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.estimado)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.modificado)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.devengado||0)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(r.recaudado||0)}</TableCell>
                      <TableCell className="text-right">{r.estimado>0?`${((r.recaudado||0)/r.estimado*100).toFixed(1)}%`:'-'}</TableCell>
                    </TableRow>
                  ))}
                  {eai.data?.totals && <TableRow className="font-bold bg-muted text-xs">
                    <TableCell colSpan={3}>TOTALES</TableCell>
                    <TableCell className="text-right">{formatCurrency(eai.data.totals.estimado)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eai.data.totals.modificado)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(eai.data.totals.recaudado)}</TableCell>
                    <TableCell className="text-right">{eai.data.totals.estimado>0?`${(eai.data.totals.recaudado/eai.data.totals.estimado*100).toFixed(1)}%`:'-'}</TableCell>
                  </TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      {!['situacion','actividades','eaepe','eai'].includes(type) && (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <p className="font-medium">Reporte en construcción</p>
          <p className="text-sm mt-1">Este estado financiero estará disponible próximamente</p>
        </CardContent></Card>
      )}
    </div>
  );
}
