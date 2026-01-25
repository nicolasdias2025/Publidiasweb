import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Loader2, Building2, Calendar, Plus, Pencil, Trash2, Eye, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClientLookup } from "@/hooks/useClientLookup";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateAuthorizationPDF, loadLogoAsBase64 } from "@/lib/generateAuthorizationPDF";
import type { Authorization } from "@shared/schema";

const autorizacaoFormSchema = z.object({
  // Dados do Cliente
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  clientName: z.string().min(1, "Nome é obrigatório"),
  clientAddress: z.string().min(1, "Endereço é obrigatório"),
  clientCity: z.string().min(1, "Cidade é obrigatória"),
  clientState: z.string().length(2, "UF deve ter 2 caracteres"),
  clientZip: z.string().min(8, "CEP deve ter 8 dígitos"),
  clientEmail: z.string().email("E-mail inválido").optional().or(z.literal('')),
  
  // Dados da Publicação
  jornal: z.string().min(1, "Jornal é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  mes: z.string().min(1, "Mês é obrigatório"),
  ano: z.string().min(1, "Ano é obrigatório"),
  diasPublicacao: z.array(z.number()).min(1, "Selecione pelo menos um dia"),
  colLinha: z.string().min(1, "Col./Linha é obrigatório"),
  cm: z.string().min(1, "Cm é obrigatório"),
  valorUnitario: z.string().min(1, "Valor unitário é obrigatório"),
  desconto: z.string().optional(),
  aplicarValorLiquido: z.boolean().default(false),
  valorDiagramacao: z.string().optional(),
  custoPublicacao: z.string().optional(),
  observacoes: z.string().optional(),
});

type AutorizacaoFormData = z.infer<typeof autorizacaoFormSchema>;

export default function Autorizacoes() {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar autorizações existentes
  const { data: authorizations = [], isLoading } = useQuery<Authorization[]>({
    queryKey: ["/api/authorizations"],
  });

  // Buscar próximo número de autorização
  const { data: nextNumberData } = useQuery<{ nextNumber: number }>({
    queryKey: ["/api/authorizations/next-number"],
    enabled: isDialogOpen && !editingId,
  });

  const form = useForm<AutorizacaoFormData>({
    resolver: zodResolver(autorizacaoFormSchema),
    defaultValues: {
      cnpj: "",
      clientName: "",
      clientAddress: "",
      clientCity: "",
      clientState: "",
      clientZip: "",
      clientEmail: "",
      jornal: "",
      tipo: "",
      mes: "",
      ano: "",
      diasPublicacao: [],
      colLinha: "",
      cm: "",
      valorUnitario: "",
      desconto: "0",
      aplicarValorLiquido: false,
      valorDiagramacao: "0",
      custoPublicacao: "0",
      observacoes: "",
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/authorizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/authorizations/next-number"] });
      toast({ title: "Autorização criada!", description: "Registro salvo com sucesso." });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar autorização.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/authorizations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorizations"] });
      toast({ title: "Autorização atualizada!", description: "Alterações salvas com sucesso." });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar autorização.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/authorizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorizations"] });
      toast({ title: "Autorização excluída!", description: "Registro removido com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao excluir autorização.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    form.reset();
    setSelectedDays([]);
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditForm = (auth: Authorization) => {
    const dias = auth.diasPublicacao ? JSON.parse(auth.diasPublicacao) : [];
    setSelectedDays(dias);
    form.reset({
      cnpj: auth.cnpj || "",
      clientName: auth.clientName || "",
      clientAddress: auth.clientAddress || "",
      clientCity: auth.clientCity || "",
      clientState: auth.clientState || "",
      clientZip: auth.clientZip || "",
      clientEmail: auth.clientEmail || "",
      jornal: auth.jornal || "",
      tipo: auth.tipo || "",
      mes: auth.mes || "",
      ano: auth.ano || "",
      diasPublicacao: dias,
      colLinha: auth.colLinha || "",
      cm: auth.cm || "",
      valorUnitario: auth.valorUnitario || "",
      desconto: auth.desconto || "0",
      aplicarValorLiquido: auth.aplicarValorLiquido || false,
      valorDiagramacao: auth.diagramacao || "0",
      custoPublicacao: "0",
      observacoes: auth.observacoes || "",
    });
    setEditingId(auth.id);
    setIsDialogOpen(true);
  };

  const watchedCnpj = form.watch("cnpj") || "";
  const { clientData, isLoading: loadingClient } = useClientLookup(watchedCnpj);

  // Autopreencher dados do cliente
  useEffect(() => {
    if (clientData) {
      form.setValue("clientName", clientData.name);
      form.setValue("clientAddress", clientData.address);
      form.setValue("clientCity", clientData.city);
      form.setValue("clientState", clientData.state);
      form.setValue("clientZip", clientData.zip);
      form.setValue("clientEmail", clientData.email);
      
      toast({
        title: "Cliente encontrado!",
        description: `Dados de ${clientData.name} preenchidos automaticamente.`,
      });
    }
  }, [clientData, form, toast]);

  // Atualizar dias quando checkbox é marcado/desmarcado
  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b);
      form.setValue("diasPublicacao", newDays);
      return newDays;
    });
  };

  // Cálculos automáticos
  const colLinha = parseFloat(form.watch("colLinha") || "0");
  const cm = parseFloat(form.watch("cm") || "0");
  const valorUnitario = parseFloat(form.watch("valorUnitario") || "0");
  const descontoPercentual = parseFloat(form.watch("desconto") || "0");
  const aplicarValorLiquido = form.watch("aplicarValorLiquido");
  const numeroInsercoes = selectedDays.length;

  // Formato = Col./Linha × Cm
  const formato = colLinha * cm;

  // Subtotal = (col × cm × valorUnitario) × nºInserções
  const subtotal = colLinha * cm * valorUnitario * numeroInsercoes;
  
  // Aplicar desconto percentual sobre o subtotal
  const valorDesconto = subtotal * (descontoPercentual / 100);
  
  // Valor Total = subtotal - desconto percentual
  const valorTotal = subtotal - valorDesconto;
  
  // Valor Líquido = Valor Total × 0.8 (apenas se checkbox marcado, senão fica zerado)
  const valorLiquido = aplicarValorLiquido ? valorTotal * 0.8 : 0;

  const onSubmit = (data: AutorizacaoFormData) => {
    // Preparar dados para salvar
    const authData = {
      cnpj: data.cnpj,
      clientName: data.clientName,
      clientAddress: data.clientAddress,
      clientCity: data.clientCity,
      clientState: data.clientState,
      clientZip: data.clientZip,
      clientEmail: data.clientEmail || null,
      jornal: data.jornal,
      tipo: data.tipo,
      mes: data.mes,
      ano: data.ano,
      diasPublicacao: JSON.stringify(selectedDays),
      colLinha: data.colLinha,
      cm: data.cm,
      formato: `${data.colLinha} col × ${data.cm} cm`,
      numInsercoes: numeroInsercoes,
      valorUnitario: data.valorUnitario,
      desconto: data.desconto || "0",
      aplicarValorLiquido: data.aplicarValorLiquido,
      valorBruto: subtotal.toFixed(2),
      valorLiquido: valorLiquido.toFixed(2),
      valorTotal: valorTotal.toFixed(2),
      diagramacao: data.valorDiagramacao || "0",
      observacoes: data.observacoes || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: authData });
    } else {
      createMutation.mutate(authData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta autorização?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleGeneratePDF = async (auth: Authorization) => {
    try {
      toast({ title: "Gerando PDF...", description: "Aguarde um momento." });
      const logoBase64 = await loadLogoAsBase64();
      await generateAuthorizationPDF(auth, logoBase64);
      toast({ title: "PDF gerado!", description: `Autorização #${auth.authorizationNumber} salva com sucesso.` });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({ title: "Erro", description: "Falha ao gerar o PDF.", variant: "destructive" });
    }
  };

  const formatCurrency = (value: string | number | null) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!num && num !== 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  // Opções de meses e anos
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      years.push((currentYear + i).toString());
    }
    return years;
  };
  
  const anos = generateYearOptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Autorizações</h1>
          <p className="text-muted-foreground">Autorização de publicação em jornais oficiais</p>
        </div>
        <Button onClick={openNewForm} className="gap-2" data-testid="button-nova-autorizacao">
          <Plus className="h-4 w-4" />
          Nova Autorização
        </Button>
      </div>

      {/* Lista de Autorizações */}
      <Card>
        <CardHeader>
          <CardTitle>Autorizações Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : authorizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma autorização cadastrada. Clique em "Nova Autorização" para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Jornal</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead className="text-right">Valor Bruto</TableHead>
                    <TableHead className="text-right">Valor Líquido</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authorizations.map((auth) => (
                    <TableRow key={auth.id} data-testid={`row-auth-${auth.id}`}>
                      <TableCell className="font-mono">{auth.authorizationNumber}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{auth.clientName}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{auth.jornal}</TableCell>
                      <TableCell>{auth.mes}/{auth.ano}</TableCell>
                      <TableCell>{auth.formato || `${auth.colLinha} × ${auth.cm}`}</TableCell>
                      <TableCell className="text-right">{formatCurrency(auth.valorBruto)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(auth.valorLiquido)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(auth.valorTotal)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGeneratePDF(auth)}
                            title="Gerar PDF"
                            data-testid={`button-pdf-${auth.id}`}
                          >
                            <FileDown className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditForm(auth)}
                            title="Editar"
                            data-testid={`button-edit-${auth.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(auth.id)}
                            title="Excluir"
                            data-testid={`button-delete-${auth.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog do Formulário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId 
                ? `Editar Autorização #${authorizations.find(a => a.id === editingId)?.authorizationNumber || ''}`
                : `Nova Autorização #${nextNumberData?.nextNumber || ''}`
              }
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* SEÇÃO 1: DADOS DO CLIENTE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="00.000.000/0000-00" 
                          {...field} 
                          data-testid="input-cnpj"
                        />
                        {loadingClient && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} data-testid="input-client-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com" {...field} data-testid="input-client-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro" {...field} data-testid="input-client-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="clientCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} data-testid="input-client-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" maxLength={2} {...field} data-testid="input-client-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientZip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} data-testid="input-client-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* SEÇÃO 2: DADOS DA PUBLICAÇÃO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados da Publicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jornal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jornal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Diário Oficial da União" {...field} data-testid="input-jornal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tipo">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="impresso">Impresso</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="diagramacao">Diagramação</SelectItem>
                          <SelectItem value="ambos">Impresso + Digital</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mês e Ano da Publicação */}
              <div className="space-y-4">
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período da Publicação
                </FormLabel>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-mes">
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {meses.map((mes) => (
                              <SelectItem key={mes} value={mes}>
                                {mes}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ano"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ano">
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {anos.map((ano) => (
                              <SelectItem key={ano} value={ano}>
                                {ano}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Dias da Publicação</FormLabel>
                  <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <div
                        key={day}
                        className={`
                          flex items-center justify-center p-1 rounded border cursor-pointer transition-all
                          ${selectedDays.includes(day) 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-background hover-elevate border-border'
                          }
                        `}
                        onClick={() => toggleDay(day)}
                        data-testid={`checkbox-day-${day}`}
                      >
                        <span className="text-xs font-semibold">{String(day).padStart(2, '0')}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique nos dias para selecionar/desselecionar
                  </p>
                </div>
              </div>

              {/* Cálculos */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="colLinha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Col./Linha</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0" {...field} data-testid="input-col-linha" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cm (Centímetros)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0" {...field} data-testid="input-cm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Formato (Col./Linha × Cm)</FormLabel>
                  <Input 
                    value={formato.toFixed(2)} 
                    readOnly 
                    className="bg-muted font-semibold"
                    data-testid="display-formato"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente</p>
                </div>

                <FormField
                  control={form.control}
                  name="valorUnitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor "col./linha × cm" (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-valor-unitario" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="desconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} data-testid="input-desconto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos Calculados (Read-only) */}
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Nº de Inserções</FormLabel>
                    <Input 
                      value={numeroInsercoes} 
                      readOnly 
                      className="bg-background font-semibold"
                      data-testid="display-num-insercoes"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente</p>
                  </div>

                  <div>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <Input 
                      value={valorTotal.toFixed(2)} 
                      readOnly 
                      className="bg-background font-semibold"
                      data-testid="display-valor-total"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      (col × cm × valor) × inserções - desconto
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name="aplicarValorLiquido"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-valor-liquido"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Aplicar Valor Líquido (20% desconto)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex-1">
                    <FormLabel>Valor Líquido (R$)</FormLabel>
                    <Input 
                      value={valorLiquido.toFixed(2)} 
                      readOnly 
                      className={`bg-background font-semibold ${aplicarValorLiquido ? 'border-primary' : ''}`}
                      data-testid="display-valor-liquido"
                    />
                  </div>
                </div>
              </div>

              {/* Campos Adicionais */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorDiagramacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Diagramação (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-diagramacao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custoPublicacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo da Publicação (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-custo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre a publicação..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-observacoes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="gap-2"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-salvar"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <FileText className="h-5 w-5" />
                  {editingId ? "Salvar Alterações" : "Salvar Autorização"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
