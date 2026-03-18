import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast, useStore } from '../store/useStore';
import { Plus, Calendar, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';

interface FiscalPeriod {
  id: number;
  year: number;
  month: number;
  name: string;
  status: 'Abierto' | 'Cerrado';
  openDate?: string;
  closeDate?: string;
}

interface FiscalYear {
  id: number;
  year: number;
  name: string;
  status: 'Abierto' | 'Cerrado' | 'En Proceso de Cierre';
  openDate: string;
  closeDate?: string;
  periods?: FiscalPeriod[];
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const STATUS_COLORS: Record<string, string> = {
  'Abierto': 'bg-green-100 text-green-800 border-green-200',
  'Cerrado': 'bg-gray-100 text-gray-700 border-gray-300',
  'En Proceso de Cierre': 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function FiscalYearsPage() {
  const [years, setYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ year: new Date().getFullYear() + 1, name: '' });
  const { fiscalYear: currentFY, setFiscalYear } = useStore();
  const toast = useToast();

  useEffect(() => {
    loadYears();
  }, []);

  async function loadYears() {
    setLoading(true);
    try {
      const res = await fetch('/api/budget/fiscal-years', {
        headers: { Authorization: `Bearer ${localStorage.getItem('scg_token')}` },
      });
      const data = await res.json();
      if (data.data?.length) {
        setYears(data.data);
      } else {
        setDemoData();
      }
    } catch {
      setDemoData();
    }
    setLoading(false);
  }

  function setDemoData() {
    setYears([
      {
        id: 1,
        year: 2025,
        name: 'Ejercicio Fiscal 2025',
        status: 'Abierto',
        openDate: '2025-01-01',
        periods: MONTHS.map((name, i) => ({
          id: i + 1,
          year: 2025,
          month: i + 1,
          name,
          status: i < 5 ? 'Cerrado' : 'Abierto',
          openDate: `2025-${String(i+1).padStart(2,'0')}-01`,
          closeDate: i < 5 ? `2025-${String(i+1).padStart(2,'0')}-${[31,28,31,30,31][i] || 30}` : undefined,
        })),
      },
      {
        id: 2,
        year: 2024,
        name: 'Ejercicio Fiscal 2024',
        status: 'Cerrado',
        openDate: '2024-01-01',
        closeDate: '2024-12-31',
      },
    ]);
  }

  async function handleCreate() {
    if (!form.year || !form.name) {
      toast.error('Complete todos los campos');
      return;
    }
    try {
      const res = await fetch('/api/budget/fiscal-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('scg_token')}`,
        },
        body: JSON.stringify({ year: form.year, name: form.name }),
      });
      if (res.ok) {
        toast.success(`Ejercicio Fiscal ${form.year} creado`);
        setShowDialog(false);
        loadYears();
      } else {
        toast.error('Error al crear el ejercicio fiscal');
      }
    } catch {
      toast.error('Error de conexión');
    }
  }

  async function togglePeriod(fyId: number, period: FiscalPeriod) {
    const newStatus = period.status === 'Abierto' ? 'Cerrado' : 'Abierto';
    try {
      await fetch(`/api/budget/fiscal-periods/${period.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('scg_token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Período ${period.name} ${newStatus === 'Cerrado' ? 'cerrado' : 'abierto'}`);
      loadYears();
    } catch {
      // Update locally for demo
      setYears(prev => prev.map(y =>
        y.id === fyId
          ? {
              ...y,
              periods: y.periods?.map(p =>
                p.id === period.id ? { ...p, status: newStatus as 'Abierto' | 'Cerrado' } : p
              ),
            }
          : y
      ));
    }
  }

  function selectYear(yr: FiscalYear) {
    setFiscalYear(yr.year);
    toast.success(`Ejercicio activo: ${yr.year}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Ejercicios y Períodos Fiscales</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión del ejercicio fiscal activo y apertura/cierre de períodos contables</p>
        </div>
        <Button onClick={() => { setForm({ year: new Date().getFullYear() + 1, name: `Ejercicio Fiscal ${new Date().getFullYear() + 1}` }); setShowDialog(true); }} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Current fiscal year indicator */}
      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-600" />
            <div>
              <div className="font-semibold text-amber-800 dark:text-amber-200">Ejercicio Fiscal Activo</div>
              <div className="text-2xl font-bold text-amber-600">{currentFY}</div>
            </div>
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300">
            Seleccione un ejercicio para activarlo en el sistema
          </div>
        </CardContent>
      </Card>

      {/* Years list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando ejercicios fiscales...</div>
      ) : (
        <div className="space-y-4">
          {years.map(fy => (
            <Card key={fy.id} className={fy.year === currentFY ? 'border-amber-400 ring-1 ring-amber-400' : ''}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpanded(expanded === fy.id ? null : fy.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expanded === fy.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <CardTitle className="text-base">{fy.name}</CardTitle>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Apertura: {new Date(fy.openDate).toLocaleDateString('es-MX')}
                        {fy.closeDate && ` • Cierre: ${new Date(fy.closeDate).toLocaleDateString('es-MX')}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[fy.status]}`}>
                      {fy.status}
                    </span>
                    {fy.year === currentFY ? (
                      <Badge className="bg-amber-500 text-white">Activo</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { e.stopPropagation(); selectYear(fy); }}
                        disabled={fy.status === 'Cerrado'}
                      >
                        Activar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Periods grid */}
              {expanded === fy.id && (
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(fy.periods || MONTHS.map((name, i) => ({
                      id: i + 1,
                      year: fy.year,
                      month: i + 1,
                      name,
                      status: 'Cerrado' as const,
                    }))).map(period => (
                      <div
                        key={period.id}
                        className={`rounded-lg border p-3 text-center ${
                          period.status === 'Abierto'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                        }`}
                      >
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                          {period.name.slice(0, 3)}
                        </div>
                        <div className={`text-xs mb-2 font-medium ${
                          period.status === 'Abierto' ? 'text-green-700 dark:text-green-400' : 'text-gray-500'
                        }`}>
                          {period.status}
                        </div>
                        {fy.status !== 'Cerrado' && (
                          <button
                            onClick={() => togglePeriod(fy.id, period)}
                            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                              period.status === 'Abierto'
                                ? 'border-red-300 text-red-600 hover:bg-red-50'
                                : 'border-green-300 text-green-600 hover:bg-green-50'
                            }`}
                            title={period.status === 'Abierto' ? 'Cerrar período' : 'Abrir período'}
                          >
                            {period.status === 'Abierto' ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-600 font-medium">
                      {(fy.periods || []).filter(p => p.status === 'Abierto').length} períodos abiertos
                    </span>
                    <span className="text-gray-500">
                      {(fy.periods || []).filter(p => p.status === 'Cerrado').length} períodos cerrados
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* CONAC note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>Nota normativa:</strong> El ejercicio fiscal corresponde al año calendario (1 enero — 31 diciembre).
        Los períodos contables mensuales deben cerrarse de manera secuencial. Conforme al Art. 9 de la LGCG,
        el cierre definitivo del ejercicio debe realizarse dentro de los 30 días hábiles siguientes al cierre del año.
      </div>

      {/* Create dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Ejercicio Fiscal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Año Fiscal *</Label>
              <Input
                type="number"
                value={form.year}
                onChange={e => setForm({ ...form, year: parseInt(e.target.value), name: `Ejercicio Fiscal ${e.target.value}` })}
                min={2020}
                max={2035}
              />
            </div>
            <div className="space-y-1">
              <Label>Nombre del Ejercicio *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={`Ejercicio Fiscal ${form.year}`}
              />
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-3 text-xs text-amber-700 dark:text-amber-300">
              Al crear el ejercicio se generarán automáticamente los 12 períodos mensuales en estado <strong>Abierto</strong>.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreate} className="bg-amber-500 hover:bg-amber-600 text-white">
                Crear Ejercicio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
