import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { CheckCircle, Circle, FileText, Download } from 'lucide-react';

export default function CuentaPublicaPage() {
  const { fiscalYear } = useStore();
  const sections = [
    { code:'I', title:'Introducción y Marco Jurídico', done: true, required: true },
    { code:'II', title:'Resultados Generales', done: true, required: true },
    { code:'III', title:'Información Contable', done: true, required: true,
      subsections: ['Estado de Situación Financiera','Estado de Actividades','Estado de Variación en la Hacienda Pública','Estado de Flujos de Efectivo','Estado Analítico del Activo','Notas a los EF'] },
    { code:'IV', title:'Información Presupuestal', done: true, required: true,
      subsections: ['Estado Analítico de Ingresos (EAI)','Estado Analítico del Ejercicio del Presupuesto de Egresos (EAEPE)','Endeudamiento Neto','Intereses de la Deuda','Flujo de Fondos'] },
    { code:'V', title:'Información Programática', done: false, required: true,
      subsections: ['Gasto por Categoría Programática','Programas con Recursos Federales (PASH)','Indicadores de Resultados (MIR)'] },
    { code:'VI', title:'Indicadores de Resultados', done: false, required: true },
    { code:'VII', title:'Análisis de la Deuda Pública', done: true, required: true },
  ];

  const completed = sections.filter(s => s.done).length;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Compilación anual de la Cuenta Pública conforme LGCG Art. 53 | Ejercicio Fiscal {fiscalYear}</p>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">Avance de Elaboración</p>
              <p className="text-sm text-muted-foreground">{completed}/{sections.length} secciones completas</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Descargar PDF</Button>
              <Badge variant={completed === sections.length ? 'success' : 'warning'} className="text-sm px-3 py-1">
                {completed === sections.length ? 'Lista para publicar' : 'En elaboración'}
              </Badge>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${(completed/sections.length)*100}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Sections Checklist */}
      <div className="space-y-3">
        {sections.map((s, i) => (
          <Card key={i} className={s.done ? 'border-green-200' : 'border-yellow-200'}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {s.done ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" /> : <Circle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Sección {s.code}:</span>
                    <span className="font-medium text-sm">{s.title}</span>
                    {s.required && <Badge variant="outline" className="text-xs">Obligatoria LGCG</Badge>}
                  </div>
                  {s.subsections && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {s.subsections.map((sub, j) => (
                        <div key={j} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-500" />{sub}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="sm" variant={s.done ? 'outline' : 'default'} className="text-xs">
                  {s.done ? 'Ver' : 'Completar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-blue-800">📋 Requisitos de la Cuenta Pública (LGCG Art. 53)</p>
          <p className="text-xs text-blue-700 mt-1">Conforme al artículo 53 de la Ley General de Contabilidad Gubernamental, la Cuenta Pública deberá contener como mínimo: información contable (7 estados financieros), información presupuestal (EAI, EAEPE y sus variantes de clasificación), información programática e indicadores de resultados. Todos los entes públicos deberán publicarla a más tardar el 30 de abril del año siguiente al ejercicio reportado.</p>
        </CardContent>
      </Card>
    </div>
  );
}
