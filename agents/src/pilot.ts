// ================================================================
// PILOTO INTERACTIVO
// Permite hacer una sola consulta y ver la respuesta completa.
// Uso: npm run pilot
//      PREGUNTA="¿Qué es el EAEPE?" npm run pilot
// ================================================================
import 'dotenv/config';
import { consultar } from './agents/orchestrator.js';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n❌ Falta ANTHROPIC_API_KEY');
  console.error('   Crea el archivo agents/.env con:');
  console.error('   ANTHROPIC_API_KEY=sk-ant-...\n');
  process.exit(1);
}

const pregunta = process.env.PREGUNTA ??
  '¿Cuáles son los estados financieros obligatorios según el artículo 48 de la LGCG?';

console.log('\n🏛️  SISTEMA MULTIAGENTE CONAC — Piloto');
console.log('─'.repeat(60));
console.log(`❓ Pregunta: ${pregunta}`);
console.log('─'.repeat(60));

const resultado = await consultar(pregunta, { validarConApi: false });

console.log(`\n📂 Categoría detectada: ${resultado.categoria}`);
console.log(`\n📄 RESPUESTA:\n${resultado.output.respuesta}`);

if (resultado.output.citas.length > 0) {
  console.log('\n📚 CITAS NORMATIVAS:');
  for (const cita of resultado.output.citas) {
    const valida = resultado.validacion.citasValidas.some(
      v => v.referencia === cita.referencia
    );
    console.log(`  ${valida ? '✅' : '⚠️'} [${cita.referencia}]`);
    console.log(`     "${cita.texto.slice(0, 120)}..."`);
  }
}

console.log('\n🔍 VALIDACIÓN DE CITAS:');
console.log(`  Citas válidas:   ${resultado.validacion.citasValidas.length}`);
console.log(`  Citas con aviso: ${resultado.validacion.citasInvalidas.length}`);
console.log(`  Confianza:       ${Math.round(resultado.validacion.confianza * 100)}%`);
if (resultado.validacion.notas) console.log(`  Notas:           ${resultado.validacion.notas}`);

console.log('\n📊 MÉTRICAS:');
console.log(`  Certeza del agente: ${resultado.output.certeza}`);
console.log(`  Tokens entrada:     ${resultado.costoEstimado.inputTokens}`);
console.log(`  Tokens salida:      ${resultado.costoEstimado.outputTokens}`);
console.log(`  Costo estimado:     $${resultado.costoEstimado.costoUSD.toFixed(5)} USD`);
console.log(`  Duración:           ${resultado.duracionMs}ms`);
console.log();
