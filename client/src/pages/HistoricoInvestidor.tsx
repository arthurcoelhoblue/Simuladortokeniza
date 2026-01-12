import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  History, 
  Calculator,
  Calendar, 
  DollarSign, 
  Search,
  Eye,
  TrendingUp,
  Clock,
  FileText,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function HistoricoInvestidor() {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile } = useProfile();
  const [, setLocation] = useLocation();
  const [filtro, setFiltro] = useState("");

  // Buscar simulações do usuário
  const { data: simulations, isLoading } = trpc.simulations.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Redirecionar se não for investidor
  useEffect(() => {
    if (!authLoading && activeProfile !== "investidor") {
      setLocation("/selecionar-perfil");
    }
  }, [authLoading, activeProfile, setLocation]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPercent = (basisPoints: number) => {
    return `${(basisPoints / 100).toFixed(2)}%`;
  };

  // Filtrar apenas simulações de investimento
  const simulacoesInvestimento = (simulations || []).filter(
    (s: any) => s.tipoSimulacao === "investimento"
  );

  // Aplicar filtro de busca
  const simulacoesFiltradas = simulacoesInvestimento.filter((s: any) => {
    if (!filtro) return true;
    const searchLower = filtro.toLowerCase();
    return (
      s.descricaoOferta?.toLowerCase().includes(searchLower) ||
      s.modalidade?.toLowerCase().includes(searchLower) ||
      String(s.id).includes(searchLower)
    );
  });

  // Calcular totais
  const totalSimulacoes = simulacoesInvestimento.length;
  const totalValorSimulado = simulacoesInvestimento.reduce(
    (acc: number, s: any) => acc + (s.valorAporte || 0),
    0
  );
  const mediaRetorno = simulacoesInvestimento.length > 0
    ? simulacoesInvestimento.reduce((acc: number, s: any) => acc + (s.taxaJurosAa || 0), 0) / simulacoesInvestimento.length
    : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8 text-purple-500" />
            Histórico de Simulações
          </h1>
          <p className="text-muted-foreground mt-2">
            Veja todas as simulações de investimento que você realizou
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-500" />
                Total de Simulações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{totalSimulacoes}</p>
              <p className="text-sm text-muted-foreground">simulações realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Valor Total Simulado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totalValorSimulado)}
              </p>
              <p className="text-sm text-muted-foreground">em aportes simulados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Retorno Médio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-500">
                {formatPercent(mediaRetorno)} a.a.
              </p>
              <p className="text-sm text-muted-foreground">taxa média simulada</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição, modalidade ou ID..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation("/investidor/simulacoes/nova")}
                className="gap-2"
              >
                <Calculator className="h-4 w-4" />
                Nova Simulação
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Simulações */}
        {simulacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filtro ? "Nenhuma simulação encontrada" : "Você ainda não fez simulações"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filtro
                  ? "Tente ajustar os termos de busca."
                  : "Comece simulando um investimento para ver os possíveis retornos."}
              </p>
              {!filtro && (
                <Button onClick={() => setLocation("/investidor/simulacoes/nova")}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Fazer Primeira Simulação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {simulacoesFiltradas.map((simulation: any) => (
              <Card
                key={simulation.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/investidor/simulacoes/${simulation.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info Principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{simulation.id}
                        </Badge>
                        <Badge className="bg-emerald-600">
                          {simulation.sistemaAmortizacao}
                        </Badge>
                        {simulation.modalidade && (
                          <Badge variant="secondary">
                            {simulation.modalidade}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">
                        {simulation.descricaoOferta || `Simulação de Investimento`}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(simulation.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {simulation.prazoMeses} meses
                        </span>
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Valor do Aporte</p>
                        <p className="text-xl font-bold text-green-500">
                          {formatCurrency(simulation.valorAporte)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Taxa</p>
                          <p className="font-semibold text-purple-500">
                            {formatPercent(simulation.taxaJurosAa)} a.a.
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          Ver
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dica */}
        <Card className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dica</h3>
                <p className="text-sm text-muted-foreground">
                  Clique em qualquer simulação para ver os detalhes completos, incluindo o cronograma
                  de pagamentos e a projeção de retornos. Você também pode exportar o relatório em PDF.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
