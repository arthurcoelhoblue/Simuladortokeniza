import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Target } from "lucide-react";

export default function Opportunities() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [tipoFilter, setTipoFilter] = useState<string | undefined>(undefined);

  const { data: opportunities, isLoading, error, refetch } = trpc.opportunities.list.useQuery({
    status: statusFilter,
  });

  const updateOpportunity = trpc.opportunities.update.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Filtrar por tipo no frontend (se backend não suportar)
  const filteredOpportunities = opportunities?.filter((opp) => {
    if (!tipoFilter) return true;
    return opp.tipoOportunidade === tipoFilter;
  });

  const formatCurrency = (cents: number | null) => {
    if (cents === null || cents === undefined) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("pt-BR");
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-red-500 text-white hover:bg-red-600"; // Prioritário
    if (score >= 50) return "bg-yellow-500 text-black hover:bg-yellow-600"; // Quente
    if (score >= 25) return "bg-gray-400 text-white hover:bg-gray-500"; // Morno
    return "bg-gray-300 text-gray-700 hover:bg-gray-400"; // Frio
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      novo: "bg-blue-500 text-white",
      em_analise: "bg-purple-500 text-white",
      aguardando_cliente: "bg-orange-500 text-white",
      em_oferta: "bg-green-500 text-white",
      ganho: "bg-emerald-600 text-white",
      perdido: "bg-red-600 text-white",
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      novo: "Novo",
      em_analise: "Em Análise",
      aguardando_cliente: "Aguardando Cliente",
      em_oferta: "Em Oferta",
      ganho: "Ganho",
      perdido: "Perdido",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Oportunidades</h1>
          </div>
          <p className="text-muted-foreground">
            Funil operacional de investidores e emissores
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine a visualização das oportunidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de Status */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={statusFilter || "todos"}
                  onValueChange={(value) =>
                    setStatusFilter(value === "todos" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                    <SelectItem value="em_oferta">Em Oferta</SelectItem>
                    <SelectItem value="ganho">Ganho</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Tipo */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Oportunidade</label>
                <Select
                  value={tipoFilter || "todos"}
                  onValueChange={(value) =>
                    setTipoFilter(value === "todos" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="investidor">Investidor</SelectItem>
                    <SelectItem value="emissor">Emissor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão de limpar filtros */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter(undefined);
                    setTipoFilter(undefined);
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredOpportunities?.length || 0} oportunidade(s) encontrada(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando oportunidades...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-500">
                Erro ao carregar oportunidades: {error.message}
              </div>
            )}

            {!isLoading && !error && filteredOpportunities && filteredOpportunities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma oportunidade encontrada com os filtros aplicados.
              </div>
            )}

            {!isLoading && !error && filteredOpportunities && filteredOpportunities.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Simulação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score Tokeniza</TableHead>
                      <TableHead>Probabilidade</TableHead>
                      <TableHead>Próxima Ação</TableHead>
                      <TableHead>Data Próxima Ação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opp) => (
                      <TableRow key={opp.id}>
                        {/* Lead */}
                        <TableCell>
                          <div>
                            <div className="font-medium">{opp.lead?.nome || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">
                              {opp.lead?.whatsapp || opp.lead?.email || "Sem contato"}
                            </div>
                          </div>
                        </TableCell>

                        {/* Tipo */}
                        <TableCell>
                          <Badge variant="outline">
                            {opp.tipoOportunidade === "investidor" ? "Investidor" : "Emissor"}
                          </Badge>
                        </TableCell>

                        {/* Simulação */}
                        <TableCell>
                          <div>
                            <div className="text-sm">
                              {opp.simulation?.tipoSimulacao === "investimento"
                                ? "Investimento"
                                : "Financiamento"}
                            </div>
                            <div className="text-sm font-medium">
                              {formatCurrency(
                                opp.simulation?.valorAporte || opp.simulation?.valorDesejado || 0
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status - Edição Inline */}
                        <TableCell>
                          <Select
                            value={opp.status}
                            onValueChange={(newStatus) => {
                              updateOpportunity.mutate({
                                id: opp.id,
                                status: newStatus as any,
                              });
                            }}
                            disabled={updateOpportunity.isPending}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue>
                                <Badge className={getStatusBadgeColor(opp.status)}>
                                  {getStatusLabel(opp.status)}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="novo">Novo</SelectItem>
                              <SelectItem value="em_analise">Em Análise</SelectItem>
                              <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                              <SelectItem value="em_oferta">Em Oferta</SelectItem>
                              <SelectItem value="ganho">Ganho</SelectItem>
                              <SelectItem value="perdido">Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Score Tokeniza */}
                        <TableCell>
                          <Badge className={getScoreBadgeColor(opp.tokenizaScore)}>
                            {opp.tokenizaScore}
                          </Badge>
                        </TableCell>

                        {/* Probabilidade - Edição Inline */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={opp.probabilidade}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                if (newValue >= 0 && newValue <= 100) {
                                  updateOpportunity.mutate({
                                    id: opp.id,
                                    probabilidade: newValue,
                                  });
                                }
                              }}
                              className="w-20"
                              disabled={updateOpportunity.isPending}
                            />
                            <span>%</span>
                          </div>
                        </TableCell>

                        {/* Próxima Ação - Edição Inline */}
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="Próxima ação..."
                            value={opp.nextAction || ""}
                            onChange={(e) => {
                              updateOpportunity.mutate({
                                id: opp.id,
                                nextAction: e.target.value || null,
                              });
                            }}
                            className="w-[200px]"
                            disabled={updateOpportunity.isPending}
                          />
                        </TableCell>

                        {/* Data Próxima Ação */}
                        <TableCell>{formatDate(opp.nextActionAt)}</TableCell>

                        {/* Ações */}
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {/* Ver Simulação */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/simulation/${opp.simulationId}`, "_blank")}
                            >
                              Ver Simulação
                            </Button>

                            {/* Abrir no Pipedrive */}
                            {opp.pipedriveDealId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `https://tokeniza.pipedrive.com/deal/${opp.pipedriveDealId}`,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Pipedrive
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
