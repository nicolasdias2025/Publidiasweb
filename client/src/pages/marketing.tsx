import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { 
  Calendar, 
  FileText, 
  BarChart3, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Trash2,
  Pencil,
  Mail,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MarketingActivity, MarketingContent, MarketingMetric } from "@shared/schema";

type TabType = "calendario" | "conteudo" | "dados";

const PLATFORMS = ["Brevo", "Mailchimp", "GetResponse", "Systeme", "ActiveCampaign"];
const CONTENT_TYPES = ["Texto", "Email", "LandingPage"];
const CLIENT_TYPES = ["Todos", "Novo Cliente", "Cliente Ativo", "Ex-Cliente", "Lead"];
const ACTIVITY_STATUS = ["Pendente", "Execução", "Concluída"];
const STATUS_COLORS: Record<string, string> = {
  "Pendente": "#F59E0B",
  "Execução": "#3B82F6", 
  "Concluída": "#10B981",
};

export default function Marketing() {
  const [activeTab, setActiveTab] = useState<TabType>("calendario");
  const { toast } = useToast();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === "calendario" ? "default" : "outline"}
          onClick={() => setActiveTab("calendario")}
          data-testid="tab-calendario"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Calendário
        </Button>
        <Button
          variant={activeTab === "conteudo" ? "default" : "outline"}
          onClick={() => setActiveTab("conteudo")}
          data-testid="tab-conteudo"
        >
          <FileText className="h-4 w-4 mr-2" />
          Central de Conteúdo
        </Button>
        <Button
          variant={activeTab === "dados" ? "default" : "outline"}
          onClick={() => setActiveTab("dados")}
          data-testid="tab-dados"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Central de Dados
        </Button>
      </div>

      {activeTab === "calendario" && <CalendarTab />}
      {activeTab === "conteudo" && <ContentTab />}
      {activeTab === "dados" && <DataTab />}
    </div>
  );
}

function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<MarketingActivity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: activities = [], isLoading } = useQuery<MarketingActivity[]>({
    queryKey: ["/api/marketing/activities", year, month],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing/activities", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/activities"] });
      setIsDialogOpen(false);
      setSelectedDate(null);
      toast({ title: "Atividade criada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar atividade", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/marketing/activities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/activities"] });
      setIsDialogOpen(false);
      setEditingActivity(null);
      toast({ title: "Atividade atualizada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar atividade", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/activities"] });
      setDeleteId(null);
      toast({ title: "Atividade removida com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover atividade", description: error.message, variant: "destructive" });
    },
  });

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const startDayOfWeek = getDay(startDate);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setEditingActivity(null);
    setIsDialogOpen(true);
  };

  const handleEditActivity = (activity: MarketingActivity) => {
    setEditingActivity(activity);
    setSelectedDate(new Date(activity.date));
    setIsDialogOpen(true);
  };

  const getActivitiesForDay = (day: Date) => {
    return activities.filter(activity => 
      isSameDay(new Date(activity.date), day)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" data-testid="text-calendar-title">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            data-testid="button-today"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b">
                {day}
              </div>
            ))}
            
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] border-b border-r bg-muted/20" />
            ))}
            
            {days.map((day) => {
              const dayActivities = getActivitiesForDay(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className="min-h-[120px] border-b border-r p-2 hover-elevate cursor-pointer"
                  onClick={() => handleDayClick(day)}
                  data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className={`text-sm mb-2 ${isCurrentDay ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center" : ""}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="text-xs p-1 rounded truncate bg-[#cbeee1]"
                        style={{ backgroundColor: STATUS_COLORS[activity.status] + "20", borderLeft: `3px solid ${STATUS_COLORS[activity.status]}` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditActivity(activity);
                        }}
                        data-testid={`activity-${activity.id}`}
                      >
                        {activity.collaborator}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <ActivityDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingActivity(null);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
        activity={editingActivity}
        onSave={(data) => {
          if (editingActivity) {
            updateMutation.mutate({ id: editingActivity.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        onDelete={(id) => setDeleteId(id)}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta atividade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActivityDialog({
  isOpen,
  onClose,
  selectedDate,
  activity,
  onSave,
  onDelete,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  activity: MarketingActivity | null;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collaborator, setCollaborator] = useState("");
  const [status, setStatus] = useState("Pendente");

  useEffect(() => {
    if (isOpen) {
      if (activity) {
        setTitle(activity.title);
        setDescription(activity.description || "");
        setCollaborator(activity.collaborator);
        setStatus(activity.status);
      } else {
        setTitle("");
        setDescription("");
        setCollaborator("");
        setStatus("Pendente");
      }
    }
  }, [isOpen, activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date: selectedDate?.toISOString(),
      title,
      description,
      collaborator,
      status,
      color: STATUS_COLORS[status],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {activity ? "Editar Atividade" : "Nova Atividade"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input
              value={selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""}
              disabled
            />
          </div>
          <div>
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da atividade"
              required
              data-testid="input-activity-title"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da atividade"
              data-testid="input-activity-description"
            />
          </div>
          <div>
            <Label>Colaborador *</Label>
            <Input
              value={collaborator}
              onChange={(e) => setCollaborator(e.target.value)}
              placeholder="Nome do colaborador"
              required
              data-testid="input-activity-collaborator"
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-activity-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {ACTIVITY_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            {activity && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(activity.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-activity">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContentTab() {
  const [clientTypeFilter, setClientTypeFilter] = useState("Todos");
  const [contentTypeFilter, setContentTypeFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<MarketingContent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: contents = [], isLoading } = useQuery<MarketingContent[]>({
    queryKey: ["/api/marketing/content", { clientTypeFilter, contentTypeFilter, searchTerm }],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing/content", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/content"] });
      setIsDialogOpen(false);
      toast({ title: "Conteúdo criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar conteúdo", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing/content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/content"] });
      setDeleteId(null);
      toast({ title: "Conteúdo removido com sucesso" });
    },
  });

  const filteredContents = contents.filter(content => {
    if (clientTypeFilter !== "Todos" && content.clientType !== clientTypeFilter) return false;
    if (contentTypeFilter !== "Todos" && content.contentType !== contentTypeFilter) return false;
    if (searchTerm && !content.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const clearFilters = () => {
    setClientTypeFilter("Todos");
    setContentTypeFilter("Todos");
    setSearchTerm("");
    setTagFilter("");
  };

  return (
    <div className="flex gap-6">
      <Card className="w-64 shrink-0">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de Cliente</Label>
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger data-testid="select-client-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {CLIENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de Conteúdo</Label>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger data-testid="select-content-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="Todos">Todos</SelectItem>
                {CONTENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Busca por Título</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite..."
                className="pl-8"
                data-testid="input-search-content"
              />
            </div>
          </div>
          <div>
            <Label>Filtro por Tags</Label>
            <Input
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Digite tag..."
              data-testid="input-tag-filter"
            />
          </div>
          <Button variant="outline" onClick={clearFilters} className="w-full">
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Conteúdos ({filteredContents.length})</h2>
          <Button onClick={() => { setEditingContent(null); setIsDialogOpen(true); }} data-testid="button-new-content">
            <Plus className="h-4 w-4 mr-2" />
            Novo Conteúdo
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Criador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Versão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum conteúdo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredContents.map((content) => (
                  <TableRow 
                    key={content.id} 
                    className="cursor-pointer hover-elevate"
                    onClick={() => { setEditingContent(content); setIsDialogOpen(true); }}
                    data-testid={`content-row-${content.id}`}
                  >
                    <TableCell className="font-medium">{content.title}</TableCell>
                    <TableCell>{content.contentType}</TableCell>
                    <TableCell>{content.clientType || "-"}</TableCell>
                    <TableCell>{content.createdBy}</TableCell>
                    <TableCell>{content.createdAt ? format(new Date(content.createdAt), "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell>{content.currentVersion}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <ContentDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingContent(null); }}
        content={editingContent}
        onSave={(data) => createMutation.mutate(data)}
        onDelete={(id) => setDeleteId(id)}
        isPending={createMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este conteúdo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContentDialog({
  isOpen,
  onClose,
  content,
  onSave,
  onDelete,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  content: MarketingContent | null;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(content?.title || "");
  const [contentType, setContentType] = useState(content?.contentType || "Texto");
  const [clientType, setClientType] = useState(content?.clientType || "");
  const [contentData, setContentData] = useState(content?.contentData || "");
  const [tags, setTags] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      contentType,
      clientType,
      contentData,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {content ? "Editar Conteúdo" : "Novo Conteúdo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do conteúdo"
              required
              data-testid="input-content-title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Conteúdo</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Cliente</Label>
              <Select value={clientType} onValueChange={setClientType}>
                <SelectTrigger data-testid="select-content-client-type">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  {CLIENT_TYPES.filter(t => t !== "Todos").map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Conteúdo *</Label>
            <Textarea
              value={contentData}
              onChange={(e) => setContentData(e.target.value)}
              placeholder="Digite o conteúdo..."
              className="min-h-[200px]"
              required
              data-testid="input-content-data"
            />
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              data-testid="input-content-tags"
            />
          </div>
          <DialogFooter className="gap-2">
            {content && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(content.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-content">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DataTab() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [collaboratorFilter, setCollaboratorFilter] = useState("Todos");
  const [platformFilter, setPlatformFilter] = useState("Todas");
  const [editingMetric, setEditingMetric] = useState<MarketingMetric | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: metrics = [], isLoading } = useQuery<MarketingMetric[]>({
    queryKey: ["/api/marketing/metrics"],
  });

  const { data: activities = [] } = useQuery<MarketingActivity[]>({
    queryKey: ["/api/marketing/all-activities"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing/metrics", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/metrics"] });
      resetForm();
      toast({ title: "Métrica registrada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar métrica", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing/metrics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/metrics"] });
      setDeleteId(null);
      toast({ title: "Métrica removida com sucesso" });
    },
  });

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    collaborator: "",
    activityId: "",
    activityTitle: "",
    platform: "",
    emailsSent: 0,
    openRate: 0,
    emailsBounced: 0,
    emailsReturned: "",
    bounceReasons: [] as string[],
    observations: "",
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      collaborator: "",
      activityId: "",
      activityTitle: "",
      platform: "",
      emailsSent: 0,
      openRate: 0,
      emailsBounced: 0,
      emailsReturned: "",
      bounceReasons: [],
      observations: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      date: new Date(formData.date).toISOString(),
      bounceReasons: formData.bounceReasons.join(","),
    });
  };

  const handleBounceReasonChange = (reason: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      bounceReasons: checked
        ? [...prev.bounceReasons, reason]
        : prev.bounceReasons.filter(r => r !== reason),
    }));
  };

  const filteredMetrics = metrics.filter(metric => {
    if (dateFrom && new Date(metric.date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(metric.date) > new Date(dateTo)) return false;
    if (collaboratorFilter !== "Todos" && metric.collaborator !== collaboratorFilter) return false;
    if (platformFilter !== "Todas" && metric.platform !== platformFilter) return false;
    return true;
  });

  const totalSent = filteredMetrics.reduce((acc, m) => acc + (m.emailsSent || 0), 0);
  const avgOpenRate = filteredMetrics.length > 0
    ? filteredMetrics.reduce((acc, m) => {
        const rate = typeof m.openRate === 'string' ? parseFloat(m.openRate) : (m.openRate || 0);
        return acc + (isNaN(rate) ? 0 : rate);
      }, 0) / filteredMetrics.length
    : 0;
  const totalBounced = filteredMetrics.reduce((acc, m) => acc + (m.emailsBounced || 0), 0);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCollaboratorFilter("Todos");
    setPlatformFilter("Todas");
  };

  const uniqueCollaborators = Array.from(new Set(metrics.map(m => m.collaborator)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nova Métrica</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  data-testid="input-metric-date"
                />
              </div>
              <div>
                <Label>Colaborador</Label>
                <Input
                  value={formData.collaborator}
                  onChange={(e) => setFormData(prev => ({ ...prev, collaborator: e.target.value }))}
                  placeholder="Nome do colaborador"
                  data-testid="input-metric-collaborator"
                />
              </div>
              <div>
                <Label>Atividade Relacionada</Label>
                <Select 
                  value={formData.activityId} 
                  onValueChange={(value) => {
                    const activity = activities.find(a => a.id === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      activityId: value,
                      activityTitle: activity?.title || "Manual (sem atividade)"
                    }));
                  }}
                >
                  <SelectTrigger data-testid="select-metric-activity">
                    <SelectValue placeholder="Manual (sem atividade)" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="manual">Manual (sem atividade)</SelectItem>
                    {activities.map((activity) => (
                      <SelectItem key={activity.id} value={activity.id}>
                        {activity.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plataforma</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                  <SelectTrigger data-testid="select-metric-platform">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.activityId === "manual" && (
              <div>
                <Label>Título da atividade manual</Label>
                <Input
                  value={formData.activityTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, activityTitle: e.target.value }))}
                  placeholder="Título da atividade manual"
                  data-testid="input-metric-activity-title"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Emails Enviados</Label>
                <Input
                  type="number"
                  value={formData.emailsSent}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailsSent: parseInt(e.target.value) || 0 }))}
                  data-testid="input-metric-emails-sent"
                />
              </div>
              <div>
                <Label>Taxa de Abertura (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.openRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, openRate: parseFloat(e.target.value) || 0 }))}
                  data-testid="input-metric-open-rate"
                />
              </div>
              <div>
                <Label>Emails Retornados</Label>
                <Input
                  type="number"
                  value={formData.emailsBounced}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailsBounced: parseInt(e.target.value) || 0 }))}
                  data-testid="input-metric-bounced"
                />
              </div>
            </div>

            <div>
              <Label>Motivos dos Retornos</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {["Bounce", "Unsubscribe", "Spam", "Bloqueado", "Outro"].map((reason) => (
                  <label key={reason} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.bounceReasons.includes(reason)}
                      onCheckedChange={(checked) => handleBounceReasonChange(reason, !!checked)}
                    />
                    <span className="text-sm">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Lista de Emails que Retornaram (um por linha)</Label>
              <Textarea
                value={formData.emailsReturned}
                onChange={(e) => setFormData(prev => ({ ...prev, emailsReturned: e.target.value }))}
                placeholder="email1@exemplo.com&#10;email2@exemplo.com"
                className="min-h-[80px]"
                data-testid="input-metric-emails-returned"
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Observações adicionais..."
                data-testid="input-metric-observations"
              />
            </div>

            <Button type="submit" disabled={createMutation.isPending} data-testid="button-register-metric">
              Registrar Métrica
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Enviados</div>
              <div className="text-xs text-muted-foreground">Período filtrado</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 rounded-full bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Taxa Média de Abertura</div>
              <div className="text-xs text-muted-foreground">Média do período</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalBounced}</div>
              <div className="text-sm text-muted-foreground">Total Retornados</div>
              <div className="text-xs text-muted-foreground">Bounces e erros</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Data De</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-filter-date-from"
              />
            </div>
            <div>
              <Label>Data Até</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-filter-date-to"
              />
            </div>
            <div>
              <Label>Colaborador</Label>
              <Select value={collaboratorFilter} onValueChange={setCollaboratorFilter}>
                <SelectTrigger data-testid="select-filter-collaborator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Todos">Todos</SelectItem>
                  {uniqueCollaborators.map((collab) => (
                    <SelectItem key={collab} value={collab}>{collab}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plataforma</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger data-testid="select-filter-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Todas">Todas</SelectItem>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Enviados</TableHead>
              <TableHead>Taxa Abertura</TableHead>
              <TableHead>Retornados</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMetrics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma métrica encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredMetrics.map((metric) => (
                <TableRow key={metric.id} data-testid={`metric-row-${metric.id}`}>
                  <TableCell>{format(new Date(metric.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{metric.collaborator}</TableCell>
                  <TableCell>{metric.activityTitle || "-"}</TableCell>
                  <TableCell>{metric.platform}</TableCell>
                  <TableCell>{metric.emailsSent.toLocaleString()}</TableCell>
                  <TableCell>{metric.openRate}%</TableCell>
                  <TableCell>{metric.emailsBounced}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingMetric(metric)}
                        data-testid={`button-edit-metric-${metric.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(metric.id)}
                        data-testid={`button-delete-metric-${metric.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta métrica? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
