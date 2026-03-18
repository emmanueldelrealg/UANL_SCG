import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useToast } from '@/store/useStore';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Landmark, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      setAuth(res.data.data.user, res.data.data.token);
      success('Bienvenido', `Sesión iniciada como ${res.data.data.user.name}`);
      navigate('/dashboard');
    } catch (err: any) {
      error('Error de autenticación', err.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => { setUsername(u); setPassword(p); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl mb-4">
            <Landmark className="h-8 w-8 text-navy-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">SCG-UANL</h1>
          <p className="text-navy-300 text-sm mt-1">Sistema de Contabilidad Gubernamental</p>
          <p className="text-navy-400 text-xs mt-1">Conforme a CONAC • LGCG • Armonización Contable</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">Ingrese sus credenciales de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="username" className="pl-9" placeholder="nombre.usuario" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-9" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Autenticando...' : 'Ingresar al Sistema'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-2">👤 Usuarios de demostración:</p>
              <div className="grid grid-cols-2 gap-1">
                {[['admin','Admin123!','Administrador'],['capturista','Cap123!','Capturista'],['auditor','Aud123!','Auditor'],['alumno','Alu123!','Alumno']].map(([u,p,r]) => (
                  <button key={u} onClick={() => fillDemo(u,p)} className="text-left text-xs p-2 hover:bg-background rounded border border-transparent hover:border-border transition-colors">
                    <span className="font-medium block">{u}</span>
                    <span className="text-muted-foreground">{r}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-navy-400 text-xs mt-6">
          UANL • Facultad de Contaduría Pública y Administración<br />
          Marco CONAC v4 • LGCG • Armonización 2025
        </p>
      </div>
    </div>
  );
}
