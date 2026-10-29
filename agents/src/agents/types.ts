// Tipos compartidos entre todos los agentes
export interface AgentInput {
  pregunta: string;
  contexto?: string;   // Contexto previo de conversación
}

export interface Cita {
  referencia: string;  // "LGCG Art. 48"
  texto: string;       // Fragmento citado
}

export interface AgentOutput {
  respuesta: string;
  citas: Cita[];
  certeza: 'alta' | 'media' | 'baja';
  temas: string[];     // Para routing
  tokensUsados?: { input: number; output: number };
}

export interface ValidationResult {
  citasValidas: Cita[];
  citasInvalidas: Array<{ cita: Cita; razon: string }>;
  confianza: number;   // 0-1
  notas: string;
}

export type Categoria =
  | 'plan_cuentas'
  | 'momentos_contables'
  | 'estados_financieros'
  | 'presupuesto'
  | 'cog'
  | 'ramo28_33'
  | 'cierre'
  | 'cuenta_publica'
  | 'deuda'
  | 'depreciacion'
  | 'general';
