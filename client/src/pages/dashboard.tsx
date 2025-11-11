import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckSquare, Receipt, TrendingUp, DollarSign, Users } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

export default function Dashboard() {
  //todo: remove mock functionality
  const recentBudgets = [
    { id: "ORC-001", cliente: "Empresa ABC Ltda", valor: "R$ 45.000,00", status: "pending" as const },
    { id: "ORC-002", cliente: "Tech Solutions", valor: "R$ 28.500,00", status: "approved" as const },
    { id: "ORC-003", cliente: "Indústria XYZ", valor: "R$ 92.000,00", status: "draft" as const },
  ];

  const recentApprovals = [
    { id: "AUT-045", tipo: "Compra de Equipamentos", solicitante: "João Silva", status: "pending" as const },
    { id: "AUT-046", tipo: "Viagem Corporativa", solicitante: "Maria Santos", status: "approved" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema corporativo</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Orçamentos Ativos"
          value="24"
          description="Últimos 30 dias"
          icon={FileText}
          trend={{ value: "+12%", isPositive: true }}
        />
        <StatCard
          title="Autorizações Pendentes"
          value="8"
          description="Aguardando aprovação"
          icon={CheckSquare}
        />
        <StatCard
          title="Notas Fiscais (mês)"
          value="156"
          description="Emitidas em novembro"
          icon={Receipt}
          trend={{ value: "+8%", isPositive: true }}
        />
        <StatCard
          title="Receita Total"
          value="R$ 2.4M"
          description="Acumulado no ano"
          icon={DollarSign}
          trend={{ value: "+18%", isPositive: true }}
        />
        <StatCard
          title="Campanhas Ativas"
          value="12"
          description="Marketing em andamento"
          icon={TrendingUp}
        />
        <StatCard
          title="Usuários Ativos"
          value="47"
          description="Equipe cadastrada"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos Recentes</CardTitle>
            <CardDescription>Últimas propostas criadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBudgets.map((budget) => (
                <div key={budget.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium font-mono text-sm" data-testid={`text-budget-id-${budget.id}`}>{budget.id}</p>
                    <p className="text-sm text-muted-foreground">{budget.cliente}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold font-mono text-sm">{budget.valor}</p>
                    <StatusBadge status={budget.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Autorizações Pendentes</CardTitle>
            <CardDescription>Aguardando sua aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApprovals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium font-mono text-sm" data-testid={`text-approval-id-${approval.id}`}>{approval.id}</p>
                    <p className="text-sm text-muted-foreground">{approval.tipo}</p>
                    <p className="text-xs text-muted-foreground">Por: {approval.solicitante}</p>
                  </div>
                  <StatusBadge status={approval.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
