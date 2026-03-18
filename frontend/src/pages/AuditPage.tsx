import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Shield } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = () => reportsApi.getAudit({ page, limit: 50 }).then(r => { setLogs(r.data.data||[]); setTotal(r.data.total||0); });
  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Registro inmutable de todas las acciones realizadas en el sistema</p>
      <Card>
        <CardContent className="p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} /></div></CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Usuario</TableHead><TableHead>Módulo</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No hay registros de auditoría</TableCell></TableRow>
                : logs.map((l,i)=>(
                  <TableRow key={i} className="text-xs">
                    <TableCell className="font-mono">{l.timestamp}</TableCell>
                    <TableCell>{l.user_name||`ID:${l.user_id}`}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{l.module}</Badge></TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>{l.entity_type}{l.entity_id?` #${l.entity_id}`:''}</TableCell>
                    <TableCell>{l.ip_address||'-'}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-xs text-muted-foreground">{total} registros totales</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Anterior</Button>
              <span className="text-sm px-2 py-1">Pág. {page}</span>
              <Button size="sm" variant="outline" onClick={()=>setPage(p=>p+1)} disabled={logs.length<50}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
