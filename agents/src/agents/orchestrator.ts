// ================================================================
// ORQUESTADOR PRINCIPAL
// Coordina: Router → Especialista → Validador → Respuesta final
// ================================================================
import { clasificarPregunta } from './router.js';
import { preguntarEspecialista } from './specialist.js';
import { validarCitas } from './validator.js';
import type { AgentOutput, ValidationResult } from './types.js';

export interface ConsultaResult {
  pregunta: string;
  categoria: string;
  output: AgentOutput;
  validacion: ValidationResult;
  costoEstimado: {
    inputTokens: number;
    outputTokens: number;
    costoUSD: number;
  };
  duracionMs: number;
}

// Precios claude-haiku-5-5 y claude-sonnet-4-6 (USD por 1M tokens)
const PRECIOS = {
  haikuInput: 0.25 / 1_000_000,
  haikuOutput: 1.25 / 1_000_000,
  sonnetInput: 3.0 / 1_000_000,
  sonnetOutput: 15.0 / 1_000_000,
};

export async function consultar(
  pregunta: string,
  { validarConApi = false } = {},
): Promise<ConsultaResult> {
  const t0 = Date.now();
  let inputTokensTotal = 0;
  let outputTokensTotal = 0;
  let costoUSD = 0;

  // 1. Router (Haiku)
  const { categoria, tokens: tokensRouter } = await clasificarPregunta(pregunta);
  inputTokensTotal += tokensRouter.input;
  outputTokensTotal += tokensRouter.output;
  costoUSD += tokensRouter.input * PRECIOS.haikuInput + tokensRouter.output * PRECIOS.haikuOutput;

  // 2. Especialista (Sonnet)
  const output = await preguntarEspecialista(pregunta, categoria);
  if (output.tokensUsados) {
    inputTokensTotal += output.tokensUsados.input;
    outputTokensTotal += output.tokensUsados.output;
    costoUSD += output.tokensUsados.input * PRECIOS.sonnetInput +
                output.tokensUsados.output * PRECIOS.sonnetOutput;
  }

  // 3. Validador (local + opcional Haiku)
  const validacion = await validarCitas(output.citas, output.respuesta, validarConApi);

  return {
    pregunta,
    categoria,
    output,
    validacion,
    costoEstimado: {
      inputTokens: inputTokensTotal,
      outputTokens: outputTokensTotal,
      costoUSD: Math.round(costoUSD * 100_000) / 100_000,
    },
    duracionMs: Date.now() - t0,
  };
}
