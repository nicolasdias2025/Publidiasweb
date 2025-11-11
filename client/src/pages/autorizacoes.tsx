import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckCircle, XCircle, Clock, Loader2, Building2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useClientLookup } from "@/hooks/useClientLookup";
import type { Approval } from "@shared/schema";

const approvalFormSchema = z.object({
  type: z.string().min(1, "Tipo é obrigatório"),
  requester: z.string().min(1, "Solicitante é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  value: z.string().min(1, "Valor é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  clientCnpj: z.string().optional(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  clientCity: z.string().optional(),
  clientState: z.string().max(2).optional(),
  clientZip: z.string().optional(),
  clientEmail: z.string().email("E-mail inválido").optional().or(z.literal('')),
});

type ApprovalFormData = z.infer<typeof approvalFormSchema>;

export default function Autorizacoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: approvals = [], isLoading: loadingApprovals } = useQuery<Approval[]>({
    queryKey: ['/api/approvals'],
  });

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      type: "",
      requester: "",
      department: "",
      value: "",
      description: "",
      clientCnpj: "",
      clientName: "",
      clientAddress: "",
      clientCity: "",
      clientState: "",
      clientZip: "",
      clientEmail: "",
    },
  });

  const watchedCnpj = form.watch("clientCnpj") || "";
  const { clientData, isLoading: loadingClient, isNotFound } = useClientLookup(watchedCnpj);

  // Autopreencher campos quando dados do cliente são encontrados
  useEffect(() => {
    if (clientData) {
      form.setValue("clientName", clientData.razaoSocial);
      form.setValue("clientAddress", clientData.endereco);
      form.setValue("clientCity", clientData.cidade);
      form.setValue("clientState", clientData.uf);
      form.setValue("clientZip", clientData.cep);
      form.setValue("clientEmail", clientData.email);
      
      toast({
        title: "Cliente encontrado!",
        description: `Dados de ${clientData.razaoSocial} preenchidos automaticamente.`,
      });
    }
  }, [clientData, form, toast]);

  const createMutation = useMutation({
    mutationFn: async (data: ApprovalFormData) => {
      return await apiRequest("POST", "/api/approvals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals'] });
      toast({
        title: "Sucesso!",
        description: "Solicitação criada com sucesso.",
      });
      setIsNewDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao criar solicitação. Tente novamente.",
      });
    },
  });

  const onSubmit = (data: ApprovalFormData) => {
    createMutation.mutate(data);
  };

  const filteredApprovals = approvals.filter(a => 
    a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.requester.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Autorizações</h1>
          <p className="text-muted-foreground">Gerencie aprovações e workflows internos</p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)} data-testid="button-new-approval">
          <Plus className="h-4 w-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo, solicitante ou ID..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingApprovals ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApprovals.map((approval) => (
                <Card key={approval.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedApproval(approval)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-semibold" data-testid={`text-approval-id-${approval.id}`}>
                            {approval.id}
                          </span>
                          <StatusBadge status={approval.status} />
                        </div>
                        <h3 className="font-semibold mb-1">{approval.type}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{approval.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Solicitante: {approval.requester}</span>
                          <span>Depto: {approval.department}</span>
                        </div>
                        {approval.clientName && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{approval.clientName}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-lg">R$ {Number(approval.value).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Solicitação */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Autorização</DialogTitle>
            <DialogDescription>
              Preencha os dados da solicitação. Os campos do cliente serão preenchidos automaticamente ao digitar o CNPJ.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados da Solicitação */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Dados da Solicitação</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Solicitação</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Compra de Equipamentos" {...field} data-testid="input-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solicitante</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do solicitante" {...field} data-testid="input-requester" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: TI, Vendas, Marketing" {...field} data-testid="input-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva os detalhes da solicitação..." {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dados do Cliente */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Dados do Cliente (Opcional)</h3>
                  {loadingClient && <Loader2 className="h-4 w-4 animate-spin" data-testid="loader-client" />}
                </div>

                <FormField
                  control={form.control}
                  name="clientCnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00.000.000/0000-00" 
                          {...field} 
                          data-testid="input-client-cnpj"
                          maxLength={18}
                        />
                      </FormControl>
                      {isNotFound && watchedCnpj.replace(/\D/g, '').length === 14 && (
                        <p className="text-sm text-orange-600" data-testid="text-client-not-found">
                          Cliente não cadastrado. Preencha os dados manualmente.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="clientAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo</FormLabel>
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
                          <Input placeholder="RS" maxLength={2} {...field} data-testid="input-client-state" />
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

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com.br" {...field} data-testid="input-client-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)} data-testid="button-cancel">
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save">
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Solicitação
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Autorização</DialogTitle>
            <DialogDescription>
              {selectedApproval?.id} - {selectedApproval?.type}
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Solicitante</Label>
                <p className="text-sm">{selectedApproval.requester} - {selectedApproval.department}</p>
              </div>
              <div className="grid gap-2">
                <Label>Valor</Label>
                <p className="text-sm font-mono font-semibold">R$ {Number(selectedApproval.value).toFixed(2)}</p>
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <p className="text-sm">{selectedApproval.description}</p>
              </div>
              {selectedApproval.clientName && (
                <>
                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <p className="text-sm">{selectedApproval.clientName}</p>
                    {selectedApproval.clientCnpj && (
                      <p className="text-xs text-muted-foreground">CNPJ: {selectedApproval.clientCnpj}</p>
                    )}
                  </div>
                  {selectedApproval.clientAddress && (
                    <div className="grid gap-2">
                      <Label>Endereço</Label>
                      <p className="text-sm">
                        {selectedApproval.clientAddress}, {selectedApproval.clientCity} - {selectedApproval.clientState}
                        <br />
                        CEP: {selectedApproval.clientZip}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div className="grid gap-2">
                <Label>Status</Label>
                <div>
                  <StatusBadge status={selectedApproval.status} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
