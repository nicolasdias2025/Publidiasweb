import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2, Building2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClientLookup } from "@/hooks/useClientLookup";

const autorizacaoFormSchema = z.object({
  // Dados do Cliente
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  clientName: z.string().min(1, "Nome é obrigatório"),
  clientAddress: z.string().min(1, "Endereço é obrigatório"),
  clientCity: z.string().min(1, "Cidade é obrigatória"),
  clientState: z.string().length(2, "UF deve ter 2 caracteres"),
  clientZip: z.string().min(8, "CEP deve ter 8 dígitos"),
  clientEmail: z.string().email("E-mail inválido").optional().or(z.literal('')),
  
  // Dados da Publicação
  jornal: z.string().min(1, "Jornal é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  mes: z.string().min(1, "Mês é obrigatório"),
  ano: z.string().min(1, "Ano é obrigatório"),
  diasPublicacao: z.array(z.number()).min(1, "Selecione pelo menos um dia"),
  colLinha: z.string().min(1, "Col./Linha é obrigatório"),
  cm: z.string().min(1, "Cm é obrigatório"),
  formato: z.string().min(1, "Formato é obrigatório"),
  valorUnitario: z.string().min(1, "Valor unitário é obrigatório"),
  desconto: z.string().optional(),
  aplicarValorLiquido: z.boolean().default(false),
  valorDiagramacao: z.string().optional(),
  custoPublicacao: z.string().optional(),
  observacoes: z.string().optional(),
});

type AutorizacaoFormData = z.infer<typeof autorizacaoFormSchema>;

export default function Autorizacoes() {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const { toast } = useToast();

  const form = useForm<AutorizacaoFormData>({
    resolver: zodResolver(autorizacaoFormSchema),
    defaultValues: {
      cnpj: "",
      clientName: "",
      clientAddress: "",
      clientCity: "",
      clientState: "",
      clientZip: "",
      clientEmail: "",
      jornal: "",
      tipo: "",
      mes: "",
      ano: "",
      diasPublicacao: [],
      colLinha: "",
      cm: "",
      formato: "",
      valorUnitario: "",
      desconto: "0",
      aplicarValorLiquido: false,
      valorDiagramacao: "0",
      custoPublicacao: "0",
      observacoes: "",
    },
  });

  const watchedCnpj = form.watch("cnpj") || "";
  const { clientData, isLoading: loadingClient } = useClientLookup(watchedCnpj);

  // Autopreencher dados do cliente
  useEffect(() => {
    if (clientData) {
      form.setValue("clientName", clientData.razaoSocial);
      form.setValue("clientAddress", clientData.endereco);
      form.setValue("clientCity", clientData.cidade);
      form.setValue("clientState", clientData.uf);
      form.setValue("clientZip", clientData.cep);
      form.setValue("clientEmail", clientData.email);
      
      toast({
        title: "Cliente encontrado!",
        description: `Dados de ${clientData.razaoSocial} preenchidos automaticamente.`,
      });
    }
  }, [clientData, form, toast]);

  // Atualizar dias quando checkbox é marcado/desmarcado
  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b);
      form.setValue("diasPublicacao", newDays);
      return newDays;
    });
  };

  // Cálculos automáticos
  const colLinha = parseFloat(form.watch("colLinha") || "0");
  const cm = parseFloat(form.watch("cm") || "0");
  const valorUnitario = parseFloat(form.watch("valorUnitario") || "0");
  const descontoPercentual = parseFloat(form.watch("desconto") || "0");
  const aplicarValorLiquido = form.watch("aplicarValorLiquido");
  const numeroInsercoes = selectedDays.length;

  // Subtotal = (col × cm × valorUnitario) × nºInserções
  const subtotal = colLinha * cm * valorUnitario * numeroInsercoes;
  
  // Aplicar desconto percentual sobre o subtotal
  const valorDesconto = subtotal * (descontoPercentual / 100);
  
  // Valor Total = subtotal - desconto percentual
  const valorTotal = subtotal - valorDesconto;
  
  // Valor Líquido = Valor Total × 0.8 (se checkbox marcado)
  const valorLiquido = aplicarValorLiquido ? valorTotal * 0.8 : valorTotal;

  const onSubmit = (data: AutorizacaoFormData) => {
    console.log("Dados da autorização:", data);
    console.log("Valor Total calculado:", valorTotal);
    console.log("Valor Líquido calculado:", valorLiquido);
    
    toast({
      title: "PDF será gerado em breve",
      description: "Funcionalidade de geração de PDF será implementada na próxima etapa.",
    });
  };

  // Opções de meses e anos
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      years.push((currentYear + i).toString());
    }
    return years;
  };
  
  const anos = generateYearOptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Autorizações</h1>
          <p className="text-muted-foreground">Autorização de publicação em jornais oficiais</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* SEÇÃO 1: DADOS DO CLIENTE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        />
                        {loadingClient && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} data-testid="input-client-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com" {...field} data-testid="input-client-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro" {...field} data-testid="input-client-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="clientCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} data-testid="input-client-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" maxLength={2} {...field} data-testid="input-client-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientZip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} data-testid="input-client-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* SEÇÃO 2: DADOS DA PUBLICAÇÃO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados da Publicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jornal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jornal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Diário Oficial da União" {...field} data-testid="input-jornal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tipo">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="impresso">Impresso</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="diagramacao">Diagramação</SelectItem>
                          <SelectItem value="ambos">Impresso + Digital</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mês e Ano da Publicação */}
              <div className="space-y-4">
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período da Publicação
                </FormLabel>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-mes">
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {meses.map((mes) => (
                              <SelectItem key={mes} value={mes}>
                                {mes}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ano"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ano">
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {anos.map((ano) => (
                              <SelectItem key={ano} value={ano}>
                                {ano}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Dias da Publicação</FormLabel>
                  <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-31 gap-2">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <div
                        key={day}
                        className={`
                          flex items-center justify-center p-2 rounded-md border-2 cursor-pointer transition-all
                          ${selectedDays.includes(day) 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-background hover-elevate border-border'
                          }
                        `}
                        onClick={() => toggleDay(day)}
                        data-testid={`checkbox-day-${day}`}
                      >
                        <span className="text-sm font-semibold">{String(day).padStart(2, '0')}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique nos dias para selecionar/desselecionar
                  </p>
                </div>
              </div>

              {/* Cálculos */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="colLinha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Col./Linha</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0" {...field} data-testid="input-col-linha" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cm (Centímetros)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0" {...field} data-testid="input-cm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="formato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formato</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-formato">
                            <SelectValue placeholder="Selecione o formato" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="padrao">Padrão</SelectItem>
                          <SelectItem value="10x3">10x3</SelectItem>
                          <SelectItem value="10x5">10x5</SelectItem>
                          <SelectItem value="15x5">15x5</SelectItem>
                          <SelectItem value="personalizado">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorUnitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor "col./linha × cm" (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-valor-unitario" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="desconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} data-testid="input-desconto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos Calculados (Read-only) */}
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Nº de Inserções</FormLabel>
                    <Input 
                      value={numeroInsercoes} 
                      readOnly 
                      className="bg-background font-semibold"
                      data-testid="display-num-insercoes"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente</p>
                  </div>

                  <div>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <Input 
                      value={valorTotal.toFixed(2)} 
                      readOnly 
                      className="bg-background font-semibold"
                      data-testid="display-valor-total"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      (col × cm × valor) × inserções - desconto
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name="aplicarValorLiquido"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-valor-liquido"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Aplicar Valor Líquido (20% desconto)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex-1">
                    <FormLabel>Valor Líquido (R$)</FormLabel>
                    <Input 
                      value={valorLiquido.toFixed(2)} 
                      readOnly 
                      className={`bg-background font-semibold ${aplicarValorLiquido ? 'border-primary' : ''}`}
                      data-testid="display-valor-liquido"
                    />
                  </div>
                </div>
              </div>

              {/* Campos Adicionais */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorDiagramacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Diagramação (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-diagramacao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custoPublicacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo da Publicação (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-custo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre a publicação..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-observacoes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botão Gerar PDF */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              className="gap-2"
              data-testid="button-gerar-pdf"
            >
              <FileText className="h-5 w-5" />
              GERAR PDF
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
