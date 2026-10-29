// ================================================================
// AGENTE ESPECIALISTA CONAC
// Genera respuestas normativas con citas verificables.
// Usa claude-sonnet-4-6 para respuestas de calidad.
// ================================================================
import Anthropic from '@anthropic-ai/sdk';
import { buscarNormas, buscarCuentas, buscarGlosario } from '../knowledge/conac-kb.js';
import type { AgentOutput, Categoria, Cita } from './types.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un experto en contabilidad gubernamental mexicana, especializado en:
- Ley General de Contabilidad Gubernamental (LGCG)
- Normas y Acuerdos del CONAC (Consejo Nacional de Armonización Contable)
- Clasificador por Objeto del Gasto (COG) del INEGI
- Ley Federal de Presupuesto y Responsabilidad Hacendaria (LFPRH)
- Ley de Coordinación Fiscal (Ramos 28 y 33)

INSTRUCCIONES:
1. Responde siempre citando el artículo, acuerdo o norma específica
2. Sé preciso con los números de artículos y nombres de documentos
3. Si no tienes certeza sobre un dato específico, indícalo con "aproximadamente" o "conforme a lo general"
4. Estructura tu respuesta con: explicación + fundamento normativo + aplicación práctica
5. Usa términos técnicos correctos de contabilidad gubernamental
6. El JSON de respuesta debe seguir exactamente el formato solicitado`;

function buildContexto(pregunta: string, categoria: Categoria): string {
  const normas = buscarNormas(pregunta);
  const cuentas = buscarCuentas(pregunta);
  const glosario = buscarGlosario(pregunta);

  let contexto = '';

  if (normas.length > 0) {
    contexto += '\n\n### Normas relevantes recuperadas:\n';
    for (const n of normas) {
      contexto += `\n**[${n.referencia}]** ${n.titulo}\n"${n.texto}"\n`;
    }
  }

  if (cuentas.length > 0) {
    contexto += '\n\n### Cuentas CONAC relacionadas (de la BD):\n';
    for (const c of cuentas) {
      contexto += `- ${c.code}: ${c.name} (${c.nature}, Grupo ${c.group_num})\n`;
    }
  }

  if (glosario.length > 0) {
    contexto += '\n\n### Definiciones del glosario:\n';
    for (const g of glosario) {
      contexto += `- **${g.term}**: ${g.definition}\n`;
    }
  }

  return contexto;
}

const OUTPUT_SCHEMA = `Responde SOLO con un JSON válido con esta estructura exacta:
{
  "respuesta": "Explicación completa y técnica",
  "citas": [
    { "referencia": "LGCG Art. 48", "texto": "fragmento exacto citado" }
  ],
  "certeza": "alta|media|baja",
  "temas": ["tema1", "tema2"]
}`;

export async function preguntarEspecialista(
  pregunta: string,
  categoria: Categoria,
): Promise<AgentOutput> {
  const contextoRecuperado = buildContexto(pregunta, categoria);

  const userMessage = `${OUTPUT_SCHEMA}

Pregunta: ${pregunta}
Categoría: ${categoria}
${contextoRecuperado}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const texto = (response.content[0] as { type: string; text: string }).text;

  // Extraer JSON de la respuesta
  const jsonMatch = texto.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      respuesta: texto,
      citas: [],
      certeza: 'baja',
      temas: [categoria],
      tokensUsados: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      respuesta: parsed.respuesta ?? texto,
      citas: parsed.citas ?? [],
      certeza: parsed.certeza ?? 'media',
      temas: parsed.temas ?? [categoria],
      tokensUsados: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  } catch {
    return {
      respuesta: texto,
      citas: [],
      certeza: 'baja',
      temas: [categoria],
      tokensUsados: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }
}
