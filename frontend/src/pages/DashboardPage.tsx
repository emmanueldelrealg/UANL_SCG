import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { budgetApi, reportsApi, entriesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, FileText, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#1e3a5f','#f59e0b','#10b981','#ef4444','#6366f1','#8b5cf6'];

export default function DashboardPage() {
  const { fiscalYear } = useStore();
  const [budgetSummary, setBudgetSummary] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [eaepe, setEaepe] = useState<any>(null);
  const [eai, setEai] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      budgetApi.getLinesSummary({ fiscalYear }),
      entriesApi.getAll({ fiscalYear, limit: 8, page: 1 }),
      reportsApi.getEAEPE({ fiscalYear }),
      reportsApi.getEAI({ fiscalYear }),
    ]).then(([bs, re, ea, ei]) => {
      setBudgetSummary(bs.data.data || []);
      setRecentEntries(re.data.data || []);
      setEaepe(ea.data);
      setEai(ei.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [fiscalYear]);

  const totalAprobado = budgetSummary.reduce((s, r) => s + (r.aprobado || 0), 0);
  const totalEjercido = budgetSummary.reduce((s, r) => s + (r.ejercido || 0), 0);
  const totalPagado = budgetSummary.reduce((s, r) => s + (r.pagado || 0), 0);
  const totalDisponible = budgetSummary.reduce((s, r) => s + (r.disponible || 0), 0);
  const pctEjercido = totalAprobado > 0 ? (totalEjercido / totalAprobado * 100).toFixed(1) : '0';

  const capituloNames: Record<string, string> = {
    '1000': 'Serv. Personales', '2000': 'Mat. y Suministros', '3000': 'Serv. Generales',
    '4000': 'Transferencias', '5000': 'Bienes Muebles', '6000': 'Inversión Pública',
    '9000': 'Deuda Pública'
  };

  const chartData = budgetSummary.map(r => ({
    name: capituloNames[r.cog_capitulo] || r.cog_capitulo,
    Aprobado: r.aprobado, Ejercido: r.ejercido, Disponible: r.disponible
  }));

  const pieData = budgetSummary.filter(r => r.ejercido > 0).map(r => ({
    name: capituloNames[r.cog_capitulo] || r.cog_capitulo,
    value: r.ejercido
  }));

  const ingresoEstimado = eai?.data?.totals?.estimado || 0;
  const ingresoRecaudado = eai?.data?.totals?.recaudado || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dashboard — Ejercicio Fiscal {fiscalYear}</h2>
        <p className="text-muted-foreground text-sm">Vista general del estado financiero y presupuestal</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Presupuesto Aprobado', value: formatCurrency(totalAprobado), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Presupuesto Ejercido', value: formatCurrency(totalEjercido), sub: `${pctEjercido}% del aprobado`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { title: 'Presupuesto Disponible', value: formatCurrency(totalDisponible), icon: CheckCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { title: 'Ingresos Recaudados', value: formatCurrency(ingresoRecaudado), sub: `Meta: ${formatCurrency(ingresoEstimado)}`, icon: TrendingDown, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-xl font-bold mt-1">{loading ? '...' : kpi.value}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
                </div>
                <div className={`p-3 rounded-lg ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget by Capítulo */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Presupuesto por Capítulo de Gasto</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-48 flex items-center justify-center text-muted-foreground">Cargando...</div> :
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Aprobado" fill="#1e3a5f" />
                  <Bar dataKey="Ejercido" fill="#10b981" />
                  <Bar dataKey="Disponible" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            }
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribución del Gasto Ejercido</CardTitle></CardHeader>
          <CardContent>
            {loading || !pieData.length ? <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div> :
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            }
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimas Pólizas Registradas</CardTitle>
          <Link to="/entries" className="text-xs text-primary hover:underline">Ver todas →</Link>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground text-sm">Cargando...</p> :
            <div className="space-y-2">
              {recentEntries.slice(0,6).map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.status==='Autorizada'?'bg-green-500':e.status==='Cancelada'?'bg-red-500':'bg-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium">{e.folio}</span>
                      <span className="text-xs text-muted-foreground truncate">{e.concept}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.date} • {e.momento || e.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{formatCurrency(e.total_debit)}</p>
                  </div>
                </div>
              ))}
              {!recentEntries.length && <p className="text-muted-foreground text-sm text-center py-4">No hay pólizas registradas</p>}
            </div>
          }
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/entries', label: 'Nueva Póliza', icon: FileText, color: 'bg-blue-600' },
          { to: '/budget', label: 'Control Presupuestal', icon: DollarSign, color: 'bg-green-600' },
          { to: '/balanza', label: 'Balanza Comprobación', icon: BookOpen, color: 'bg-purple-600' },
          { to: '/reports/eaepe', label: 'EAEPE', icon: TrendingUp, color: 'bg-yellow-600' },
        ].map(q => (
          <Link key={q.to} to={q.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${q.color}`}><q.icon className="h-4 w-4 text-white" /></div>
                <span className="text-sm font-medium">{q.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
