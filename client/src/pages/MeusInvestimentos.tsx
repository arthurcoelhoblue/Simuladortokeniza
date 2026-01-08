import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  PieChart
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Dados mockados para demonstração
const investimentosMock = [
  {
    id: 1,
    nomeOferta: "Loteamento Solar Valley",
    tipoAtivo: "Loteamento",
    valorInvestido: 5000000, // em centavos
    valorAtual: 5350000,
    rendimentoPercentual: 7.0,
    dataInvestimento: "2024-06-15",
    dataVencimento: "2026-06-15",
    status: "ativo",
    proximoPagamento: "2025-02-15",
    pagamentosRecebidos: 8,
    totalPagamentos: 24,
  },
  {
    id: 2,
    nomeOferta: "Edifício Comercial Centro",
    tipoAtivo: "Imóvel Comercial",
    valorInvestido: 10000000,
    valorAtual: 10800000,
    rendimentoPercentual: 8.0,
    dataInvestimento: "2024-03-01",
    dataVencimento: "2027-03-01",
    status: "ativo",
    proximoPagamento: "2025-02-01",
    pagamentosRecebidos: 11,
    totalPagamentos: 36,
  },
  {
    id: 3,
    nomeOferta: "Usina Solar Nordeste",
    tipoAtivo: "Energia",
    valorInvestido: 2500000,
    valorAtual: 2750000,
    rendimentoPercentual: 10.0,
    dataInvestimento: "2024-09-01",
    dataVencimento: "2025-09-01",
    status: "ativo",
    proximoPagamento: "2025-02-01",
    pagamentosRecebidos: 5,
    totalPagamentos: 12,
  },
  {
    id: 4,
    nomeOferta: "Galpão Logístico SP",
    tipoAtivo: "Logística",
    valorInvestido: 7500000,
    valorAtual: 8250000,
    rendimentoPercentual: 10.0,
    dataInvestimento: "2023-06-01",
    dataVencimento: "2024-12-01",
    status: "finalizado",
    proximoPagamento: null,
    pagamentosRecebidos: 18,
    totalPagamentos: 18,
  },
];

export default function MeusInvestimentos() {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile } = useProfile();
  const [, setLocation] = useLocation();

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00Z").toLocaleDateString("pt-BR");
  };

  // Calcular totais
  const totalInvestido = investimentosMock.reduce((acc, inv) => acc + inv.valorInvestido, 0);
  const totalAtual = investimentosMock.reduce((acc, inv) => acc + inv.valorAtual, 0);
  const rendimentoTotal = totalAtual - totalInvestido;
  const rendimentoPercentual = ((rendimentoTotal / totalInvestido) * 100).toFixed(2);
  const investimentosAtivos = investimentosMock.filter(inv => inv.status === "ativo").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-600">Ativo</Badge>;
      case "finalizado":
        return <Badge variant="secondary">Finalizado</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-600">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="h-8 w-8 text-green-500" />
            Meus Investimentos
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe todos os seus investimentos tokenizados em um só lugar
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Investido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalInvestido)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Valor Atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(totalAtual)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Rendimento Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                +{formatCurrency(rendimentoTotal)}
              </p>
              <p className="text-sm text-muted-foreground">+{rendimentoPercentual}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Investimentos Ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{investimentosAtivos}</p>
              <p className="text-sm text-muted-foreground">de {investimentosMock.length} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Investimentos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detalhes dos Investimentos</h2>
          
          {investimentosMock.map((investimento) => (
            <Card key={investimento.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{investimento.nomeOferta}</h3>
                      {getStatusBadge(investimento.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Badge variant="outline">{investimento.tipoAtivo}</Badge>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Investido em {formatDate(investimento.dataInvestimento)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Vencimento: {formatDate(investimento.dataVencimento)}
                      </span>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-muted-foreground">Valor Investido</p>
                      <p className="font-semibold">{formatCurrency(investimento.valorInvestido)}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-muted-foreground">Valor Atual</p>
                      <p className="font-semibold text-green-500">{formatCurrency(investimento.valorAtual)}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-muted-foreground">Rendimento</p>
                      <p className="font-semibold text-green-500">+{investimento.rendimentoPercentual}%</p>
                    </div>
                  </div>
                </div>

                {/* Progresso de Pagamentos */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Pagamentos recebidos: {investimento.pagamentosRecebidos} de {investimento.totalPagamentos}
                    </span>
                    {investimento.proximoPagamento && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Próximo: {formatDate(investimento.proximoPagamento)}
                      </span>
                    )}
                    {investimento.status === "finalizado" && (
                      <span className="text-sm text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Concluído
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={(investimento.pagamentosRecebidos / investimento.totalPagamentos) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="mt-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Quer diversificar seu portfólio?</h3>
            <p className="text-muted-foreground mb-4">
              Explore novas oportunidades de investimento tokenizado
            </p>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setLocation("/investidor/ofertas")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Ver Oportunidades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
