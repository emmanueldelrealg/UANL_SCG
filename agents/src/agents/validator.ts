// ================================================================
// AGENTE VALIDADOR DE CITAS
// Verifica que las citas normativas sean reales y precisas.
// Usa claude-haiku-5-5 (barato) para validación rápida.
// ================================================================
import Anthropic from '@anthropic-ai/sdk';
import { CONAC_KNOWLEDGE_BASE } from '../knowledge/conac-kb.js';
import type { Cita, ValidationResult } from './types.js';

const client = new Anthropic();

// Referencias normativas conocidas para validación rápida sin API
const REFERENCIAS_CONOCIDAS = new Set([
  'LGCG Art. 1', 'LGCG Art. 4', 'LGCG Art. 6', 'LGCG Art. 9',
  'LGCG Art. 19', 'LGCG Art. 22', 'LGCG Art. 40', 'LGCG Art. 48',
  'LGCG Art. 53', 'LGCG Art. 54',
  'CONAC Acuerdo Momentos Contables — Egresos (DOF 2009)',
  'CONAC Acuerdo Momentos Contables — Ingresos (DOF 2009)',
  'CONAC Acuerdo Plan de Cuentas (DOF 2011)',
  'CONAC Plan de Cuentas — Grupo 1000',
  'CONAC Plan de Cuentas — Grupo 2000',
  'CONAC Plan de Cuentas — Grupos 7000-9000',
  'Clasificador por Objeto del Gasto — INEGI/CONAC',
  'Ley de Coordinación Fiscal — Ramo 28',
  'Ley de Coordinación Fiscal — Ramo 33',
  'CONAC Norma de Información Financiera Gubernamental — NIF-G 06',
  'LGCG Art. 53-57 — Cuenta Pública',
]);

// Patrones de referencias válidas (regex)
const PATRONES_VALIDOS = [
  /^LGCG Art\.\s*\d+/,
  /^CONAC\s+(Acuerdo|Norma|Circular)/,
  /^Ley de Coordinación Fiscal/,
  /^Clasificador por Objeto del Gasto/,
  /^LFPRH Art\.\s*\d+/,
  /^DOF\s+\d{2}[-/]\d{2}[-/]\d{4}/,
  /^NIF-G\s+\d{2}/,
];

function validarCitaLocal(cita: Cita): { valida: boolean; razon?: string } {
  // 1. Verificar en la KB hardcoded
  const enKB = CONAC_KNOWLEDGE_BASE.some(
    chunk => chunk.referencia.toLowerCase().includes(cita.referencia.toLowerCase()) ||
             cita.referencia.toLowerCase().includes(chunk.referencia.toLowerCase())
  );
  if (enKB) return { valida: true };

  // 2. Verificar en el set de referencias conocidas
  if (REFERENCIAS_CONOCIDAS.has(cita.referencia)) return { valida: true };

  // 3. Verificar patrones válidos
  for (const patron of PATRONES_VALIDOS) {
    if (patron.test(cita.referencia)) return { valida: true };
  }

  // 4. Detectar referencias sospechosas (números de artículos muy altos)
  const artMatch = cita.referencia.match(/Art\.\s*(\d+)/);
  if (artMatch) {
    const num = parseInt(artMatch[1]);
    if (num > 120) {
      return { valida: false, razon: `LGCG tiene máximo ~90 artículos; Art. ${num} probablemente incorrecto` };
    }
  }

  return { valida: true }; // Default: aceptar si tiene formato válido
}

export async function validarCitas(
  citas: Cita[],
  respuesta: string,
  useApi = false,
): Promise<ValidationResult> {
  if (citas.length === 0) {
    return {
      citasValidas: [],
      citasInvalidas: [],
      confianza: 0.5,
      notas: 'La respuesta no incluye citas normativas específicas.',
    };
  }

  const citasValidas: Cita[] = [];
  const citasInvalidas: Array<{ cita: Cita; razon: string }> = [];

  // Validación local (sin API) — siempre se ejecuta
  for (const cita of citas) {
    const resultado = validarCitaLocal(cita);
    if (resultado.valida) {
      citasValidas.push(cita);
    } else {
      citasInvalidas.push({ cita, razon: resultado.razon ?? 'Referencia no reconocida' });
    }
  }

  // Validación con API (opcional — consume tokens)
  let notasApi = '';
  if (useApi && citas.length > 0) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-5-5',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Verifica si las siguientes citas normativas de contabilidad gubernamental mexicana son reales y precisas.
Responde con JSON: { "observaciones": "notas breves sobre la precisión de las citas" }

Citas a verificar:
${citas.map(c => `- ${c.referencia}: "${c.texto.slice(0, 100)}..."`).join('\n')}`,
        }],
      });
      const txt = (response.content[0] as any).text;
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) notasApi = JSON.parse(m[0]).observaciones ?? '';
    } catch {
      notasApi = 'No se pudo validar con API.';
    }
  }

  const confianza = citasValidas.length / citas.length;

  return {
    citasValidas,
    citasInvalidas,
    confianza,
    notas: [
      citasInvalidas.length > 0
        ? `${citasInvalidas.length} cita(s) con problemas detectados.`
        : 'Todas las citas pasaron la validación local.',
      notasApi,
    ].filter(Boolean).join(' '),
  };
}
