import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { budgetApi } from '../lib/api';
import { useToast } from '../store/useStore';
import { Search, BookOpen, Grid3X3, Users, Wallet, Building2 } from 'lucide-react';

interface COGItem {
  id: number;
  capitulo: string;
  capituloNombre: string;
  concepto: string;
  conceptoNombre: string;
  partidaGenerica: string;
  partidaGenericaNombre: string;
  partidaEspecifica?: string;
  partidaEspecificaNombre?: string;
  active: boolean;
}

interface FinancingSource {
  id: number;
  code: string;
  name: string;
  type: string;
  active: boolean;
}

interface ResponsibleUnit {
  id: number;
  code: string;
  name: string;
  area?: string;
  head?: string;
  active: boolean;
}

const CAPITULOS = [
  { code: '1000', name: 'Servicios Personales' },
  { code: '2000', name: 'Materiales y Suministros' },
  { code: '3000', name: 'Servicios Generales' },
  { code: '4000', name: 'Transferencias, Asignaciones, Subsidios y Otras Ayudas' },
  { code: '5000', name: 'Bienes Muebles, Inmuebles e Intangibles' },
  { code: '6000', name: 'Inversión Pública' },
  { code: '7000', name: 'Inversiones Financieras y Otras Provisiones' },
  { code: '8000', name: 'Participaciones y Aportaciones' },
  { code: '9000', name: 'Deuda Pública' },
];

const FUENTES = [
  { code: '101', name: 'Recursos Propios', type: 'Recursos Propios' },
  { code: '201', name: 'FISM - Fondo Infraestructura Social', type: 'Federales' },
  { code: '202', name: 'FORTAMUN - Fondo Fortalecimiento Municipal', type: 'Federales' },
  { code: '203', name: 'Participaciones Ramo 28', type: 'Federales' },
  { code: '204', name: 'Convenios Federales', type: 'Federales' },
  { code: '301', name: 'Crédito BANOBRAS', type: 'Crédito' },
  { code: '302', name: 'Banca Comercial', type: 'Crédito' },
  { code: '401', name: 'Donaciones y Otros', type: 'Otros' },
];

export default function CatalogsPage() {
  const [activeTab, setActiveTab] = useState<'cog' | 'fuentes' | 'unidades' | 'funcional'>('cog');
  const [cog, setCog] = useState<COGItem[]>([]);
  const [fuentes, setFuentes] = useState<FinancingSource[]>(FUENTES.map((f, i) => ({ ...f, id: i + 1, active: true })));
  const [unidades, setUnidades] = useState<ResponsibleUnit[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await budgetApi.getCog();
      setCog(res.data.data || []);
    } catch {
      // Use static data if API fails
      setCog([]);
    }
    try {
      const res = await budgetApi.getFinancingSources();
      if (res.data.data?.length) setFuentes(res.data.data);
    } catch {
      // use defaults
    }
    try {
      const res = await budgetApi.getResponsibleUnits();
      setUnidades(res.data.data || []);
    } catch {
      setUnidades([
        { id: 1, code: 'A00', name: 'Presidencia Municipal', area: 'Gobierno', head: 'Presidente Municipal', active: true },
        { id: 2, code: 'A01', name: 'Secretaría General', area: 'Gobierno', head: 'Secretario General', active: true },
        { id: 3, code: 'A02', name: 'Tesorería Municipal', area: 'Hacienda', head: 'Tesorero Municipal', active: true },
        { id: 4, code: 'A03', name: 'Contraloría Municipal', area: 'Gobierno', head: 'Contralor Municipal', active: true },
        { id: 5, code: 'A04', name: 'Dirección de Obras Públicas', area: 'Obras', head: 'Director de Obras', active: true },
        { id: 6, code: 'A05', name: 'Dirección de Servicios Públicos', area: 'Servicios', head: 'Director de Servicios', active: true },
        { id: 7, code: 'A06', name: 'Dirección de Seguridad', area: 'Seguridad', head: 'Director de Seguridad', active: true },
        { id: 8, code: 'A07', name: 'DIF Municipal', area: 'Desarrollo Social', head: 'Director DIF', active: true },
        { id: 9, code: 'A08', name: 'Instituto de Cultura y Educación', area: 'Cultura', head: 'Director ICE', active: true },
        { id: 10, code: 'A09', name: 'Dirección de Planeación', area: 'Planeación', head: 'Director de Planeación', active: true },
      ]);
    }
    setLoading(false);
  }

  const tabs = [
    { id: 'cog', label: 'Clasificador por Objeto del Gasto', icon: Grid3X3 },
    { id: 'fuentes', label: 'Fuentes de Financiamiento', icon: Wallet },
    { id: 'unidades', label: 'Unidades Responsables', icon: Building2 },
    { id: 'funcional', label: 'Clasificación Funcional', icon: BookOpen },
  ] as const;

  const filteredCog = cog.filter(c =>
    !search ||
    c.capitulo.includes(search) ||
    c.capituloNombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.concepto?.includes(search) ||
    c.partidaGenerica?.includes(search) ||
    c.conceptoNombre?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFuentes = fuentes.filter(f =>
    !search ||
    f.code.toLowerCase().includes(search.toLowerCase()) ||
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUnidades = unidades.filter(u =>
    !search ||
    u.code.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const funcionesData = [
    { funcion: '1', nombre: 'Gobierno', subfuncion: '1.1', subfNombre: 'Legislación' },
    { funcion: '1', nombre: 'Gobierno', subfuncion: '1.2', subfNombre: 'Justicia' },
    { funcion: '1', nombre: 'Gobierno', subfuncion: '1.3', subfNombre: 'Coordinación Fiscal' },
    { funcion: '2', nombre: 'Desarrollo Social', subfuncion: '2.1', subfNombre: 'Protección Social' },
    { funcion: '2', nombre: 'Desarrollo Social', subfuncion: '2.2', subfNombre: 'Educación' },
    { funcion: '2', nombre: 'Desarrollo Social', subfuncion: '2.3', subfNombre: 'Salud' },
    { funcion: '2', nombre: 'Desarrollo Social', subfuncion: '2.4', subfNombre: 'Vivienda y Servicios a la Comunidad' },
    { funcion: '2', nombre: 'Desarrollo Social', subfuncion: '2.5', subfNombre: 'Actividades Recreativas, Culturales y Otras' },
    { funcion: '3', nombre: 'Desarrollo Económico', subfuncion: '3.1', subfNombre: 'Asuntos Económicos en General' },
    { funcion: '3', nombre: 'Desarrollo Económico', subfuncion: '3.2', subfNombre: 'Energía' },
    { funcion: '3', nombre: 'Desarrollo Económico', subfuncion: '3.3', subfNombre: 'Comunicaciones y Transportes' },
    { funcion: '4', nombre: 'Otras no Clasificadas', subfuncion: '4.1', subfNombre: 'Transacciones de la Deuda Pública' },
  ];

  const filteredFuncional = funcionesData.filter(f =>
    !search ||
    f.funcion.includes(search) ||
    f.nombre.toLowerCase().includes(search.toLowerCase()) ||
    f.subfNombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Catálogos Presupuestales Homologados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Catálogos normativos CONAC — Clasificador por Objeto del Gasto, Fuentes de Financiamiento,
          Clasificación Funcional y Unidades Responsables
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* COG Tab */}
      {activeTab === 'cog' && (
        <div className="space-y-4">
          {/* Capítulos summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {CAPITULOS.map(cap => (
              <Card key={cap.code} className="cursor-pointer hover:border-amber-400 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-600">{cap.code.slice(0, 1)}</span>
                    <div>
                      <div className="text-xs font-semibold text-navy-900 dark:text-white">{cap.code}</div>
                      <div className="text-xs text-gray-500 leading-tight">{cap.name}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* COG detail table */}
          {cog.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Partidas del COG ({filteredCog.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left">Capítulo</th>
                        <th className="px-3 py-2 text-left">Concepto</th>
                        <th className="px-3 py-2 text-left">Partida Genérica</th>
                        <th className="px-3 py-2 text-left">Partida Específica</th>
                        <th className="px-3 py-2 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredCog.slice(0, 100).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-2 font-mono text-xs">
                            <span className="font-semibold">{item.capitulo}</span>
                            <div className="text-gray-500">{item.capituloNombre}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            <span className="font-semibold">{item.concepto}</span>
                            <div className="text-gray-500">{item.conceptoNombre}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            <span className="font-semibold">{item.partidaGenerica}</span>
                            <div className="text-gray-500">{item.partidaGenericaNombre}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-500">
                            {item.partidaEspecifica || '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={item.active ? 'default' : 'secondary'}>
                              {item.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                {loading ? 'Cargando catálogo...' : 'No hay partidas registradas en el COG.'}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Fuentes de Financiamiento */}
      {activeTab === 'fuentes' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuentes de Financiamiento ({filteredFuentes.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Clave</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredFuentes.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-mono font-semibold">{f.code}</td>
                    <td className="px-4 py-3">{f.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={
                        f.type === 'Recursos Propios' ? 'border-green-500 text-green-700' :
                        f.type === 'Federales' ? 'border-blue-500 text-blue-700' :
                        f.type === 'Crédito' ? 'border-red-500 text-red-700' :
                        'border-gray-500'
                      }>
                        {f.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={f.active ? 'default' : 'secondary'}>
                        {f.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Unidades Responsables */}
      {activeTab === 'unidades' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unidades Responsables ({filteredUnidades.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Clave</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Área</th>
                  <th className="px-4 py-2 text-left">Titular</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUnidades.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-mono font-semibold">{u.code}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.area || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{u.head || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={u.active ? 'default' : 'secondary'}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Clasificación Funcional */}
      {activeTab === 'funcional' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clasificación Funcional CONAC ({filteredFuncional.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Función</th>
                  <th className="px-4 py-2 text-left">Nombre Función</th>
                  <th className="px-4 py-2 text-left">Subfunción</th>
                  <th className="px-4 py-2 text-left">Nombre Subfunción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredFuncional.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-mono font-bold text-amber-600">{f.funcion}</td>
                    <td className="px-4 py-3 font-semibold">{f.nombre}</td>
                    <td className="px-4 py-3 font-mono text-blue-600">{f.subfuncion}</td>
                    <td className="px-4 py-3">{f.subfNombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* CONAC reference note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Referencia CONAC:</strong> Los catálogos presupuestales están armonizados conforme al
            Acuerdo por el que se emiten las Normas y Metodología para la Determinación de los Momentos
            Contables de los Egresos del CONAC, y el Clasificador por Objeto del Gasto del INEGI.
            Todos los catálogos son obligatorios para entidades federativas y municipios (LGCG Art. 6).
          </div>
        </div>
      </div>
    </div>
  );
}
