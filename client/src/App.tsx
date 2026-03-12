/**
 * App Root Component - Sistema Corporativo
 * 
 * Gerencia autenticação e roteamento da aplicação.
 * Exibe landing page para usuários não autenticados.
 */

import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Orcamentos from "@/pages/orcamentos";
import Clientes from "@/pages/clientes";
import Autorizacoes from "@/pages/autorizacoes";
import NotasFiscais from "@/pages/notas-fiscais";
import GestaoAdministrativa from "@/pages/gestao-administrativa";
import Marketing from "@/pages/marketing";
import AdminUsuarios from "@/pages/admin-usuarios";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import ChangePasswordPage from "@/pages/change-password";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Exibe landing/login se não autenticado
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={LoginPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Usuário autenticado mas precisa trocar a senha — bloqueia acesso ao restante
  if (user?.requirePasswordChange) {
    return (
      <Switch>
        <Route path="/change-password" component={ChangePasswordPage} />
        <Route>
          <Redirect to="/change-password" />
        </Route>
      </Switch>
    );
  }

  // Rotas protegidas para usuários autenticados com senha definitiva
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login">
        <Redirect to="/" />
      </Route>
      <Route path="/change-password">
        <Redirect to="/" />
      </Route>
      <Route path="/orcamentos" component={Orcamentos} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/autorizacoes" component={Autorizacoes} />
      <Route path="/notas-fiscais" component={NotasFiscais} />
      <Route path="/gestao-administrativa/:rest*" component={GestaoAdministrativa} />
      <Route path="/marketing" component={Marketing} />
      {user?.role === "admin" && (
        <Route path="/admin/usuarios" component={AdminUsuarios} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Usuário não autenticado — layout simples sem sidebar
  if (isLoading || !isAuthenticated) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  // Usuário autenticado mas precisa trocar senha — sem sidebar
  if (user?.requirePasswordChange) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  // Layout completo com sidebar para usuários autenticados com senha definitiva
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background">
            <Router />
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sistema-corporativo-theme">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
