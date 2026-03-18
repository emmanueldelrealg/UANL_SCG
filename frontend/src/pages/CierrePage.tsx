import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore, useToast } from '@/store/useStore';
import { CheckCircle, Circle, AlertTriangle, Lock } from 'lucide-react';

export default function CierrePage() {
  const { fiscalYear } = useStore();
  const { success, warning } = useToast();
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Verificar Balanza de Comprobación', desc: 'Confirmar que Total Cargos = Total Abonos en todos los períodos', done: step > 0, action: 'Verificar' },
    { title: 'Calcular Depreciaciones Finales', desc: 'Registrar depreciación del último período del ejercicio', done: step > 1, action: 'Calcular' },
    { title: 'Registrar Provisiones y Ajustes', desc: 'Asientos de ajuste por diferencias temporales', done: step > 2, action: 'Registrar' },
    { title: 'Generar Asientos de Cierre', desc: 'Cerrar cuentas de resultados (grupos 4000 y 5000) y traspasar al grupo 6000', done: step > 3, action: 'Generar' },
    { title: 'Transferir Resultado al Patrimonio', desc: 'Mover saldo del grupo 6000 al 3000 (Hacienda Pública)', done: step > 4, action: 'Transferir' },
    { title: 'Cerrar Períodos y Ejercicio', desc: 'Bloquear todas las modificaciones del ejercicio fiscal', done: step > 5, action: 'Cerrar y Bloquear' },
    { title: 'Generar Apertura Siguiente Ejercicio', desc: 'Crear asientos de apertura para el próximo ejercicio fiscal', done: step > 6, action: 'Generar Apertura' },
  ];

  const handleStep = () => {
    if (step < 5) { setStep(s => s + 1); success(`Paso ${step+1} completado`); }
    else if (step === 5) { warning('Atención', 'El ejercicio será bloqueado permanentemente. ¿Confirma?'); setStep(6); }
    else { success('Cierre completado', `Ejercicio ${fiscalYear} cerrado exitosamente`); }
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Proceso guiado de cierre del ejercicio fiscal conforme CONAC — Ejercicio {fiscalYear}</p>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-500">{step}</p><p className="text-xs text-muted-foreground">Pasos Completados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{steps.length - step}</p><p className="text-xs text-muted-foreground">Pasos Pendientes</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Badge variant={step >= steps.length ? 'success' : 'warning'} className="text-sm">{step >= steps.length ? 'Cerrado' : 'En Proceso'}</Badge></CardContent></Card>
      </div>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <Card key={i} className={s.done ? 'border-green-200 bg-green-50/30' : i === step ? 'border-blue-400 shadow-md' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              {s.done ? <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" /> : i === step ? <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div> : <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
              <div className="flex-1">
                <p className={`font-medium text-sm ${s.done ? 'line-through text-muted-foreground' : ''}`}>{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              {i === step && <Button size="sm" onClick={handleStep}>{s.action}</Button>}
              {s.done && <Badge variant="success" className="text-xs">✓ Completado</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
      {step >= steps.length && (
        <Card className="border-green-400 bg-green-50">
          <CardContent className="p-4 text-center">
            <Lock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-green-800">Ejercicio Fiscal {fiscalYear} Cerrado</p>
            <p className="text-sm text-green-700 mt-1">Todos los períodos han sido bloqueados. No se pueden realizar modificaciones.</p>
          </CardContent>
        </Card>
      )}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Referencia Normativa</p>
          <p className="text-xs text-yellow-700 mt-1">El cierre del ejercicio debe realizarse conforme al Manual de Contabilidad Gubernamental emitido por CONAC, asegurando que los estados financieros cumplan con la NIF A-7 (Presentación y Revelación) y las Normas Específicas de la Información Financiera Gubernamental (NEIFG).</p>
        </CardContent>
      </Card>
    </div>
  );
}
