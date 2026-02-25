import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckSquare, Receipt, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import type { Budget, Authorization, Invoice, Campaign, Lead } from "@shared/schema";

function ModuleCard({
  title,
  icon: Icon,
  href,
  isLoading,
  stats,
}: {
  title: string;
  icon: React.ElementType;
  href: string;
  isLoading: boolean;
  stats: { label: string; value: string | number; highlight?: boolean }[];
}) {
  const [, setLocation] = useLocation();

  return (
    <Card
      className="flex flex-col"
      data-testid={`card-module-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
        <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <CardTitle className="text-base font-semibold uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    stat.highlight ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-auto pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setLocation(href)}
            data-testid={`button-goto-${title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            Acessar módulo
            <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: authorizations = [], isLoading: loadingAuth } = useQuery<Authorization[]>({
    queryKey: ["/api/authorizations"],
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const budgetsThisMonth = budgets.filter((b) => {
    const d = new Date(b.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const budgetStats = [
    { label: "Total de orçamentos", value: budgets.length },
    { label: "Este mês", value: budgetsThisMonth.length },
  ];

  const authStats = [
    { label: "Total de autorizações", value: authorizations.length },
    {
      label: "Ativas",
      value: authorizations.filter((a) => a.status === "ativo").length,
    },
    {
      label: "Canceladas",
      value: authorizations.filter((a) => a.status === "cancelado").length,
      highlight: authorizations.filter((a) => a.status === "cancelado").length > 0,
    },
  ];

  const invoiceStats = [
    { label: "Total de notas", value: invoices.length },
    { label: "Emitidas", value: invoices.filter((i) => i.status === "issued").length },
    { label: "Pendentes", value: invoices.filter((i) => i.status === "pending").length },
    {
      label: "Vencidas",
      value: invoices.filter((i) => i.status === "overdue").length,
      highlight: invoices.filter((i) => i.status === "overdue").length > 0,
    },
  ];

  const marketingStats = [
    { label: "Campanhas ativas", value: campaigns.filter((c) => c.status === "active").length },
    { label: "Total de campanhas", value: campaigns.length },
    { label: "Total de leads", value: leads.length },
    {
      label: "Leads qualificados",
      value: leads.filter((l) => l.status === "qualified").length,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Visão geral do sistema corporativo</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <ModuleCard
          title="Orçamentos"
          icon={FileText}
          href="/orcamentos"
          isLoading={loadingBudgets}
          stats={budgetStats}
        />
        <ModuleCard
          title="Autorização"
          icon={CheckSquare}
          href="/autorizacoes"
          isLoading={loadingAuth}
          stats={authStats}
        />
        <ModuleCard
          title="Notas Fiscais"
          icon={Receipt}
          href="/notas-fiscais"
          isLoading={loadingInvoices}
          stats={invoiceStats}
        />
        <ModuleCard
          title="Marketing"
          icon={TrendingUp}
          href="/marketing"
          isLoading={loadingCampaigns || loadingLeads}
          stats={marketingStats}
        />
      </div>
    </div>
  );
}
