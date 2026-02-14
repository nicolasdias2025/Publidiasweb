import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  Edit,
  Trash2,
  MessageSquare,
  Filter,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useClientLookup } from "@/hooks/useClientLookup";
import type { Invoice } from "@shared/schema";

// Paleta de cores para status
const statusColors = {
  pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-200", label: "Pendente Rec." },
  overdue: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200", label: "Vencida" },
  paid: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200", label: "Paga" },
  replaced: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-200", label: "Substituída" },
};

// Schema de validação
const PREDEFINED_SERVICE_TYPES = [
  "Publicação DOU",
  "Publicação DOE",
  "Publicação DOU + DOE",
  "Diagramação",
  "Comissão Veículo",
];

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Número da nota fiscal é obrigatório"),
  cnpj: z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido"),
  clientName: z.string().min(1, "Razão social é obrigatória"),
  clientEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório"),
  serviceTypeCustom: z.string().optional().or(z.literal("")),
  value: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valor deve ser maior que zero"),
  emissionDate: z.string().refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
  }, "Data de emissão não pode ser futura"),
  dueDate: z.string(),
  paymentDate: z.string().optional().or(z.literal("")),
  status: z.enum(["pending", "overdue", "paid", "replaced"]),
  retencaoCsll: z.boolean().default(false),
  retencaoCofins: z.boolean().default(false),
  retencaoIssqn: z.boolean().default(false),
  retencaoIr: z.boolean().default(false),
  retencaoPisPasep: z.boolean().default(false),
  comments: z.string().max(500, "Comentários não podem exceder 500 caracteres").optional().or(z.literal("")),
}).refine(
  (data) => {
    if (!data.dueDate || !data.emissionDate) return true;
    return new Date(data.dueDate) >= new Date(data.emissionDate);
  },
  {
    message: "Data de vencimento deve ser maior ou igual à data de emissão",
    path: ["dueDate"],
  }
).refine(
  (data) => {
    if (!data.paymentDate || !data.emissionDate) return true;
    return new Date(data.paymentDate) >= new Date(data.emissionDate);
  },
  {
    message: "Data de pagamento deve ser maior ou igual à data de emissão",
    path: ["paymentDate"],
  }
).refine(
  (data) => {
    if (data.serviceType === "Outro") {
      return !!data.serviceTypeCustom && data.serviceTypeCustom.trim().length > 0;
    }
    return true;
  },
  {
    message: "Informe o tipo de serviço personalizado",
    path: ["serviceTypeCustom"],
  }
).refine(
  (data) => {
    if (data.status === "paid") {
      return !!data.paymentDate && data.paymentDate !== "";
    }
    return true;
  },
  {
    message: "Data de pagamento é obrigatória para notas fiscais pagas",
    path: ["paymentDate"],
  }
);

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export default function NotasFiscais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [viewingComments, setViewingComments] = useState<Invoice | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCnpj, setFilterCnpj] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterMinValue, setFilterMinValue] = useState("");
  const [filterMaxValue, setFilterMaxValue] = useState("");
  
  const { toast } = useToast();

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      cnpj: "",
      clientName: "",
      clientEmail: "",
      serviceType: "Publicação DOU",
      serviceTypeCustom: "",
      value: "",
      emissionDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: "",
      status: "pending",
      retencaoCsll: false,
      retencaoCofins: false,
      retencaoIssqn: false,
      retencaoIr: false,
      retencaoPisPasep: false,
      comments: "",
    },
  });

  const watchedCnpj = form.watch("cnpj") || "";
  const watchedStatus = form.watch("status");
  const watchedServiceType = form.watch("serviceType");
  const { clientData, isLoading: loadingLookup } = useClientLookup(watchedCnpj);

  // Autopreencher cliente quando CNPJ é encontrado
  useEffect(() => {
    if (clientData) {
      form.setValue("clientName", clientData.name);
      toast({
        title: "Cliente encontrado!",
        description: `Dados de ${clientData.name} preenchidos automaticamente.`,
      });
    }
  }, [clientData, form, toast]);

  // Limpar data de pagamento quando status não é 'paid'
  useEffect(() => {
    if (watchedStatus !== "paid") {
      form.setValue("paymentDate", "");
    }
  }, [watchedStatus, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      return await apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Sucesso!",
        description: "Nota fiscal cadastrada com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.errors?.[0]?.message || "Falha ao cadastrar nota fiscal. Tente novamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceFormData> }) => {
      return await apiRequest("PATCH", `/api/invoices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Sucesso!",
        description: "Nota fiscal atualizada com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.errors?.[0]?.message || "Falha ao atualizar nota fiscal. Tente novamente.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/invoices/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Sucesso!",
        description: "Nota fiscal deletada com sucesso.",
      });
      setDeletingInvoice(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao deletar nota fiscal. Tente novamente.",
      });
    },
  });

  const handleCloseDialog = () => {
    setIsNewDialogOpen(false);
    setEditingInvoice(null);
    form.reset({
      invoiceNumber: "",
      cnpj: "",
      clientName: "",
      clientEmail: "",
      serviceType: "Publicação DOU",
      serviceTypeCustom: "",
      value: "",
      emissionDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: "",
      status: "pending",
      retencaoCsll: false,
      retencaoCofins: false,
      retencaoIssqn: false,
      retencaoIr: false,
      retencaoPisPasep: false,
      comments: "",
    });
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    
    const isPredefined = PREDEFINED_SERVICE_TYPES.includes(invoice.serviceType);
    form.reset({
      invoiceNumber: invoice.invoiceNumber,
      cnpj: invoice.cnpj,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail || "",
      serviceType: isPredefined ? invoice.serviceType : "Outro",
      serviceTypeCustom: isPredefined ? "" : invoice.serviceType,
      value: invoice.value,
      emissionDate: new Date(invoice.emissionDate).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate).toISOString().split('T')[0] : "",
      status: invoice.status as any,
      retencaoCsll: invoice.retencaoCsll ?? false,
      retencaoCofins: invoice.retencaoCofins ?? false,
      retencaoIssqn: invoice.retencaoIssqn ?? false,
      retencaoIr: invoice.retencaoIr ?? false,
      retencaoPisPasep: invoice.retencaoPisPasep ?? false,
      comments: invoice.comments || "",
    });
  };

  const handleSubmit = (data: InvoiceFormData) => {
    const finalServiceType = data.serviceType === "Outro" && data.serviceTypeCustom
      ? data.serviceTypeCustom
      : data.serviceType;

    const { serviceTypeCustom, ...rest } = data;
    const cleanedData = {
      ...rest,
      serviceType: finalServiceType,
      paymentDate: data.paymentDate === "" ? null : data.paymentDate,
      clientEmail: data.clientEmail === "" ? null : data.clientEmail,
      comments: data.comments === "" ? null : data.comments,
    };
    
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data: cleanedData as any });
    } else {
      createMutation.mutate(cleanedData as any);
    }
  };

  // Aplicar filtros
  const filteredInvoices = invoices.filter((invoice) => {
    // Filtro por status
    if (filterStatus.length > 0 && !filterStatus.includes(invoice.status)) {
      return false;
    }

    // Filtro por CNPJ
    if (filterCnpj && !invoice.cnpj.includes(filterCnpj.replace(/\D/g, ''))) {
      return false;
    }

    // Filtro por cliente
    if (filterClient && !invoice.clientName.toLowerCase().includes(filterClient.toLowerCase())) {
      return false;
    }

    // Filtro por valor
    const value = parseFloat(invoice.value);
    if (filterMinValue && value < parseFloat(filterMinValue)) {
      return false;
    }
    if (filterMaxValue && value > parseFloat(filterMaxValue)) {
      return false;
    }

    // Busca inteligente
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(search) ||
        invoice.clientName.toLowerCase().includes(search) ||
        invoice.cnpj.includes(searchTerm.replace(/\D/g, ''))
      );
    }

    return true;
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterCnpj("");
    setFilterClient("");
    setFilterMinValue("");
    setFilterMaxValue("");
  };

  const activeFiltersCount = 
    filterStatus.length + 
    (filterCnpj ? 1 : 0) + 
    (filterClient ? 1 : 0) + 
    (filterMinValue ? 1 : 0) + 
    (filterMaxValue ? 1 : 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Notas Fiscais
          </h1>
          <p className="text-muted-foreground">
            Gerencie notas fiscais com validações e controle de status
          </p>
        </div>
        <Button 
          onClick={() => setIsNewDialogOpen(true)} 
          className="gap-2"
          data-testid="button-new-invoice"
        >
          <Plus className="h-4 w-4" />
          Nova Nota Fiscal
        </Button>
      </div>

      {/* Barra de busca e filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº nota, cliente ou CNPJ..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Painel de filtros */}
          {showFilters && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtros</h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Filtro por Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusColors).map(([key, config]) => {
                      const isSelected = filterStatus.includes(key);
                      return (
                        <Badge
                          key={key}
                          className={`cursor-pointer ${isSelected ? config.bg + ' ' + config.text : 'bg-muted text-muted-foreground'}`}
                          onClick={() => {
                            setFilterStatus(prev =>
                              prev.includes(key)
                                ? prev.filter(s => s !== key)
                                : [...prev, key]
                            );
                          }}
                        >
                          {config.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Filtro por CNPJ */}
                <div className="space-y-2">
                  <Label htmlFor="filter-cnpj">CNPJ</Label>
                  <Input
                    id="filter-cnpj"
                    placeholder="Digite o CNPJ..."
                    value={filterCnpj}
                    onChange={(e) => setFilterCnpj(e.target.value)}
                    data-testid="input-filter-cnpj"
                  />
                </div>

                {/* Filtro por Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="filter-client">Cliente</Label>
                  <Input
                    id="filter-client"
                    placeholder="Nome do cliente..."
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    data-testid="input-filter-client"
                  />
                </div>

                {/* Filtro por Valor Mínimo */}
                <div className="space-y-2">
                  <Label htmlFor="filter-min-value">Valor Mínimo</Label>
                  <Input
                    id="filter-min-value"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={filterMinValue}
                    onChange={(e) => setFilterMinValue(e.target.value)}
                    data-testid="input-filter-min-value"
                  />
                </div>

                {/* Filtro por Valor Máximo */}
                <div className="space-y-2">
                  <Label htmlFor="filter-max-value">Valor Máximo</Label>
                  <Input
                    id="filter-max-value"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={filterMaxValue}
                    onChange={(e) => setFilterMaxValue(e.target.value)}
                    data-testid="input-filter-max-value"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Listagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Nota Fiscal' : 'Notas Fiscais'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {activeFiltersCount > 0 || searchTerm
                ? "Nenhuma nota fiscal encontrada com os filtros aplicados."
                : "Nenhuma nota fiscal cadastrada. Clique em 'Nova Nota Fiscal' para começar."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm">
                    <th className="pb-3 font-semibold">Nº Nota</th>
                    <th className="pb-3 font-semibold">Cliente</th>
                    <th className="pb-3 font-semibold">Tipo</th>
                    <th className="pb-3 font-semibold">Valor</th>
                    <th className="pb-3 font-semibold">Emissão</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const statusConfig = statusColors[invoice.status as keyof typeof statusColors];
                    return (
                      <tr key={invoice.id} className="border-b last:border-0" data-testid={`row-invoice-${invoice.id}`}>
                        <td className="py-4 font-medium" data-testid={`text-invoice-number-${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-4" data-testid={`text-client-name-${invoice.id}`}>
                          {invoice.clientName}
                        </td>
                        <td className="py-4" data-testid={`text-service-type-${invoice.id}`}>
                          {invoice.serviceType}
                        </td>
                        <td className="py-4 font-semibold" data-testid={`text-value-${invoice.id}`}>
                          {formatCurrency(invoice.value)}
                        </td>
                        <td className="py-4" data-testid={`text-emission-date-${invoice.id}`}>
                          {formatDate(invoice.emissionDate)}
                        </td>
                        <td className="py-4">
                          <Badge className={`${statusConfig.bg} ${statusConfig.text}`} data-testid={`badge-status-${invoice.id}`}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(invoice)}
                              data-testid={`button-edit-${invoice.id}`}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingInvoice(invoice)}
                              data-testid={`button-delete-${invoice.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                            {invoice.comments && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingComments(invoice)}
                                data-testid={`button-view-comments-${invoice.id}`}
                              >
                                <MessageSquare className="h-4 w-4 text-gray-600" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar */}
      <Dialog open={isNewDialogOpen || !!editingInvoice} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingInvoice ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice
                ? "Atualize as informações da nota fiscal."
                : "Preencha os dados para cadastrar uma nova nota fiscal."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Número da Nota Fiscal */}
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Nota Fiscal *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 12345" data-testid="input-invoice-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CNPJ */}
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="00.000.000/0000-00"
                          data-testid="input-cnpj"
                        />
                        {loadingLookup && (
                          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Razão Social */}
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome da empresa"
                        data-testid="input-client-name"
                        disabled={!!clientData}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* E-mail */}
              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contato@empresa.com"
                        data-testid="input-client-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grid com 2 colunas */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Tipo de Serviço */}
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-service-type">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" sideOffset={4}>
                          <SelectItem value="Publicação DOU">Publicação DOU</SelectItem>
                          <SelectItem value="Publicação DOE">Publicação DOE</SelectItem>
                          <SelectItem value="Publicação DOU + DOE">Publicação DOU + DOE</SelectItem>
                          <SelectItem value="Diagramação">Diagramação</SelectItem>
                          <SelectItem value="Comissão Veículo">Comissão Veículo</SelectItem>
                          <SelectItem value="Outro">Outro (digitar)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedServiceType === "Outro" && (
                  <FormField
                    control={form.control}
                    name="serviceTypeCustom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique o Tipo de Serviço *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Jornal Gazeta SP" {...field} data-testid="input-service-type-custom" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Valor */}
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Retenções */}
              <div className="space-y-2">
                <FormLabel>Retenções</FormLabel>
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="retencaoCsll"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-csll"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">CSLL</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="retencaoCofins"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-cofins"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">COFINS</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="retencaoIssqn"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-issqn"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">ISSQN</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="retencaoIr"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-ir"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">IR</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="retencaoPisPasep"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-pis-pasep"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">PIS/PASEP</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Grid com 3 colunas para datas */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Data de Emissão */}
                <FormField
                  control={form.control}
                  name="emissionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Emissão *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-emission-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data de Vencimento */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Vencimento *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-due-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data de Pagamento */}
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Pagamento {watchedStatus === "paid" && "*"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          disabled={watchedStatus !== "paid"}
                          data-testid="input-payment-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="pending">Pendente Rec.</SelectItem>
                        <SelectItem value="overdue">Vencida</SelectItem>
                        <SelectItem value="paid">Paga</SelectItem>
                        <SelectItem value="replaced">Substituída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comentários */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentários (máx. 500 caracteres)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações adicionais..."
                        className="min-h-[100px]"
                        maxLength={500}
                        data-testid="input-comments"
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground text-right">
                      {(field.value?.length || 0)}/500
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingInvoice ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingInvoice} onOpenChange={() => setDeletingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a nota fiscal <strong>{deletingInvoice?.invoiceNumber}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingInvoice && deleteMutation.mutate(deletingInvoice.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Visualização de Comentários */}
      <Dialog open={!!viewingComments} onOpenChange={() => setViewingComments(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentários</DialogTitle>
            <DialogDescription>
              Nota Fiscal: {viewingComments?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="whitespace-pre-wrap text-sm">{viewingComments?.comments}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
