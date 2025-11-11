import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Mail, TrendingUp, Target } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";

export default function Marketing() {
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const campaigns = [
    { 
      id: "CAMP-001", 
      nome: "Black Friday 2025", 
      canal: "Email + Redes Sociais",
      inicio: "20/11/2025",
      fim: "30/11/2025",
      leads: 1240,
      conversoes: 89,
      status: "active" as const 
    },
    { 
      id: "CAMP-002", 
      nome: "Lançamento Produto X", 
      canal: "Google Ads",
      inicio: "01/11/2025",
      fim: "15/11/2025",
      leads: 856,
      conversoes: 67,
      status: "approved" as const 
    },
    { 
      id: "CAMP-003", 
      nome: "Newsletter Mensal", 
      canal: "Email Marketing",
      inicio: "01/11/2025",
      fim: "30/11/2025",
      leads: 3200,
      conversoes: 124,
      status: "active" as const 
    },
  ];

  const leads = [
    { id: "LEAD-001", nome: "Carlos Oliveira", empresa: "Tech Corp", origem: "Website", score: 85, status: "pending" as const },
    { id: "LEAD-002", nome: "Patricia Mendes", empresa: "Digital SA", origem: "LinkedIn", score: 92, status: "approved" as const },
    { id: "LEAD-003", nome: "Roberto Lima", empresa: "Startup ABC", origem: "Google Ads", score: 78, status: "pending" as const },
  ];

  const totalLeads = campaigns.reduce((acc, c) => acc + c.leads, 0);
  const totalConversoes = campaigns.reduce((acc, c) => acc + c.conversoes, 0);
  const taxaConversao = ((totalConversoes / totalLeads) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Marketing</h1>
          <p className="text-muted-foreground">Gerencie campanhas, leads e análises de marketing</p>
        </div>
        <Button data-testid="button-new-campaign">
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversoes}</div>
            <p className="text-xs text-chart-2 mt-1">↑ +15% vs mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConversao}%</div>
            <p className="text-xs text-muted-foreground mt-1">Média geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Em execução</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campanhas de Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-xs font-semibold" data-testid={`text-campaign-id-${campaign.id}`}>
                            {campaign.id}
                          </span>
                          <StatusBadge status={campaign.status} />
                        </div>
                        <h3 className="font-semibold">{campaign.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{campaign.canal}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.inicio} - {campaign.fim}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Leads gerados:</span>
                        <span className="font-semibold">{campaign.leads}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversões:</span>
                        <span className="font-semibold">{campaign.conversoes}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Taxa de conversão</span>
                          <span className="font-medium">
                            {((campaign.conversoes / campaign.leads) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(campaign.conversoes / campaign.leads) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Leads Recentes</CardTitle>
              <Button variant="outline" size="sm" data-testid="button-view-all-leads">
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.map((lead) => (
                <Card key={lead.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-xs font-semibold" data-testid={`text-lead-id-${lead.id}`}>
                            {lead.id}
                          </span>
                          <StatusBadge status={lead.status} />
                        </div>
                        <h3 className="font-semibold">{lead.nome}</h3>
                        <p className="text-sm text-muted-foreground">{lead.empresa}</p>
                        <p className="text-xs text-muted-foreground mt-1">Origem: {lead.origem}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold mb-1">Score</div>
                        <div className={`text-2xl font-bold ${lead.score >= 80 ? 'text-chart-2' : 'text-muted-foreground'}`}>
                          {lead.score}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
