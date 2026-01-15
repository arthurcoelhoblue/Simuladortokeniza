import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  Loader2
} from "lucide-react";

type FilterType = 
  | "all" 
  | "today" 
  | "week" 
  | "month"
  | "with_simulation"
  | "without_simulation"
  | "with_opportunity"
  | "without_opportunity"
  | "without_whatsapp"
  | "without_email"
  | "without_location"
  | "investidor"
  | "emissor"
  | "by_origin";

interface LeadListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: FilterType;
  origin?: string;
  title: string;
  description?: string;
}

const filterLabels: Record<FilterType, string> = {
  all: "Todos os Leads",
  today: "Leads de Hoje",
  week: "Leads da Semana",
  month: "Leads do Mês",
  with_simulation: "Leads com Simulação",
  without_simulation: "Leads sem Simulação",
  with_opportunity: "Leads com Oportunidade",
  without_opportunity: "Leads sem Oportunidade",
  without_whatsapp: "Leads sem WhatsApp",
  without_email: "Leads sem Email",
  without_location: "Leads sem Localização",
  investidor: "Leads Investidores",
  emissor: "Leads Emissores",
  by_origin: "Leads por Origem",
};

export function LeadListModal({ 
  open, 
  onOpenChange, 
  filter, 
  origin,
  title,
  description 
}: LeadListModalProps) {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = trpc.leads.listFiltered.useQuery(
    { filter, origin, page, limit },
    { enabled: open }
  );

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (data?.hasMore) setPage(page + 1);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-destructive">
              <p>Erro ao carregar leads: {error.message}</p>
            </div>
          )}

          {data && data.leads.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhum lead encontrado para este filtro.</p>
            </div>
          )}

          {data && data.leads.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  
                  <TableHead>Origem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {lead.nomeCompleto?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{lead.nomeCompleto || "Sem nome"}</p>
                          {(lead.cidade || lead.estado) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[lead.cidade, lead.estado].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.email && (
                          <a 
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                          >
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </a>
                        )}
                        {lead.whatsapp && (
                          <a 
                            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-green-600"
                          >
                            <Phone className="h-3 w-3" />
                            {lead.whatsapp}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.canalOrigem || "desconhecido"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={`/captador/oportunidades?leadId=${lead.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginação */}
        {data && data.leads.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Página {page} • {data.leads.length} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!data.hasMore}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LeadListModal;
