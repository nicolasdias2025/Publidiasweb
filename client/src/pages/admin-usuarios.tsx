import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Users, Plus, Loader2, ShieldCheck, KeyRound, Trash2 } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  requirePasswordChange: boolean;
  createdAt: string | null;
}

const createSchema = z.object({
  username: z
    .string()
    .min(3, "Usuário deve ter pelo menos 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9._-]+$/, "Apenas letras minúsculas, números, pontos, hífens e underscores"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type CreateFormData = z.infer<typeof createSchema>;

export default function AdminUsuarios() {
  const { toast } = useToast();
  const [openCreate, setOpenCreate] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUsername, setDeleteUsername] = useState<string>("");

  const { data: users = [], isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", password: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateFormData) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Colaborador criado!",
        description: `Usuário "${newUser.username}" foi criado. No primeiro acesso, o sistema exigirá a criação de uma senha pessoal.`,
      });
      form.reset();
      setOpenCreate(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar colaborador",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`, {});
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Colaborador removido!",
        description: result.message,
      });
      setDeleteUserId(null);
      setDeleteUsername("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover colaborador",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => createMutation.mutate(data));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gerenciar Equipe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie os acessos dos colaboradores ao sistema
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} data-testid="button-novo-colaborador">
          <Plus className="h-4 w-4 mr-2" />
          Novo Colaborador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Colaboradores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Usuário
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Perfil
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status de Acesso
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Criado em
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-muted-foreground text-sm">
                      Carregando...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-muted-foreground text-sm">
                      Nenhum colaborador cadastrado
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b hover:bg-muted/40"
                      data-testid={`row-user-${u.id}`}
                    >
                      <td className="p-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {u.role === "admin" && (
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          )}
                          {u.username}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? "Administrador" : "Colaborador"}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        {u.requirePasswordChange ? (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <KeyRound className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Aguardando primeiro acesso</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ativo</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="p-3 text-sm">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteUserId(u.id);
                            setDeleteUsername(u.username);
                          }}
                          data-testid={`button-delete-user-${u.id}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Colaborador</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-username">Nome de Usuário</Label>
              <Input
                id="new-username"
                placeholder="ex: joao.silva"
                autoComplete="off"
                data-testid="input-new-username"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números, pontos, hífens e underscores.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-password">Senha Temporária</Label>
              <Input
                id="temp-password"
                type="text"
                placeholder="ex: publidias123"
                autoComplete="off"
                data-testid="input-temp-password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                No primeiro acesso, o colaborador será obrigado a criar uma senha pessoal.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => setOpenCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-criar-colaborador">
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Colaborador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Colaborador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteUsername}</strong>? Essa ação é irreversível e o colaborador perderá acesso ao sistema imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
