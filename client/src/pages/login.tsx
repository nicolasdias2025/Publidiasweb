import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, setAuthToken } from "@/lib/queryClient";
import { Building2, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres").max(50, "Usuário deve ter no máximo 50 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (result: { user: any; token: string }) => {
      setAuthToken(result.token);
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao sistema.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message || "Usuário ou senha inválidos",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: async (result: { user: any; token: string }) => {
      setAuthToken(result.token);
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Conta criada!",
        description: "Você foi autenticado automaticamente.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    loginForm.handleSubmit((data) => {
      loginMutation.mutate(data);
    })();
  };

  const onRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    registerForm.handleSubmit((data) => {
      registerMutation.mutate(data);
    })();
  };

  const toggleMode = () => {
    setIsCreateAccount(!isCreateAccount);
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isCreateAccount ? "Criar Conta" : "Fazer Login"}
          </CardTitle>
          <CardDescription>
            {isCreateAccount 
              ? "Preencha os dados para criar sua conta" 
              : "Entre com suas credenciais para acessar o sistema"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreateAccount ? (
            <form onSubmit={onRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username">Usuário</Label>
                <Input 
                  id="register-username"
                  autoComplete="username"
                  placeholder="Digite seu nome de usuário" 
                  data-testid="input-register-username"
                  {...registerForm.register("username")}
                />
                {registerForm.formState.errors.username && (
                  <p className="text-sm font-medium text-destructive">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">E-mail</Label>
                <Input 
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail" 
                  data-testid="input-register-email"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input 
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite sua senha" 
                  data-testid="input-register-password"
                  {...registerForm.register("password")}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
            </form>
          ) : (
            <form onSubmit={onLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Usuário</Label>
                <Input 
                  id="login-username"
                  autoComplete="username"
                  placeholder="Digite seu nome de usuário" 
                  data-testid="input-login-username"
                  {...loginForm.register("username")}
                />
                {loginForm.formState.errors.username && (
                  <p className="text-sm font-medium text-destructive">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input 
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha" 
                  data-testid="input-login-password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={toggleMode}
              className="text-sm"
              data-testid="button-toggle-mode"
            >
              {isCreateAccount 
                ? "Já tem uma conta? Fazer login" 
                : "Não tem conta? Criar conta"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
