import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Eye } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotasFiscais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  //todo: remove mock functionality
  const invoices = [
    { 
      id: "NF-2025-001", 
      cliente: "Empresa ABC Ltda", 
      valor: "R$ 45.000,00",
      valorImposto: "R$ 7.650,00",
      data: "15/11/2025", 
      status: "issued" as const 
    },
    { 
      id: "NF-2025-002", 
      cliente: "Tech Solutions", 
      valor: "R$ 28.500,00",
      valorImposto: "R$ 4.845,00",
      data: "14/11/2025", 
      status: "issued" as const 
    },
    { 
      id: "NF-2025-003", 
      cliente: "Indústria XYZ", 
      valor: "R$ 92.000,00",
      valorImposto: "R$ 15.640,00",
      data: "13/11/2025", 
      status: "draft" as const 
    },
    { 
      id: "NF-2025-004", 
      cliente: "Comércio Digital", 
      valor: "R$ 15.200,00",
      valorImposto: "R$ 2.584,00",
      data: "12/11/2025", 
      status: "cancelled" as const 
    },
  ];

  const filteredInvoices = invoices.filter(nf => 
    nf.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nf.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmitidas = invoices.filter(nf => nf.status === 'issued').length;
  const totalValor = invoices
    .filter(nf => nf.status === 'issued')
    .reduce((acc, nf) => acc + parseFloat(nf.valor.replace(/[R$.\s]/g, '').replace(',', '.')), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Notas Fiscais</h1>
          <p className="text-muted-foreground">Emissão e gerenciamento de notas fiscais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-invoice">
              <Plus className="h-4 w-4 mr-2" />
              Emitir Nota Fiscal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Emitir Nova Nota Fiscal</DialogTitle>
              <DialogDescription>
                Preencha os dados para emitir uma nota fiscal eletrônica
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nf-cliente">Cliente (CNPJ/CPF)</Label>
                <Input id="nf-cliente" placeholder="00.000.000/0000-00" data-testid="input-cliente" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nf-valor">Valor dos Serviços</Label>
                  <Input id="nf-valor" placeholder="R$ 0,00" data-testid="input-valor" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nf-tipo">Tipo de Serviço</Label>
                  <Select>
                    <SelectTrigger id="nf-tipo" data-testid="select-tipo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultoria">Consultoria</SelectItem>
                      <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nf-descricao">Descrição dos Serviços</Label>
                <Input id="nf-descricao" placeholder="Descrição detalhada..." data-testid="input-descricao" />
              </div>
              <div className="rounded-md bg-muted p-4">
                <h4 className="font-medium mb-2">Simulação de Impostos</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ISS (5%):</span>
                    <span className="font-mono">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">COFINS (3%):</span>
                    <span className="font-mono">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PIS (0.65%):</span>
                    <span className="font-mono">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-2">
                    <span>Total de Impostos:</span>
                    <span className="font-mono">R$ 0,00</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                Cancelar
              </Button>
              <Button onClick={() => {
                console.log("Nota fiscal emitida");
                setIsDialogOpen(false);
              }} data-testid="button-emit">
                Emitir Nota Fiscal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NFs Emitidas (mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmitidas}</div>
            <p className="text-xs text-muted-foreground mt-1">Novembro 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">NFs emitidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(nf => nf.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando emissão</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou número..."
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
                  <th className="text-left p-3 text-sm font-medium">Número NF</th>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium">Valor</th>
                  <th className="text-left p-3 text-sm font-medium">Impostos</th>
                  <th className="text-left p-3 text-sm font-medium">Data Emissão</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover-elevate" data-testid={`row-invoice-${invoice.id}`}>
                    <td className="p-3 font-mono text-sm font-semibold">{invoice.id}</td>
                    <td className="p-3 text-sm">{invoice.cliente}</td>
                    <td className="p-3 font-mono text-sm font-semibold">{invoice.valor}</td>
                    <td className="p-3 font-mono text-sm text-muted-foreground">{invoice.valorImposto}</td>
                    <td className="p-3 text-sm text-muted-foreground">{invoice.data}</td>
                    <td className="p-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" data-testid={`button-view-${invoice.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-download-${invoice.id}`}>
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
    </div>
  );
}
