import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Activity } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  metadata: any;
  createdAt: Date | string;
  username: string | null;
}

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"];
const ENTITY_TYPES = ["budgets", "invoices", "users", "clients", "authorizations", "campaigns"];

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

export default function AdminAuditoria() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ["/api/audit-logs", { page, search, action, entityType }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "50" });
      if (search) params.append("username", search);
      if (action) params.append("action", action);
      if (entityType) params.append("entityType", entityType);
      const res = await fetch(`/api/audit-logs?${params}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Painel de Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitore todas as ações registradas no sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Usuário</label>
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                data-testid="input-audit-search"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ação</label>
              <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                <SelectTrigger data-testid="select-audit-action">
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Módulo</label>
              <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
                <SelectTrigger data-testid="select-audit-module">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Registro de Auditoria {data?.total ? `(${data.total})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Data/Hora</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Ação</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Módulo</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center p-6 text-sm text-muted-foreground">Carregando...</td></tr>
                ) : !data?.logs?.length ? (
                  <tr><td colSpan={5} className="text-center p-6 text-sm text-muted-foreground">Nenhum registro</td></tr>
                ) : (
                  data.logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/40">
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3 text-sm font-medium">{log.username || "Sistema"}</td>
                      <td className="p-3 text-sm">
                        <Badge className={actionColors[log.action] || ""}>{log.action}</Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{log.entityType}</td>
                      <td className="p-3 text-sm">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedLog && (
        <AlertDialog open onOpenChange={() => setSelectedLog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Detalhes</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p><span className="font-medium">Data:</span> {new Date(selectedLog.createdAt).toLocaleString("pt-BR")}</p>
              <p><span className="font-medium">Usuário:</span> {selectedLog.username || "—"}</p>
              <p><span className="font-medium">Ação:</span> {selectedLog.action}</p>
              <p><span className="font-medium">Módulo:</span> {selectedLog.entityType}</p>
              <p><span className="font-medium">ID:</span> {selectedLog.entityId || "—"}</p>
              {selectedLog.description && <p><span className="font-medium">Descrição:</span> {selectedLog.description}</p>}
            </AlertDialogDescription>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
