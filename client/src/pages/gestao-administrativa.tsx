import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState, useMemo, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import GestaoOrcamentos from "./gestao-orcamentos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronRight, FileText, Users, Newspaper, Download, Filter, X, Calendar, Search, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Authorization, Invoice } from "@shared/schema";

interface FilterState {
  periodo: string;
  dataInicio: string;
  dataFim: string;
  cliente: string;
  jornal: string;
  diagramacaoMin: string;
  diagramacaoMax: string;
}

function GestaoPublicacoes() {
  const [activeTab, setActiveTab] = useState("por-cliente");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    periodo: "mes",
    dataInicio: "",
    dataFim: "",
    cliente: "",
    jornal: "",
    diagramacaoMin: "",
    diagramacaoMax: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    periodo: "mes",
    dataInicio: "",
    dataFim: "",
    cliente: "",
    jornal: "",
    diagramacaoMin: "",
    diagramacaoMax: "",
  });

  // Buscar autorizações
  const { data: authorizations = [], isLoading } = useQuery<Authorization[]>({
    queryKey: ["/api/authorizations"],
  });

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let filtered = [...authorizations];
    
    // Filtro por período
    const now = new Date();
    if (appliedFilters.periodo === "hoje") {
      filtered = filtered.filter(a => {
        const date = new Date(a.createdAt!);
        return date.toDateString() === now.toDateString();
      });
    } else if (appliedFilters.periodo === "semana") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(a => new Date(a.createdAt!) >= weekAgo);
    } else if (appliedFilters.periodo === "mes") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(a => new Date(a.createdAt!) >= monthAgo);
    } else if (appliedFilters.periodo === "personalizado" && appliedFilters.dataInicio && appliedFilters.dataFim) {
      const inicio = new Date(appliedFilters.dataInicio);
      const fim = new Date(appliedFilters.dataFim);
      fim.setHours(23, 59, 59, 999);
      filtered = filtered.filter(a => {
        const date = new Date(a.createdAt!);
        return date >= inicio && date <= fim;
      });
    }
    
    // Filtro por cliente
    if (appliedFilters.cliente) {
      filtered = filtered.filter(a => 
        a.clientName.toLowerCase().includes(appliedFilters.cliente.toLowerCase())
      );
    }
    
    // Filtro por jornal
    if (appliedFilters.jornal) {
      filtered = filtered.filter(a => 
        a.jornal.toLowerCase().includes(appliedFilters.jornal.toLowerCase())
      );
    }

    // Filtro por diagramação (intervalo de valor)
    if (appliedFilters.diagramacaoMin) {
      const min = parseFloat(appliedFilters.diagramacaoMin.replace(",", "."));
      if (!isNaN(min)) {
        filtered = filtered.filter(a => parseFloat(a.diagramacao || "0") >= min);
      }
    }
    if (appliedFilters.diagramacaoMax) {
      const max = parseFloat(appliedFilters.diagramacaoMax.replace(",", "."));
      if (!isNaN(max)) {
        filtered = filtered.filter(a => parseFloat(a.diagramacao || "0") <= max);
      }
    }
    
    return filtered;
  }, [authorizations, appliedFilters]);

  // Consolidado por cliente
  const consolidadoPorCliente = useMemo(() => {
    const grouped: Record<string, { 
      clientName: string; 
      items: Authorization[]; 
      valorTotal: number; 
      valorBruto: number; 
      valorLiquido: number; 
      diagramacao: number;
      count: number;
    }> = {};
    
    filteredData.forEach(auth => {
      const key = auth.clientName;
      if (!grouped[key]) {
        grouped[key] = { 
          clientName: key, 
          items: [], 
          valorTotal: 0, 
          valorBruto: 0, 
          valorLiquido: 0, 
          diagramacao: 0,
          count: 0 
        };
      }
      grouped[key].items.push(auth);
      grouped[key].valorTotal += parseFloat(auth.valorTotal || "0");
      grouped[key].valorBruto += parseFloat(auth.valorBruto || "0");
      grouped[key].valorLiquido += parseFloat(auth.valorLiquido || "0");
      grouped[key].diagramacao += parseFloat(auth.diagramacao || "0");
      grouped[key].count++;
    });
    
    return Object.values(grouped).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [filteredData]);

  // Consolidado por jornal
  const consolidadoPorJornal = useMemo(() => {
    const grouped: Record<string, { 
      jornal: string; 
      items: Authorization[]; 
      valorTotal: number; 
      valorBruto: number; 
      valorLiquido: number;
      count: number;
    }> = {};
    
    filteredData.forEach(auth => {
      const key = auth.jornal;
      if (!grouped[key]) {
        grouped[key] = { 
          jornal: key, 
          items: [], 
          valorTotal: 0, 
          valorBruto: 0, 
          valorLiquido: 0,
          count: 0 
        };
      }
      grouped[key].items.push(auth);
      grouped[key].valorTotal += parseFloat(auth.valorTotal || "0");
      grouped[key].valorBruto += parseFloat(auth.valorBruto || "0");
      grouped[key].valorLiquido += parseFloat(auth.valorLiquido || "0");
      grouped[key].count++;
    });
    
    return Object.values(grouped).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [filteredData]);

  // Totais gerais
  const totais = useMemo(() => {
    return filteredData.reduce((acc, auth) => ({
      valorTotal: acc.valorTotal + parseFloat(auth.valorTotal || "0"),
      valorBruto: acc.valorBruto + parseFloat(auth.valorBruto || "0"),
      valorLiquido: acc.valorLiquido + parseFloat(auth.valorLiquido || "0"),
      diagramacao: acc.diagramacao + parseFloat(auth.diagramacao || "0"),
      count: acc.count + 1,
    }), { valorTotal: 0, valorBruto: 0, valorLiquido: 0, diagramacao: 0, count: 0 });
  }, [filteredData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = { 
      periodo: "mes", 
      dataInicio: "", 
      dataFim: "", 
      cliente: "", 
      jornal: "",
      diagramacaoMin: "",
      diagramacaoMax: "",
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const exportCSV = () => {
    const headers = ["Cliente", "Jornal", "Período", "Dias", "Formato", "Inserções", "Desconto (%)", "Valor Total", "Valor Bruto", "Valor Líquido", "Diagramação"];
    const rows = filteredData.map(auth => [
      auth.clientName,
      auth.jornal,
      `${auth.mes}/${auth.ano}`,
      auth.diasPublicacao,
      auth.formato || `${auth.colLinha} × ${auth.cm}`,
      auth.numInsercoes,
      auth.desconto || "0",
      auth.valorTotal,
      auth.valorBruto,
      auth.valorLiquido,
      auth.diagramacao || "0"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `publicacoes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-gestao-publicacoes">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Publicações</h1>
          <p className="text-muted-foreground">Relatórios de publicações realizadas (somente leitura)</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2" data-testid="button-export-csv">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards Informativos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total no Período</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.valorTotal)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas as publicações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Publicações</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais.count}</div>
            <p className="text-xs text-muted-foreground">Quantidade de registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Valor Bruto</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.valorBruto)}</div>
            <p className="text-xs text-muted-foreground">Sem descontos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Valor Líquido</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.valorLiquido)}</div>
            <p className="text-xs text-muted-foreground">Com descontos aplicados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={filters.periodo} onValueChange={(v) => setFilters(f => ({ ...f, periodo: v }))}>
                <SelectTrigger data-testid="select-periodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Último Mês</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {filters.periodo === "personalizado" && (
              <>
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input 
                    type="date" 
                    value={filters.dataInicio}
                    onChange={(e) => setFilters(f => ({ ...f, dataInicio: e.target.value }))}
                    data-testid="input-data-inicio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input 
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => setFilters(f => ({ ...f, dataFim: e.target.value }))}
                    data-testid="input-data-fim"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input 
                placeholder="Buscar cliente..."
                value={filters.cliente}
                onChange={(e) => setFilters(f => ({ ...f, cliente: e.target.value }))}
                data-testid="input-filtro-cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Jornal/Veículo</Label>
              <Input 
                placeholder="Buscar jornal..."
                value={filters.jornal}
                onChange={(e) => setFilters(f => ({ ...f, jornal: e.target.value }))}
                data-testid="input-filtro-jornal"
              />
            </div>

            <div className="space-y-2">
              <Label>Diagramação (Mín)</Label>
              <Input 
                placeholder="Ex: 100,00"
                value={filters.diagramacaoMin}
                onChange={(e) => setFilters(f => ({ ...f, diagramacaoMin: e.target.value }))}
                data-testid="input-filtro-diagramacao-min"
              />
            </div>

            <div className="space-y-2">
              <Label>Diagramação (Máx)</Label>
              <Input 
                placeholder="Ex: 500,00"
                value={filters.diagramacaoMax}
                onChange={(e) => setFilters(f => ({ ...f, diagramacaoMax: e.target.value }))}
                data-testid="input-filtro-diagramacao-max"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} data-testid="button-aplicar-filtros">
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters} data-testid="button-limpar-filtros">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="por-cliente" data-testid="tab-por-cliente">Por Cliente</TabsTrigger>
          <TabsTrigger value="por-jornal" data-testid="tab-por-jornal">Por Jornal</TabsTrigger>
          <TabsTrigger value="detalhado" data-testid="tab-detalhado">Detalhado</TabsTrigger>
        </TabsList>

        {/* Aba Por Cliente */}
        <TabsContent value="por-cliente">
          <Card>
            <CardHeader>
              <CardTitle>Consolidado por Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma publicação encontrada no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aut._nº</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Valor Bruto</TableHead>
                      <TableHead className="text-right">Valor Líquido</TableHead>
                      <TableHead className="text-right">Diagramação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((auth) => (
                      <TableRow key={auth.id} data-testid={`row-cliente-${auth.id}`}>
                        <TableCell className="font-mono">{auth.authorizationNumber}</TableCell>
                        <TableCell className="font-medium">{auth.clientName}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(parseFloat(auth.valorTotal || "0"))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseFloat(auth.valorBruto || "0"))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseFloat(auth.valorLiquido || "0"))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseFloat(auth.diagramacao || "0"))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Por Jornal */}
        <TabsContent value="por-jornal">
          <Card>
            <CardHeader>
              <CardTitle>Consolidado por Jornal/Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              {consolidadoPorJornal.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma publicação encontrada no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Jornal/Veículo</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Valor Bruto</TableHead>
                      <TableHead className="text-right">Valor Líquido</TableHead>
                      <TableHead className="text-center">Publicações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidadoPorJornal.map((grupo) => (
                      <Fragment key={grupo.jornal}>
                        <TableRow 
                          className="cursor-pointer hover-elevate"
                          onClick={() => toggleRow(`jornal-${grupo.jornal}`)}
                          data-testid={`row-jornal-${grupo.jornal}`}
                        >
                          <TableCell>
                            {expandedRows.has(`jornal-${grupo.jornal}`) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{grupo.jornal}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(grupo.valorTotal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(grupo.valorBruto)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(grupo.valorLiquido)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{grupo.count}</Badge>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(`jornal-${grupo.jornal}`) && grupo.items.map((item) => (
                          <TableRow key={item.id} className="bg-muted/50">
                            <TableCell></TableCell>
                            <TableCell className="pl-8 text-sm">
                              {item.clientName} - {item.mes}/{item.ano}
                            </TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(parseFloat(item.valorTotal || "0"))}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(parseFloat(item.valorBruto || "0"))}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(parseFloat(item.valorLiquido || "0"))}</TableCell>
                            <TableCell className="text-center text-sm">{item.formato}</TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Detalhado */}
        <TabsContent value="detalhado">
          <Card>
            <CardHeader>
              <CardTitle>Lista Completa de Publicações</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma publicação encontrada no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Jornal</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Formato</TableHead>
                        <TableHead className="text-center">Inserções</TableHead>
                        <TableHead className="text-center">Desconto</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                        <TableHead className="text-right">Diagramação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((auth) => (
                        <TableRow key={auth.id} data-testid={`row-detalhe-${auth.id}`}>
                          <TableCell className="max-w-[150px] truncate">{auth.clientName}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{auth.jornal}</TableCell>
                          <TableCell>{auth.mes}/{auth.ano}</TableCell>
                          <TableCell className="max-w-[80px] truncate">{auth.diasPublicacao}</TableCell>
                          <TableCell>{auth.formato || `${auth.colLinha} × ${auth.cm}`}</TableCell>
                          <TableCell className="text-center">{auth.numInsercoes}</TableCell>
                          <TableCell className="text-center">{auth.desconto || "0"}%</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(parseFloat(auth.valorTotal || "0"))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(auth.valorBruto || "0"))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(auth.valorLiquido || "0"))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(auth.diagramacao || "0"))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FaturamentoFilterState {
  dataEmissaoInicio: string;
  dataEmissaoFim: string;
  cliente: string;
  valor: string;
  nfeNumber: string;
  vencimento: string;
  status: string;
}

function GestaoFaturamento() {
  const [filters, setFilters] = useState<FaturamentoFilterState>({
    dataEmissaoInicio: "",
    dataEmissaoFim: "",
    cliente: "",
    valor: "",
    nfeNumber: "",
    vencimento: "",
    status: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<FaturamentoFilterState>({
    dataEmissaoInicio: "",
    dataEmissaoFim: "",
    cliente: "",
    valor: "",
    nfeNumber: "",
    vencimento: "",
    status: "",
  });

  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const copyEmailToClipboard = async (email: string | null | undefined) => {
    if (!email) {
      toast({
        title: "E-mail não disponível",
        description: "Esta nota fiscal não possui e-mail cadastrado.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
      toast({
        title: "E-mail copiado!",
        description: email,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o e-mail.",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Filtro por data de emissão (início)
    if (appliedFilters.dataEmissaoInicio) {
      const inicio = new Date(appliedFilters.dataEmissaoInicio);
      filtered = filtered.filter(inv => new Date(inv.emissionDate) >= inicio);
    }

    // Filtro por data de emissão (fim)
    if (appliedFilters.dataEmissaoFim) {
      const fim = new Date(appliedFilters.dataEmissaoFim);
      fim.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => new Date(inv.emissionDate) <= fim);
    }

    // Filtro por cliente
    if (appliedFilters.cliente) {
      filtered = filtered.filter(inv =>
        inv.clientName.toLowerCase().includes(appliedFilters.cliente.toLowerCase())
      );
    }

    // Filtro por valor
    if (appliedFilters.valor) {
      const valorBusca = parseFloat(appliedFilters.valor.replace(",", "."));
      if (!isNaN(valorBusca)) {
        filtered = filtered.filter(inv => parseFloat(inv.value) === valorBusca);
      }
    }

    // Filtro por Nº NFe
    if (appliedFilters.nfeNumber) {
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(appliedFilters.nfeNumber.toLowerCase())
      );
    }

    // Filtro por vencimento
    if (appliedFilters.vencimento) {
      const vcto = new Date(appliedFilters.vencimento);
      filtered = filtered.filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return dueDate.toDateString() === vcto.toDateString();
      });
    }

    // Filtro por status (ignora "all" ou vazio)
    if (appliedFilters.status && appliedFilters.status !== "all") {
      filtered = filtered.filter(inv => inv.status === appliedFilters.status);
    }

    return filtered;
  }, [invoices, appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const emptyFilters = {
      dataEmissaoInicio: "",
      dataEmissaoFim: "",
      cliente: "",
      valor: "",
      nfeNumber: "",
      vencimento: "",
      status: "",
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== "");

  // Calcula o valor total das notas fiscais filtradas
  const valorTotal = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.value), 0);
  }, [filteredInvoices]);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Vencido</Badge>;
      case "replaced":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Substituído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-faturamento">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-gestao-faturamento">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Faturamento</h2>
        <Badge variant="secondary" className="text-sm">
          {filteredInvoices.length} registro(s)
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Data Emissão - Início */}
            <div className="space-y-2">
              <Label htmlFor="dataEmissaoInicio">Data Emissão (Início)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dataEmissaoInicio"
                  type="date"
                  value={filters.dataEmissaoInicio}
                  onChange={(e) => setFilters({ ...filters, dataEmissaoInicio: e.target.value })}
                  className="pl-10"
                  data-testid="filter-data-emissao-inicio"
                />
              </div>
            </div>

            {/* Data Emissão - Fim */}
            <div className="space-y-2">
              <Label htmlFor="dataEmissaoFim">Data Emissão (Fim)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dataEmissaoFim"
                  type="date"
                  value={filters.dataEmissaoFim}
                  onChange={(e) => setFilters({ ...filters, dataEmissaoFim: e.target.value })}
                  className="pl-10"
                  data-testid="filter-data-emissao-fim"
                />
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                type="text"
                placeholder="Buscar por cliente..."
                value={filters.cliente}
                onChange={(e) => setFilters({ ...filters, cliente: e.target.value })}
                data-testid="filter-cliente"
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="text"
                placeholder="Ex: 1500,00"
                value={filters.valor}
                onChange={(e) => setFilters({ ...filters, valor: e.target.value })}
                data-testid="filter-valor"
              />
            </div>

            {/* Nº NFe */}
            <div className="space-y-2">
              <Label htmlFor="nfeNumber">Nº NFe</Label>
              <Input
                id="nfeNumber"
                type="text"
                placeholder="Número da nota..."
                value={filters.nfeNumber}
                onChange={(e) => setFilters({ ...filters, nfeNumber: e.target.value })}
                data-testid="filter-nfe-number"
              />
            </div>

            {/* Vencimento */}
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vencimento"
                  type="date"
                  value={filters.vencimento}
                  onChange={(e) => setFilters({ ...filters, vencimento: e.target.value })}
                  className="pl-10"
                  data-testid="filter-vencimento"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="replaced">Substituído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botões */}
            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1" data-testid="button-apply-filters">
                <Search className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notas Fiscais */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº NFe</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {hasActiveFilters
                      ? "Nenhuma nota fiscal encontrada com os filtros aplicados."
                      : "Nenhuma nota fiscal cadastrada."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{invoice.clientName}</span>
                        {(invoice.status === "pending" || invoice.status === "overdue") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyEmailToClipboard(invoice.clientEmail)}
                            title={invoice.clientEmail ? `Copiar: ${invoice.clientEmail}` : "E-mail não cadastrado"}
                            data-testid={`button-copy-email-${invoice.id}`}
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.serviceType}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(invoice.value)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.emissionDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      {invoice.paymentDate ? formatDate(invoice.paymentDate) : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card Valor Total */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">VALOR TOTAL</span>
            <span className="text-2xl font-bold text-primary font-mono" data-testid="valor-total">
              {formatCurrency(valorTotal)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GestaoAdministrativo() {
  return <div data-testid="page-gestao-administrativo"></div>;
}

export default function GestaoAdministrativa() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/gestao-administrativa") {
      setLocation("/gestao-administrativa/orcamentos");
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/gestao-administrativa/orcamentos" component={GestaoOrcamentos} />
      <Route path="/gestao-administrativa/publicacoes" component={GestaoPublicacoes} />
      <Route path="/gestao-administrativa/faturamento" component={GestaoFaturamento} />
      <Route path="/gestao-administrativa/administrativo" component={GestaoAdministrativo} />
    </Switch>
  );
}
