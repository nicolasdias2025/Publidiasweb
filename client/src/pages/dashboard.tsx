import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Copy,
  FileText,
  CheckSquare,
  Receipt,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Budget, Invoice, Campaign, Client } from "@shared/schema";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(raw: string | Date | null | undefined): string {
  if (!raw) return "—";
  const str = typeof raw === "string" ? raw : raw.toISOString();
  const parts = str.split("T")[0].split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function daysSince(raw: string | Date | null | undefined): number {
  if (!raw) return 0;
  const d = new Date(raw);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

function isTomorrow(raw: string | Date | null | undefined): boolean {
  if (!raw) return false;
  const pub = new Date(raw);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    pub.getDate() === tomorrow.getDate() &&
    pub.getMonth() === tomorrow.getMonth() &&
    pub.getFullYear() === tomorrow.getFullYear()
  );
}

// ─── budget view dialog (standalone) ─────────────────────────────────────────

function BudgetViewDialog({
  budget,
  open,
  onClose,
}: {
  budget: Budget | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!budget) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Orçamento</DialogTitle>
          <DialogDescription>Detalhes do orçamento de publicação</DialogDescription>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Número do Orçamento: </span>
            <span className="font-mono font-bold text-lg">
              Nº Orc. {String(budget.budgetNumber || 0).padStart(5, "0")}
            </span>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-4">
            <h3 className="text-sm font-semibold border-b pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Cliente</Label>
                <p className="font-medium">{budget.clientName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">E-mail</Label>
                <p className="font-medium">{budget.clientEmail}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-sm font-semibold border-b pb-2">Linhas de Publicação</h3>
            <div className="space-y-3">
              {[
                { jornal: budget.line1Jornal, valor: budget.line1ValorCmCol, formato: budget.line1Formato, incluir: budget.line1IncluirTotal },
                { jornal: budget.line2Jornal, valor: budget.line2ValorCmCol, formato: budget.line2Formato, incluir: budget.line2IncluirTotal },
                { jornal: budget.line3Jornal, valor: budget.line3ValorCmCol, formato: budget.line3Formato, incluir: budget.line3IncluirTotal },
                { jornal: budget.line4Jornal, valor: budget.line4ValorCmCol, formato: budget.line4Formato, incluir: budget.line4IncluirTotal },
                { jornal: budget.line5Jornal, valor: budget.line5ValorCmCol, formato: budget.line5Formato, incluir: budget.line5IncluirTotal },
              ].map(
                (line, i) =>
                  line.jornal && (
                    <div key={i} className="p-3 border rounded-md bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {line.incluir && <CheckCircle2 className="h-4 w-4 text-chart-2" />}
                          <span className="font-medium">Linha {i + 1}: {line.jornal}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Formato: {line.formato} | Valor: R$ {formatBRL(line.valor)}
                        </span>
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-sm font-semibold border-b pb-2">Valores</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Diagramação</Label>
                <p className="font-mono font-medium">R$ {formatBRL(budget.diagramacao)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Valor Total</Label>
                <p className="font-mono font-bold text-lg text-chart-2">
                  R$ {formatBRL(budget.valorTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-sm font-semibold border-b pb-2">Datas e Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Data Orç.</Label>
                <p className="font-medium">{formatDate(budget.createdAt)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Data Public.</Label>
                <p className="font-medium">{formatDate(budget.date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                {budget.approved ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    <span className="font-medium text-chart-2">Aprovado</span>
                  </div>
                ) : (budget as any).rejected ? (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">Reprovado</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Pendente</span>
                )}
              </div>
            </div>
          </div>

          {budget.observations && (
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold border-b pb-2">Observações</h3>
              <p className="text-sm text-muted-foreground">{budget.observations}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── panel header ─────────────────────────────────────────────────────────────

function PanelHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-3 border-b">
      <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary-foreground" />
      </div>
      <CardTitle className="text-base font-semibold uppercase tracking-wide">{title}</CardTitle>
    </CardHeader>
  );
}

// ─── separator row ────────────────────────────────────────────────────────────

function SeparatorRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-1 bg-muted/40 border-y border-border/60">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </td>
    </tr>
  );
}

// ─── empty row ────────────────────────────────────────────────────────────────

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="p-6 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

// ─── ORÇAMENTOS panel ─────────────────────────────────────────────────────────

function OrcamentosPanel() {
  const { toast } = useToast();
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  function copyEmail(email: string, name: string) {
    navigator.clipboard.writeText(email).then(() => {
      toast({ title: "E-mail copiado!", description: email });
    });
  }

  // Only pending (not approved, not rejected)
  const pending = budgets.filter((b) => !b.approved && !(b as any).rejected);

  const group1 = pending.filter((b) => { const d = daysSince(b.createdAt); return d >= 0 && d <= 4; });
  const group2 = pending.filter((b) => { const d = daysSince(b.createdAt); return d >= 10 && d <= 12; });
  const group3 = pending.filter((b) => { const d = daysSince(b.createdAt); return d >= 20 && d <= 22; });

  const hasAny = group1.length + group2.length + group3.length > 0;

  function BudgetRow({ budget }: { budget: Budget }) {
    const yellow = isTomorrow(budget.date);
    return (
      <tr
        key={budget.id}
        data-testid={`row-budget-${budget.id}`}
        className={yellow ? "bg-yellow-100 dark:bg-yellow-900/30" : "hover:bg-muted/40"}
      >
        <td className="p-3 text-sm font-mono font-semibold whitespace-nowrap">
          {String(budget.budgetNumber || 0).padStart(5, "0")}
        </td>
        <td className="p-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">{budget.clientName}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyEmail(budget.clientEmail, budget.clientName)}
              title={`Copiar e-mail: ${budget.clientEmail}`}
              data-testid={`button-copy-email-${budget.id}`}
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </td>
        <td className="p-3 text-sm font-mono font-semibold whitespace-nowrap">
          R$ {formatBRL(budget.valorTotal)}
        </td>
        <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(budget.createdAt)}
        </td>
        <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(budget.date)}
        </td>
        <td className="p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewingBudget(budget)}
            title="Visualizar orçamento"
            data-testid={`button-view-${budget.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <Card data-testid="panel-orcamentos">
      <PanelHeader icon={FileText} title="Orçamentos" />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nº Orç.</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor Total</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Orç.</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Public.</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <EmptyRow cols={6} message="Carregando..." />
              ) : !hasAny ? (
                <EmptyRow cols={6} message="Nenhum orçamento pendente no momento" />
              ) : (
                <>
                  {group1.map((b) => <BudgetRow key={b.id} budget={b} />)}
                  {group2.length > 0 && (
                    <>
                      <SeparatorRow cols={6} label="Reexibição após 10 dias" />
                      {group2.map((b) => <BudgetRow key={b.id} budget={b} />)}
                    </>
                  )}
                  {group3.length > 0 && (
                    <>
                      <SeparatorRow cols={6} label="Reexibição após 20 dias" />
                      {group3.map((b) => <BudgetRow key={b.id} budget={b} />)}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <BudgetViewDialog
        budget={viewingBudget}
        open={!!viewingBudget}
        onClose={() => setViewingBudget(null)}
      />
    </Card>
  );
}

// ─── AUTORIZAÇÃO panel ────────────────────────────────────────────────────────

function AutorizacaoPanel() {
  const { toast } = useToast();

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  function findCnpj(clientEmail: string): string | null {
    const c = clients.find(
      (cl) => cl.email === clientEmail || cl.email2 === clientEmail || cl.email3 === clientEmail
    );
    return c?.cnpj ?? null;
  }

  function copyCnpj(cnpj: string) {
    navigator.clipboard.writeText(cnpj).then(() => {
      toast({ title: "CNPJ copiado!", description: cnpj });
    });
  }

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/budgets/${id}`, { jornalConfirmed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({ title: "Confirmação registrada!", description: "Autorização confirmada para o jornal." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível confirmar.", variant: "destructive" });
    },
  });

  // Mostra apenas orçamentos aprovados ainda não confirmados ao jornal
  const pendentes = budgets.filter((b) => b.approved && !b.jornalConfirmed);

  return (
    <Card data-testid="panel-autorizacao">
      <PanelHeader icon={CheckSquare} title="Autorização" />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nº Orç.</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Clientes</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Jornal</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Publ.</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <EmptyRow cols={6} message="Carregando..." />
              ) : pendentes.length === 0 ? (
                <EmptyRow cols={6} message="Nenhuma autorização pendente de confirmação" />
              ) : (
                pendentes.map((b) => {
                  const jornal =
                    b.line1Jornal || b.line2Jornal || b.line3Jornal ||
                    b.line4Jornal || b.line5Jornal || "—";
                  return (
                    <tr
                      key={b.id}
                      className="border-b bg-yellow-100 dark:bg-yellow-900/30"
                      data-testid={`row-autorizacao-${b.id}`}
                    >
                      <td className="p-3 text-sm font-mono font-semibold whitespace-nowrap">
                        {String(b.budgetNumber || 0).padStart(5, "0")}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{b.clientName}</span>
                          {(() => {
                            const cnpj = findCnpj(b.clientEmail);
                            return cnpj ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyCnpj(cnpj)}
                                title={`Copiar CNPJ: ${cnpj}`}
                                data-testid={`button-copy-cnpj-${b.id}`}
                              >
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{jornal}</td>
                      <td className="p-3 text-sm font-mono font-semibold whitespace-nowrap">
                        R$ {formatBRL(b.valorTotal)}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(b.date)}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          onClick={() => confirmMutation.mutate(b.id)}
                          disabled={confirmMutation.isPending}
                          data-testid={`button-confirm-jornal-${b.id}`}
                        >
                          Confirmação Jornal
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── NOTAS FISCAIS panel ──────────────────────────────────────────────────────

const STATUS_NF: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:   { label: "Pendente",  variant: "outline" },
  issued:    { label: "Emitida",   variant: "default" },
  overdue:   { label: "Vencida",   variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

function NotasFiscaisPanel() {
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  return (
    <Card data-testid="panel-notas-fiscais">
      <PanelHeader icon={Receipt} title="Notas Fiscais" />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nº NF</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Emissão</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Vencimento</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <EmptyRow cols={6} message="Carregando..." />
              ) : invoices.length === 0 ? (
                <EmptyRow cols={6} message="Nenhuma nota fiscal cadastrada" />
              ) : (
                invoices.map((inv) => {
                  const st = STATUS_NF[inv.status] ?? { label: inv.status, variant: "outline" as const };
                  return (
                    <tr key={inv.id} className="border-b hover:bg-muted/40" data-testid={`row-invoice-${inv.id}`}>
                      <td className="p-3 text-sm font-mono font-semibold">{inv.invoiceNumber}</td>
                      <td className="p-3 text-sm font-medium">{inv.clientName}</td>
                      <td className="p-3 text-sm font-mono font-semibold whitespace-nowrap">
                        R$ {formatBRL(inv.value)}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(inv.emissionDate)}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="p-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MARKETING panel ──────────────────────────────────────────────────────────

function MarketingPanel() {
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  return (
    <Card data-testid="panel-marketing">
      <PanelHeader icon={TrendingUp} title="Marketing" />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Campanha</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Canal</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversões</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <EmptyRow cols={5} message="Carregando..." />
              ) : campaigns.length === 0 ? (
                <EmptyRow cols={5} message="Nenhuma campanha cadastrada" />
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/40" data-testid={`row-campaign-${c.id}`}>
                    <td className="p-3 text-sm font-medium">{c.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{c.channel}</td>
                    <td className="p-3 text-sm text-center">{c.leads}</td>
                    <td className="p-3 text-sm text-center">{c.conversions}</td>
                    <td className="p-3">
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>
                        {c.status === "active" ? "Ativa" : c.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Visão geral do sistema corporativo</p>
      </div>

      <OrcamentosPanel />
      <AutorizacaoPanel />
      <NotasFiscaisPanel />
      <MarketingPanel />
    </div>
  );
}
