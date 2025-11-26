import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, DollarSign, Clock, Shield } from "lucide-react";

interface OfferSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectOffer: (offer: {
    id: number;
    nome: string;
    taxaAnual: number;
    prazoMeses: number;
    valorMinimo: number | null;
    tipoAtivo: string | null;
    dataEncerramento: Date | null;
  }) => void;
}

export function OfferSelectionModal({ open, onClose, onSelectOffer }: OfferSelectionModalProps) {
  // Usar API real da Tokeniza (forceRefresh = false para usar cache do banco)
  const { data: offers, isLoading, error } = trpc.offers.listActiveFromTokeniza.useQuery(
    { forceRefresh: false },
    {
      enabled: open, // Só busca quando o modal está aberto
    }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Não definido';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getDaysUntilClose = (date: Date | null) => {
    if (!date) return null;
    const today = new Date();
    const closeDate = new Date(date);
    const diffTime = closeDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecione uma Oferta Tokeniza</DialogTitle>
          <DialogDescription>
            Escolha a oferta que você deseja simular. Os dados serão preenchidos automaticamente no formulário.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
            <span className="ml-2 text-muted-foreground">Carregando ofertas...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">
              Erro ao carregar ofertas: {error.message}
            </p>
          </div>
        )}

        {offers && offers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma oferta ativa disponível no momento.</p>
          </div>
        )}

        {offers && offers.length > 0 && (
          <div className="space-y-4">
            {offers.map((offer) => {
              const daysUntilClose = getDaysUntilClose(offer.dataEncerramento);
              const isUrgent = daysUntilClose !== null && daysUntilClose <= 7;

              return (
                <div
                  key={offer.id}
                  className="p-4 border rounded-lg hover:border-lime-500 transition-all cursor-pointer"
                  onClick={() => {
                    onSelectOffer(offer);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{offer.nome}</h3>
                      {offer.tipoAtivo && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Shield className="h-3 w-3" />
                          {offer.tipoAtivo}
                        </div>
                      )}
                    </div>
                    {isUrgent && (
                      <Badge variant="destructive" className="ml-2">
                        🔥 Encerra em {daysUntilClose} dias
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Taxa Anual
                      </div>
                      <p className="font-semibold text-lime-600">
                        {(offer.taxaAnual / 100).toFixed(2)}% a.a.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        Prazo
                      </div>
                      <p className="font-semibold">{offer.prazoMeses} meses</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Investimento Mínimo
                      </div>
                      <p className="font-semibold">
                        {offer.valorMinimo ? formatCurrency(offer.valorMinimo) : 'Não definido'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Encerramento
                      </div>
                      <p className="font-semibold text-sm">{formatDate(offer.dataEncerramento)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOffer(offer);
                        onClose();
                      }}
                    >
                      Selecionar esta oferta
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
