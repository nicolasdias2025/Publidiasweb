/**
 * Landing Page - Sistema Corporativo
 * 
 * Página inicial para usuários não autenticados.
 * Apresenta o sistema e oferece login via autenticação local.
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  CheckSquare, 
  Receipt, 
  Settings, 
  Megaphone,
  ArrowRight 
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: FileText,
      title: "Orçamentos",
      description: "Crie e gerencie orçamentos para publicações em jornais oficiais com cálculo automático",
    },
    {
      icon: CheckSquare,
      title: "Autorizações",
      description: "Workflow completo de aprovação para solicitações internas",
    },
    {
      icon: Receipt,
      title: "Notas Fiscais",
      description: "Emissão e gerenciamento de notas fiscais eletrônicas",
    },
    {
      icon: Settings,
      title: "Gestão Administrativa",
      description: "Controle de documentos e processos administrativos",
    },
    {
      icon: Megaphone,
      title: "Marketing",
      description: "Gerencie campanhas, leads e acompanhe métricas de conversão",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xl font-bold">SC</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-landing-title">
            Sistema Corporativo Integrado
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plataforma completa para gestão empresarial: orçamentos, autorizações, 
            notas fiscais, gestão administrativa e marketing
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              Fazer Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {features.map((feature) => (
            <Card key={feature.title} className="hover-elevate">
              <CardContent className="p-6">
                <feature.icon className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="mb-6 text-primary-foreground/90">
              Faça login ou crie sua conta para acessar o sistema completo
            </p>
            <Button 
              variant="secondary"
              size="lg"
              onClick={() => setLocation("/login")}
              data-testid="button-login-cta"
            >
              Acessar Sistema
            </Button>
          </CardContent>
        </Card>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Sistema desenvolvido para gestão corporativa completa • 
            Autenticação segura • 
            Compatível com UOL Host
          </p>
        </div>
      </div>
    </div>
  );
}
