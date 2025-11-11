import { Badge } from "@/components/ui/badge";

type Status = "pending" | "approved" | "rejected" | "draft" | "issued" | "cancelled" | "active" | "inactive";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  draft: { label: "Rascunho", variant: "outline" },
  issued: { label: "Emitida", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  active: { label: "Ativo", variant: "default" },
  inactive: { label: "Inativo", variant: "secondary" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}
