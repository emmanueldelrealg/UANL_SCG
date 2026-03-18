import { useEffect, useState } from 'react';
import { educationalApi } from '@/lib/api';
import { useStore, useToast } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, GraduationCap, CheckCircle, Award, Search, AlertCircle } from 'lucide-react';

export default function EducationalPage({ module }: { module?: string }) {
  const m = module || 'glossary';
  const { user } = useStore();
  const { success, error } = useToast();
  const [glossary, setGlossary] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedEx, setSelectedEx] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (m === 'glossary') educationalApi.getGlossary({ search: search||undefined, category: catFilter!=='all'?catFilter:undefined }).then(r => setGlossary(r.data.data||[]));
    if (m === 'exercises') {
      educationalApi.getExercises().then(r => setExercises(r.data.data||[]));
      educationalApi.getDashboard('me').then(r => setDashboard(r.data.data));
    }
  }, [m, search, catFilter]);

  const cats = [...new Set(glossary.map(g => g.category))];

  const submitExercise = async () => {
    if (!selectedEx) return;
    setSubmitting(true);
    try {
      const res = await educationalApi.submitExercise(selectedEx.id, { entries: [] }); // Student submits via entries page
      setResult(res.data.data);
      success('Ejercicio evaluado', `Puntaje: ${res.data.data.score}/${res.data.data.maxScore}`);
    } catch (e: any) { error('Error', 'No se pudo evaluar'); }
    finally { setSubmitting(false); }
  };

  if (m === 'glossary') return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Glosario de términos CONAC — Marco normativo de Armonización Contable Gubernamental</p>
      <Card>
        <CardContent className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar término..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {glossary.map((g, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm">{g.term}</h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">{g.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{g.definition}</p>
              {g.norm_reference && (
                <div className="mt-2 flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-primary" />
                  <p className="text-xs text-primary font-mono">{g.norm_reference}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {glossary.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground">No se encontraron términos</div>
        )}
      </div>
    </div>
  );

  if (m === 'exercises') return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Banco de ejercicios prácticos de contabilidad gubernamental con retroalimentación automática</p>
      {dashboard && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Ejercicios Completados', val: dashboard.stats.totalAttempts, icon: GraduationCap },
            { label: 'Aprobados', val: dashboard.stats.passed, icon: CheckCircle },
            { label: 'Puntaje Total', val: dashboard.stats.totalScore, icon: Award },
            { label: 'Pólizas Creadas', val: dashboard.stats.entriesCreated, icon: BookOpen },
          ].map((s, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-8 w-8 text-primary" />
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.val}</p></div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exercises.map((ex, i) => (
          <Card key={i} className="hover:shadow-md cursor-pointer" onClick={() => setSelectedEx(ex)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm">{ex.title}</h3>
                <Badge variant={ex.difficulty==='Básico'?'success':ex.difficulty==='Intermedio'?'warning':'destructive'} className="text-xs">{ex.difficulty}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>
              <div className="flex items-center justify-between mt-3">
                <Badge variant="outline" className="text-xs">{ex.category}</Badge>
                <span className="text-xs text-muted-foreground">{ex.points} pts</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedEx && (
        <Dialog open={!!selectedEx} onOpenChange={() => { setSelectedEx(null); setResult(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selectedEx.title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={selectedEx.difficulty==='Básico'?'success':selectedEx.difficulty==='Intermedio'?'warning':'destructive'}>{selectedEx.difficulty}</Badge>
                <Badge variant="outline">{selectedEx.category}</Badge>
                <Badge variant="outline">{selectedEx.points} puntos</Badge>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Enunciado:</h4>
                <p className="text-sm">{selectedEx.description}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm text-blue-800">Pistas:</h4>
                {(selectedEx.hints || []).map((h: string, i: number) => (
                  <p key={i} className="text-xs text-blue-700 flex items-start gap-1"><span className="font-bold">{i+1}.</span>{h}</p>
                ))}
              </div>
              <div className="p-3 border rounded-lg text-xs">
                <p className="font-medium flex items-center gap-1"><BookOpen className="h-3 w-3" />Referencia normativa:</p>
                <p className="text-muted-foreground mt-0.5">{selectedEx.norm_reference}</p>
              </div>
              {result && (
                <div className={`p-4 rounded-lg ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.passed ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                    <p className={`font-bold ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                      {result.passed ? '¡Aprobado!' : 'Necesita mejorar'} — {result.score}/{result.maxScore} puntos
                    </p>
                  </div>
                  {result.feedback.map((f: string, i: number) => <p key={i} className="text-xs mt-1">{f}</p>)}
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="font-semibold text-xs">Explicación:</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.explanation}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setSelectedEx(null); setResult(null); }}>Cerrar</Button>
                <Button onClick={submitExercise} disabled={submitting}>{submitting ? 'Evaluando...' : 'Evaluar mi respuesta'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  if (m === 'tutorials') return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Guías paso a paso para cada proceso del sistema de contabilidad gubernamental</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Apertura del Ejercicio Fiscal', steps: ['Configurar ejercicio fiscal','Cargar presupuesto aprobado','Generar asientos de apertura','Verificar saldos iniciales'], norm: 'CONAC Guía No.1' },
          { title: 'Registro de Nómina Quincenal', steps: ['Comprometer nómina (orden de servicio)','Devengar: reconocer la obligación','Ejercer: expedir el cheque/transferencia','Pagar: depositar a trabajadores'], norm: 'CONAC Guía No.3' },
          { title: 'Compra de Bienes y Servicios', steps: ['Comprometer: firma de contrato/OC','Devengar: recibir factura/bien','Ejercer: expedir cheque','Pagar: transferencia bancaria'], norm: 'CONAC Guías No.5 y 6' },
          { title: 'Recaudación de Ingresos', steps: ['Estimar ingresos en el presupuesto','Modificar estimaciones','Devengar el derecho de cobro','Recaudar: ingreso a tesorería'], norm: 'CONAC Guías Ingresos' },
          { title: 'Depreciación de Activos', steps: ['Identificar activos depreciables','Calcular tasa anual (vida útil)','Registrar mensualmente','Actualizar valor en libros'], norm: 'CONAC Normas Activos' },
          { title: 'Cierre del Ejercicio', steps: ['Verificar balanza cuadrada','Calcular depreciaciones finales','Traspasar resultado al patrimonio','Cerrar cuentas temporales'], norm: 'CONAC Manual Cierre' },
        ].map((t, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t.title}</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {t.steps.map((s, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{j+1}</span>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary font-mono mt-3 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />{t.norm}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return null;
}
