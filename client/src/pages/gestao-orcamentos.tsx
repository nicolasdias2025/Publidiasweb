import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  X,
  Calendar,
  Users,
  Newspaper,
} from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Budget } from "@shared/schema";

interface BudgetLine {
  jornal: string | null;
  valorCmCol: number;
  formato: number;
  incluirTotal: boolean;
}

interface ProcessedBudget {
  id: string;
  clientName: string;
  clientEmail: string;
  date: Date;
  approved: boolean;
  valorTotal: number;
  diagramacao: number;
  lines: BudgetLine[];
}

interface ClientConsolidated {
  clientName: string;
  total: number;
  diagramacao: number;
  budgets: ProcessedBudget[];
}

interface JornalConsolidated {
  jornal: string;
  total: number;
  lines: {
    clientName: string;
    date: Date;
    approved: boolean;
    valorCmCol: number;
    formato: number;
    subtotal: number;
  }[];
}

function processBudgetLines(budget: Budget): BudgetLine[] {
  const lines: BudgetLine[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const jornal = budget[`line${i}Jornal` as keyof Budget] as string | null;
    const valorCmCol = parseFloat(budget[`line${i}ValorCmCol` as keyof Budget] as string || "0");
    const formato = parseFloat(budget[`line${i}Formato` as keyof Budget] as string || "0");
    const incluirTotal = budget[`line${i}IncluirTotal` as keyof Budget] as boolean || false;
    
    if (jornal && incluirTotal) {
      lines.push({ jornal, valorCmCol, formato, incluirTotal });
    }
  }
  
  return lines;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export default function GestaoOrcamentos() {
  const [periodo, setPeriodo] = useState("mes");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [clienteFilter, setClienteFilter] = useState("");
  const [jornalFilter, setJornalFilter] = useState("");

  const [appliedPeriodo, setAppliedPeriodo] = useState("mes");
  const [appliedDataInicio, setAppliedDataInicio] = useState("");
  const [appliedDataFim, setAppliedDataFim] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("todos");
  const [appliedClienteFilter, setAppliedClienteFilter] = useState("");
  const [appliedJornalFilter, setAppliedJornalFilter] = useState("");

  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedJornais, setExpandedJornais] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("por-cliente");

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const processedBudgets = useMemo((): ProcessedBudget[] => {
    return budgets.map((b) => ({
      id: b.id,
      clientName: b.clientName,
      clientEmail: b.clientEmail,
      date: new Date(b.date),
      approved: b.approved || false,
      valorTotal: parseFloat(b.valorTotal || "0"),
      diagramacao: parseFloat(b.diagramacao || "0"),
      lines: processBudgetLines(b),
    }));
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    let filtered = processedBudgets;
    
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date = endOfDay(now);

    switch (appliedPeriodo) {
      case "hoje":
        startDate = startOfDay(now);
        break;
      case "semana":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case "mes":
        startDate = startOfMonth(now);
        break;
      case "personalizado":
        if (appliedDataInicio) startDate = parseISO(appliedDataInicio);
        if (appliedDataFim) endDate = endOfDay(parseISO(appliedDataFim));
        break;
    }

    if (startDate) {
      filtered = filtered.filter((b) =>
        isWithinInterval(b.date, { start: startDate!, end: endDate })
      );
    }

    if (appliedStatusFilter !== "todos") {
      const isApproved = appliedStatusFilter === "aprovado";
      filtered = filtered.filter((b) => b.approved === isApproved);
    }

    if (appliedClienteFilter.trim()) {
      const search = appliedClienteFilter.toLowerCase();
      filtered = filtered.filter((b) =>
        b.clientName.toLowerCase().includes(search)
      );
    }

    if (appliedJornalFilter.trim()) {
      const search = appliedJornalFilter.toLowerCase();
      filtered = filtered.filter((b) =>
        b.lines.some((l) => l.jornal?.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [processedBudgets, appliedPeriodo, appliedDataInicio, appliedDataFim, appliedStatusFilter, appliedClienteFilter, appliedJornalFilter]);

  const clientConsolidated = useMemo((): ClientConsolidated[] => {
    const map = new Map<string, ClientConsolidated>();
    
    for (const budget of filteredBudgets) {
      const existing = map.get(budget.clientName);
      if (existing) {
        existing.total += budget.valorTotal;
        existing.diagramacao += budget.diagramacao;
        existing.budgets.push(budget);
      } else {
        map.set(budget.clientName, {
          clientName: budget.clientName,
          total: budget.valorTotal,
          diagramacao: budget.diagramacao,
          budgets: [budget],
        });
      }
    }
    
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredBudgets]);

  const jornalConsolidated = useMemo((): JornalConsolidated[] => {
    const map = new Map<string, JornalConsolidated>();
    
    for (const budget of filteredBudgets) {
      for (const line of budget.lines) {
        if (!line.jornal) continue;
        
        const subtotal = line.valorCmCol * line.formato;
        const existing = map.get(line.jornal);
        
        if (existing) {
          existing.total += subtotal;
          existing.lines.push({
            clientName: budget.clientName,
            date: budget.date,
            approved: budget.approved,
            valorCmCol: line.valorCmCol,
            formato: line.formato,
            subtotal,
          });
        } else {
          map.set(line.jornal, {
            jornal: line.jornal,
            total: subtotal,
            lines: [{
              clientName: budget.clientName,
              date: budget.date,
              approved: budget.approved,
              valorCmCol: line.valorCmCol,
              formato: line.formato,
              subtotal,
            }],
          });
        }
      }
    }
    
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredBudgets]);

  const totals = useMemo(() => {
    const total = filteredBudgets.reduce((sum, b) => sum + b.valorTotal, 0);
    const diagramacao = filteredBudgets.reduce((sum, b) => sum + b.diagramacao, 0);
    return {
      total,
      diagramacao,
      publicacoes: total - diagramacao,
      qtd: filteredBudgets.length,
    };
  }, [filteredBudgets]);

  const periodoLabel = useMemo(() => {
    switch (appliedPeriodo) {
      case "hoje": return "Hoje";
      case "semana": return "Esta semana";
      case "mes": return format(new Date(), "MMMM yyyy", { locale: ptBR });
      case "personalizado": 
        if (appliedDataInicio && appliedDataFim) {
          return `${format(parseISO(appliedDataInicio), "dd/MM/yyyy")} - ${format(parseISO(appliedDataFim), "dd/MM/yyyy")}`;
        }
        return "Personalizado";
      default: return "Período";
    }
  }, [appliedPeriodo, appliedDataInicio, appliedDataFim]);

  const handleApplyFilters = () => {
    setAppliedPeriodo(periodo);
    setAppliedDataInicio(dataInicio);
    setAppliedDataFim(dataFim);
    setAppliedStatusFilter(statusFilter);
    setAppliedClienteFilter(clienteFilter);
    setAppliedJornalFilter(jornalFilter);
  };

  const handleClearFilters = () => {
    setPeriodo("mes");
    setDataInicio("");
    setDataFim("");
    setStatusFilter("todos");
    setClienteFilter("");
    setJornalFilter("");
    setAppliedPeriodo("mes");
    setAppliedDataInicio("");
    setAppliedDataFim("");
    setAppliedStatusFilter("todos");
    setAppliedClienteFilter("");
    setAppliedJornalFilter("");
  };

  const toggleClientExpanded = (clientName: string) => {
    const newSet = new Set(expandedClients);
    if (newSet.has(clientName)) {
      newSet.delete(clientName);
    } else {
      newSet.add(clientName);
    }
    setExpandedClients(newSet);
  };

  const toggleJornalExpanded = (jornal: string) => {
    const newSet = new Set(expandedJornais);
    if (newSet.has(jornal)) {
      newSet.delete(jornal);
    } else {
      newSet.add(jornal);
    }
    setExpandedJornais(newSet);
  };

  const exportToCSV = () => {
    let csvContent = "\uFEFF";
    
    if (activeTab === "por-cliente") {
      csvContent += "RESUMO POR CLIENTE\n";
      csvContent += "Cliente,Total,Diagramação,Publicações\n";
      for (const client of clientConsolidated) {
        const publicacoes = client.total - client.diagramacao;
        csvContent += `"${client.clientName}",${client.total.toFixed(2)},${client.diagramacao.toFixed(2)},${publicacoes.toFixed(2)}\n`;
      }
      
      csvContent += "\n\nDETALHAMENTO POR CLIENTE\n";
      csvContent += "Cliente,Data,Status,Valor Total,Diagramação,Jornais\n";
      for (const client of clientConsolidated) {
        for (const budget of client.budgets) {
          const jornais = budget.lines.map((l) => l.jornal).filter(Boolean).join("; ");
          csvContent += `"${client.clientName}",${formatDate(budget.date)},${budget.approved ? "Aprovado" : "Não aprovado"},${budget.valorTotal.toFixed(2)},${budget.diagramacao.toFixed(2)},"${jornais}"\n`;
        }
      }
    } else {
      csvContent += "RESUMO POR JORNAL/VEÍCULO\n";
      csvContent += "Jornal/Veículo,Total\n";
      for (const jornal of jornalConsolidated) {
        csvContent += `"${jornal.jornal}",${jornal.total.toFixed(2)}\n`;
      }
      
      csvContent += "\n\nDETALHAMENTO POR JORNAL/VEÍCULO\n";
      csvContent += "Jornal/Veículo,Cliente,Data,Status,Valor cm x col,Formato,Subtotal\n";
      for (const jornal of jornalConsolidated) {
        for (const line of jornal.lines) {
          csvContent += `"${jornal.jornal}","${line.clientName}",${formatDate(line.date)},${line.approved ? "Aprovado" : "Não aprovado"},${line.valorCmCol.toFixed(2)},${line.formato.toFixed(2)},${line.subtotal.toFixed(2)}\n`;
        }
      }
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orcamentos-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando orçamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Orçamentos - Relatórios
          </h1>
          <p className="text-muted-foreground text-sm">
            Acompanhamento e análise de orçamentos por cliente e jornal/veículo
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportToCSV}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Período
              </label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger data-testid="select-periodo">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mês</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodo === "personalizado" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Data início
                  </label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    data-testid="input-data-inicio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Data fim
                  </label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    data-testid="input-data-fim"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="nao-aprovado">Não aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Cliente
              </label>
              <Input
                placeholder="Buscar cliente..."
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
                data-testid="input-cliente"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Jornal/Veículo
              </label>
              <Input
                placeholder="Buscar jornal..."
                value={jornalFilter}
                onChange={(e) => setJornalFilter(e.target.value)}
                data-testid="input-jornal"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              data-testid="button-limpar-filtros"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
            <Button
              onClick={handleApplyFilters}
              data-testid="button-aplicar-filtro"
            >
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtro
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total no período</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-total-periodo">
              {formatCurrency(totals.total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diagramação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-diagramacao">
              {formatCurrency(totals.diagramacao)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-publicacoes">
              {formatCurrency(totals.publicacoes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qtd. orçamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-qtd-orcamentos">
              {totals.qtd}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{periodoLabel}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="por-cliente" data-testid="tab-por-cliente">
            <Users className="h-4 w-4 mr-2" />
            Por Cliente
          </TabsTrigger>
          <TabsTrigger value="por-jornal" data-testid="tab-por-jornal">
            <Newspaper className="h-4 w-4 mr-2" />
            Por Jornal/Veículo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="por-cliente" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {clientConsolidated.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum orçamento encontrado para os filtros selecionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium text-sm">Cliente</th>
                        <th className="text-right p-4 font-medium text-sm">Total</th>
                        <th className="text-right p-4 font-medium text-sm">Diagramação</th>
                        <th className="w-12 p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientConsolidated.map((client) => {
                        const isExpanded = expandedClients.has(client.clientName);
                        return (
                          <Collapsible
                            key={client.clientName}
                            open={isExpanded}
                            onOpenChange={() => toggleClientExpanded(client.clientName)}
                            asChild
                          >
                            <>
                              <CollapsibleTrigger asChild>
                                <tr
                                  className="border-b hover-elevate cursor-pointer"
                                  data-testid={`row-cliente-${client.clientName}`}
                                >
                                  <td className="p-4 font-medium">{client.clientName}</td>
                                  <td className="p-4 text-right font-semibold text-primary">
                                    {formatCurrency(client.total)}
                                  </td>
                                  <td className="p-4 text-right text-muted-foreground">
                                    {formatCurrency(client.diagramacao)}
                                  </td>
                                  <td className="p-4 text-center">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </td>
                                </tr>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <tr>
                                  <td colSpan={4} className="p-0">
                                    <div className="bg-muted/30 p-4 space-y-4">
                                      <div className="grid gap-4 md:grid-cols-3">
                                        <Card>
                                          <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground uppercase mb-1">
                                              Total
                                            </p>
                                            <p className="text-lg font-bold text-primary">
                                              {formatCurrency(client.total)}
                                            </p>
                                          </CardContent>
                                        </Card>
                                        <Card>
                                          <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground uppercase mb-1">
                                              Diagramação
                                            </p>
                                            <p className="text-lg font-bold">
                                              {formatCurrency(client.diagramacao)}
                                            </p>
                                          </CardContent>
                                        </Card>
                                        <Card>
                                          <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground uppercase mb-1">
                                              Publicações
                                            </p>
                                            <p className="text-lg font-bold">
                                              {formatCurrency(client.total - client.diagramacao)}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </div>

                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b">
                                              <th className="text-left p-3 font-medium">Data</th>
                                              <th className="text-left p-3 font-medium">Status</th>
                                              <th className="text-right p-3 font-medium">Valor Total</th>
                                              <th className="text-right p-3 font-medium">Diagramação</th>
                                              <th className="text-left p-3 font-medium">Jornais</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {client.budgets.map((budget) => (
                                              <tr
                                                key={budget.id}
                                                className="border-b"
                                                data-testid={`row-budget-${budget.id}`}
                                              >
                                                <td className="p-3">{formatDate(budget.date)}</td>
                                                <td className="p-3">
                                                  <Badge
                                                    className={budget.approved 
                                                      ? "bg-green-600 hover:bg-green-700 text-white" 
                                                      : "bg-red-600 hover:bg-red-700 text-white"
                                                    }
                                                  >
                                                    {budget.approved ? "Aprovado" : "Não aprovado"}
                                                  </Badge>
                                                </td>
                                                <td className="p-3 text-right font-medium">
                                                  {formatCurrency(budget.valorTotal)}
                                                </td>
                                                <td className="p-3 text-right text-muted-foreground">
                                                  {formatCurrency(budget.diagramacao)}
                                                </td>
                                                <td className="p-3 text-sm">
                                                  {budget.lines.map((l) => l.jornal).filter(Boolean).join(", ") || "-"}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </CollapsibleContent>
                            </>
                          </Collapsible>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="por-jornal" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {jornalConsolidated.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum orçamento encontrado para os filtros selecionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium text-sm">Jornal/Veículo</th>
                        <th className="text-right p-4 font-medium text-sm">Total</th>
                        <th className="w-12 p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jornalConsolidated.map((jornal) => {
                        const isExpanded = expandedJornais.has(jornal.jornal);
                        return (
                          <Collapsible
                            key={jornal.jornal}
                            open={isExpanded}
                            onOpenChange={() => toggleJornalExpanded(jornal.jornal)}
                            asChild
                          >
                            <>
                              <CollapsibleTrigger asChild>
                                <tr
                                  className="border-b hover-elevate cursor-pointer"
                                  data-testid={`row-jornal-${jornal.jornal}`}
                                >
                                  <td className="p-4 font-medium">{jornal.jornal}</td>
                                  <td className="p-4 text-right font-semibold text-primary">
                                    {formatCurrency(jornal.total)}
                                  </td>
                                  <td className="p-4 text-center">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </td>
                                </tr>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <tr>
                                  <td colSpan={3} className="p-0">
                                    <div className="bg-muted/30 p-4">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b">
                                              <th className="text-left p-3 font-medium">Cliente</th>
                                              <th className="text-left p-3 font-medium">Data</th>
                                              <th className="text-left p-3 font-medium">Status</th>
                                              <th className="text-right p-3 font-medium">Valor cm x col</th>
                                              <th className="text-right p-3 font-medium">Formato</th>
                                              <th className="text-right p-3 font-medium">Subtotal</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {jornal.lines.map((line, idx) => (
                                              <tr
                                                key={idx}
                                                className="border-b"
                                                data-testid={`row-jornal-line-${idx}`}
                                              >
                                                <td className="p-3">{line.clientName}</td>
                                                <td className="p-3">{formatDate(line.date)}</td>
                                                <td className="p-3">
                                                  <Badge
                                                    className={line.approved 
                                                      ? "bg-green-600 hover:bg-green-700 text-white" 
                                                      : "bg-red-600 hover:bg-red-700 text-white"
                                                    }
                                                  >
                                                    {line.approved ? "Aprovado" : "Não aprovado"}
                                                  </Badge>
                                                </td>
                                                <td className="p-3 text-right">
                                                  {formatCurrency(line.valorCmCol)}
                                                </td>
                                                <td className="p-3 text-right">{line.formato}</td>
                                                <td className="p-3 text-right font-medium">
                                                  {formatCurrency(line.subtotal)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </CollapsibleContent>
                            </>
                          </Collapsible>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
