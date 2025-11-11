import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Autorizacoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<any>(null);

  //todo: remove mock functionality
  const approvals = [
    { 
      id: "AUT-045", 
      tipo: "Compra de Equipamentos", 
      solicitante: "João Silva", 
      departamento: "TI",
      valor: "R$ 12.500,00",
      data: "15/11/2025", 
      status: "pending" as const,
      descricao: "Solicitação de 3 notebooks Dell para equipe de desenvolvimento"
    },
    { 
      id: "AUT-046", 
      tipo: "Viagem Corporativa", 
      solicitante: "Maria Santos", 
      departamento: "Vendas",
      valor: "R$ 4.200,00",
      data: "14/11/2025", 
      status: "approved" as const,
      descricao: "Viagem para feira de negócios em São Paulo"
    },
    { 
      id: "AUT-047", 
      tipo: "Contratação de Serviço", 
      solicitante: "Pedro Costa", 
      departamento: "Marketing",
      valor: "R$ 8.900,00",
      data: "13/11/2025", 
      status: "pending" as const,
      descricao: "Consultoria de marketing digital - 3 meses"
    },
    { 
      id: "AUT-048", 
      tipo: "Treinamento", 
      solicitante: "Ana Lima", 
      departamento: "RH",
      valor: "R$ 2.800,00",
      data: "12/11/2025", 
      status: "rejected" as const,
      descricao: "Curso de gestão de pessoas para gerentes"
    },
  ];

  const filteredApprovals = approvals.filter(a => 
    a.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.solicitante.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Autorizações</h1>
          <p className="text-muted-foreground">Gerencie aprovações e workflows internos</p>
        </div>
        <Button data-testid="button-new-approval">
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
                      <h3 className="font-semibold mb-1">{approval.tipo}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{approval.descricao}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Solicitante: {approval.solicitante}</span>
                        <span>Depto: {approval.departamento}</span>
                        <span>{approval.data}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-lg">{approval.valor}</p>
                      {approval.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Aprovando ${approval.id}`);
                            }}
                            data-testid={`button-approve-${approval.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Rejeitando ${approval.id}`);
                            }}
                            data-testid={`button-reject-${approval.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Autorização</DialogTitle>
            <DialogDescription>
              {selectedApproval?.id} - {selectedApproval?.tipo}
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Solicitante</Label>
                <p className="text-sm">{selectedApproval.solicitante} - {selectedApproval.departamento}</p>
              </div>
              <div className="grid gap-2">
                <Label>Valor</Label>
                <p className="text-sm font-mono font-semibold">{selectedApproval.valor}</p>
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <p className="text-sm">{selectedApproval.descricao}</p>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <div>
                  <StatusBadge status={selectedApproval.status} />
                </div>
              </div>
              {selectedApproval.status === 'pending' && (
                <div className="grid gap-2">
                  <Label htmlFor="comentario">Comentário (opcional)</Label>
                  <Textarea id="comentario" placeholder="Adicione um comentário sobre a decisão..." />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedApproval?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => {
                  console.log(`Rejeitando ${selectedApproval.id}`);
                  setSelectedApproval(null);
                }}>
                  Rejeitar
                </Button>
                <Button onClick={() => {
                  console.log(`Aprovando ${selectedApproval.id}`);
                  setSelectedApproval(null);
                }}>
                  Aprovar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
