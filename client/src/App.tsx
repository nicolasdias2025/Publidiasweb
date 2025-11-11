/**
 * App Root Component - Sistema Corporativo
 * 
 * Gerencia autenticação e roteamento da aplicação.
 * Exibe landing page para usuários não autenticados.
 */

import { Switch, Route } from "wouter";
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
import Autorizacoes from "@/pages/autorizacoes";
import NotasFiscais from "@/pages/notas-fiscais";
import GestaoAdministrativa from "@/pages/gestao-administrativa";
import Marketing from "@/pages/marketing";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Exibe landing page se não autenticado
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Rotas protegidas para usuários autenticados
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/orcamentos" component={Orcamentos} />
      <Route path="/autorizacoes" component={Autorizacoes} />
      <Route path="/notas-fiscais" component={NotasFiscais} />
      <Route path="/gestao-administrativa" component={GestaoAdministrativa} />
      <Route path="/marketing" component={Marketing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading || !isAuthenticated) {
    // Layout simples para landing page
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  // Layout completo com sidebar para usuários autenticados
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
