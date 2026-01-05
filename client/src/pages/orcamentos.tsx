/**
 * Módulo de Orçamentos - Publicações em Jornais Oficiais
 * 
 * Sistema completo de criação e gestão de orçamentos para publicações
 * em jornais como Diário Oficial da União.
 * 
 * Funcionalidades:
 * - Formulário com 5 linhas de publicação
 * - Cálculo automático: Valor Total = Σ(formato × valor_cm_col) + diagramação
 * - Validação de campos obrigatórios
 * - Integração completa com backend
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, Trash2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Budget } from "@shared/schema";

/**
 * Interface para cada linha de publicação
 * Linhas 1-4: campos padrão
 * Linha 5: Tabela de Formação de Preço com campos adicionais
 */
interface BudgetLine {
  jornal: string;
  valorCmCol: string;       // Valor cm x col./linha (linhas 1-4)
  formato: string;
  incluirTotal: boolean;
  // Campos exclusivos da Linha 5 (Tabela de Formação de Preço)
  valorLiquido?: string;    // Valor cm x col./linha LÍQUIDO
  valorCliente?: string;    // Valor Final cm x col./linha CLIENTE
  imposto?: string;         // Imposto em percentual (%)
}

export default function Orcamentos() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estados do formulário
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [diagramacao, setDiagramacao] = useState("");
  // Usa data local para evitar problemas de timezone
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [observations, setObservations] = useState("");
  const [approved, setApproved] = useState(false);
  
  // Estados dos checkboxes de conferência
  const [conferirRazaoSocial, setConferirRazaoSocial] = useState(false);
  const [conferirDatas, setConferirDatas] = useState(false);
  const [conferirValores, setConferirValores] = useState(false);

  // Busca o próximo número de orçamento quando o dialog abre
  const { data: nextNumberData, refetch: refetchNextNumber } = useQuery<{ nextNumber: number }>({
    queryKey: ["/api/budgets/next-number"],
    enabled: isDialogOpen && isAuthenticated,
  });

  // Estados das 5 linhas de publicação
  // Linhas 1-4: padrão | Linha 5: Tabela de Formação de Preço
  const [lines, setLines] = useState<BudgetLine[]>([
    { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
    { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
    { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
    { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
    { jornal: "", valorCmCol: "", formato: "", incluirTotal: false, valorLiquido: "", valorCliente: "", imposto: "" },
  ]);

  const [valorTotal, setValorTotal] = useState("0.00");

  /**
   * CÁLCULO AUTOMÁTICO DO VALOR TOTAL
   * 
   * Regra: Para cada linha marcada (incluirTotal = true):
   * Linhas 1-4: valor_linha = formato × valor_cm_col
   * Linha 5 (Tabela de Formação de Preço): valor_linha = formato × valorCliente
   * 
   * Valor Total = Σ(valores_linhas_marcadas) + diagramação
   */
  useEffect(() => {
    const diagramacaoNum = parseFloat(diagramacao) || 0;

    let total = 0;

    // Calcula soma das linhas 1-4 marcadas
    lines.slice(0, 4).forEach(line => {
      if (line.incluirTotal && line.valorCmCol && line.formato) {
        const valorCmColNum = parseFloat(line.valorCmCol) || 0;
        const formatoNum = parseFloat(line.formato) || 0;
        total += formatoNum * valorCmColNum;
      }
    });

    // Calcula linha 5 (usa valorCliente)
    const line5 = lines[4];
    if (line5.incluirTotal && line5.valorCliente && line5.formato) {
      const valorClienteNum = parseFloat(line5.valorCliente) || 0;
      const formatoNum = parseFloat(line5.formato) || 0;
      total += formatoNum * valorClienteNum;
    }

    // Adiciona diagramação
    total += diagramacaoNum;

    setValorTotal(total.toFixed(2));
  }, [diagramacao, lines]);

  // Busca orçamentos do backend
  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    enabled: isAuthenticated,
  });

  // Mutação para criar orçamento
  const createMutation = useMutation({
    mutationFn: async (budgetData: any) => {
      await apiRequest("POST", "/api/budgets", budgetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/next-number"] });
      toast({
        title: "Sucesso!",
        description: "Orçamento criado com sucesso.",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao criar orçamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para deletar orçamento
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Sucesso!",
        description: "Orçamento excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao excluir orçamento.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    setDiagramacao("");
    // Usa data local para evitar problemas de timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
    setObservations("");
    setApproved(false);
    setConferirRazaoSocial(false);
    setConferirDatas(false);
    setConferirValores(false);
    setLines([
      { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
      { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
      { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
      { jornal: "", valorCmCol: "", formato: "", incluirTotal: false },
      { jornal: "", valorCmCol: "", formato: "", incluirTotal: false, valorLiquido: "", valorCliente: "" },
    ]);
  };

  const handleLineChange = (index: number, field: keyof BudgetLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  /**
   * Validação do formulário
   * Requisitos:
   * - Cliente obrigatório
   * - E-mail obrigatório e válido
   * - Pelo menos uma linha marcada
   */
  const handleSubmit = () => {
    // Validação: Cliente
    if (!clientName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    // Validação: E-mail
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, forneça um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    // Validação: Pelo menos uma linha marcada
    const hasLineMarcada = lines.some(line => line.incluirTotal);
    if (!hasLineMarcada) {
      toast({
        title: "Nenhuma linha selecionada",
        description: "Por favor, marque pelo menos uma linha para incluir no cálculo.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados para envio
    const budgetData = {
      clientName,
      clientEmail,
      
      line1Jornal: lines[0].jornal || null,
      line1ValorCmCol: lines[0].valorCmCol || "0",
      line1Formato: lines[0].formato || "0",
      line1IncluirTotal: lines[0].incluirTotal,
      
      line2Jornal: lines[1].jornal || null,
      line2ValorCmCol: lines[1].valorCmCol || "0",
      line2Formato: lines[1].formato || "0",
      line2IncluirTotal: lines[1].incluirTotal,
      
      line3Jornal: lines[2].jornal || null,
      line3ValorCmCol: lines[2].valorCmCol || "0",
      line3Formato: lines[2].formato || "0",
      line3IncluirTotal: lines[2].incluirTotal,
      
      line4Jornal: lines[3].jornal || null,
      line4ValorCmCol: lines[3].valorCmCol || "0",
      line4Formato: lines[3].formato || "0",
      line4IncluirTotal: lines[3].incluirTotal,
      
      line5Jornal: lines[4].jornal || null,
      line5ValorCmCol: lines[4].valorCmCol || "0",
      line5Formato: lines[4].formato || "0",
      line5IncluirTotal: lines[4].incluirTotal,
      
      valorTotal,
      diagramacao: diagramacao || "0",
      date: new Date(date),
      observations: observations || null,
      approved,
    };

    createMutation.mutate(budgetData);
  };

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa estar logado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const filteredBudgets = budgets.filter(b => 
    b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie orçamentos para publicações em jornais oficiais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-budget">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Orçamento</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um orçamento de publicação em jornal oficial
              </DialogDescription>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Número do Orçamento: </span>
                <span className="font-mono font-bold text-lg" data-testid="text-budget-number">
                  Nº Orc. {String(nextNumberData?.nextNumber || 1).padStart(5, '0')}
                </span>
              </div>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Dados do Cliente */}
              <div className="grid gap-4">
                <h3 className="text-sm font-semibold border-b pb-2">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Input 
                      id="cliente" 
                      placeholder="Nome do cliente" 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      data-testid="input-cliente" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="email@exemplo.com" 
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      data-testid="input-email" 
                    />
                  </div>
                </div>
              </div>

              {/* Linhas de Publicação 1-4 */}
              <div className="grid gap-4">
                <h3 className="text-sm font-semibold border-b pb-2">Linhas de Publicação</h3>
                <p className="text-xs text-muted-foreground">
                  Marque as linhas que deseja incluir no cálculo do valor total
                </p>
                
                {lines.slice(0, 4).map((line, index) => (
                  <Card key={index} className={line.incluirTotal ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="grid gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`line-${index}-incluir`}
                            checked={line.incluirTotal}
                            onCheckedChange={(checked) => 
                              handleLineChange(index, 'incluirTotal', checked === true)
                            }
                            data-testid={`checkbox-line-${index + 1}`}
                          />
                          <Label 
                            htmlFor={`line-${index}-incluir`}
                            className="font-semibold cursor-pointer"
                          >
                            Linha {index + 1} {line.incluirTotal && "(✓ Incluída no total)"}
                          </Label>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`line-${index}-jornal`}>
                              Jornal (ex: Diário Oficial da União)
                            </Label>
                            <Input
                              id={`line-${index}-jornal`}
                              placeholder="Nome do jornal"
                              value={line.jornal}
                              onChange={(e) => handleLineChange(index, 'jornal', e.target.value)}
                              data-testid={`input-jornal-${index + 1}`}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`line-${index}-valor`}>
                              Valor cm x col./linha
                            </Label>
                            <Input
                              id={`line-${index}-valor`}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={line.valorCmCol}
                              onChange={(e) => handleLineChange(index, 'valorCmCol', e.target.value)}
                              data-testid={`input-valor-${index + 1}`}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`line-${index}-formato`}>
                              Formato
                            </Label>
                            <Input
                              id={`line-${index}-formato`}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={line.formato}
                              onChange={(e) => handleLineChange(index, 'formato', e.target.value)}
                              data-testid={`input-formato-${index + 1}`}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Linha 5 - Tabela de Formação de Preço */}
              <div className="grid gap-4">
                <h3 className="text-sm font-semibold border-b pb-2">Linha 5 - Tabela de Formação de Preço</h3>
                <Card className={lines[4].incluirTotal ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="line-4-incluir"
                          checked={lines[4].incluirTotal}
                          onCheckedChange={(checked) => 
                            handleLineChange(4, 'incluirTotal', checked === true)
                          }
                          data-testid="checkbox-line-5"
                        />
                        <Label 
                          htmlFor="line-4-incluir"
                          className="font-semibold cursor-pointer"
                        >
                          Incluir no total {lines[4].incluirTotal && "(✓ Incluída no total)"}
                        </Label>
                      </div>
                      
                      {/* Primeira linha: Jornal e Formato */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="line-4-jornal">Jornal</Label>
                          <Input
                            id="line-4-jornal"
                            placeholder="Nome do jornal"
                            value={lines[4].jornal}
                            onChange={(e) => handleLineChange(4, 'jornal', e.target.value)}
                            data-testid="input-jornal-5"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="line-4-formato">Formato</Label>
                          <Input
                            id="line-4-formato"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={lines[4].formato}
                            onChange={(e) => handleLineChange(4, 'formato', e.target.value)}
                            data-testid="input-formato-5"
                          />
                        </div>
                      </div>

                      {/* Segunda linha: Valores Líquido e Cliente */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="line-4-liquido">Valor cm x col./linha LÍQUIDO</Label>
                          <Input
                            id="line-4-liquido"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={lines[4].valorLiquido || ""}
                            onChange={(e) => handleLineChange(4, 'valorLiquido', e.target.value)}
                            data-testid="input-valor-liquido-5"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="line-4-cliente">Valor Final cm x col./linha CLIENTE</Label>
                          <Input
                            id="line-4-cliente"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={lines[4].valorCliente || ""}
                            onChange={(e) => handleLineChange(4, 'valorCliente', e.target.value)}
                            data-testid="input-valor-cliente-5"
                          />
                        </div>
                      </div>

                      {/* Terceira linha: Imposto e Valores calculados */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="line-4-imposto">Imposto (%)</Label>
                          <Input
                            id="line-4-imposto"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={lines[4].imposto || ""}
                            onChange={(e) => handleLineChange(4, 'imposto', e.target.value)}
                            data-testid="input-imposto-5"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Valor Final Cliente (calculado)</Label>
                          <div className="flex h-10 items-center rounded-md border bg-muted px-3 py-2">
                            <span className="font-mono font-semibold" data-testid="text-valor-final-cliente-5">
                              R$ {(() => {
                                const valorCliente = parseFloat(lines[4].valorCliente || "0") || 0;
                                const formato = parseFloat(lines[4].formato || "0") || 0;
                                return (valorCliente * formato).toFixed(2);
                              })()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            = Valor CLIENTE × Formato
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label>Lucro (calculado)</Label>
                          <div className="flex h-10 items-center rounded-md border bg-muted px-3 py-2">
                            <span className="font-mono font-semibold text-chart-2" data-testid="text-lucro-5">
                              R$ {(() => {
                                const valorLiquido = parseFloat(lines[4].valorLiquido || "0") || 0;
                                const valorCliente = parseFloat(lines[4].valorCliente || "0") || 0;
                                const formato = parseFloat(lines[4].formato || "0") || 0;
                                const imposto = parseFloat(lines[4].imposto || "0") || 0;
                                const valorFinalCliente = valorCliente * formato;
                                const impostoValor = valorFinalCliente * (imposto / 100);
                                const custoLiquido = valorLiquido * formato;
                                return (valorFinalCliente - impostoValor - custoLiquido).toFixed(2);
                              })()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            = Valor Final Cliente - (Imposto %) - (Valor LÍQUIDO × Formato)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cálculo do Total */}
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="diagramacao">Diagramação</Label>
                        <Input
                          id="diagramacao"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={diagramacao}
                          onChange={(e) => setDiagramacao(e.target.value)}
                          data-testid="input-diagramacao"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Valor Total (calculado)</Label>
                        <div className="flex h-10 items-center rounded-md border bg-background px-3 py-2">
                          <span className="font-mono text-lg font-bold" data-testid="text-valor-total">
                            R$ {valorTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cálculo: Σ(Formato × Valor cm x col./linha) de cada linha marcada + Diagramação
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Campos Finais */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="data">Data Publicação</Label>
                  <Input
                    id="data"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    data-testid="input-data"
                  />
                </div>

                {/* Checkboxes de Conferência */}
                <div className="grid gap-2 p-3 border rounded-md bg-muted/30">
                  <Label className="text-sm font-medium text-muted-foreground">Checklist de Conferência</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="conferir-razao-social"
                      checked={conferirRazaoSocial}
                      onCheckedChange={(checked) => setConferirRazaoSocial(checked === true)}
                      data-testid="checkbox-conferir-razao-social"
                    />
                    <Label htmlFor="conferir-razao-social" className="cursor-pointer text-sm">
                      CONFERIR - Razão Social e CNPJ - Cliente
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="conferir-datas"
                      checked={conferirDatas}
                      onCheckedChange={(checked) => setConferirDatas(checked === true)}
                      data-testid="checkbox-conferir-datas"
                    />
                    <Label htmlFor="conferir-datas" className="cursor-pointer text-sm">
                      CONFERIR - Datas na publicação
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="conferir-valores"
                      checked={conferirValores}
                      onCheckedChange={(checked) => setConferirValores(checked === true)}
                      data-testid="checkbox-conferir-valores"
                    />
                    <Label htmlFor="conferir-valores" className="cursor-pointer text-sm">
                      CONFERIR - Valores e Negociação
                    </Label>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="obs">Observações</Label>
                  <Textarea
                    id="obs"
                    placeholder="Observações adicionais..."
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    data-testid="input-observacoes"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="aprovado"
                    checked={approved}
                    onCheckedChange={(checked) => setApproved(checked === true)}
                    data-testid="checkbox-aprovado"
                  />
                  <Label htmlFor="aprovado" className="cursor-pointer flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${approved ? 'text-chart-2' : 'text-muted-foreground'}`} />
                    Aprovado
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(false);
                }} 
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-save"
              >
                {createMutation.isPending ? "Salvando..." : "Salvar Orçamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou e-mail..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Nº Orc.</th>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium">E-mail</th>
                  <th className="text-left p-3 text-sm font-medium">Valor Total</th>
                  <th className="text-left p-3 text-sm font-medium">Data Publicação</th>
                  <th className="text-left p-3 text-sm font-medium">Aprovado</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="border-b hover-elevate" data-testid={`row-budget-${budget.id}`}>
                    <td className="p-3 text-sm font-mono font-semibold" data-testid={`text-budget-number-${budget.id}`}>
                      {String(budget.budgetNumber || 0).padStart(5, '0')}
                    </td>
                    <td className="p-3 text-sm font-medium">{budget.clientName}</td>
                    <td className="p-3 text-sm text-muted-foreground">{budget.clientEmail}</td>
                    <td className="p-3 font-mono text-sm font-semibold">
                      R$ {parseFloat(budget.valorTotal).toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {(() => {
                        // Evita problema de timezone ao exibir data
                        const dateStr = typeof budget.date === 'string' ? budget.date : budget.date.toISOString();
                        const dateParts = dateStr.split('T')[0].split('-');
                        return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                      })()}
                    </td>
                    <td className="p-3">
                      {budget.approved ? (
                        <CheckCircle2 className="h-5 w-5 text-chart-2" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pendente</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" data-testid={`button-view-${budget.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-${budget.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(budget.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${budget.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
