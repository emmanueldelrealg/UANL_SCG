// ================================================================
// SISTEMA DE PUNTUACIÓN AUTOMÁTICA
// Evalúa respuestas del agente contra criterios predefinidos.
// ================================================================
import type { ConsultaResult } from '../agents/orchestrator.js';
import type { PreguntaEval } from './questions.js';

export interface PuntajeDetalle {
  preguntaId: string;
  dificultad: string;
  puntaje: number;       // 0–100
  categoriaCorrecta: boolean;
  terminosEncontrados: string[];
  terminosFaltantes: string[];
  citasEncontradas: string[];
  citasFaltantes: string[];
  certeza: string;
  confianzaCitas: number;
  costoUSD: number;
  duracionMs: number;
}

export interface ResumenEval {
  total: number;
  promedioPuntaje: number;
  aprobados: number;       // puntaje >= 60
  categoriaAciertos: number;
  costoTotalUSD: number;
  tokensInput: number;
  tokensOutput: number;
  duracionTotalMs: number;
  puntajePorDificultad: Record<string, number>;
}

export function calcularPuntaje(
  resultado: ConsultaResult,
  pregunta: PreguntaEval,
): PuntajeDetalle {
  const respuesta = resultado.output.respuesta.toLowerCase();

  // 1. Categoría correcta (20 puntos)
  const categoriaCorrecta = resultado.categoria === pregunta.categoriaEsperada;

  // 2. Términos requeridos (40 puntos)
  const terminosEncontrados = pregunta.terminos_requeridos.filter(t =>
    respuesta.includes(t.toLowerCase())
  );
  const terminosFaltantes = pregunta.terminos_requeridos.filter(t =>
    !respuesta.includes(t.toLowerCase())
  );
  const puntajeTerminos = pregunta.terminos_requeridos.length > 0
    ? (terminosEncontrados.length / pregunta.terminos_requeridos.length) * 40
    : 40;

  // 3. Citas normativas (30 puntos)
  const citasEncontradas: string[] = [];
  const citasFaltantes: string[] = [];
  for (const citaEsperada of pregunta.citas_esperadas) {
    const encontrada = resultado.output.citas.some(c =>
      c.referencia.toLowerCase().includes(citaEsperada.toLowerCase()) ||
      citaEsperada.toLowerCase().includes(c.referencia.toLowerCase())
    ) || respuesta.includes(citaEsperada.toLowerCase().replace('lgcg art. ', 'art. '));
    if (encontrada) citasEncontradas.push(citaEsperada);
    else citasFaltantes.push(citaEsperada);
  }
  const puntajeCitas = pregunta.citas_esperadas.length > 0
    ? (citasEncontradas.length / pregunta.citas_esperadas.length) * 30
    : 30;

  // 4. Certeza del agente (10 puntos)
  const puntajeCerteza = resultado.output.certeza === 'alta' ? 10 :
                         resultado.output.certeza === 'media' ? 6 : 2;

  const puntajeTotal = Math.round(
    (categoriaCorrecta ? 20 : 0) + puntajeTerminos + puntajeCitas + puntajeCerteza
  );

  return {
    preguntaId: pregunta.id,
    dificultad: pregunta.dificultad,
    puntaje: Math.min(100, puntajeTotal),
    categoriaCorrecta,
    terminosEncontrados,
    terminosFaltantes,
    citasEncontradas,
    citasFaltantes,
    certeza: resultado.output.certeza,
    confianzaCitas: resultado.validacion.confianza,
    costoUSD: resultado.costoEstimado.costoUSD,
    duracionMs: resultado.duracionMs,
  };
}

export function calcularResumen(puntajes: PuntajeDetalle[], resultados: ConsultaResult[]): ResumenEval {
  const promedioPuntaje = puntajes.reduce((s, p) => s + p.puntaje, 0) / puntajes.length;
  const aprobados = puntajes.filter(p => p.puntaje >= 60).length;
  const categoriaAciertos = puntajes.filter(p => p.categoriaCorrecta).length;
  const costoTotal = puntajes.reduce((s, p) => s + p.costoUSD, 0);

  const tokensInput = resultados.reduce((s, r) => s + r.costoEstimado.inputTokens, 0);
  const tokensOutput = resultados.reduce((s, r) => s + r.costoEstimado.outputTokens, 0);
  const duracionTotal = resultados.reduce((s, r) => s + r.duracionMs, 0);

  const porDificultad: Record<string, number[]> = {};
  for (const p of puntajes) {
    if (!porDificultad[p.dificultad]) porDificultad[p.dificultad] = [];
    porDificultad[p.dificultad].push(p.puntaje);
  }
  const puntajePorDificultad: Record<string, number> = {};
  for (const [d, ps] of Object.entries(porDificultad)) {
    puntajePorDificultad[d] = Math.round(ps.reduce((a, b) => a + b, 0) / ps.length);
  }

  return {
    total: puntajes.length,
    promedioPuntaje: Math.round(promedioPuntaje),
    aprobados,
    categoriaAciertos,
    costoTotalUSD: Math.round(costoTotal * 100_000) / 100_000,
    tokensInput,
    tokensOutput,
    duracionTotalMs: duracionTotal,
    puntajePorDificultad,
  };
}
