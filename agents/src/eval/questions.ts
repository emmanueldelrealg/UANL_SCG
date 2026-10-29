// ================================================================
// BANCO DE PREGUNTAS — PILOTO DE EVALUACIÓN
// 10 preguntas con respuestas esperadas y criterios de puntuación.
// Clasificadas por dificultad y categoría CONAC.
// ================================================================

export interface PreguntaEval {
  id: string;
  pregunta: string;
  categoriaEsperada: string;
  // Términos que DEBEN aparecer en la respuesta (case-insensitive)
  terminos_requeridos: string[];
  // Referencias normativas que deben citarse
  citas_esperadas: string[];
  // Respuesta de referencia (para evaluación cualitativa)
  respuesta_referencia: string;
  dificultad: 'básico' | 'intermedio' | 'avanzado';
}

export const PREGUNTAS_EVAL: PreguntaEval[] = [
  // ─── BÁSICO ──────────────────────────────────────────────
  {
    id: 'P01',
    pregunta: '¿Cuántos estados financieros son obligatorios según el artículo 48 de la LGCG y cuáles son?',
    categoriaEsperada: 'estados_financieros',
    terminos_requeridos: [
      'siete', '7', 'situación financiera', 'actividades', 'flujos de efectivo',
      'hacienda pública', 'activo', 'deuda', 'notas',
    ],
    citas_esperadas: ['LGCG Art. 48'],
    respuesta_referencia: 'El Art. 48 LGCG establece 7 estados financieros: (I) Estado de Situación Financiera, (II) Estado de Actividades, (III) Estado de Variación en la HP, (IV) Estado de Flujos de Efectivo, (V) Estado Analítico del Activo, (VI) Estado Analítico de la Deuda, (VII) Notas.',
    dificultad: 'básico',
  },
  {
    id: 'P02',
    pregunta: '¿Cuáles son los cinco momentos contables de los egresos y en qué orden se registran?',
    categoriaEsperada: 'momentos_contables',
    terminos_requeridos: ['aprobado', 'comprometido', 'devengado', 'ejercido', 'pagado'],
    citas_esperadas: ['CONAC Acuerdo Momentos Contables'],
    respuesta_referencia: 'Los 5 momentos de egresos son, en orden: 1. Aprobado, 2. Comprometido, 3. Devengado, 4. Ejercido, 5. Pagado.',
    dificultad: 'básico',
  },
  {
    id: 'P03',
    pregunta: '¿Qué es el Registro Único e Integrador y qué norma lo establece?',
    categoriaEsperada: 'plan_cuentas',
    terminos_requeridos: ['único', 'integrador', 'simultáneo', 'contable', 'presupuestal', 'programático'],
    citas_esperadas: ['LGCG Art. 19'],
    respuesta_referencia: 'El Registro Único e Integrador (Art. 19 LGCG) permite registrar en tiempo real las transacciones generando simultáneamente los registros contable, presupuestal y programático.',
    dificultad: 'básico',
  },
  // ─── INTERMEDIO ──────────────────────────────────────────
  {
    id: 'P04',
    pregunta: '¿Cuál es la diferencia entre el Ramo 28 (Participaciones) y el Ramo 33 (Aportaciones) en términos de su uso y restricciones?',
    categoriaEsperada: 'ramo28_33',
    terminos_requeridos: ['participaciones', 'aportaciones', 'libre', 'etiquetados', 'FISM', 'FORTAMUN', 'condicionados'],
    citas_esperadas: ['Ley de Coordinación Fiscal'],
    respuesta_referencia: 'Ramo 28 (Participaciones) son recursos de libre disposición para cualquier gasto. Ramo 33 (Aportaciones) son recursos etiquetados y condicionados: FISM para infraestructura social, FORTAMUN para seguridad y saneamiento financiero.',
    dificultad: 'intermedio',
  },
  {
    id: 'P05',
    pregunta: '¿En qué grupo del Plan de Cuentas CONAC se registran los gastos de nómina y qué subcuenta de egresos presupuestales corresponde?',
    categoriaEsperada: 'plan_cuentas',
    terminos_requeridos: ['5000', 'gastos', 'nómina', 'servicios personales', '8000', 'cuentas de orden'],
    citas_esperadas: ['CONAC Plan de Cuentas'],
    respuesta_referencia: 'La nómina se registra en el Grupo 5000 Gastos de Funcionamiento (cuenta contable). El registro presupuestal simultáneo va al Grupo 8000 Cuentas de Orden Presupuestales de Egresos. El COG es capítulo 1000 Servicios Personales.',
    dificultad: 'intermedio',
  },
  {
    id: 'P06',
    pregunta: '¿Qué información debe contener el Estado Analítico del Ejercicio del Presupuesto de Egresos (EAEPE) según el artículo 53 de la LGCG?',
    categoriaEsperada: 'presupuesto',
    terminos_requeridos: ['objeto del gasto', 'COG', 'económica', 'funcional', 'programática', 'administrativa', 'Art. 53'],
    citas_esperadas: ['LGCG Art. 53'],
    respuesta_referencia: 'El Art. 53 LGCG establece que el EAEPE debe presentarse en 4 clasificaciones: a) por Objeto del Gasto (COG), b) Económica, c) Funcional-Programática, d) Administrativa.',
    dificultad: 'intermedio',
  },
  {
    id: 'P07',
    pregunta: '¿Cuál es la tasa de depreciación anual para equipos de cómputo según las normas CONAC y en qué cuenta contable se registra?',
    categoriaEsperada: 'depreciacion',
    terminos_requeridos: ['33', '3 años', 'cómputo', 'equipo', 'depreciación acumulada', '1500'],
    citas_esperadas: ['CONAC Norma'],
    respuesta_referencia: 'Equipo de cómputo: tasa 33.33% anual (vida útil 3 años). Se registra como gasto en la cuenta 5000 y se acumula en la cuenta de depreciación acumulada del Activo (Grupo 1500 Propiedades, Planta y Equipo).',
    dificultad: 'intermedio',
  },
  // ─── AVANZADO ─────────────────────────────────────────────
  {
    id: 'P08',
    pregunta: 'Explica el asiento contable del momento "Devengado" en un gasto de servicios de energía eléctrica, incluyendo las cuentas del balance y las cuentas de orden.',
    categoriaEsperada: 'momentos_contables',
    terminos_requeridos: ['servicios generales', 'cuentas por pagar', 'debe', 'haber', 'cuentas de orden', 'presupuestal', '3000', '8000'],
    citas_esperadas: ['CONAC Acuerdo Momentos Contables'],
    respuesta_referencia: 'Devengado de energía eléctrica: DEBE 5000 Gastos de Funcionamiento (servicios generales), HABER 2100 Cuentas por Pagar. Simultáneamente: DEBE 8000 Cuentas de Orden Presupuestales Devengado, HABER 8000 Cuentas de Orden Presupuestales Comprometido.',
    dificultad: 'avanzado',
  },
  {
    id: 'P09',
    pregunta: '¿Cuáles son los pasos del cierre del ejercicio fiscal y en qué plazo deben presentarse los estados financieros finales?',
    categoriaEsperada: 'cierre',
    terminos_requeridos: ['cierre', 'ejercicio', 'saldos', 'cuentas de resultado', '30', 'hábiles', 'póliza de cierre'],
    citas_esperadas: ['LGCG Art. 9'],
    respuesta_referencia: 'El cierre incluye: (1) verificar cuadre de balanza, (2) registrar depreciaciones pendientes, (3) saldar cuentas de resultado (grupos 4000/5000/6000) contra Hacienda Pública, (4) emitir estados financieros finales. El Art. 9 LGCG establece 30 días hábiles de plazo.',
    dificultad: 'avanzado',
  },
  {
    id: 'P10',
    pregunta: 'Un municipio recibe recursos FISM del Ramo 33 para construir una obra pública. ¿Cómo se registra el ingreso en el sistema de contabilidad gubernamental (momentos, cuentas y clasificación presupuestal)?',
    categoriaEsperada: 'ramo28_33',
    terminos_requeridos: [
      'FISM', 'Ramo 33', 'estimado', 'recaudado', 'devengado', 'bancos', 'ingresos',
      '9000', 'cuentas de orden', 'presupuestal', 'fuente de financiamiento',
    ],
    citas_esperadas: ['Ley de Coordinación Fiscal', 'CONAC Acuerdo Momentos Contables'],
    respuesta_referencia: 'Al recibir FISM: DEBE 1111 Bancos, HABER 4000 Ingresos de Gestión (transferencias federales). Presupuestal: Momento Recaudado en Grupo 9000. Clasificación: Fuente de Financiamiento Ramo 33 FISM, capítulo 2 (transferencias condicionadas federales).',
    dificultad: 'avanzado',
  },
];
