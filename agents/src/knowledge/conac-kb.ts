// ================================================================
// BASE DE CONOCIMIENTO CONAC
// Fragmentos normativos codificados de las fuentes primarias.
// Cada entrada incluye: fuente, artículo/sección, texto, tema.
// Cuando se carguen los 78 documentos PDF, esta estructura
// se poblará desde el extractor de texto en lugar de estar
// hardcoded.
// ================================================================

export interface NormaChunk {
  id: string;
  fuente: 'LGCG' | 'CONAC-Acuerdo' | 'CONAC-Norma' | 'COG-INEGI' | 'LFPRH';
  referencia: string;   // "LGCG Art. 48" | "CONAC-Acuerdo-2011" etc.
  titulo: string;
  texto: string;
  temas: string[];      // Para recuperación por palabras clave
}

export const CONAC_KNOWLEDGE_BASE: NormaChunk[] = [
  // ─── LGCG ──────────────────────────────────────────────────
  {
    id: 'lgcg-art1',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 1',
    titulo: 'Objeto de la Ley',
    texto: 'La presente Ley tiene por objeto establecer los criterios generales que regirán la Contabilidad Gubernamental y la emisión de información financiera de los entes públicos, con el fin de lograr su adecuada armonización.',
    temas: ['objeto', 'armonización', 'contabilidad gubernamental', 'LGCG'],
  },
  {
    id: 'lgcg-art4',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 4',
    titulo: 'Definiciones — Contabilidad Gubernamental',
    texto: 'Para efectos de esta Ley se entenderá por: Contabilidad Gubernamental: la técnica que sustenta los sistemas de contabilidad gubernamental, basada en el conjunto de principios, normas y procedimientos técnicos que permiten registrar, procesar y resumir las transacciones que afectan la situación financiera, presupuestaria, patrimonial y programático-presupuestal de los entes públicos.',
    temas: ['contabilidad gubernamental', 'definición', 'sistema contable', 'transacciones'],
  },
  {
    id: 'lgcg-art6',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 6',
    titulo: 'Información Financiera — Obligatoriedad',
    texto: 'Los entes públicos adoptarán e implementarán las categorías y clasificaciones del gasto e ingreso, así como los catálogos de cuentas que emita el Consejo, de manera homogénea en todas las etapas del proceso presupuestario y contable.',
    temas: ['catálogo de cuentas', 'clasificación', 'gasto', 'ingreso', 'obligatorio', 'homogéneo'],
  },
  {
    id: 'lgcg-art9',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 9',
    titulo: 'Cierre del Ejercicio',
    texto: 'Los entes públicos deberán presentar la información financiera correspondiente al cierre del ejercicio fiscal dentro de los treinta días hábiles siguientes a su conclusión.',
    temas: ['cierre', 'ejercicio fiscal', 'plazo', '30 días hábiles', 'información financiera'],
  },
  {
    id: 'lgcg-art19',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 19',
    titulo: 'Registro Único e Integrador',
    texto: 'El sistema de contabilidad gubernamental deberá permitir el registro en tiempo real de las transacciones presupuestarias y contables, con el objeto de llevar un registro único e integrador que permita conocer la situación financiera y presupuestaria en cualquier momento.',
    temas: ['registro único', 'integrador', 'tiempo real', 'presupuestal', 'contable', 'sistema'],
  },
  {
    id: 'lgcg-art22',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 22',
    titulo: 'Partida Doble',
    texto: 'Los registros contables deberán efectuarse con base en el sistema de partida doble, de tal manera que todos los asientos afecten por lo menos dos cuentas contables.',
    temas: ['partida doble', 'asiento contable', 'cuentas', 'registro'],
  },
  {
    id: 'lgcg-art40',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 40',
    titulo: 'Registro Presupuestario de los Egresos',
    texto: 'Los entes públicos registrarán sus egresos conforme al momento contable del devengado. Los pagos se efectuarán contra la disponibilidad de recursos presupuestarios aprobados y comprometidos.',
    temas: ['devengado', 'egreso', 'pago', 'disponibilidad', 'presupuesto', 'momento contable'],
  },
  {
    id: 'lgcg-art48',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 48',
    titulo: 'Estados Financieros Obligatorios',
    texto: 'Los entes públicos deberán generar, en forma mensual, los estados financieros siguientes: I. Estado de Situación Financiera; II. Estado de Actividades; III. Estado de Variación en la Hacienda Pública o Patrimonio; IV. Estado de Flujos de Efectivo; V. Estado Analítico del Activo; VI. Estado Analítico de la Deuda; VII. Notas a los Estados Financieros.',
    temas: ['estados financieros', 'situación financiera', 'actividades', 'hacienda pública', 'flujos de efectivo', 'activo', 'deuda', 'notas', 'mensual', 'Art. 48'],
  },
  {
    id: 'lgcg-art53',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 53',
    titulo: 'Información Presupuestaria Obligatoria',
    texto: 'Los entes públicos deberán generar mensualmente la siguiente información presupuestaria: I. Estado Analítico de Ingresos (EAI); II. Estado Analítico del Ejercicio del Presupuesto de Egresos (EAEPE) que detalle la clasificación por: a) Objeto del Gasto (COG); b) Económica; c) Funcional-Programática; d) Administrativa.',
    temas: ['presupuesto', 'EAI', 'EAEPE', 'ingresos', 'egresos', 'clasificación', 'Art. 53', 'mensual', 'COG'],
  },
  {
    id: 'lgcg-art54',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 54',
    titulo: 'Endeudamiento Neto',
    texto: 'Los entes públicos generarán mensualmente el estado de endeudamiento neto, el cual deberá incluir la deuda pública contratada y el saldo de obligaciones de corto, mediano y largo plazo.',
    temas: ['endeudamiento neto', 'deuda pública', 'obligaciones', 'corto plazo', 'largo plazo'],
  },
  // ─── MOMENTOS CONTABLES ────────────────────────────────────
  {
    id: 'conac-momentos-egreso',
    fuente: 'CONAC-Acuerdo',
    referencia: 'CONAC Acuerdo Momentos Contables — Egresos (DOF 2009)',
    titulo: 'Cinco Momentos Contables de los Egresos',
    texto: 'Los egresos se registrarán en cinco momentos contables: 1. Aprobado: monto del presupuesto aprobado por el órgano legislativo. 2. Comprometido: cuando se formaliza el compromiso mediante acto jurídico (contrato, pedido, convenio). 3. Devengado: cuando el bien o servicio ha sido recibido o el beneficio se ha generado. 4. Ejercido: equivalente al devengado en el momento del pago. 5. Pagado: cuando se realiza la transferencia de recursos financieros.',
    temas: ['momentos contables', 'egresos', 'aprobado', 'comprometido', 'devengado', 'ejercido', 'pagado', 'cinco momentos'],
  },
  {
    id: 'conac-momentos-ingreso',
    fuente: 'CONAC-Acuerdo',
    referencia: 'CONAC Acuerdo Momentos Contables — Ingresos (DOF 2009)',
    titulo: 'Cuatro Momentos Contables de los Ingresos',
    texto: 'Los ingresos se registrarán en cuatro momentos contables: 1. Estimado: monto del presupuesto de ingresos aprobado. 2. Modificado: presupuesto ajustado por ampliaciones o reducciones. 3. Devengado: cuando el ingreso es líquido y exigible por el ente público. 4. Recaudado: cuando se recibe efectivamente el recurso.',
    temas: ['momentos contables', 'ingresos', 'estimado', 'modificado', 'devengado', 'recaudado', 'cuatro momentos'],
  },
  // ─── PLAN DE CUENTAS ───────────────────────────────────────
  {
    id: 'conac-plan-cuentas',
    fuente: 'CONAC-Acuerdo',
    referencia: 'CONAC Acuerdo Plan de Cuentas (DOF 2011)',
    titulo: 'Plan de Cuentas — Grupos y Estructura',
    texto: 'El Plan de Cuentas CONAC se estructura en nueve grupos: 1000 Activo, 2000 Pasivo, 3000 Hacienda Pública/Patrimonio, 4000 Ingresos de Gestión, 5000 Gastos de Funcionamiento, 6000 Resultado del Ejercicio, 7000 Cuentas de Orden Contables, 8000 Cuentas de Orden Presupuestales de Egresos, 9000 Cuentas de Orden Presupuestales de Ingresos. La estructura es de cuatro niveles: Rubro, Cuenta, Subcuenta, Sub-subcuenta.',
    temas: ['plan de cuentas', 'grupos', 'niveles', 'activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'cuentas de orden', 'estructura', 'rubro'],
  },
  {
    id: 'conac-activo',
    fuente: 'CONAC-Acuerdo',
    referencia: 'CONAC Plan de Cuentas — Grupo 1000',
    titulo: 'Grupo 1000 — Activo',
    texto: 'El Activo se clasifica en: 1100 Efectivo y Equivalentes, 1200 Derechos a Recibir Efectivo o Equivalentes, 1300 Bienes Adquiridos para su Transformación, Distribución o Venta, 1400 Inversiones Financieras, 1500 Propiedades, Planta y Equipo, 1600 Activos Intangibles, 1700 Otros Activos. Naturaleza deudora: saldo normal en el debe (cargo).',
    temas: ['activo', 'grupo 1000', 'efectivo', 'bienes', 'propiedades', 'planta y equipo', 'naturaleza deudora'],
  },
  {
    id: 'conac-pasivo',
    fuente: 'CONAC-Acuerdo',
    referencia: 'CONAC Plan de Cuentas — Grupo 2000',
    titulo: 'Grupo 2000 — Pasivo',
    texto: 'El Pasivo incluye: 2100 Cuentas por Pagar a Corto Plazo, 2200 Documentos por Pagar a Corto Plazo, 2300 Obligaciones Laborales a Corto Plazo, 2400 Deuda Pública a Corto Plazo, 2500 Pasivo Contingente, 2600 Pasivos a Largo Plazo. Naturaleza acreedora: saldo normal en el haber (abono).',
    temas: ['pasivo', 'grupo 2000', 'cuentas por pagar', 'deuda pública', 'obligaciones', 'naturaleza acreedora'],
  },
  // ─── CUENTAS DE ORDEN ──────────────────────────────────────
  {
    id: 'conac-cuentas-orden',
    fuente: 'CONAC-Acuerdo',
    referencia: 'CONAC Plan de Cuentas — Grupos 7000-9000',
    titulo: 'Cuentas de Orden — Presupuestales y Contables',
    texto: 'Las Cuentas de Orden permiten el registro simultáneo contable y presupuestal (Registro Único e Integrador). Grupo 7000: Cuentas de Orden Contables (contingencias, bienes en custodia). Grupo 8000: Cuentas de Orden Presupuestales de Egresos — registran los cinco momentos del gasto. Grupo 9000: Cuentas de Orden Presupuestales de Ingresos — registran los cuatro momentos del ingreso.',
    temas: ['cuentas de orden', 'grupo 7000', 'grupo 8000', 'grupo 9000', 'registro único', 'presupuestal', 'simultáneo'],
  },
  // ─── COG ───────────────────────────────────────────────────
  {
    id: 'cog-estructura',
    fuente: 'COG-INEGI',
    referencia: 'Clasificador por Objeto del Gasto — INEGI/CONAC',
    titulo: 'Estructura del COG',
    texto: 'El Clasificador por Objeto del Gasto (COG) se estructura en cuatro niveles: Capítulo (1 dígito), Concepto (2 dígitos), Partida Genérica (3 dígitos), Partida Específica (4-7 dígitos). Los nueve capítulos son: 1000 Servicios Personales, 2000 Materiales y Suministros, 3000 Servicios Generales, 4000 Transferencias, 5000 Bienes Muebles, 6000 Inversión Pública, 7000 Inversiones Financieras, 8000 Participaciones, 9000 Deuda Pública.',
    temas: ['COG', 'clasificador', 'objeto del gasto', 'capítulo', 'concepto', 'partida', 'servicios personales', 'materiales', 'inversión pública'],
  },
  // ─── RAMO 28 Y 33 ──────────────────────────────────────────
  {
    id: 'ramo28-participaciones',
    fuente: 'LFPRH',
    referencia: 'Ley de Coordinación Fiscal — Ramo 28',
    titulo: 'Ramo 28 — Participaciones Federales',
    texto: 'Las Participaciones Federales (Ramo 28) son recursos que la Federación transfiere a estados y municipios como parte del Sistema Nacional de Coordinación Fiscal. Principales fondos: Fondo General de Participaciones (FGP), Fondo de Fomento Municipal (FFM), Fondo de Fiscalización (FOFIE). Se registran en el capítulo 8000 del COG como Participaciones y Aportaciones.',
    temas: ['Ramo 28', 'participaciones federales', 'coordinación fiscal', 'FGP', 'FFM', 'FOFIE', 'municipios', 'estados'],
  },
  {
    id: 'ramo33-aportaciones',
    fuente: 'LFPRH',
    referencia: 'Ley de Coordinación Fiscal — Ramo 33',
    titulo: 'Ramo 33 — Aportaciones Federales',
    texto: 'Las Aportaciones Federales (Ramo 33) son recursos etiquetados para fines específicos. Principales fondos para municipios: FISM (Fondo de Infraestructura Social Municipal) — para infraestructura básica; FORTAMUN (Fondo de Fortalecimiento Municipal) — para seguridad pública y saneamiento financiero. Son recursos condicionados sujetos a fiscalización de la ASF.',
    temas: ['Ramo 33', 'aportaciones federales', 'FISM', 'FORTAMUN', 'infraestructura social', 'fortalecimiento municipal', 'etiquetados'],
  },
  // ─── DEPRECIACIÓN ──────────────────────────────────────────
  {
    id: 'conac-depreciacion',
    fuente: 'CONAC-Norma',
    referencia: 'CONAC Norma de Información Financiera Gubernamental — NIF-G 06',
    titulo: 'Depreciación de Propiedades, Planta y Equipo',
    texto: 'Los bienes muebles e inmuebles deben depreciarse. La depreciación es el reconocimiento sistemático del costo de un activo a lo largo de su vida útil. Tasas anuales orientativas: Edificios 2.5%, Equipo de Cómputo 33.33% (3 años), Vehículos 20% (5 años), Mobiliario 10% (10 años), Maquinaria 8.33% (12 años). Se registra en la cuenta 5000 Gastos de Funcionamiento y en la cuenta de depreciación acumulada del Activo.',
    temas: ['depreciación', 'activo fijo', 'propiedades', 'planta y equipo', 'vida útil', 'tasas', 'bienes muebles', 'reconocimiento'],
  },
  // ─── CUENTA PÚBLICA ────────────────────────────────────────
  {
    id: 'lgcg-cuenta-publica',
    fuente: 'LGCG',
    referencia: 'LGCG Art. 53-57 — Cuenta Pública',
    titulo: 'Cuenta Pública — Integración y Plazos',
    texto: 'La Cuenta Pública es el informe anual que los entes públicos presentan al órgano de fiscalización superior. Debe contener todos los estados financieros del Art. 48 y la información presupuestaria del Art. 53. Los estados y municipios deben presentarla al Congreso o Cabildo dentro de los plazos establecidos en sus constituciones o leyes orgánicas locales (generalmente 30-60 días hábiles después del cierre del ejercicio).',
    temas: ['cuenta pública', 'informe anual', 'fiscalización', 'Art. 53', 'Art. 48', 'plazos', 'estados financieros'],
  },
];

// ─── Recuperación por palabras clave (TF-IDF simple) ────────
export function buscarNormas(query: string, topK = 3): NormaChunk[] {
  const palabras = query.toLowerCase().split(/\s+/).filter(p => p.length > 3);
  const scored = CONAC_KNOWLEDGE_BASE.map(chunk => {
    const texto = (chunk.texto + ' ' + chunk.titulo + ' ' + chunk.temas.join(' ')).toLowerCase();
    const ref = chunk.referencia.toLowerCase();
    let score = 0;
    for (const p of palabras) {
      // Boost para referencias directas (Art. 48, Ramo 33, etc.)
      if (ref.includes(p)) score += 3;
      if (chunk.temas.some(t => t.toLowerCase().includes(p))) score += 2;
      if (texto.includes(p)) score += 1;
    }
    return { chunk, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.chunk);
}

// ─── Recuperación desde la BD SCG (cuentas + glosario) ──────
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../../backend/data/scg.db');

export function buscarCuentas(query: string): any[] {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db.prepare(
      `SELECT code, name, nature, account_type, description, group_num
       FROM accounts
       WHERE name LIKE ? OR code LIKE ? OR description LIKE ?
       LIMIT 5`
    ).all(`%${query}%`, `%${query}%`, `%${query}%`);
    db.close();
    return rows;
  } catch { return []; }
}

export function buscarGlosario(query: string): any[] {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db.prepare(
      `SELECT term, definition, category, references FROM glossary_terms
       WHERE term LIKE ? OR definition LIKE ?
       LIMIT 3`
    ).all(`%${query}%`, `%${query}%`);
    db.close();
    return rows;
  } catch { return []; }
}
