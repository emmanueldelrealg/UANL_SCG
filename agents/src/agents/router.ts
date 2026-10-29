// ================================================================
// AGENTE ROUTER / ORQUESTADOR
// Clasifica la pregunta y la dirige al especialista correcto.
// Usa claude-haiku-5-5 (barato) para reducir costos de routing.
// ================================================================
import Anthropic from '@anthropic-ai/sdk';
import type { Categoria } from './types.js';

const client = new Anthropic();

const CATEGORIAS_PROMPT = `
Clasifica la siguiente pregunta de contabilidad gubernamental mexicana en UNA de estas categorías:

- plan_cuentas: Plan de Cuentas CONAC, grupos 1000-9000, naturaleza de cuentas, niveles
- momentos_contables: Momentos contables de egresos (5) o ingresos (4), devengado, comprometido
- estados_financieros: Estados LGCG Art. 48 (situación financiera, actividades, flujos, etc.)
- presupuesto: EAI, EAEPE, control presupuestal, modificaciones, LGCG Art. 53
- cog: Clasificador por Objeto del Gasto, capítulos, partidas, INEGI
- ramo28_33: Participaciones federales Ramo 28, Aportaciones federales Ramo 33, FISM, FORTAMUN
- cierre: Cierre del ejercicio fiscal, procedimiento, plazos
- cuenta_publica: Cuenta Pública, integración, presentación, plazos
- deuda: Deuda pública, endeudamiento neto, amortizaciones, créditos
- depreciacion: Depreciación de activos, vida útil, tasas
- general: Cualquier otro tema de contabilidad gubernamental o LGCG

Responde SOLO con el nombre de la categoría, sin explicación.
`.trim();

export async function clasificarPregunta(pregunta: string): Promise<{
  categoria: Categoria;
  tokens: { input: number; output: number };
}> {
  const response = await client.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 20,
    messages: [
      {
        role: 'user',
        content: `${CATEGORIAS_PROMPT}\n\nPregunta: ${pregunta}`,
      },
    ],
  });

  const texto = (response.content[0] as { type: string; text: string }).text.trim().toLowerCase();
  const categorias: Categoria[] = [
    'plan_cuentas', 'momentos_contables', 'estados_financieros', 'presupuesto',
    'cog', 'ramo28_33', 'cierre', 'cuenta_publica', 'deuda', 'depreciacion', 'general',
  ];
  const categoria = categorias.find(c => texto.includes(c)) ?? 'general';

  return {
    categoria,
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}
