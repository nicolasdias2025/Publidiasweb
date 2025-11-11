import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Upload, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";

export default function GestaoAdministrativa() {
  const [searchTerm, setSearchTerm] = useState("");

  //todo: remove mock functionality
  const documents = [
    { id: "DOC-001", titulo: "Contrato Fornecedor XYZ", categoria: "Contratos", data: "15/11/2025", status: "active" as const },
    { id: "DOC-002", titulo: "Política de RH 2025", categoria: "Políticas", data: "10/11/2025", status: "active" as const },
    { id: "DOC-003", titulo: "Ata Reunião Diretoria", categoria: "Atas", data: "08/11/2025", status: "active" as const },
  ];

  const processos = [
    { id: "PROC-001", titulo: "Onboarding Funcionário", responsavel: "RH", prazo: "20/11/2025", status: "pending" as const },
    { id: "PROC-002", titulo: "Auditoria Interna", responsavel: "Controladoria", prazo: "30/11/2025", status: "approved" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Gestão Administrativa</h1>
          <p className="text-muted-foreground">Controle de documentos e processos internos</p>
        </div>
        <Button data-testid="button-upload-document">
          <Upload className="h-4 w-4 mr-2" />
          Carregar Documento
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.categoria === 'Contratos').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Vigentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Políticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.categoria === 'Políticas').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Atualizadas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documentos" data-testid="tab-documentos">Documentos</TabsTrigger>
          <TabsTrigger value="processos" data-testid="tab-processos">Processos</TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium">ID</th>
                      <th className="text-left p-3 text-sm font-medium">Título</th>
                      <th className="text-left p-3 text-sm font-medium">Categoria</th>
                      <th className="text-left p-3 text-sm font-medium">Data Upload</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-right p-3 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b hover-elevate" data-testid={`row-doc-${doc.id}`}>
                        <td className="p-3 font-mono text-sm">{doc.id}</td>
                        <td className="p-3 text-sm">{doc.titulo}</td>
                        <td className="p-3 text-sm">{doc.categoria}</td>
                        <td className="p-3 text-sm text-muted-foreground">{doc.data}</td>
                        <td className="p-3">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" data-testid={`button-download-${doc.id}`}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processos Administrativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processos.map((proc) => (
                  <Card key={proc.id} className="hover-elevate">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm font-semibold" data-testid={`text-proc-id-${proc.id}`}>
                              {proc.id}
                            </span>
                            <StatusBadge status={proc.status} />
                          </div>
                          <h3 className="font-semibold mb-1">{proc.titulo}</h3>
                          <p className="text-sm text-muted-foreground">
                            Responsável: {proc.responsavel} • Prazo: {proc.prazo}
                          </p>
                        </div>
                        <Button size="sm" data-testid={`button-view-${proc.id}`}>
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
