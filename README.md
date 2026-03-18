# SCG-UANL — Sistema de Contabilidad Gubernamental

Sistema web de contabilidad gubernamental armonizada, desarrollado conforme a la normatividad CONAC (Consejo Nacional de Armonización Contable), la Ley General de Contabilidad Gubernamental (LGCG) y los lineamientos del INEGI para entidades federativas y municipios de México.

---

## Requisitos

- **Node.js** v18 o superior
- **npm** v9 o superior
- Sistema operativo: Linux, macOS o Windows

---

## Instalación y Ejecución Rápida

```bash
# 1. Clonar o descomprimir el repositorio
cd UANL_SCG

# 2. Instalar todas las dependencias (monorepo)
npm install

# 3. Poblar la base de datos con datos de demostración
cd backend && npm run db:seed && cd ..

# 4. Iniciar backend y frontend simultáneamente
npm run dev
```

El sistema estará disponible en:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

---

## Credenciales de Demostración

| Usuario        | Contraseña  | Rol            | Acceso |
|----------------|-------------|----------------|--------|
| `admin`        | `Admin123!` | Administrador  | Total  |
| `capturista`   | `Cap123!`   | Capturista     | Captura y consulta |
| `auditor`      | `Aud123!`   | Auditor        | Solo lectura |
| `alumno`       | `Alu123!`   | Alumno         | Módulo educativo |

---

## Estructura del Proyecto

```
UANL_SCG/
├── frontend/          # React 18 + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/    # Componentes reutilizables (UI + Layout)
│       ├── pages/         # Páginas del sistema (30+ módulos)
│       ├── store/         # Estado global con Zustand
│       └── lib/           # API client y utilidades
├── backend/           # Node.js + Express + TypeScript + SQLite
│   └── src/
│       ├── db/            # Esquema, inicialización y seed
│       ├── middleware/    # Autenticación JWT y auditoría
│       └── routes/        # Endpoints REST por módulo
├── shared/            # Tipos TypeScript compartidos
└── package.json       # Monorepo root (npm workspaces)
```

---

## Scripts Disponibles

```bash
# Raíz del monorepo
npm run dev       # Inicia backend + frontend simultáneamente
npm run build     # Compila backend (TS) y frontend (Vite)

# Backend
cd backend
npm run build     # Compilar TypeScript
npm run dev       # Desarrollo con ts-node-dev (hot reload)
npm run db:seed   # Poblar base de datos con datos demo
npm start         # Producción (requiere build previo)

# Frontend
cd frontend
npm run dev       # Servidor de desarrollo Vite
npm run build     # Build de producción
npm run preview   # Previsualizar build de producción
```

---

## Módulos del Sistema

### Contabilidad (LGCG / CONAC)
| Módulo | Descripción |
|--------|-------------|
| **Plan de Cuentas** | Catálogo CONAC 4 niveles, grupos 1000-9000, naturaleza Deudora/Acreedora |
| **Pólizas / Registro Único** | Registro Único e Integrador (contable + presupuestal + programático simultáneo) |
| **15 Plantillas CONAC** | Nóminas, compras, Ramo 28/33, deuda, depreciación, cierre, apertura, etc. |
| **Libro Diario** | Registro cronológico de pólizas con folio único |
| **Libro Mayor** | Cuentas T con saldo acumulado por cuenta |
| **Balanza de Comprobación** | Por nivel, período y grupo; verificación de partida doble |

### Presupuesto (LGCG Art. 53)
| Módulo | Descripción |
|--------|-------------|
| **Control Presupuestal** | 5 momentos de egresos: Aprobado→Comprometido→Devengado→Ejercido→Pagado |
| **Ingresos** | 4 momentos: Estimado→Modificado→Devengado→Recaudado |
| **Modificaciones** | Ampliaciones, reducciones, traspasos y adecuaciones presupuestales |
| **EAI** | Estado Analítico de Ingresos (LGCG Art. 53 fracs. I-IV) |
| **EAEPE** | Por objeto del gasto, por programa, por unidad responsable |
| **Catálogos** | COG (INEGI), Fuentes de Financiamiento, Clasificación Funcional, Unidades |

### Estados Financieros (LGCG Art. 48)
| Estado | Descripción |
|--------|-------------|
| Estado de Situación Financiera | Activo / Pasivo / Hacienda Pública |
| Estado de Actividades | Ingresos de gestión vs Gastos; Ahorro/Desahorro |
| Estado de Variación en la HP | Movimientos del patrimonio público |
| Estado de Flujos de Efectivo | Actividades de operación, inversión y financiamiento |
| Estado Analítico del Activo | Activos con vida útil y depreciación acumulada |
| Estado de Deuda | Deuda interna, externa, amortizaciones |
| Notas a los Estados Financieros | Revelaciones normativas |

### Captura de Operaciones
| Módulo | Descripción |
|--------|-------------|
| **Ingresos** | Captura rápida con póliza automática (Bancos + ingresos + cuentas de orden) |
| **Egresos** | Con plantilla CONAC y clasificación presupuestal |
| **Deuda Pública** | Registro de créditos, amortizaciones e intereses |
| **Almacén e Inventarios** | Bienes muebles, inmuebles, depreciación; movimientos Entrada/Salida/Baja |

### Cierre y Cuenta Pública
| Módulo | Descripción |
|--------|-------------|
| **Cierre del Ejercicio** | 7 pasos guiados con verificación automática de cuadre |
| **Cuenta Pública** | Compilación de los 7 estados LGCG con checklist de secciones |
| **Ejercicios Fiscales** | Gestión de años fiscales y apertura/cierre de períodos mensuales |

### Administración y Auditoría
| Módulo | Descripción |
|--------|-------------|
| **Gestión de Usuarios** | CRUD usuarios con 4 roles (Administrador, Capturista, Auditor, Alumno) |
| **Bitácora de Auditoría** | Registro inmutable de todas las operaciones por usuario, módulo y fecha |

### Módulo Educativo
| Módulo | Descripción |
|--------|-------------|
| **Glosario** | 200+ términos de contabilidad gubernamental con referencia normativa |
| **Ejercicios** | 30 ejercicios con calificación automática y retroalimentación |
| **Tutoriales** | Flujos visuales de los momentos contables, partida doble, cierre |
| **Simulación** | 50+ transacciones del ejercicio fiscal con datos reales de demostración |

---

## Tecnologías Utilizadas

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix UI primitives)
- React Router v6 (SPA)
- Zustand (estado global con persistencia)
- TanStack Table v8 (tablas de datos)
- Recharts (visualizaciones presupuestales)
- jsPDF + SheetJS (exportación PDF/Excel)

### Backend
- Node.js + Express + TypeScript
- SQLite (better-sqlite3) con modo WAL
- Drizzle ORM
- JWT (autenticación) + bcrypt (contraseñas)
- Helmet + CORS (seguridad HTTP)

---

## Variables de Entorno

Crea un archivo `.env` en `/backend`:

```env
PORT=3001
DATABASE_URL=./data/scg.db
JWT_SECRET=tu-clave-secreta-muy-larga-aqui
NODE_ENV=development
```

---

## Normatividad de Referencia

- **LGCG**: Ley General de Contabilidad Gubernamental (DOF 31-Dic-2008 y reformas)
- **CONAC**: Normas y Metodología para la Determinación de los Momentos Contables de los Egresos
- **CONAC**: Normas y Metodología para la Determinación de los Momentos Contables de los Ingresos
- **CONAC**: Plan de Cuentas (Acuerdo DOF 2011)
- **CONAC**: Clasificador por Objeto del Gasto (INEGI)
- **CONAC**: Normas para la Integración y Presentación de la Cuenta Pública
- **LGCG Art. 48**: Estados financieros obligatorios
- **LGCG Art. 53**: Información presupuestal (EAI, EAEPE)

---

## Licencia

Desarrollado para fines educativos y de capacitación en contabilidad gubernamental armonizada — UANL / FACPYA.
