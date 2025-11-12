import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Building2, Mail, MapPin, Edit, Trash2 } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useClientLookup } from "@/hooks/useClientLookup";
import type { Client } from "@shared/schema";

const clientFormSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  name: z.string().min(1, "Razão Social é obrigatória"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  zip: z.string().min(8, "CEP deve ter 8 dígitos"),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      cnpj: "",
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      email: "",
      telefone: "",
      celular: "",
    },
  });

  const watchedCnpj = form.watch("cnpj") || "";
  const { clientData, isLoading: loadingLookup, isNotFound } = useClientLookup(watchedCnpj);

  // Autopreencher campos quando dados são encontrados no banco de dados
  useEffect(() => {
    if (clientData) {
      form.setValue("name", clientData.name);
      form.setValue("address", clientData.address);
      form.setValue("city", clientData.city);
      form.setValue("state", clientData.state);
      form.setValue("zip", clientData.zip);
      form.setValue("email", clientData.email);
      
      toast({
        title: "Cliente encontrado!",
        description: `Dados de ${clientData.name} preenchidos automaticamente.`,
      });
    }
  }, [clientData, form, toast]);

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      return await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/lookup-by-cnpj'] });
      toast({
        title: "Sucesso!",
        description: "Cliente cadastrado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao cadastrar cliente. Tente novamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      return await apiRequest("PATCH", `/api/clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/lookup-by-cnpj'] });
      toast({
        title: "Sucesso!",
        description: "Cliente atualizado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar cliente. Tente novamente.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Sucesso!",
        description: "Cliente excluído com sucesso.",
      });
      setDeletingClient(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir cliente. Tente novamente.",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCloseDialog = () => {
    setIsNewDialogOpen(false);
    setEditingClient(null);
    form.reset();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      cnpj: client.cnpj,
      name: client.name,
      address: client.address,
      city: client.city,
      state: client.state,
      zip: client.zip,
      email: client.email || "",
      telefone: client.telefone || "",
      celular: client.celular || "",
    });
    setIsNewDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
  };

  const confirmDelete = () => {
    if (deletingClient) {
      deleteMutation.mutate(deletingClient.id);
    }
  };

  const filteredClients = clients.filter(c => {
    const search = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(search) ||
      c.cnpj.toLowerCase().includes(search) ||
      c.city.toLowerCase().includes(search) ||
      (c.email && c.email.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Cadastro de Clientes</h1>
          <p className="text-muted-foreground">Gerencie clientes cadastrados no sistema</p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)} data-testid="button-new-client">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por razão social, CNPJ, cidade ou e-mail..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingClients ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover-elevate" data-testid={`card-client-${client.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1" data-testid={`text-client-name-${client.id}`}>
                          {client.name}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span data-testid={`text-client-cnpj-${client.id}`}>CNPJ: {client.cnpj}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span data-testid={`text-client-location-${client.id}`}>
                              {client.city}/{client.state} - CEP: {client.zip}
                            </span>
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span data-testid={`text-client-email-${client.id}`}>{client.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(client)}
                          data-testid={`button-edit-${client.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(client)}
                          data-testid={`button-delete-${client.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo/Editar Cliente */}
      <Dialog open={isNewDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingClient 
                ? "Atualize os dados do cliente." 
                : "Preencha os dados do cliente."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          disabled={!!editingClient}
                        />
                        {loadingLookup && !editingClient && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {isNotFound && !editingClient && (
                      <p className="text-xs text-muted-foreground">
                        Cliente não encontrado na planilha. Preencha os dados manualmente.
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro" {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" maxLength={2} {...field} data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} data-testid="input-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 0000-0000" {...field} data-testid="input-telefone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} data-testid="input-celular" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
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
                  {editingClient ? "Salvar Alterações" : "Cadastrar Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{deletingClient?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
