import { useEffect, useState } from 'react';
import { inventoryApi, debtApi, entriesApi, budgetApi } from '@/lib/api';
import { useStore, useToast } from '@/store/useStore';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, Package, CreditCard, Archive } from 'lucide-react';

// ── CAPTURA INGRESOS ─────────────────────────────────────────
function CapturaIngresos() {
  const { fiscalYear } = useStore();
  const { success, error } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], concept: '', reference: '', amount: '', rubro: '', fuente: '', momento: 'Recaudado', period: new Date().getMonth() + 1 });

  useEffect(() => {
    import('@/lib/api').then(({ accountsApi }) => accountsApi.getAll({ level: 4, group: 4000 }).then(r => setAccounts(r.data.data || [])));
  }, []);

  const handleSave = async () => {
    const amt = Number(form.amount);
    if (!amt || !form.concept) { error('Datos incompletos', 'Monto y concepto son requeridos'); return; }
    try {
      const lines = [
        { accountCode: '1112', description: form.concept, debit: amt, credit: 0 },
        { accountCode: form.rubro || '4811', description: form.concept, debit: 0, credit: amt },
        { accountCode: '9411', description: 'Recaudado presupuestal', debit: amt, credit: 0 },
        { accountCode: '9350', description: 'Liberación devengado ingresos', debit: 0, credit: amt },
      ];
      await entriesApi.create({ type: 'Ingreso', date: form.date, concept: form.concept, reference: form.reference, fiscalYear, period: form.period, momento: form.momento, lines });
      success('Ingreso registrado', `$${formatCurrency(amt)}`);
      setShowNew(false);
    } catch (e: any) { error('Error', e.response?.data?.error || 'Error al guardar'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-sm">Captura directa de ingresos con generación automática de póliza y momentos contables</p>
          <p className="text-xs text-muted-foreground">Flujo: Estimado → Modificado → Devengado → Recaudado</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Registrar Ingreso</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Impuesto Predial', icon: TrendingUp, color: 'text-green-600' },
          { label: 'Participaciones Ramo 28', icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Aportaciones Ramo 33', icon: TrendingUp, color: 'text-purple-600' },
        ].map((t, i) => (
          <Card key={i} className="cursor-pointer hover:shadow-md" onClick={() => setShowNew(true)}>
            <CardContent className="p-4 flex items-center gap-3">
              <t.icon className={`h-8 w-8 ${t.color}`} />
              <div>
                <p className="font-medium text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground">Clic para registrar</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Captura de Ingreso</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></div>
              <div className="space-y-2"><Label>Período</Label>
                <Select value={String(form.period)} onValueChange={v => setForm(f=>({...f,period:Number(v)}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m,i)=><SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2"><Label>Concepto</Label><Input value={form.concept} onChange={e=>setForm(f=>({...f,concept:e.target.value}))} placeholder="Descripción del ingreso..." /></div>
              <div className="space-y-2"><Label>Referencia</Label><Input value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} placeholder="Recibo, folio, etc." /></div>
              <div className="space-y-2"><Label>Monto ($)</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} /></div>
              <div className="space-y-2"><Label>Cuenta de Ingreso</Label>
                <Select value={form.rubro} onValueChange={v=>setForm(f=>({...f,rubro:v}))}>
                  <SelectTrigger><SelectValue placeholder="Seleccione cuenta..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4121">4121 - Impuesto Predial</SelectItem>
                    <SelectItem value="4111">4111 - Impuesto sobre Nóminas</SelectItem>
                    <SelectItem value="4811">4811 - Participaciones Ramo 28</SelectItem>
                    <SelectItem value="4821">4821 - FISM Ramo 33</SelectItem>
                    <SelectItem value="4822">4822 - FORTAMUN Ramo 33</SelectItem>
                    <SelectItem value="4411">4411 - Derechos por Servicios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Momento</Label>
                <Select value={form.momento} onValueChange={v=>setForm(f=>({...f,momento:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estimado">Estimado</SelectItem>
                    <SelectItem value="Modificado">Modificado</SelectItem>
                    <SelectItem value="Devengado">Devengado</SelectItem>
                    <SelectItem value="Recaudado">Recaudado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowNew(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Registrar Ingreso</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── CAPTURA EGRESOS ──────────────────────────────────────────
function CapturaEgresos() {
  const { fiscalYear } = useStore();
  const { success, error } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<any>(null);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], concept: '', reference: '', amount: '', area: '', officer: '', cogCapitulo: '1000', cogConcepto: '1100', cogPartida: '11101', programa: 'E001', fuente: '101', momento: 'Devengado', period: new Date().getMonth() + 1 });

  useEffect(() => { entriesApi.getTemplates().then(r => setTemplates(r.data.data || [])); }, []);

  const egresoTpls = templates.filter(t => ['Servicios Personales','Materiales y Suministros','Servicios Generales','Bienes Muebles e Inmuebles'].includes(t.category));

  const handleSave = async () => {
    const amt = Number(form.amount);
    if (!amt || !form.concept || !selectedTpl) { error('Datos incompletos', 'Seleccione plantilla, llene concepto y monto'); return; }
    try {
      const lines = selectedTpl.lines.map((l: any) => ({
        accountCode: l.accountCode, description: l.description,
        debit: l.debitFormula === 'amount' ? amt : 0,
        credit: l.creditFormula === 'amount' ? amt : 0,
      }));
      await entriesApi.create({
        type: 'Egreso', date: form.date, concept: form.concept, reference: form.reference,
        area: form.area, officer: form.officer, fiscalYear, period: form.period,
        momento: form.momento, lines,
        presupuestalRecord: { cogCapitulo: form.cogCapitulo, cogConcepto: form.cogConcepto, cogPartidaGenerica: form.cogPartida, programa: form.programa, fuenteFinanciamiento: form.fuente, momento: form.momento, monto: amt },
      });
      success('Egreso registrado', `${selectedTpl.name} — ${formatCurrency(amt)}`);
      setShowNew(false);
    } catch (e: any) { error('Error', e.response?.data?.error || 'Error al guardar'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-sm">Captura de egresos con plantillas CONAC y control de momentos presupuestales</p>
          <p className="text-xs text-muted-foreground">Flujo: Aprobado → Comprometido → Devengado → Ejercido → Pagado</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Registrar Egreso</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {egresoTpls.slice(0,4).map(t => (
          <Card key={t.id} className="cursor-pointer hover:shadow-md" onClick={() => { setSelectedTpl(t); setForm(f=>({...f,momento:t.momento,concept:t.name})); setShowNew(true); }}>
            <CardContent className="p-3">
              <p className="font-medium text-xs">{t.name}</p>
              <Badge variant="outline" className="text-xs mt-1">{t.momento}</Badge>
              <p className="text-xs text-muted-foreground mt-1">{t.category}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Captura de Egreso</DialogTitle></DialogHeader>
          <Tabs defaultValue="general">
            <TabsList><TabsTrigger value="general">Datos Generales</TabsTrigger><TabsTrigger value="plantilla">Plantilla CONAC</TabsTrigger><TabsTrigger value="presupuestal">Clasificación Presupuestal</TabsTrigger></TabsList>
            <TabsContent value="plantilla" className="space-y-2">
              <p className="text-sm text-muted-foreground">Seleccione plantilla conforme a Guías Contabilizadoras CONAC:</p>
              <div className="grid grid-cols-2 gap-2">
                {egresoTpls.map(t=>(
                  <button key={t.id} onClick={()=>setSelectedTpl(t)} className={`text-left p-3 rounded-lg border text-xs hover:bg-accent ${selectedTpl?.id===t.id?'border-primary bg-primary/5':''}`}>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground">{t.momento} • {t.normReference?.split(' - ')[0]}</p>
                  </button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
                <div className="space-y-2"><Label>Monto ($)</Label><Input type="number" min="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} /></div>
                <div className="col-span-2 space-y-2"><Label>Concepto</Label><Input value={form.concept} onChange={e=>setForm(f=>({...f,concept:e.target.value}))} /></div>
                <div className="space-y-2"><Label>Referencia / Factura</Label><Input value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} /></div>
                <div className="space-y-2"><Label>Área</Label><Input value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))} /></div>
                <div className="space-y-2"><Label>Momento</Label>
                  <Select value={form.momento} onValueChange={v=>setForm(f=>({...f,momento:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['Comprometido','Devengado','Ejercido','Pagado'].map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {selectedTpl && <div className="p-3 bg-blue-50 rounded text-xs text-blue-800"><p className="font-medium">Plantilla: {selectedTpl.name}</p><p className="mt-1">{selectedTpl.normReference}</p></div>}
            </TabsContent>
            <TabsContent value="presupuestal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Capítulo COG</Label>
                  <Select value={form.cogCapitulo} onValueChange={v=>setForm(f=>({...f,cogCapitulo:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[['1000','Servicios Personales'],['2000','Materiales y Suministros'],['3000','Servicios Generales'],['4000','Transferencias'],['5000','Bienes Muebles'],['6000','Inversión Pública'],['9000','Deuda Pública']].map(([k,v])=><SelectItem key={k} value={k}>{k} - {v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Programa</Label>
                  <Select value={form.programa} onValueChange={v=>setForm(f=>({...f,programa:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['E001','E002','E003','E004','E005','E006','S001','S002'].map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Fuente Financiamiento</Label>
                  <Select value={form.fuente} onValueChange={v=>setForm(f=>({...f,fuente:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[['101','Recursos Propios'],['201','Ramo 28'],['301','FISM Ramo 33'],['302','FORTAMUN'],['401','Crédito']].map(([k,v])=><SelectItem key={k} value={k}>{k} - {v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={()=>setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Registrar Egreso</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── DEUDA PÚBLICA ─────────────────────────────────────────────
function DeudaPublica() {
  const { fiscalYear } = useStore();
  const { success, error } = useToast();
  const [debts, setDebts] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ creditor:'', debtType:'Interna', instrument:'Crédito', contractDate:'', maturityDate:'', originalAmount:'', interestRate:'', monthlyPayment:'', purpose:'' });

  const load = () => debtApi.getAll({ fiscalYear }).then(r => setDebts(r.data.data||[]));
  useEffect(() => { load(); }, [fiscalYear]);

  const handleSave = async () => {
    try {
      await debtApi.create({ ...form, originalAmount: Number(form.originalAmount), interestRate: Number(form.interestRate), monthlyPayment: Number(form.monthlyPayment), fiscalYear });
      success('Deuda registrada'); setShowNew(false); load();
    } catch (e: any) { error('Error', e.response?.data?.error); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-muted-foreground text-sm">Registro y control de deuda pública (créditos, bonos, arrendamientos)</p>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Nueva Deuda</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Folio</TableHead><TableHead>Acreedor</TableHead><TableHead>Tipo</TableHead><TableHead>Instrumento</TableHead><TableHead className="text-right">Monto Original</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Tasa</TableHead><TableHead>Vencimiento</TableHead></TableRow></TableHeader>
            <TableBody>
              {debts.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{d.folio}</TableCell>
                  <TableCell className="text-sm">{d.creditor}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{d.debt_type}</Badge></TableCell>
                  <TableCell className="text-xs">{d.instrument}</TableCell>
                  <TableCell className="text-right text-xs">{formatCurrency(d.original_amount)}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatCurrency(d.balance)}</TableCell>
                  <TableCell className="text-xs">{d.interest_rate}%</TableCell>
                  <TableCell className="text-xs">{d.maturity_date}</TableCell>
                </TableRow>
              ))}
              {!debts.length && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No hay deuda registrada</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Deuda Pública</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2"><Label>Acreedor</Label><Input value={form.creditor} onChange={e=>setForm(f=>({...f,creditor:e.target.value}))} placeholder="BANOBRAS, NAFIN, etc." /></div>
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={form.debtType} onValueChange={v=>setForm(f=>({...f,debtType:v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Interna">Interna</SelectItem><SelectItem value="Externa">Externa</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Instrumento</Label>
              <Select value={form.instrument} onValueChange={v=>setForm(f=>({...f,instrument:v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Bono','Crédito','Arrendamiento','SOFOM','Otro'].map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fecha Contrato</Label><Input type="date" value={form.contractDate} onChange={e=>setForm(f=>({...f,contractDate:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Fecha Vencimiento</Label><Input type="date" value={form.maturityDate} onChange={e=>setForm(f=>({...f,maturityDate:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Monto Original ($)</Label><Input type="number" value={form.originalAmount} onChange={e=>setForm(f=>({...f,originalAmount:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Tasa de Interés (%)</Label><Input type="number" step="0.01" value={form.interestRate} onChange={e=>setForm(f=>({...f,interestRate:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Pago Mensual ($)</Label><Input type="number" value={form.monthlyPayment} onChange={e=>setForm(f=>({...f,monthlyPayment:e.target.value}))} /></div>
            <div className="col-span-2 space-y-2"><Label>Destino / Propósito</Label><Input value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={()=>setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Registrar Deuda</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── ALMACÉN / INVENTARIO ──────────────────────────────────────
function AlmacenInventario() {
  const { fiscalYear } = useStore();
  const { success, error } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showMov, setShowMov] = useState<number|null>(null);
  const [form, setForm] = useState({ code:'', name:'', category:'Equipo de Cómputo', assetType:'Mueble', unit:'Pieza', quantity:1, unitCost:'', location:'', custodian:'', acquisitionDate:'', invoiceRef:'', condition:'Bueno', depreciationRate:'', accountCode:'1221' });
  const [movForm, setMovForm] = useState({ movementType:'Entrada', quantity:1, unitCost:'', date:new Date().toISOString().split('T')[0], reference:'', justification:'', authorizedBy:'' });

  const load = () => inventoryApi.getAll({ fiscalYear }).then(r => setItems(r.data.data||[]));
  useEffect(() => { load(); }, [fiscalYear]);

  const handleSave = async () => {
    try {
      await inventoryApi.create({ ...form, quantity: Number(form.quantity), unitCost: Number(form.unitCost), depreciationRate: Number(form.depreciationRate)||null, fiscalYear });
      success('Artículo registrado', form.name); setShowNew(false); load();
    } catch (e: any) { error('Error', e.response?.data?.error); }
  };

  const handleMov = async () => {
    try {
      await inventoryApi.addMovement(showMov!, { ...movForm, quantity: Number(movForm.quantity), unitCost: Number(movForm.unitCost)||undefined, fiscalYear });
      success('Movimiento registrado'); setShowMov(null); load();
    } catch (e: any) { error('Error', e.response?.data?.error); }
  };

  const totalValor = items.reduce((s,i) => s + (i.net_value||0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-sm">Control de activos fijos, inventarios y movimientos de almacén</p>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>Total artículos: <strong>{items.length}</strong></span>
            <span>Valor neto total: <strong>{formatCurrency(totalValor)}</strong></span>
          </div>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Nuevo Artículo</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Artículo</TableHead><TableHead>Categoría</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Costo Unitario</TableHead><TableHead className="text-right">Valor Neto</TableHead><TableHead>Estado</TableHead><TableHead>Acción</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{it.code}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.location}</p>
                  </TableCell>
                  <TableCell className="text-xs">{it.category}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{it.asset_type}</Badge></TableCell>
                  <TableCell className="text-right text-sm">{it.quantity}</TableCell>
                  <TableCell className="text-right text-xs">{formatCurrency(it.unit_cost)}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatCurrency(it.net_value||0)}</TableCell>
                  <TableCell><Badge variant={it.condition==='Bueno'?'success':it.condition==='Baja'?'destructive':'warning'} className="text-xs">{it.condition}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="outline" className="text-xs h-7" onClick={()=>setShowMov(it.id)}>Movimiento</Button></TableCell>
                </TableRow>
              ))}
              {!items.length && <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No hay artículos registrados</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Item Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Artículo de Inventario</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Código</Label><Input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="INV-XXX" /></div>
            <div className="space-y-2"><Label>Categoría</Label>
              <Select value={form.category} onValueChange={v=>setForm(f=>({...f,category:v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Equipo de Cómputo','Mobiliario de Oficina','Vehículos','Maquinaria','Inmuebles','Material de Oficina','Herramientas'].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2"><Label>Nombre del Artículo</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Tipo de Activo</Label>
              <Select value={form.assetType} onValueChange={v=>setForm(f=>({...f,assetType:v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Mueble','Inmueble','Intangible','Depreciable'].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Unidad</Label><Input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Cantidad</Label><Input type="number" min="1" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)}))} /></div>
            <div className="space-y-2"><Label>Costo Unitario ($)</Label><Input type="number" value={form.unitCost} onChange={e=>setForm(f=>({...f,unitCost:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Ubicación</Label><Input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Responsable Custodio</Label><Input value={form.custodian} onChange={e=>setForm(f=>({...f,custodian:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Fecha Adquisición</Label><Input type="date" value={form.acquisitionDate} onChange={e=>setForm(f=>({...f,acquisitionDate:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Factura / Ref.</Label><Input value={form.invoiceRef} onChange={e=>setForm(f=>({...f,invoiceRef:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Tasa Depreciación (%)</Label><Input type="number" step="0.01" value={form.depreciationRate} onChange={e=>setForm(f=>({...f,depreciationRate:e.target.value}))} placeholder="e.g. 25 para 4 años" /></div>
            <div className="space-y-2"><Label>Cuenta Contable</Label>
              <Select value={form.accountCode} onValueChange={v=>setForm(f=>({...f,accountCode:v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1211">1211 - Terrenos</SelectItem>
                  <SelectItem value="1212">1212 - Edificios</SelectItem>
                  <SelectItem value="1221">1221 - Mobiliario y Equipo</SelectItem>
                  <SelectItem value="1224">1224 - Vehículos</SelectItem>
                  <SelectItem value="1226">1226 - Equipo de TIC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={()=>setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Registrar Artículo</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMov !== null} onOpenChange={()=>setShowMov(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Movimiento de Almacén</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Tipo de Movimiento</Label>
              <Select value={movForm.movementType} onValueChange={v=>setMovForm(f=>({...f,movementType:v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Entrada','Salida','Transferencia','Baja','Ajuste'].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cantidad</Label><Input type="number" min="1" value={movForm.quantity} onChange={e=>setMovForm(f=>({...f,quantity:Number(e.target.value)}))} /></div>
              <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={movForm.date} onChange={e=>setMovForm(f=>({...f,date:e.target.value}))} /></div>
            </div>
            <div className="space-y-2"><Label>Referencia / Oficio</Label><Input value={movForm.reference} onChange={e=>setMovForm(f=>({...f,reference:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Justificación</Label><Input value={movForm.justification} onChange={e=>setMovForm(f=>({...f,justification:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Autorizado por</Label><Input value={movForm.authorizedBy} onChange={e=>setMovForm(f=>({...f,authorizedBy:e.target.value}))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowMov(null)}>Cancelar</Button>
              <Button onClick={handleMov}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── MAIN CAPTURE PAGE ─────────────────────────────────────────
export default function CapturePage({ module }: { module?: string }) {
  const m = module || 'egresos';
  return (
    <div className="space-y-4">
      {m === 'ingresos' && <CapturaIngresos />}
      {m === 'egresos' && <CapturaEgresos />}
      {m === 'deuda' && <DeudaPublica />}
      {m === 'almacen' && <AlmacenInventario />}
    </div>
  );
}
