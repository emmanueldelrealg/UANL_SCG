import { useEffect, useState } from 'react';
import { accountsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/store/useStore';
import { Search, Plus, ChevronRight, ChevronDown, Eye } from 'lucide-react';
import { ACCOUNT_GROUPS } from '@/lib/utils';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filter, setFilter] = useState({ search: '', group: 'all', level: 'all' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1000','2000','3000','4000','5000']));
  const [showNew, setShowNew] = useState(false);
  const [newAcc, setNewAcc] = useState({ code: '', name: '', level: 4, parentCode: '', nature: 'Deudora', accountType: 'Balance', groupNum: 1000, normalBalance: 'Debit', description: '' });
  const { success, error } = useToast();

  const load = () => accountsApi.getAll().then(r => setAccounts(r.data.data || []));
  useEffect(() => { load(); }, []);

  const filtered = accounts.filter(a => {
    if (filter.search && !a.code.includes(filter.search) && !a.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.group !== 'all' && a.group_num !== Number(filter.group)) return false;
    if (filter.level !== 'all' && a.level !== Number(filter.level)) return false;
    return true;
  });

  const toggle = (code: string) => {
    const s = new Set(expanded);
    s.has(code) ? s.delete(code) : s.add(code);
    setExpanded(s);
  };

  const grouped = filtered.reduce((acc: any, a) => {
    const g = a.group_num;
    if (!acc[g]) acc[g] = [];
    acc[g].push(a);
    return acc;
  }, {});

  const handleCreate = async () => {
    try {
      await accountsApi.create(newAcc);
      success('Cuenta creada', `${newAcc.code} - ${newAcc.name}`);
      setShowNew(false);
      load();
    } catch (e: any) { error('Error', e.response?.data?.error || 'Error al crear cuenta'); }
  };

  const natureColor = (n: string) => n === 'Deudora' ? 'info' : 'warning';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Catálogo de Cuentas Armonizado CONAC — 4 niveles</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total: {accounts.length} cuentas • Referencia: CONAC Acuerdo Catálogo de Cuentas</p>
        </div>
        <Button onClick={() => setShowNew(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Nueva Cuenta</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por código o nombre..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
            </div>
            <Select value={filter.group} onValueChange={v => setFilter(f => ({ ...f, group: v }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {Object.entries(ACCOUNT_GROUPS).map(([k, v]) => <SelectItem key={k} value={k}>{k} - {v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filter.level} onValueChange={v => setFilter(f => ({ ...f, level: v }))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="1">Grupo (N1)</SelectItem>
                <SelectItem value="2">Subgrupo (N2)</SelectItem>
                <SelectItem value="3">Cuenta (N3)</SelectItem>
                <SelectItem value="4">Subcuenta (N4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account Tree */}
      {Object.entries(grouped).map(([grp, accs]: [string, any]) => (
        <Card key={grp}>
          <CardHeader className="p-4 cursor-pointer" onClick={() => toggle(grp)}>
            <div className="flex items-center gap-2">
              {expanded.has(grp) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-bold text-sm">{grp}</span>
              <span className="font-semibold">{ACCOUNT_GROUPS[Number(grp)]}</span>
              <Badge variant="outline" className="ml-auto">{accs.length} cuentas</Badge>
            </div>
          </CardHeader>
          {expanded.has(grp) && (
            <CardContent className="p-0">
              <div className="divide-y">
                {accs.map((a: any) => (
                  <div key={a.id} className={`flex items-center gap-3 px-4 py-2 hover:bg-muted/50 text-sm`}
                    style={{ paddingLeft: `${(a.level - 1) * 16 + 16}px` }}>
                    <span className="font-mono text-xs w-28 text-muted-foreground">{a.code}</span>
                    <span className={`flex-1 ${a.level <= 2 ? 'font-semibold' : ''} ${!a.active ? 'line-through text-muted-foreground' : ''}`}>{a.name}</span>
                    <Badge variant={natureColor(a.nature)} className="text-xs">{a.nature}</Badge>
                    <Badge variant="outline" className="text-xs hidden md:flex">{a.account_type}</Badge>
                    <Badge variant="outline" className="text-xs w-6 text-center">{a.level}</Badge>
                    {!a.is_conac && <Badge variant="secondary" className="text-xs">Custom</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* New Account Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva Subcuenta Personalizada</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={newAcc.code} onChange={e => setNewAcc(a => ({ ...a, code: e.target.value }))} placeholder="e.g. 1112-01" />
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={String(newAcc.level)} onValueChange={v => setNewAcc(a => ({ ...a, level: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4].map(l => <SelectItem key={l} value={String(l)}>Nivel {l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Nombre</Label>
              <Input value={newAcc.name} onChange={e => setNewAcc(a => ({ ...a, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cuenta Padre</Label>
              <Input value={newAcc.parentCode} onChange={e => setNewAcc(a => ({ ...a, parentCode: e.target.value }))} placeholder="e.g. 1112" />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={String(newAcc.groupNum)} onValueChange={v => setNewAcc(a => ({ ...a, groupNum: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_GROUPS).map(([k]) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Naturaleza</Label>
              <Select value={newAcc.nature} onValueChange={v => setNewAcc(a => ({ ...a, nature: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deudora">Deudora</SelectItem>
                  <SelectItem value="Acreedora">Acreedora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newAcc.accountType} onValueChange={v => setNewAcc(a => ({ ...a, accountType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Balance">Balance</SelectItem>
                  <SelectItem value="Resultados">Resultados</SelectItem>
                  <SelectItem value="Orden">Orden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear Cuenta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
