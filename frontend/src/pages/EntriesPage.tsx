import { useEffect, useState } from 'react';
import { entriesApi, accountsApi, budgetApi } from '@/lib/api';
import { useStore, useToast } from '@/store/useStore';
import { formatCurrency, formatDateShort, getMomentoColor, getStatusColor, MOMENTOS_EGRESO, MOMENTOS_INGRESO, MONTHS } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, CheckCircle, XCircle, Copy, Trash2, AlertCircle, BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENTRY_TYPES = ['Ingreso','Egreso','Diario','Apertura','Cierre'];

function MomentoPipeline({ tipo, current }: { tipo: string; current?: string }) {
  const steps = tipo === 'Ingreso' ? MOMENTOS_INGRESO : MOMENTOS_EGRESO;
  const idx = current ? steps.indexOf(current) : -1;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', i <= idx ? getMomentoColor(s) : 'bg-gray-100 text-gray-400')}>{s}</span>
          {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

export default function EntriesPage() {
  const { fiscalYear, period, user } = useStore();
  const { success, error, info } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: 'Egreso', date: new Date().toISOString().split('T')[0],
    concept: '', reference: '', area: '', officer: '',
    period: period || new Date().getMonth() + 1,
    momento: 'Devengado', notes: '', lines: [] as any[],
  });

  const loadEntries = () => {
    setLoading(true);
    const params: any = { fiscalYear, page, limit: 15 };
    if (period) params.period = period;
    if (search) params.search = search;
    if (filterType !== 'all') params.type = filterType;
    if (filterStatus !== 'all') params.status = filterStatus;
    entriesApi.getAll(params).then(r => {
      setEntries(r.data.data || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadEntries(); }, [fiscalYear, period, page, search, filterType, filterStatus]);
  useEffect(() => {
    accountsApi.getAll({ level: 4, active: true }).then(r => setAccounts(r.data.data || []));
    entriesApi.getTemplates().then(r => setTemplates(r.data.data || []));
  }, []);

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { accountCode: '', description: '', debit: 0, credit: 0 }] }));
  const removeLine = (i: number) => setForm(f => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }));
  const updateLine = (i: number, field: string, value: any) => setForm(f => ({ ...f, lines: f.lines.map((l, j) => j === i ? { ...l, [field]: value } : l) }));

  const totalDebit = form.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const applyTemplate = (tpl: any) => {
    const amount = 0;
    const lines = tpl.lines.map((l: any) => ({
      accountCode: l.accountCode, description: l.description,
      debit: l.debitFormula === 'amount' ? amount : 0,
      credit: l.creditFormula === 'amount' ? amount : 0,
    }));
    setForm(f => ({ ...f, lines, momento: tpl.momento, concept: tpl.name }));
    setSelectedTemplate(tpl);
    info('Plantilla aplicada', `${tpl.name} — ${tpl.normReference}`);
  };

  const handleSubmit = async () => {
    if (!form.concept || !form.date) { error('Datos incompletos', 'Concepto y fecha son requeridos'); return; }
    if (form.lines.length < 2) { error('Sin movimientos', 'Agregue al menos 2 líneas'); return; }
    if (!isBalanced) { error('Póliza desbalanceada', `Cargos: ${formatCurrency(totalDebit)} / Abonos: ${formatCurrency(totalCredit)}`); return; }
    setSaving(true);
    try {
      const res = await entriesApi.create({ ...form, fiscalYear });
      success('Póliza creada', `Folio: ${res.data.data.folio}`);
      setShowNew(false);
      setForm({ type: 'Egreso', date: new Date().toISOString().split('T')[0], concept: '', reference: '', area: '', officer: '', period: period || new Date().getMonth() + 1, momento: 'Devengado', notes: '', lines: [] });
      loadEntries();
    } catch (e: any) { error('Error', e.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const openDetail = async (id: number) => {
    const r = await entriesApi.getOne(id);
    setShowDetail(r.data.data);
  };

  const authorize = async (id: number) => {
    await entriesApi.authorize(id);
    success('Autorizada', 'Póliza autorizada exitosamente');
    loadEntries();
    if (showDetail?.id === id) openDetail(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Registro Único e Integrador — Contable, Presupuestal y Programático</p>
          <p className="text-xs text-muted-foreground mt-0.5">Referencia: CONAC — Acuerdo por el que se emite el Manual de Contabilidad Gubernamental</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Nueva Póliza</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar folio, concepto, referencia..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {ENTRY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {['Borrador','Validada','Autorizada','Cancelada'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Folio</TableHead>
                <TableHead className="w-24">Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="w-28">Momento</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead className="w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No se encontraron pólizas</TableCell></TableRow>
              ) : entries.map(e => (
                <TableRow key={e.id} className={e.status === 'Cancelada' ? 'opacity-50' : ''}>
                  <TableCell><span className="font-mono text-xs font-medium">{e.folio}</span></TableCell>
                  <TableCell className="text-xs">{formatDateShort(e.date)}</TableCell>
                  <TableCell>
                    <p className="text-sm truncate max-w-xs">{e.concept}</p>
                    {e.reference && <p className="text-xs text-muted-foreground">{e.reference}</p>}
                  </TableCell>
                  <TableCell>{e.momento && <Badge className={cn('text-xs', getMomentoColor(e.momento))}>{e.momento}</Badge>}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatCurrency(e.total_debit)}</TableCell>
                  <TableCell><Badge className={cn('text-xs', getStatusColor(e.status))}>{e.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(e.id)}><Eye className="h-3 w-3" /></Button>
                      {e.status === 'Borrador' && user?.role === 'Administrador' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => authorize(e.id)}><CheckCircle className="h-3 w-3" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-xs text-muted-foreground">{total} pólizas totales</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Anterior</Button>
              <span className="text-sm px-2 py-1">Página {page}</span>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p+1)} disabled={entries.length < 15}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NEW Entry Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Póliza — Registro Único e Integrador</DialogTitle></DialogHeader>
          <Tabs defaultValue="contable">
            <TabsList>
              <TabsTrigger value="plantillas">Plantillas CONAC</TabsTrigger>
              <TabsTrigger value="contable">Asiento Contable</TabsTrigger>
              <TabsTrigger value="presupuestal">Registro Presupuestal</TabsTrigger>
            </TabsList>

            {/* Templates */}
            <TabsContent value="plantillas">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Seleccione una plantilla predefinida conforme a las Guías Contabilizadoras CONAC:</p>
                {['Servicios Personales','Materiales y Suministros','Servicios Generales','Ingresos - Participaciones','Deuda Pública','Bienes Muebles e Inmuebles','Ajustes Contables','Apertura','Cierre'].map(cat => {
                  const catTpls = templates.filter(t => t.category === cat);
                  if (!catTpls.length) return null;
                  return (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mt-3 mb-1">{cat}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {catTpls.map(t => (
                          <button key={t.id} onClick={() => { applyTemplate(t); }}
                            className={cn("text-left p-3 rounded-lg border text-sm hover:bg-accent transition-colors", selectedTemplate?.id===t.id && "border-primary bg-primary/5")}>
                            <p className="font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.momento} • {t.normReference}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Contable */}
            <TabsContent value="contable" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Póliza</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ENTRY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={String(form.period)} onValueChange={v => setForm(f => ({ ...f, period: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Concepto</Label>
                  <Input value={form.concept} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} placeholder="Descripción del asiento contable..." />
                </div>
                <div className="space-y-2">
                  <Label>Momento Contable</Label>
                  <Select value={form.momento} onValueChange={v => setForm(f => ({ ...f, momento: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(form.type === 'Ingreso' ? MOMENTOS_INGRESO : MOMENTOS_EGRESO).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referencia / Factura</Label>
                  <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="No. factura, oficio, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Área / Dependencia</Label>
                  <Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Funcionario</Label>
                  <Input value={form.officer} onChange={e => setForm(f => ({ ...f, officer: e.target.value }))} />
                </div>
              </div>

              {/* Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Movimientos Contables (Cargos y Abonos)</Label>
                  <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Agregar línea</Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left w-40">Cuenta</th>
                        <th className="px-3 py-2 text-left">Descripción</th>
                        <th className="px-3 py-2 text-right w-32">Cargo</th>
                        <th className="px-3 py-2 text-right w-32">Abono</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.lines.map((line, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1">
                            <select className="w-full text-xs border rounded p-1 bg-background" value={line.accountCode}
                              onChange={e => { const acc = accounts.find(a => a.code === e.target.value); updateLine(i, 'accountCode', e.target.value); if (acc) updateLine(i, 'description', acc.name); }}>
                              <option value="">-- Cuenta --</option>
                              {accounts.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1"><input className="w-full text-xs border rounded p-1 bg-background" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} /></td>
                          <td className="px-2 py-1"><input className="w-full text-xs border rounded p-1 text-right bg-background" type="number" min="0" step="0.01" value={line.debit || ''} onChange={e => updateLine(i, 'debit', Number(e.target.value))} /></td>
                          <td className="px-2 py-1"><input className="w-full text-xs border rounded p-1 text-right bg-background" type="number" min="0" step="0.01" value={line.credit || ''} onChange={e => updateLine(i, 'credit', Number(e.target.value))} /></td>
                          <td className="px-2 py-1"><button onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button></td>
                        </tr>
                      ))}
                      {form.lines.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">Seleccione una plantilla o agregue líneas manualmente</td></tr>}
                    </tbody>
                    <tfoot className="bg-muted font-medium text-xs">
                      <tr>
                        <td colSpan={2} className="px-3 py-2">TOTALES</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(totalDebit)}</td>
                        <td className={cn("px-3 py-2 text-right", !isBalanced && form.lines.length > 0 ? 'text-red-600' : '')}>{formatCurrency(totalCredit)}</td>
                        <td className="px-2 py-2 text-center">
                          {form.lines.length > 0 && (isBalanced ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-red-500" />)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {!isBalanced && form.lines.length > 0 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Los cargos deben ser iguales a los abonos (Partida Doble)</p>
                )}
                {selectedTemplate && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                    <p className="font-semibold">📋 Plantilla: {selectedTemplate.name}</p>
                    <p className="mt-1">{selectedTemplate.description}</p>
                    <p className="mt-1 font-mono">Ref: {selectedTemplate.normReference}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Presupuestal */}
            <TabsContent value="presupuestal">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">El Registro Presupuestal se genera automáticamente al guardar la póliza. Para transacciones con impacto presupuestal, el sistema actualizará los momentos contables del presupuesto de egresos o ingresos correspondiente.</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-background p-3 rounded border">
                    <p className="font-semibold">Flujo de Egresos:</p>
                    <p className="text-muted-foreground mt-1">{MOMENTOS_EGRESO.join(' → ')}</p>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <p className="font-semibold">Flujo de Ingresos:</p>
                    <p className="text-muted-foreground mt-1">{MOMENTOS_INGRESO.join(' → ')}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <MomentoPipeline tipo={form.type} current={form.momento} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !isBalanced || form.lines.length < 2}>
              {saving ? 'Guardando...' : 'Registrar Póliza'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {showDetail && (
        <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="font-mono">{showDetail.folio}</span>
                <Badge className={cn('text-xs', getStatusColor(showDetail.status))}>{showDetail.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">Fecha:</span> {formatDateShort(showDetail.date)}</div>
                <div><span className="text-muted-foreground">Tipo:</span> {showDetail.type}</div>
                <div><span className="text-muted-foreground">Período:</span> {MONTHS[showDetail.period-1]} {showDetail.fiscal_year}</div>
                <div className="col-span-2 md:col-span-3"><span className="text-muted-foreground">Concepto:</span> {showDetail.concept}</div>
                {showDetail.reference && <div><span className="text-muted-foreground">Referencia:</span> {showDetail.reference}</div>}
                {showDetail.area && <div><span className="text-muted-foreground">Área:</span> {showDetail.area}</div>}
              </div>
              {showDetail.momento && (
                <div>
                  <p className="text-sm font-medium mb-2">Momento Contable:</p>
                  <MomentoPipeline tipo={showDetail.type} current={showDetail.momento} />
                </div>
              )}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs"><tr><th className="px-4 py-2 text-left">Cuenta</th><th className="px-4 py-2 text-left">Descripción</th><th className="px-4 py-2 text-right">Cargo</th><th className="px-4 py-2 text-right">Abono</th></tr></thead>
                  <tbody>
                    {showDetail.lines?.map((l: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs">{l.account_code}<br/><span className="text-muted-foreground">{l.account_name}</span></td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{l.description}</td>
                        <td className="px-4 py-2 text-right text-xs">{l.debit > 0 ? formatCurrency(l.debit) : '-'}</td>
                        <td className="px-4 py-2 text-right text-xs">{l.credit > 0 ? formatCurrency(l.credit) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-bold text-xs">
                    <tr><td colSpan={2} className="px-4 py-2">TOTALES</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(showDetail.total_debit)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(showDetail.total_credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                {showDetail.status === 'Borrador' && user?.role === 'Administrador' && (
                  <Button size="sm" onClick={() => authorize(showDetail.id)}><CheckCircle className="h-4 w-4 mr-1" />Autorizar</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setShowDetail(null)}>Cerrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
