import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { CONAC_ACCOUNTS } from './seed-accounts';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ── helpers ──────────────────────────────────────────────────
const run = (sql: string, params: unknown[] = []) => sqlite.prepare(sql).run(...params);
const get = (sql: string, params: unknown[] = []) => sqlite.prepare(sql).get(...params);

console.log('🌱 Starting seed...');

// ── accounts ────────────────────────────────────────────────
const insertAccount = sqlite.prepare(`
  INSERT OR IGNORE INTO accounts(code,name,level,parent_code,nature,account_type,group_num,active,is_conac,description,normal_balance)
  VALUES(?,?,?,?,?,?,?,1,1,?,?)
`);
const insertAccountsTx = sqlite.transaction(() => {
  for (const a of CONAC_ACCOUNTS) {
    insertAccount.run(a.code,a.name,a.level,a.parentCode??null,a.nature,a.accountType,a.groupNum,a.description??null,a.normalBalance);
  }
});
insertAccountsTx();
console.log(`✅ Inserted ${CONAC_ACCOUNTS.length} CONAC accounts`);

// ── users ────────────────────────────────────────────────────
const users = [
  { username:'admin',     name:'Administrador Sistema',   email:'admin@scg.gob.mx',    role:'Administrador', pass:'Admin123!' },
  { username:'capturista',name:'María González López',     email:'mgonzalez@scg.gob.mx',role:'Capturista',    pass:'Cap123!' },
  { username:'auditor',   name:'Carlos Ramírez Torres',   email:'cramirez@scg.gob.mx', role:'Auditor',       pass:'Aud123!' },
  { username:'alumno',    name:'Estudiante Demo',          email:'alumno@scg.gob.mx',   role:'Alumno',        pass:'Alu123!' },
];
for (const u of users) {
  const hash = bcrypt.hashSync(u.pass, 10);
  sqlite.prepare(`INSERT OR IGNORE INTO users(username,password_hash,name,email,role) VALUES(?,?,?,?,?)`).run(u.username,hash,u.name,u.email,u.role);
}
console.log('✅ Users seeded');

// ── fiscal year 2025 ─────────────────────────────────────────
sqlite.prepare(`INSERT OR IGNORE INTO fiscal_years(year,name,status,open_date) VALUES(?,?,?,?)`).run(2025,'Ejercicio Fiscal 2025','Abierto','2025-01-01');
const fy = get('SELECT id FROM fiscal_years WHERE year=2025') as { id:number };
const fyId = fy.id;
const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
for (let m=1;m<=12;m++) {
  const status = m<=3?'Cerrado':'Abierto';
  sqlite.prepare(`INSERT OR IGNORE INTO fiscal_periods(fiscal_year_id,year,month,name,status) VALUES(?,2025,?,?,?)`).run(fyId,m,months[m-1],status);
}
console.log('✅ Fiscal year 2025 seeded');

// ── COG catalog ──────────────────────────────────────────────
const COG = [
  ['1000','Servicios Personales','1100','Remuneraciones al Personal de Carácter Permanente','11101','Sueldos y Salarios Compactados al Personal Permanente','1110101','Sueldos y Salarios Compactados'],
  ['1000','Servicios Personales','1300','Remuneraciones Adicionales y Especiales','13301','Gratificación de Fin de Año (Aguinaldo)','1330101','Aguinaldo o Gratificación de Fin de Año'],
  ['1000','Servicios Personales','1400','Seguridad Social','14101','Aportaciones al IMSS','1410101','Cuotas para el Seguro Social'],
  ['2000','Materiales y Suministros','2100','Materiales de Administración, Emisión de Documentos y Artículos Oficiales','21101','Materiales, Útiles y Equipos Menores de Oficina','2110101','Materiales de Oficina'],
  ['2000','Materiales y Suministros','2600','Combustibles, Lubricantes y Aditivos','26101','Combustibles','2610101','Combustibles para Vehículos'],
  ['3000','Servicios Generales','3100','Servicios Básicos','31101','Energía Eléctrica','3110101','Servicio de Energía Eléctrica'],
  ['3000','Servicios Generales','3100','Servicios Básicos','31401','Telefonía Convencional','3140101','Servicio Telefónico Convencional'],
  ['3000','Servicios Generales','3200','Servicios de Arrendamiento','32101','Arrendamiento de Edificios','3210101','Arrendamiento de Inmuebles'],
  ['3000','Servicios Generales','3300','Servicios Profesionales, Científicos, Técnicos y Otros','33101','Asesorías','3310101','Servicios de Asesoría'],
  ['3000','Servicios Generales','3500','Servicios de Instalación, Reparación, Mantenimiento y Conservación','35101','Mantenimiento y Conservación de Inmuebles','3510101','Mantenimiento de Edificios'],
  ['4000','Transferencias, Asignaciones, Subsidios y Otras Ayudas','4400','Ayudas Sociales','44102','Becas','4410201','Becas para Educación'],
  ['5000','Bienes Muebles, Inmuebles e Intangibles','5100','Mobiliario y Equipo de Administración','51101','Muebles de Oficina y Estantería','5110101','Muebles de Oficina'],
  ['5000','Bienes Muebles, Inmuebles e Intangibles','5100','Mobiliario y Equipo de Administración','51501','Bienes Informáticos','5150101','Equipos de Cómputo'],
  ['5000','Bienes Muebles, Inmuebles e Intangibles','5400','Vehículos y Equipo de Transporte','54101','Vehículos y Equipo Terrestres','5410101','Automóviles'],
  ['6000','Inversión Pública','6100','Obra Pública en Bienes de Dominio Público','61101','Edificación no Habitacional','6110101','Construcción de Edificios Públicos'],
  ['9000','Deuda Pública','9100','Amortización de la Deuda Pública','91101','Amortización de la Deuda Interna','9110101','Amortización de Créditos Bancarios'],
  ['9000','Deuda Pública','9200','Intereses de la Deuda Pública','92101','Intereses de la Deuda Pública Interna','9210101','Intereses sobre Créditos Bancarios'],
];
const insertCog = sqlite.prepare(`INSERT OR IGNORE INTO cog_catalog(capitulo,capitulo_nombre,concepto,concepto_nombre,partida_generica,partida_generica_nombre,partida_especifica,partida_especifica_nombre) VALUES(?,?,?,?,?,?,?,?)`);
for (const c of COG) insertCog.run(...c);
console.log('✅ COG catalog seeded');

// ── financing sources ────────────────────────────────────────
const fuentes = [
  ['101','Recursos Propios del Estado','Recursos Propios'],
  ['102','Ingresos de Libre Disposición','Recursos Propios'],
  ['201','Fondo General de Participaciones (Ramo 28)','Federales'],
  ['202','Fondo de Fomento Municipal','Federales'],
  ['301','FISM - Fondo para Infraestructura Social Municipal','Federales'],
  ['302','FORTAMUN - Fondo de Aportaciones para el Fortalecimiento','Federales'],
  ['401','Crédito Banca de Desarrollo','Crédito'],
  ['402','Crédito Banca Comercial','Crédito'],
];
for (const f of fuentes) sqlite.prepare(`INSERT OR IGNORE INTO financing_sources(code,name,type) VALUES(?,?,?)`).run(...f);
console.log('✅ Financing sources seeded');

// ── responsible units ────────────────────────────────────────
const units = [
  ['01','Presidencia Municipal'],['02','Secretaría General'],['03','Tesorería Municipal'],
  ['04','Dirección de Obras Públicas'],['05','Dirección de Seguridad Pública'],
  ['06','Dirección de Desarrollo Social'],['07','Dirección de Educación'],
  ['08','Dirección de Salud'],['09','Dirección de Ecología'],['10','Contraloría Interna'],
];
for (const u of units) sqlite.prepare(`INSERT OR IGNORE INTO responsible_units(code,name) VALUES(?,?)`).run(...u);
console.log('✅ Responsible units seeded');

// ── functional classifier ────────────────────────────────────
const funcs = [
  ['1','Gobierno','1.1','Legislativo'],['1','Gobierno','1.2','Ejecutivo'],
  ['1','Gobierno','1.3','Administración Fiscal'],['1','Gobierno','1.4','Relaciones Exteriores'],
  ['2','Desarrollo Social','2.1','Protección Ambiental'],['2','Desarrollo Social','2.2','Vivienda y Servicios a la Comunidad'],
  ['2','Desarrollo Social','2.3','Salud'],['2','Desarrollo Social','2.4','Recreación, Cultura y Otras Manifestaciones Sociales'],
  ['2','Desarrollo Social','2.5','Educación'],['2','Desarrollo Social','2.6','Protección Social'],
  ['3','Desarrollo Económico','3.1','Asuntos Económicos Generales, Comerciales y Laborales'],
  ['3','Desarrollo Económico','3.2','Agropecuaria, Silvicultura, Pesca y Caza'],
  ['3','Desarrollo Económico','3.3','Combustibles y Energía'],['3','Desarrollo Económico','3.4','Minería'],
  ['3','Desarrollo Económico','3.5','Transporte'],['3','Desarrollo Económico','3.6','Comunicaciones'],
  ['4','Otras No Clasificadas en Funciones Anteriores','4.1','Deuda Pública'],
];
for (const f of funcs) sqlite.prepare(`INSERT OR IGNORE INTO functional_classifier(funcion,funcion_nombre,subfuncion,subfuncion_nombre) VALUES(?,?,?,?)`).run(...f);
console.log('✅ Functional classifier seeded');

// ── programs ─────────────────────────────────────────────────
const programs = [
  ['E001','Administración General','Garantizar el funcionamiento eficiente de la administración municipal','01'],
  ['E002','Seguridad Pública','Proporcionar seguridad y orden público a la ciudadanía','05'],
  ['E003','Obras de Infraestructura','Construir y mantener infraestructura urbana','04'],
  ['E004','Desarrollo Social','Atender las necesidades básicas de la población en situación vulnerable','06'],
  ['E005','Educación Municipal','Fomentar la educación en todos sus niveles','07'],
  ['E006','Salud Pública','Garantizar servicios de salud de calidad','08'],
  ['S001','Becas Educativas','Otorgar apoyos económicos a estudiantes de escasos recursos','07'],
  ['S002','Apoyo Alimentario','Distribuir despensas a familias de bajos recursos','06'],
];
for (const p of programs) sqlite.prepare(`INSERT OR IGNORE INTO programs(fiscal_year,code,name,objective,unit_responsible) VALUES(2025,?,?,?,?)`).run(...p);
console.log('✅ Programs seeded');

// ── budget lines ─────────────────────────────────────────────
const budgetLines = [
  ['1000','1100','11101',null,'E001','','','01','101', 3600000],
  ['1000','1300','13301',null,'E001','','','01','101', 300000],
  ['1000','1400','14101',null,'E001','','','01','101', 432000],
  ['2000','2100','21101',null,'E001','','','01','101', 120000],
  ['2000','2600','26101',null,'E001','','','03','101', 240000],
  ['3000','3100','31101',null,'E001','','','01','101', 180000],
  ['3000','3200','32101',null,'E001','','','01','101', 360000],
  ['3000','3300','33101',null,'E001','','','01','101', 150000],
  ['5000','5100','51101',null,'E001','','','01','101', 80000],
  ['5000','5100','51501',null,'E001','','','01','101', 200000],
  ['1000','1100','11101',null,'E002','','','05','101', 5400000],
  ['2000','2600','26101',null,'E002','','','05','101', 480000],
  ['5000','5400','54101',null,'E002','','','05','101', 600000],
  ['6000','6100','61101',null,'E003','','','04','301', 2000000],
  ['6000','6100','61101',null,'E003','','','04','302', 1500000],
  ['4000','4400','44102',null,'S001','','','07','101', 800000],
  ['4000','4400','44102',null,'S002','','','06','101', 600000],
  ['9000','9100','91101',null,'E001','','','03','401', 1200000],
];
const insertBL = sqlite.prepare(`INSERT OR IGNORE INTO budget_lines(fiscal_year,cog_capitulo,cog_concepto,cog_partida_generica,cog_partida_especifica,programa,subprograma,proyecto,unidad_responsable,fuente_financiamiento,aprobado,modificado,disponible) VALUES(2025,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const b of budgetLines) {
  const amt = b[9] as number;
  insertBL.run(b[0],b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8],amt,amt,amt);
}
console.log('✅ Budget lines seeded');

// ── income budget lines ───────────────────────────────────────
const incomeLines = [
  ['1','Impuestos','11','Impuesto Predial','101', 1800000],
  ['1','Impuestos','12','Impuesto sobre Traslado de Dominio','101', 400000],
  ['2','Derechos','21','Derechos por Servicios','101', 600000],
  ['3','Productos','31','Productos Financieros','101', 120000],
  ['4','Aprovechamientos','41','Multas y Recargos','101', 250000],
  ['5','Participaciones Federales (Ramo 28)','51','Fondo General de Participaciones','201', 12000000],
  ['5','Participaciones Federales (Ramo 28)','52','Fondo de Fomento Municipal','202', 2000000],
  ['6','Aportaciones Federales (Ramo 33)','61','FISM','301', 2000000],
  ['6','Aportaciones Federales (Ramo 33)','62','FORTAMUN','302', 1500000],
];
for (const il of incomeLines) {
  const amt = il[5] as number;
  sqlite.prepare(`INSERT OR IGNORE INTO income_budget_lines(fiscal_year,rubro,rubro_nombre,concepto,concepto_nombre,fuente_financiamiento,estimado,modificado) VALUES(2025,?,?,?,?,?,?,?)`).run(il[0],il[1],il[2],il[3],il[4],amt,amt);
}
console.log('✅ Income budget lines seeded');

// ── entry templates ───────────────────────────────────────────
const templates = [
  {
    code:'TPL-APERTURA',name:'Apertura del Ejercicio Presupuestal',category:'Apertura',momento:'Aprobado',
    description:'Registro de la apertura del ejercicio contable y presupuestal',
    normReference:'CONAC - Guía Contabilizadora No.1 - Apertura del Ejercicio',
    lines:[
      {accountCode:'8111',accountName:'Presupuesto de Egresos del Ejercicio Aprobado',debitFormula:'amount',creditFormula:'0',description:'Presupuesto aprobado de egresos',nature:'Deudora'},
      {accountCode:'8151',accountName:'Presupuesto de Egresos por Ejercer',debitFormula:'0',creditFormula:'amount',description:'Contrapartida presupuesto por ejercer',nature:'Acreedora'},
      {accountCode:'9150',accountName:'Presupuesto de Ingresos Estimado por Recaudar',debitFormula:'amount',creditFormula:'0',description:'Presupuesto de ingresos por recaudar',nature:'Deudora'},
      {accountCode:'9111',accountName:'Ingresos del Presupuesto Estimados',debitFormula:'0',creditFormula:'amount',description:'Estimación de ingresos',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-NOMINA-DEV',name:'Devengado de Nómina (Servicios Personales)',category:'Servicios Personales',momento:'Devengado',
    description:'Registro del devengado de nómina - obligación de pago a trabajadores',
    normReference:'CONAC - Guía Contabilizadora No.3 - Servicios Personales',
    lines:[
      {accountCode:'5111',accountName:'Sueldos y Salarios',debitFormula:'amount',creditFormula:'0',description:'Gasto por sueldos y salarios devengados',nature:'Deudora'},
      {accountCode:'2131',accountName:'Sueldos y Salarios por Pagar',debitFormula:'0',creditFormula:'amount',description:'Obligación de pago con trabajadores',nature:'Acreedora'},
      {accountCode:'8411',accountName:'Devengados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento devengado presupuestal',nature:'Deudora'},
      {accountCode:'8351',accountName:'Compromisos Pendientes de Devengar',debitFormula:'0',creditFormula:'amount',description:'Liberación de comprometido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-NOMINA-PAG',name:'Pago de Nómina',category:'Servicios Personales',momento:'Pagado',
    description:'Registro del pago de nómina a trabajadores',
    normReference:'CONAC - Guía Contabilizadora No.3 - Servicios Personales - Pagado',
    lines:[
      {accountCode:'2131',accountName:'Sueldos y Salarios por Pagar',debitFormula:'amount',creditFormula:'0',description:'Cancelación de obligación de pago',nature:'Deudora'},
      {accountCode:'1112',accountName:'Bancos/Tesorería',debitFormula:'0',creditFormula:'amount',description:'Salida de recursos de tesorería',nature:'Acreedora'},
      {accountCode:'8611',accountName:'Pagados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento pagado presupuestal',nature:'Deudora'},
      {accountCode:'8511',accountName:'Ejercidos del Presupuesto de Egresos',debitFormula:'0',creditFormula:'amount',description:'Liberación del ejercido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-COMPRA-COMP',name:'Comprometido de Compra de Bienes',category:'Materiales y Suministros',momento:'Comprometido',
    description:'Registro del compromiso por adquisición de bienes (orden de compra/contrato)',
    normReference:'CONAC - Guía Contabilizadora No.5 - Materiales y Suministros',
    lines:[
      {accountCode:'8311',accountName:'Compromisos del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Compromiso presupuestal adquisición',nature:'Deudora'},
      {accountCode:'8351',accountName:'Compromisos Pendientes de Devengar',debitFormula:'0',creditFormula:'amount',description:'Presupuesto comprometido pendiente',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-COMPRA-DEV',name:'Devengado de Compra de Bienes',category:'Materiales y Suministros',momento:'Devengado',
    description:'Registro del devengado de compra de bienes (recepción/factura)',
    normReference:'CONAC - Guía Contabilizadora No.5 - Materiales y Suministros',
    lines:[
      {accountCode:'1131',accountName:'Inventario de Almacén',debitFormula:'amount',creditFormula:'0',description:'Entrada de bienes al almacén',nature:'Deudora'},
      {accountCode:'2111',accountName:'Proveedores por Pagar',debitFormula:'0',creditFormula:'amount',description:'Obligación con proveedor',nature:'Acreedora'},
      {accountCode:'8411',accountName:'Devengados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento devengado presupuestal',nature:'Deudora'},
      {accountCode:'8351',accountName:'Compromisos Pendientes de Devengar',debitFormula:'0',creditFormula:'amount',description:'Liberación comprometido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-COMPRA-PAG',name:'Pago a Proveedor de Bienes',category:'Materiales y Suministros',momento:'Pagado',
    description:'Registro del pago a proveedor por bienes adquiridos',
    normReference:'CONAC - Guía Contabilizadora No.5 - Materiales y Suministros - Pagado',
    lines:[
      {accountCode:'2111',accountName:'Proveedores por Pagar',debitFormula:'amount',creditFormula:'0',description:'Cancelación deuda con proveedor',nature:'Deudora'},
      {accountCode:'1112',accountName:'Bancos/Tesorería',debitFormula:'0',creditFormula:'amount',description:'Pago desde tesorería',nature:'Acreedora'},
      {accountCode:'8611',accountName:'Pagados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento pagado presupuestal',nature:'Deudora'},
      {accountCode:'8511',accountName:'Ejercidos del Presupuesto de Egresos',debitFormula:'0',creditFormula:'amount',description:'Liberación ejercido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-SERV-DEV',name:'Devengado de Servicios Generales',category:'Servicios Generales',momento:'Devengado',
    description:'Registro del devengado por servicios generales (electricidad, agua, arrendamiento, etc.)',
    normReference:'CONAC - Guía Contabilizadora No.6 - Servicios Generales',
    lines:[
      {accountCode:'5311',accountName:'Energía Eléctrica',debitFormula:'amount',creditFormula:'0',description:'Gasto por servicio devengado',nature:'Deudora'},
      {accountCode:'2111',accountName:'Proveedores por Pagar',debitFormula:'0',creditFormula:'amount',description:'Obligación por servicio',nature:'Acreedora'},
      {accountCode:'8411',accountName:'Devengados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento devengado presupuestal',nature:'Deudora'},
      {accountCode:'8351',accountName:'Compromisos Pendientes de Devengar',debitFormula:'0',creditFormula:'amount',description:'Liberación comprometido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-PART28-EST',name:'Estimado Participaciones Federales (Ramo 28)',category:'Ingresos - Participaciones',momento:'Estimado',
    description:'Registro de la estimación de participaciones federales del Ramo 28',
    normReference:'CONAC - Guía Contabilizadora No.10 - Participaciones Ramo 28',
    lines:[
      {accountCode:'9150',accountName:'Presupuesto de Ingresos por Recaudar',debitFormula:'amount',creditFormula:'0',description:'Estimación de participaciones',nature:'Deudora'},
      {accountCode:'9111',accountName:'Ingresos Estimados',debitFormula:'0',creditFormula:'amount',description:'Reconocimiento de estimación',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-PART28-REC',name:'Recaudado Participaciones Federales (Ramo 28)',category:'Ingresos - Participaciones',momento:'Recaudado',
    description:'Registro de la recaudación efectiva de participaciones federales',
    normReference:'CONAC - Guía Contabilizadora No.10 - Participaciones Ramo 28',
    lines:[
      {accountCode:'1112',accountName:'Bancos/Tesorería',debitFormula:'amount',creditFormula:'0',description:'Ingreso a tesorería de participaciones',nature:'Deudora'},
      {accountCode:'4811',accountName:'Fondo General de Participaciones (Ramo 28)',debitFormula:'0',creditFormula:'amount',description:'Ingreso reconocido por participaciones',nature:'Acreedora'},
      {accountCode:'9411',accountName:'Recaudados del Presupuesto de Ingresos',debitFormula:'amount',creditFormula:'0',description:'Momento recaudado presupuestal',nature:'Deudora'},
      {accountCode:'9350',accountName:'Presupuesto de Ingresos Devengado por Recaudar',debitFormula:'0',creditFormula:'amount',description:'Liberación de devengado ingresos',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-DEPRECIACION',name:'Depreciación de Bienes Muebles',category:'Ajustes Contables',momento:'Devengado',
    description:'Registro mensual de la depreciación de bienes muebles e inmuebles',
    normReference:'CONAC - Normas y Metodología para la Determinación de los Momentos Contables de los Egresos',
    lines:[
      {accountCode:'6121',accountName:'Depreciación de Bienes Muebles',debitFormula:'amount',creditFormula:'0',description:'Gasto por depreciación del período',nature:'Deudora'},
      {accountCode:'1232',accountName:'Depreciación Acumulada Mobiliario',debitFormula:'0',creditFormula:'amount',description:'Acumulación de depreciación',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-ACTIVO-FIJO',name:'Adquisición de Activos Fijos',category:'Bienes Muebles e Inmuebles',momento:'Devengado',
    description:'Registro de la adquisición de activos fijos (muebles, equipo, vehículos)',
    normReference:'CONAC - Guía Contabilizadora No.8 - Adquisición de Bienes Muebles',
    lines:[
      {accountCode:'1221',accountName:'Mobiliario y Equipo de Administración',debitFormula:'amount',creditFormula:'0',description:'Alta del activo fijo',nature:'Deudora'},
      {accountCode:'2111',accountName:'Proveedores por Pagar',debitFormula:'0',creditFormula:'amount',description:'Obligación con proveedor de activos',nature:'Acreedora'},
      {accountCode:'8411',accountName:'Devengados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento devengado presupuestal',nature:'Deudora'},
      {accountCode:'8351',accountName:'Compromisos Pendientes de Devengar',debitFormula:'0',creditFormula:'amount',description:'Liberación comprometido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-DEUDA-CONT',name:'Contratación de Deuda Pública',category:'Deuda Pública',momento:'Devengado',
    description:'Registro de la contratación de crédito o empréstito de deuda pública',
    normReference:'CONAC - Guía Contabilizadora No.13 - Deuda Pública',
    lines:[
      {accountCode:'1112',accountName:'Bancos/Tesorería',debitFormula:'amount',creditFormula:'0',description:'Ingreso de recursos del crédito',nature:'Deudora'},
      {accountCode:'2211',accountName:'Préstamos Bancarios a Largo Plazo',debitFormula:'0',creditFormula:'amount',description:'Reconocimiento de la deuda',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-DEUDA-AMOR',name:'Amortización de Deuda Pública',category:'Deuda Pública',momento:'Pagado',
    description:'Registro del pago de capital de la deuda pública',
    normReference:'CONAC - Guía Contabilizadora No.13 - Deuda Pública - Amortización',
    lines:[
      {accountCode:'2211',accountName:'Préstamos Bancarios a Largo Plazo',debitFormula:'amount',creditFormula:'0',description:'Disminución del saldo de la deuda',nature:'Deudora'},
      {accountCode:'1112',accountName:'Bancos/Tesorería',debitFormula:'0',creditFormula:'amount',description:'Pago de capital desde tesorería',nature:'Acreedora'},
      {accountCode:'8611',accountName:'Pagados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento pagado amortización',nature:'Deudora'},
      {accountCode:'8511',accountName:'Ejercidos del Presupuesto de Egresos',debitFormula:'0',creditFormula:'amount',description:'Liberación ejercido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-DEUDA-INT',name:'Pago de Intereses de Deuda Pública',category:'Deuda Pública',momento:'Pagado',
    description:'Registro del pago de intereses financieros de la deuda pública',
    normReference:'CONAC - Guía Contabilizadora No.13 - Deuda Pública - Intereses',
    lines:[
      {accountCode:'5342',accountName:'Intereses de la Deuda Pública',debitFormula:'amount',creditFormula:'0',description:'Gasto financiero por intereses',nature:'Deudora'},
      {accountCode:'1112',accountName:'Bancos/Tesorería',debitFormula:'0',creditFormula:'amount',description:'Pago de intereses',nature:'Acreedora'},
      {accountCode:'8611',accountName:'Pagados del Presupuesto de Egresos',debitFormula:'amount',creditFormula:'0',description:'Momento pagado intereses',nature:'Deudora'},
      {accountCode:'8511',accountName:'Ejercidos del Presupuesto de Egresos',debitFormula:'0',creditFormula:'amount',description:'Liberación ejercido',nature:'Acreedora'},
    ]
  },
  {
    code:'TPL-CIERRE',name:'Cierre del Ejercicio Contable',category:'Cierre',momento:'Pagado',
    description:'Asientos de cierre: traspaso de resultados a hacienda pública',
    normReference:'CONAC - Manual de Contabilidad Gubernamental - Cierre del Ejercicio',
    lines:[
      {accountCode:'4811',accountName:'Fondo General de Participaciones',debitFormula:'amount',creditFormula:'0',description:'Cierre de ingresos',nature:'Deudora'},
      {accountCode:'6111',accountName:'Resultado del Ejercicio',debitFormula:'0',creditFormula:'amount',description:'Resultado neto del ejercicio',nature:'Acreedora'},
    ]
  },
];
const insertTpl = sqlite.prepare(`INSERT OR IGNORE INTO entry_templates(code,name,category,momento,description,norm_reference,lines_json) VALUES(?,?,?,?,?,?,?)`);
for (const t of templates) insertTpl.run(t.code,t.name,t.category,t.momento,t.description,t.normReference,JSON.stringify(t.lines));
console.log('✅ Entry templates seeded');

// ── debt records ──────────────────────────────────────────────
sqlite.prepare(`INSERT OR IGNORE INTO debt_records(folio,creditor,debt_type,instrument,contract_date,maturity_date,original_amount,currency,interest_rate,balance,monthly_payment,purpose,fiscal_year) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('DEUDA-2024-001','BANOBRAS','Interna','Crédito','2024-03-15','2029-03-15',5000000,'MXN',8.5,4800000,100000,'Proyecto de infraestructura vial urbana',2025);
sqlite.prepare(`INSERT OR IGNORE INTO debt_records(folio,creditor,debt_type,instrument,contract_date,maturity_date,original_amount,currency,interest_rate,balance,monthly_payment,purpose,fiscal_year) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('DEUDA-2023-001','NAFIN','Interna','Crédito','2023-06-01','2028-06-01',3000000,'MXN',9.0,2400000,60000,'Equipamiento de seguridad pública',2025);
console.log('✅ Debt records seeded');

// ── inventory items ───────────────────────────────────────────
const items = [
  ['INV-001','Computadora de Escritorio Dell OptiPlex','Equipo de Cómputo','Mueble','Pieza',10,18500,185000,'Presidencia','Juan Pérez','2024-01-15','FAC-2024-001','Bueno',25,0,'1221',2025],
  ['INV-002','Vehículo Pickup Ford F-150','Vehículos','Mueble','Unidad',3,320000,960000,'Seguridad Pública','Carlos Soto','2023-08-20','FAC-2023-045','Bueno',20,0,'1224',2025],
  ['INV-003','Escritorio Ejecutivo','Mobiliario de Oficina','Mueble','Pieza',20,4500,90000,'Administración','María González','2022-03-10','FAC-2022-012','Regular',10,0,'1221',2025],
  ['INV-004','Edificio Palacio Municipal','Inmuebles','Inmueble','Unidad',1,15000000,15000000,'Todo el Municipio','Presidente','2000-01-01',null,'Bueno',2,0,'1212',2025],
  ['INV-005','Impresora Multifuncional HP','Equipo de Cómputo','Mueble','Pieza',5,12000,60000,'Tesorería','Ana López','2023-11-30','FAC-2023-089','Bueno',25,0,'1221',2025],
];
for (const i of items) {
  const [code,name,category,assetType,unit,qty,unitCost,totalCost,location,custodian,acquDate,invoiceRef,condition,depRate,accDep,accountCode,fy] = i;
  const netVal = (totalCost as number) - (accDep as number);
  sqlite.prepare(`INSERT OR IGNORE INTO inventory_items(code,name,category,asset_type,unit,quantity,unit_cost,total_cost,location,custodian,acquisition_date,invoice_ref,condition,depreciation_rate,accumulated_depreciation,net_value,account_code,fiscal_year,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`).run(code,name,category,assetType,unit,qty,unitCost,totalCost,location,custodian,acquDate,invoiceRef??null,condition,depRate,accDep,netVal,accountCode,fy);
}
console.log('✅ Inventory items seeded');

// ── JOURNAL ENTRIES (50 + transactions simulation) ─────────────
const adminId = (get('SELECT id FROM users WHERE username=?',['admin']) as {id:number}).id;

function nextFolio(type: string, year: number, seq: number) {
  const map: Record<string,string> = { Ingreso:'I', Egreso:'E', Diario:'D', Cierre:'C', Apertura:'A' };
  return `${map[type]||'D'}-${year}-${String(seq).padStart(5,'0')}`;
}

function insertEntry(seq: number, type: string, date: string, concept: string, ref: string|null, area: string, periodo: number, momento: string, lines: Array<{acc:string,desc:string,deb:number,cre:number}>, status='Autorizada') {
  const folio = nextFolio(type, 2025, seq);
  const totalD = lines.reduce((s,l)=>s+l.deb,0);
  const totalC = lines.reduce((s,l)=>s+l.cre,0);
  const entryId = sqlite.prepare(`INSERT OR IGNORE INTO journal_entries(folio,type,date,concept,reference,area,fiscal_year,period,momento,status,total_debit,total_credit,created_by,authorized_by) VALUES(?,?,?,?,?,?,2025,?,?,?,?,?,?,?)`).run(folio,type,date,concept,ref,area,periodo,momento,status,totalD,totalC,adminId,adminId).lastInsertRowid as number;
  if (!entryId) return;
  let ord=0;
  for (const l of lines) {
    sqlite.prepare(`INSERT INTO journal_entry_lines(entry_id,account_code,description,debit,credit,sort_order) VALUES(?,?,?,?,?,?)`).run(entryId,l.acc,l.desc,l.deb,l.cre,ord++);
  }
  return entryId;
}

// Apertura
insertEntry(1,'Apertura','2025-01-01','Apertura del Ejercicio Fiscal 2025',null,'Tesorería',1,'Aprobado',[
  {acc:'8111',desc:'Presupuesto de Egresos Aprobado 2025',deb:18762000,cre:0},
  {acc:'8151',desc:'Presupuesto por Ejercer 2025',deb:0,cre:18762000},
  {acc:'9150',desc:'Presupuesto de Ingresos por Recaudar',deb:20670000,cre:0},
  {acc:'9111',desc:'Ingresos Estimados 2025',deb:0,cre:20670000},
]);

// Enero - Participaciones Ramo 28 estimado y recaudado
insertEntry(2,'Ingreso','2025-01-05','Estimación de Participaciones Federales Enero 2025',null,'Tesorería',1,'Estimado',[
  {acc:'9150',desc:'Estimación part. federales enero',deb:1000000,cre:0},
  {acc:'9111',desc:'Reconocimiento estimación',deb:0,cre:1000000},
]);
insertEntry(3,'Ingreso','2025-01-10','Recaudación Participaciones Federales Ramo 28 - Enero 2025','SHCP-2025-01','Tesorería',1,'Recaudado',[
  {acc:'1112',desc:'Depósito participaciones SHCP',deb:1000000,cre:0},
  {acc:'4811',desc:'Ingresos por participaciones Ramo 28',deb:0,cre:1000000},
  {acc:'9411',desc:'Recaudado presupuestal ingresos',deb:1000000,cre:0},
  {acc:'9350',desc:'Liberación devengado ingresos',deb:0,cre:1000000},
]);

// Enero - Nómina
insertEntry(4,'Egreso','2025-01-15','Compromiso Nómina Quincenal Enero 2025 - 1a Quincena',null,'Recursos Humanos',1,'Comprometido',[
  {acc:'8311',desc:'Compromiso nómina qna 1',deb:150000,cre:0},
  {acc:'8351',desc:'Presupuesto comprometido nómina',deb:0,cre:150000},
]);
insertEntry(5,'Egreso','2025-01-15','Devengado Nómina Quincenal Enero 2025 - 1a Quincena','NOM-2025-01','Recursos Humanos',1,'Devengado',[
  {acc:'5111',desc:'Sueldos y salarios devengados',deb:135000,cre:0},
  {acc:'5141',desc:'Cuotas IMSS patronal',deb:15000,cre:0},
  {acc:'2131',desc:'Nómina por pagar',deb:0,cre:135000},
  {acc:'2122',desc:'Cuotas IMSS por enterar',deb:0,cre:15000},
  {acc:'8411',desc:'Devengado presupuestal nómina',deb:150000,cre:0},
  {acc:'8351',desc:'Liberación comprometido nómina',deb:0,cre:150000},
]);
insertEntry(6,'Egreso','2025-01-16','Pago Nómina 1a Quincena Enero 2025','TRANS-2025-001','Tesorería',1,'Pagado',[
  {acc:'2131',desc:'Cancelación nómina por pagar',deb:135000,cre:0},
  {acc:'1112',desc:'Pago desde tesorería',deb:0,cre:135000},
  {acc:'8611',desc:'Pagado presupuestal nómina',deb:135000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:135000},
]);

// Enero - Electricidad
insertEntry(7,'Egreso','2025-01-20','Devengado Servicio Electricidad CFE Enero 2025','CFE-2025-01','Servicios Generales',1,'Devengado',[
  {acc:'5311',desc:'Gasto energía eléctrica enero',deb:15000,cre:0},
  {acc:'2111',desc:'CFE por pagar',deb:0,cre:15000},
  {acc:'8411',desc:'Devengado presupuestal electricidad',deb:15000,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:15000},
]);
insertEntry(8,'Egreso','2025-01-25','Pago CFE Enero 2025','TRANS-2025-002','Tesorería',1,'Pagado',[
  {acc:'2111',desc:'Cancelación CFE por pagar',deb:15000,cre:0},
  {acc:'1112',desc:'Pago desde tesorería',deb:0,cre:15000},
  {acc:'8611',desc:'Pagado presupuestal',deb:15000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:15000},
]);

// Enero - Impuesto predial recaudado
insertEntry(9,'Ingreso','2025-01-31','Recaudación Impuesto Predial Enero 2025','REC-2025-01','Tesorería',1,'Recaudado',[
  {acc:'1112',desc:'Ingreso a tesorería predial',deb:150000,cre:0},
  {acc:'4121',desc:'Impuesto predial recaudado',deb:0,cre:150000},
  {acc:'9411',desc:'Recaudado presupuestal predial',deb:150000,cre:0},
  {acc:'9350',desc:'Liberación devengado ingresos',deb:0,cre:150000},
]);

// Enero - Compra materiales de oficina
insertEntry(10,'Egreso','2025-01-28','Compromiso Compra Materiales Oficina','OC-2025-001','Administración',1,'Comprometido',[
  {acc:'8311',desc:'Compromiso materiales oficina',deb:10000,cre:0},
  {acc:'8351',desc:'Presupuesto comprometido',deb:0,cre:10000},
]);
insertEntry(11,'Egreso','2025-01-29','Devengado Compra Materiales Oficina','FAC-PROV-2025-001','Administración',1,'Devengado',[
  {acc:'5211',desc:'Materiales de oficina',deb:10000,cre:0},
  {acc:'2111',desc:'Proveedor por pagar',deb:0,cre:10000},
  {acc:'8411',desc:'Devengado presupuestal',deb:10000,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:10000},
]);
insertEntry(12,'Egreso','2025-01-30','Pago Proveedor Materiales Oficina','TRANS-2025-003','Tesorería',1,'Pagado',[
  {acc:'2111',desc:'Cancelación proveedor por pagar',deb:10000,cre:0},
  {acc:'1112',desc:'Pago a proveedor',deb:0,cre:10000},
  {acc:'8611',desc:'Pagado presupuestal',deb:10000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:10000},
]);

// Febrero - Nómina (2da quincena Enero + 1a Febrero)
insertEntry(13,'Egreso','2025-01-31','Devengado Nómina 2a Quincena Enero 2025','NOM-2025-02','Recursos Humanos',1,'Devengado',[
  {acc:'5111',desc:'Sueldos 2a quincena enero',deb:135000,cre:0},
  {acc:'5141',desc:'IMSS patronal enero',deb:15000,cre:0},
  {acc:'2131',desc:'Nómina por pagar',deb:0,cre:135000},
  {acc:'2122',desc:'IMSS por enterar',deb:0,cre:15000},
  {acc:'8411',desc:'Devengado presupuestal',deb:150000,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:150000},
]);
insertEntry(14,'Egreso','2025-02-01','Pago Nómina 2a Quincena Enero 2025','TRANS-2025-004','Tesorería',2,'Pagado',[
  {acc:'2131',desc:'Cancelación nómina por pagar',deb:135000,cre:0},
  {acc:'1112',desc:'Pago tesorería',deb:0,cre:135000},
  {acc:'8611',desc:'Pagado presupuestal',deb:135000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:135000},
]);

// Febrero - Participaciones
insertEntry(15,'Ingreso','2025-02-10','Recaudación Participaciones Federales Ramo 28 - Febrero 2025','SHCP-2025-02','Tesorería',2,'Recaudado',[
  {acc:'1112',desc:'Depósito participaciones febrero',deb:1000000,cre:0},
  {acc:'4811',desc:'Participaciones Ramo 28 febrero',deb:0,cre:1000000},
  {acc:'9411',desc:'Recaudado presupuestal',deb:1000000,cre:0},
  {acc:'9350',desc:'Liberación devengado',deb:0,cre:1000000},
]);

// Febrero - Aportaciones Ramo 33 FISM
insertEntry(16,'Ingreso','2025-02-15','Recaudación FISM Ramo 33 - Febrero 2025','SHCP-FISM-2025-01','Tesorería',2,'Recaudado',[
  {acc:'1112',desc:'Depósito FISM Ramo 33',deb:166666,cre:0},
  {acc:'4821',desc:'FISM - Aportaciones Ramo 33',deb:0,cre:166666},
  {acc:'9411',desc:'Recaudado FISM',deb:166666,cre:0},
  {acc:'9350',desc:'Liberación devengado',deb:0,cre:166666},
]);

// Febrero - Compra equipo cómputo (activo fijo)
insertEntry(17,'Egreso','2025-02-20','Compromiso Compra Equipo de Cómputo','OC-2025-005','TI',2,'Comprometido',[
  {acc:'8311',desc:'Compromiso equipo cómputo',deb:55000,cre:0},
  {acc:'8351',desc:'Presupuesto comprometido',deb:0,cre:55000},
]);
insertEntry(18,'Egreso','2025-02-25','Adquisición Equipos de Cómputo - 3 Laptops','FAC-DELL-2025-001','Administración',2,'Devengado',[
  {acc:'1226',desc:'Equipo de cómputo adquirido',deb:55000,cre:0},
  {acc:'2111',desc:'Dell México por pagar',deb:0,cre:55000},
  {acc:'8411',desc:'Devengado presupuestal activos',deb:55000,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:55000},
]);
insertEntry(19,'Egreso','2025-02-28','Pago Equipos Cómputo Dell México','TRANS-2025-010','Tesorería',2,'Pagado',[
  {acc:'2111',desc:'Cancelación Dell por pagar',deb:55000,cre:0},
  {acc:'1112',desc:'Pago a Dell México',deb:0,cre:55000},
  {acc:'8611',desc:'Pagado presupuestal activos',deb:55000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:55000},
]);

// Febrero - Pago ISN
insertEntry(20,'Egreso','2025-02-28','Devengado Impuesto sobre Nóminas Enero-Febrero','ISN-2025-01','Tesorería',2,'Devengado',[
  {acc:'5144',desc:'ISN sobre nóminas ene-feb',deb:6000,cre:0},
  {acc:'2121',desc:'ISN por enterar a estado',deb:0,cre:6000},
  {acc:'8411',desc:'Devengado presupuestal ISN',deb:6000,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:6000},
]);

// Marzo - Obra pública FISM
insertEntry(21,'Egreso','2025-03-05','Compromiso Obra Pública Pavimentación Col. Obrera (FISM)','CONT-2025-001','Obras Públicas',3,'Comprometido',[
  {acc:'8311',desc:'Compromiso obra pavimentación FISM',deb:500000,cre:0},
  {acc:'8351',desc:'Presupuesto comprometido obra',deb:0,cre:500000},
]);
insertEntry(22,'Egreso','2025-03-15','Devengado 1er Estimativa Obra Pavimentación','EST-2025-001','Obras Públicas',3,'Devengado',[
  {acc:'5611',desc:'Edificación no habitacional - pavimentación',deb:250000,cre:0},
  {acc:'2112',desc:'Contratista por pagar - pavimentación',deb:0,cre:250000},
  {acc:'8411',desc:'Devengado presupuestal obra',deb:250000,cre:0},
  {acc:'8351',desc:'Liberación comprometido parcial',deb:0,cre:250000},
]);
insertEntry(23,'Egreso','2025-03-20','Pago 1er Estimativa Obra Pavimentación','TRANS-2025-015','Tesorería',3,'Pagado',[
  {acc:'2112',desc:'Cancelación contratista por pagar',deb:250000,cre:0},
  {acc:'1112',desc:'Pago a constructora',deb:0,cre:250000},
  {acc:'8611',desc:'Pagado presupuestal obra',deb:250000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:250000},
]);

// Marzo - Arrendamiento oficinas
insertEntry(24,'Egreso','2025-03-01','Devengado Renta Oficinas Marzo 2025','FAC-ARREND-2025-03','Administración',3,'Devengado',[
  {acc:'5321',desc:'Arrendamiento edificio Tesorería',deb:30000,cre:0},
  {acc:'2111',desc:'Arrendador por pagar',deb:0,cre:30000},
  {acc:'8411',desc:'Devengado presupuestal arrendamiento',deb:30000,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:30000},
]);

// Marzo - Viáticos
insertEntry(25,'Egreso','2025-03-10','Viáticos Representación INAFED Monterrey','VIA-2025-001','Presidencia',3,'Devengado',[
  {acc:'5371',desc:'Viáticos funcionario a Monterrey',deb:8500,cre:0},
  {acc:'2111',desc:'Viáticos por comprobar',deb:0,cre:8500},
  {acc:'8411',desc:'Devengado presupuestal viáticos',deb:8500,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:8500},
]);

// Marzo - Pago deuda BANOBRAS
insertEntry(26,'Egreso','2025-03-28','Amortización Crédito BANOBRAS Marzo 2025','PAGO-BANOBRAS-0003','Tesorería',3,'Pagado',[
  {acc:'2211',desc:'Amortización capital BANOBRAS',deb:100000,cre:0},
  {acc:'1112',desc:'Pago capital crédito',deb:0,cre:100000},
  {acc:'8611',desc:'Pagado amortización deuda',deb:100000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:100000},
]);
insertEntry(27,'Egreso','2025-03-28','Intereses Crédito BANOBRAS Marzo 2025','PAGO-BANOBRAS-INT-0003','Tesorería',3,'Pagado',[
  {acc:'5342',desc:'Intereses deuda BANOBRAS marzo',deb:34000,cre:0},
  {acc:'1112',desc:'Pago intereses',deb:0,cre:34000},
  {acc:'8611',desc:'Pagado intereses',deb:34000,cre:0},
  {acc:'8511',desc:'Liberación ejercido intereses',deb:0,cre:34000},
]);

// Depreciación mensual (3 meses)
for (let m=1;m<=3;m++) {
  const fecha = `2025-0${m}-${m===1?'31':m===2?'28':'31'}`;
  insertEntry(27+m,'Diario',fecha,`Depreciación Mensual de Activos Fijos - ${months[m-1]} 2025`,null,'Contabilidad',m,'Devengado',[
    {acc:'6121',desc:`Depreciación bienes muebles ${months[m-1]}`,deb:8500,cre:0},
    {acc:'6122',desc:`Depreciación edificios ${months[m-1]}`,deb:25000,cre:0},
    {acc:'1232',desc:'Depreciación acumulada muebles',deb:0,cre:8500},
    {acc:'1231',desc:'Depreciación acumulada edificios',deb:0,cre:25000},
  ]);
}

// ISN recaudado (como ingreso del estado)
insertEntry(32,'Ingreso','2025-03-31','Recaudación ISN Marzo 2025','ISN-REC-2025-03','Tesorería',3,'Recaudado',[
  {acc:'1112',desc:'Ingreso ISN tesorería',deb:18000,cre:0},
  {acc:'4111',desc:'Impuesto sobre nóminas recaudado',deb:0,cre:18000},
  {acc:'9411',desc:'Recaudado ISN presupuestal',deb:18000,cre:0},
  {acc:'9350',desc:'Liberación devengado',deb:0,cre:18000},
]);

// Becas educativas
insertEntry(33,'Egreso','2025-03-20','Devengado Becas Educativas 1er Trimestre 2025','BECAS-2025-01','Desarrollo Social',3,'Devengado',[
  {acc:'5441',desc:'Becas educativas devengadas',deb:200000,cre:0},
  {acc:'2111',desc:'Beneficiarios por pagar',deb:0,cre:200000},
  {acc:'8411',desc:'Devengado presupuestal becas',deb:200000,cre:0},
  {acc:'8351',desc:'Liberación comprometido',deb:0,cre:200000},
]);
insertEntry(34,'Egreso','2025-03-25','Pago Becas Educativas 1er Trimestre 2025','TRANS-2025-020','Tesorería',3,'Pagado',[
  {acc:'2111',desc:'Cancelación becas por pagar',deb:200000,cre:0},
  {acc:'1112',desc:'Depósito becas beneficiarios',deb:0,cre:200000},
  {acc:'8611',desc:'Pagado presupuestal becas',deb:200000,cre:0},
  {acc:'8511',desc:'Liberación ejercido',deb:0,cre:200000},
]);

// Nóminas meses 2 y 3
for (let m=2;m<=3;m++) {
  const fecha = `2025-0${m}-15`;
  const folio = 34 + (m-2)*2 + 1;
  insertEntry(folio,'Egreso',fecha,`Devengado Nómina ${months[m-1]} 2025`,`NOM-2025-${String(m*2).padStart(2,'0')}`,'Recursos Humanos',m,'Devengado',[
    {acc:'5111',desc:`Sueldos ${months[m-1]}`,deb:300000,cre:0},
    {acc:'5141',desc:'IMSS patronal',deb:30000,cre:0},
    {acc:'2131',desc:'Nómina por pagar',deb:0,cre:300000},
    {acc:'2122',desc:'IMSS por enterar',deb:0,cre:30000},
    {acc:'8411',desc:'Devengado presupuestal',deb:330000,cre:0},
    {acc:'8351',desc:'Liberación comprometido',deb:0,cre:330000},
  ]);
  insertEntry(folio+1,'Egreso',`2025-0${m}-16`,`Pago Nómina ${months[m-1]} 2025`,`TRANS-2025-0${m}5`,'Tesorería',m,'Pagado',[
    {acc:'2131',desc:'Cancelación nómina',deb:300000,cre:0},
    {acc:'1112',desc:'Pago nómina tesorería',deb:0,cre:300000},
    {acc:'8611',desc:'Pagado presupuestal',deb:300000,cre:0},
    {acc:'8511',desc:'Liberación ejercido',deb:0,cre:300000},
  ]);
}

console.log('✅ 50+ journal entries seeded');

// ── glossary ──────────────────────────────────────────────────
const glossary = [
  ['CONAC','Consejo Nacional de Armonización Contable. Órgano de coordinación para la emisión de las normas contables y lineamientos para la generación de información financiera en el sector público.','LGCG Art. 6','Organismos'],
  ['LGCG','Ley General de Contabilidad Gubernamental. Marco normativo federal que establece las bases para la contabilidad gubernamental y la emisión de información financiera pública.','DOF 31/12/2008','Marco Legal'],
  ['Momento Contable','Instancia en que se registra un hecho económico. Para egresos: Aprobado, Comprometido, Devengado, Ejercido, Pagado. Para ingresos: Estimado, Modificado, Devengado, Recaudado.','CONAC - Momentos Contables','Presupuesto'],
  ['Devengado','Momento en que se reconoce la obligación de pago al recibir bienes/servicios, independientemente del pago. Es el momento de reconocimiento contable más importante.','CONAC - Guías Contabilizadoras','Momentos Contables'],
  ['Comprometido','Momento en que se firma un contrato u orden de compra, generando una obligación presupuestal futura.','CONAC - Momentos Contables','Momentos Contables'],
  ['Ejercido','Momento en que se expide el cheque, transferencia o documento de pago, comprometiendo recursos de la tesorería.','CONAC - Momentos Contables','Momentos Contables'],
  ['Pagado','Momento en que se realiza efectivamente la transferencia bancaria o entrega de efectivo al beneficiario.','CONAC - Momentos Contables','Momentos Contables'],
  ['Póliza','Documento contable que registra las operaciones mediante cargos y abonos en las cuentas del catálogo. Es la unidad básica del registro contable.','CONAC - Manual de Contabilidad','Contabilidad'],
  ['Balanza de Comprobación','Estado que muestra los saldos iniciales, movimientos (cargos y abonos) y saldos finales de todas las cuentas en un período, verificando la igualdad de la partida doble.','LGCG Art. 48','Reportes'],
  ['Partida Doble','Principio contable que establece que todo cargo tiene su correspondiente abono de igual valor, manteniendo el equilibrio A=P+HP.','CONAC - Normas Contables','Contabilidad'],
  ['COG','Clasificador por Objeto del Gasto. Instrumento que ordena el gasto público según la naturaleza del bien o servicio adquirido (capítulo, concepto, partida genérica y específica).','CONAC - COG','Presupuesto'],
  ['Registro Único e Integrador','Sistema de registro que simultáneamente captura el aspecto contable, presupuestal y programático de una operación, garantizando la integración de la información.','CONAC - Registro Único','Contabilidad'],
  ['Estado de Situación Financiera','Balance general del gobierno que muestra los activos, pasivos y hacienda pública/patrimonio en un momento determinado. Equivale al Balance General del sector privado.','LGCG Art. 48 Fracc. I','Estados Financieros'],
  ['Estado de Actividades','Estado de resultados gubernamental que muestra los ingresos, gastos y la variación neta (ahorro o desahorro) durante el período.','LGCG Art. 48 Fracc. II','Estados Financieros'],
  ['Hacienda Pública','Equivalente al patrimonio o capital contable en entidades gubernamentales. Representa la diferencia entre el activo y el pasivo del gobierno.','CONAC - MCCG','Contabilidad'],
  ['Ramo 28','Participaciones Federales a entidades federativas y municipios. Son recursos de libre disposición asignados según fórmulas de coordinación fiscal (Fondo General, FFM, etc.).','LCF','Ingresos'],
  ['Ramo 33','Aportaciones Federales. Recursos condicionados transferidos a estados y municipios para fines específicos (FISM, FORTAMUN, FAETA, etc.).','LCF Art. 25','Ingresos'],
  ['FISM','Fondo de Infraestructura Social Municipal. Aportación federal condicionada para inversión en infraestructura social básica (agua, saneamiento, educación, salud, caminos).','LCF Art. 33','Ingresos'],
  ['FORTAMUN','Fondo de Aportaciones para el Fortalecimiento Municipal. Recursos para satisfacer obligaciones financieras y seguridad pública municipal.','LCF Art. 37','Ingresos'],
  ['Cuenta Pública','Informe anual que los entes públicos presentan sobre el ejercicio de sus recursos financieros, presupuestales y programáticos. Máximo instrumento de rendición de cuentas.','LGCG Art. 53','Transparencia'],
  ['Plan de Cuentas','Catálogo de Cuentas Armonizado que estructura en forma ordenada todas las cuentas contables que deben utilizar los entes públicos (grupos 1000-9000).','CONAC - Catálogo de Cuentas','Contabilidad'],
  ['EAEPE','Estado Analítico del Ejercicio del Presupuesto de Egresos. Reporte que muestra el avance de ejecución del presupuesto por capítulo, clasificación económica, funcional y programática.','LGCG Art. 53 Fracc. I','Reportes'],
  ['EAI','Estado Analítico de Ingresos. Reporte que muestra la recaudación efectiva comparada con el presupuesto estimado de ingresos por fuente y tipo.','LGCG Art. 53 Fracc. II','Reportes'],
  ['Modificación Presupuestal','Cambios al presupuesto aprobado mediante ampliaciones, reducciones o traspasos entre partidas, que requieren autorización del órgano competente.','LGCG','Presupuesto'],
  ['Cierre del Ejercicio','Proceso al 31 de diciembre que incluye la elaboración de asientos de ajuste, depreciaciones, provisiones y el traspaso del resultado del ejercicio a la hacienda pública.','CONAC - Manual Cierre','Contabilidad'],
];
for (const g of glossary) {
  sqlite.prepare(`INSERT OR IGNORE INTO glossary_terms(term,definition,norm_reference,category) VALUES(?,?,?,?)`).run(...g);
}
console.log('✅ Glossary seeded (25 terms)');

// ── exercises ─────────────────────────────────────────────────
const exercises = [
  {
    title:'Registro de Nómina - Devengado',
    description:'El Municipio debe registrar la nómina quincenal de $80,000 correspondiente a servicios personales. El ISR retenido es $8,000 y las cuotas IMSS patronal son $8,800. Registre el momento Devengado.',
    difficulty:'Básico',
    category:'Servicios Personales',
    hints:['El momento Devengado implica reconocer la obligación sin haber pagado aún','Los sueldos van al cargo (gasto), la nómina por pagar al abono (pasivo)','No olvides el registro presupuestal en cuentas de orden'],
    explanation:'En el momento Devengado de nómina se reconoce el gasto por $80,000 (Sueldos y Salarios 5111 cargo), la retención de ISR $8,000 (pasivo) y la diferencia $72,000 queda como nómina por pagar (2131). El IMSS patronal es gasto adicional. En cuentas de orden: 8411 cargo / 8351 abono.',
    normReference:'CONAC - Guía Contabilizadora No.3 - Servicios Personales - Devengado',
    points:20,
  },
  {
    title:'Pago de Proveedor de Bienes',
    description:'Se recibieron materiales de papelería con factura de $25,000 (ya devengados). Registre el pago al proveedor mediante transferencia bancaria. Incluya cuentas de orden presupuestales.',
    difficulty:'Básico',
    category:'Materiales y Suministros',
    hints:['El pago implica el momento Pagado','Se cancela el pasivo (Proveedores por Pagar) y se reduce Bancos','En orden: 8611 cargo (Pagado) / 8511 abono (Ejercido)'],
    explanation:'Al pagar: 2111 Proveedores por Pagar (cargo $25,000) vs 1112 Bancos (abono $25,000). En presupuestal: 8611 Pagados (cargo) / 8511 Ejercidos (abono), cerrando el ciclo del momento pagado.',
    normReference:'CONAC - Guía Contabilizadora No.5 - Materiales y Suministros - Pagado',
    points:15,
  },
  {
    title:'Recaudación Participaciones Ramo 28',
    description:'El municipio recibe $1,500,000 de participaciones del Fondo General (Ramo 28) de la SHCP. Registre el ingreso incluyendo cuentas de orden de ingresos.',
    difficulty:'Intermedio',
    category:'Ingresos - Participaciones',
    hints:['Las participaciones son ingresos del grupo 4000','Bancos aumenta (cargo) al recibir el depósito','En orden de ingresos: 9411 cargo (Recaudado) / 9350 abono'],
    explanation:'1112 Bancos/Tesorería (cargo $1,500,000) / 4811 Fondo General Participaciones Ramo 28 (abono $1,500,000). Presupuestal: 9411 Recaudados (cargo) / 9350 Devengado por Recaudar (abono).',
    normReference:'CONAC - Guía Contabilizadora No.10 - Participaciones Ramo 28 - Recaudado',
    points:25,
  },
  {
    title:'Depreciación de Activos Fijos',
    description:'Al cierre del mes, calcule y registre la depreciación mensual de: Vehículo $320,000 (tasa 20% anual), Equipo de cómputo $185,000 (tasa 25% anual).',
    difficulty:'Intermedio',
    category:'Ajustes Contables',
    hints:['Depreciación mensual = Costo x Tasa / 12','Los activos fijos se deprecian periódicamente','Cuenta de gasto: 6121 (cargo) y contrapartida: depreciación acumulada (abono)'],
    explanation:'Vehículo: $320,000 x 20% / 12 = $5,333. Cómputo: $185,000 x 25% / 12 = $3,854. Total $9,187. Asiento: 6121 Depreciación Bienes Muebles (cargo $9,187) / 1232 Depreciación Acumulada (abono $9,187).',
    normReference:'CONAC - Normas y Metodología para la Determinación de los Momentos Contables',
    points:30,
  },
  {
    title:'Apertura del Ejercicio Fiscal',
    description:'Al iniciar el ejercicio 2025, el presupuesto de egresos aprobado es $15,000,000 y el presupuesto de ingresos estimado es $18,000,000. Registre los asientos de apertura.',
    difficulty:'Básico',
    category:'Apertura',
    hints:['La apertura usa cuentas de orden (grupos 8000 y 9000)','No hay impacto en el estado de situación financiera','El presupuesto de egresos: 8111 cargo / 8151 abono'],
    explanation:'Egresos: 8111 Presupuesto Aprobado (cargo $15M) / 8151 Presupuesto por Ejercer (abono $15M). Ingresos: 9150 Por Recaudar (cargo $18M) / 9111 Estimado (abono $18M). Solo cuentas de orden.',
    normReference:'CONAC - Guía Contabilizadora No.1 - Apertura del Ejercicio Presupuestal',
    points:20,
  },
];
for (const e of exercises) {
  sqlite.prepare(`INSERT OR IGNORE INTO exercises(title,description,difficulty,category,expected_entries_json,hints_json,explanation,norm_reference,points) VALUES(?,?,?,?,?,?,?,?,?)`).run(e.title,e.description,e.difficulty,e.category,'[]',JSON.stringify(e.hints),e.explanation,e.normReference,e.points);
}
console.log('✅ Exercises seeded');

// ── monthly balances ──────────────────────────────────────────
// Recalculate from entries
const accs = sqlite.prepare(`SELECT code FROM accounts WHERE level=4 AND active=1`).all() as {code:string}[];
const updateBalances = sqlite.transaction(() => {
  for (const period of [1,2,3]) {
    const debits = sqlite.prepare(`SELECT account_code, SUM(debit) as d, SUM(credit) as c FROM journal_entry_lines jel JOIN journal_entries je ON je.id=jel.entry_id WHERE je.fiscal_year=2025 AND je.period=? GROUP BY account_code`).all(period) as {account_code:string,d:number,c:number}[];
    for (const row of debits) {
      sqlite.prepare(`INSERT OR REPLACE INTO monthly_balances(fiscal_year,period,account_code,total_debits,total_credits,final_balance) VALUES(2025,?,?,?,?,?)`).run(period,row.account_code,row.d||0,row.c||0,(row.d||0)-(row.c||0));
    }
  }
});
updateBalances();
console.log('✅ Monthly balances recalculated');

console.log('\n✨ Seed complete! Database ready.');
console.log('\n📋 Demo credentials:');
console.log('  Administrador: admin / Admin123!');
console.log('  Capturista:    capturista / Cap123!');
console.log('  Auditor:       auditor / Aud123!');
console.log('  Alumno:        alumno / Alu123!');
