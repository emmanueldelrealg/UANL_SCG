// ================================================================
// RUNNER DE EVALUACIÓN COMPLETA
// Ejecuta todas las preguntas y genera reporte de puntuación.
// ================================================================
import 'dotenv/config';
import { consultar } from '../agents/orchestrator.js';
import { PREGUNTAS_EVAL } from './questions.js';
import { calcularPuntaje, calcularResumen } from './scorer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY no está definida. Agrégala al archivo agents/.env');
  process.exit(1);
}

console.log('\n🏛️  EVALUACIÓN SISTEMA MULTIAGENTE CONAC');
console.log('═'.repeat(60));
console.log(`📝 Preguntas: ${PREGUNTAS_EVAL.length}`);
console.log(`📅 Fecha: ${new Date().toLocaleDateString('es-MX')}`);
console.log('═'.repeat(60));

const resultados = [];
const puntajes = [];

for (const pregunta of PREGUNTAS_EVAL) {
  process.stdout.write(`\n[${pregunta.id}] ${pregunta.pregunta.slice(0, 60)}... `);
  try {
    const resultado = await consultar(pregunta.pregunta);
    const puntaje = calcularPuntaje(resultado, pregunta);
    resultados.push(resultado);
    puntajes.push(puntaje);

    const emoji = puntaje.puntaje >= 80 ? '✅' : puntaje.puntaje >= 60 ? '⚠️' : '❌';
    console.log(`${emoji} ${puntaje.puntaje}/100 | $${puntaje.costoUSD.toFixed(5)} | ${puntaje.duracionMs}ms`);

    // Pequeña pausa para no saturar la API
    await new Promise(r => setTimeout(r, 1000));
  } catch (e: any) {
    console.log(`💥 ERROR: ${e.message}`);
    puntajes.push({
      preguntaId: pregunta.id,
      dificultad: pregunta.dificultad,
      puntaje: 0,
      categoriaCorrecta: false,
      terminosEncontrados: [],
      terminosFaltantes: pregunta.terminos_requeridos,
      citasEncontradas: [],
      citasFaltantes: pregunta.citas_esperadas,
      certeza: 'baja',
      confianzaCitas: 0,
      costoUSD: 0,
      duracionMs: 0,
    });
  }
}

const resumen = calcularResumen(puntajes, resultados);

console.log('\n' + '═'.repeat(60));
console.log('📊 RESUMEN DE EVALUACIÓN');
console.log('═'.repeat(60));
console.log(`  Puntaje promedio:     ${resumen.promedioPuntaje}/100`);
console.log(`  Aprobados (≥60):      ${resumen.aprobados}/${resumen.total}`);
console.log(`  Categoría correcta:   ${resumen.categoriaAciertos}/${resumen.total}`);
console.log(`  Puntaje por dificultad:`);
for (const [d, p] of Object.entries(resumen.puntajePorDificultad)) {
  console.log(`    ${d.padEnd(12)}: ${p}/100`);
}
console.log(`  Tokens entrada:       ${resumen.tokensInput.toLocaleString()}`);
console.log(`  Tokens salida:        ${resumen.tokensOutput.toLocaleString()}`);
console.log(`  Costo total USD:      $${resumen.costoTotalUSD.toFixed(4)}`);
console.log(`  Duración total:       ${(resumen.duracionTotalMs / 1000).toFixed(1)}s`);
console.log('═'.repeat(60));

// Detalle por pregunta
console.log('\n📋 DETALLE POR PREGUNTA:');
for (const p of puntajes) {
  const emoji = p.puntaje >= 80 ? '✅' : p.puntaje >= 60 ? '⚠️' : '❌';
  console.log(`  ${emoji} [${p.preguntaId}] ${p.dificultad.padEnd(12)} ${p.puntaje}/100`);
  if (p.terminosFaltantes.length > 0) {
    console.log(`       Faltaron: ${p.terminosFaltantes.slice(0, 3).join(', ')}`);
  }
  if (p.citasFaltantes.length > 0) {
    console.log(`       Sin citar: ${p.citasFaltantes.join(', ')}`);
  }
}

// Guardar reporte JSON
const reporteDir = path.join(__dirname, '../../../eval-results');
fs.mkdirSync(reporteDir, { recursive: true });
const reportePath = path.join(reporteDir, `eval-${Date.now()}.json`);
fs.writeFileSync(reportePath, JSON.stringify({ resumen, puntajes, resultados }, null, 2));
console.log(`\n💾 Reporte guardado en: ${reportePath}`);

// Estimación de presupuesto restante
const costoPorPregunta = resumen.costoTotalUSD / resumen.total;
const preguntasConPresupuesto = Math.floor(200 / costoPorPregunta);
console.log(`\n💰 ESTIMACIÓN PRESUPUESTO ($200 USD disponibles):`);
console.log(`   Costo promedio por consulta: $${costoPorPregunta.toFixed(4)}`);
console.log(`   Consultas posibles: ~${preguntasConPresupuesto.toLocaleString()}`);
console.log(`   Vencimiento: 23 Nov 2026 (${Math.round((new Date('2026-11-23').getTime() - Date.now()) / 86400000)} días)\n`);
