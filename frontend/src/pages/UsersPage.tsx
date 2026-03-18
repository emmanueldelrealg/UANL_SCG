import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { authApi } from '../lib/api';
import { useToast, useStore } from '../store/useStore';
import { Plus, Search, Edit2, UserX, UserCheck, Shield, Eye, EyeOff } from 'lucide-react';

interface UserRecord {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  dependencia?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

const ROLES = ['Administrador', 'Capturista', 'Auditor', 'Alumno'];

const ROLE_COLORS: Record<string, string> = {
  Administrador: 'bg-red-100 text-red-800 border-red-200',
  Capturista: 'bg-blue-100 text-blue-800 border-blue-200',
  Auditor: 'bg-purple-100 text-purple-800 border-purple-200',
  Alumno: 'bg-green-100 text-green-800 border-green-200',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Administrador: ['Acceso total al sistema', 'Gestión de usuarios', 'Autorización de pólizas', 'Cierre del ejercicio', 'Auditoría'],
  Capturista: ['Captura de pólizas', 'Registro de ingresos y egresos', 'Consulta de catálogos', 'Reportes básicos'],
  Auditor: ['Consulta de todo el sistema', 'Reportes y estados financieros', 'Bitácora de auditoría', 'Sin capacidad de modificación'],
  Alumno: ['Módulo educativo', 'Simulación de operaciones', 'Glosario y ejercicios', 'Sin acceso a datos reales'],
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'Capturista',
    dependencia: '',
  });
  const { user: currentUser } = useStore();
  const toast = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await authApi.getUsers();
      setUsers(res.data.data || []);
    } catch {
      // Use demo data
      setUsers([
        { id: 1, username: 'admin', name: 'Administrador del Sistema', email: 'admin@scg.uanl.mx', role: 'Administrador', dependencia: 'Sistemas', active: true, createdAt: '2025-01-01', lastLogin: '2025-06-01' },
        { id: 2, username: 'capturista1', name: 'María García López', email: 'mgarcia@scg.uanl.mx', role: 'Capturista', dependencia: 'Tesorería', active: true, createdAt: '2025-01-15', lastLogin: '2025-05-30' },
        { id: 3, username: 'auditor1', name: 'Carlos Rodríguez', email: 'crodriguez@scg.uanl.mx', role: 'Auditor', dependencia: 'Contraloría', active: true, createdAt: '2025-02-01' },
        { id: 4, username: 'alumno1', name: 'Juan Pérez Martínez', email: 'jperez@scg.uanl.mx', role: 'Alumno', dependencia: 'FACPYA UANL', active: true, createdAt: '2025-03-01' },
        { id: 5, username: 'capturista2', name: 'Ana Torres', email: 'atorres@scg.uanl.mx', role: 'Capturista', dependencia: 'Egresos', active: false, createdAt: '2025-01-20' },
      ]);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ username: '', password: '', name: '', email: '', role: 'Capturista', dependencia: '' });
    setShowDialog(true);
  }

  function openEdit(u: UserRecord) {
    setEditing(u);
    setForm({ username: u.username, password: '', name: u.name, email: u.email, role: u.role, dependencia: u.dependencia || '' });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.username || !form.name || !form.email || (!editing && !form.password)) {
      toast.error('Complete todos los campos requeridos');
      return;
    }
    try {
      if (editing) {
        await authApi.updateUser(editing.id, form);
        toast.success('Usuario actualizado correctamente');
      } else {
        await authApi.createUser(form);
        toast.success('Usuario creado correctamente');
      }
      setShowDialog(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar usuario');
    }
  }

  async function toggleActive(u: UserRecord) {
    if (u.id === currentUser?.id) {
      toast.error('No puede desactivarse a sí mismo');
      return;
    }
    try {
      await authApi.updateUser(u.id, { active: !u.active });
      toast.success(`Usuario ${u.active ? 'desactivado' : 'activado'}`);
      loadUsers();
    } catch {
      toast.error('Error al actualizar usuario');
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.active).length,
    byRole: ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {} as Record<string, number>),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Administración de cuentas de acceso al sistema SCG</p>
        </div>
        <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-navy-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-500">Activos</div>
          </CardContent>
        </Card>
        {ROLES.map(r => (
          <Card key={r}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-navy-900 dark:text-white">{stats.byRole[r] || 0}</div>
              <div className="text-xs text-gray-500">{r}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role permissions reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permisos por Rol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map(role => (
              <div key={role} className={`rounded-lg border p-3 ${ROLE_COLORS[role]}`}>
                <div className="font-semibold mb-2">{role}</div>
                <ul className="text-xs space-y-1">
                  {ROLE_PERMISSIONS[role].map((p, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Usuarios ({filtered.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9 w-64"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Dependencia</th>
                    <th className="px-4 py-3 text-left">Último Acceso</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${!u.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono font-semibold">{u.username}</td>
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.dependencia || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-MX') : 'Nunca'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={u.active ? 'default' : 'secondary'}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Editar">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {u.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(u)}
                              title={u.active ? 'Desactivar' : 'Activar'}
                            >
                              {u.active ? <UserX className="h-3.5 w-3.5 text-red-500" /> : <UserCheck className="h-3.5 w-3.5 text-green-500" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Usuario *</Label>
                <Input
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="usuario.nombre"
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-1">
                <Label>{editing ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}</Label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nombre Completo *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo del usuario"
              />
            </div>
            <div className="space-y-1">
              <Label>Correo Electrónico *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@dominio.mx"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Rol *</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Dependencia / Área</Label>
                <Input
                  value={form.dependencia}
                  onChange={e => setForm({ ...form, dependencia: e.target.value })}
                  placeholder="Tesorería, Contraloría..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">
                {editing ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
