import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  DollarSign, 
  Building2,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

// Tipos de transação
type TipoTransacao = "investimento" | "rendimento" | "resgate" | "cancelamento";
type StatusTransacao = "concluido" | "pendente" | "cancelado";

interface Transacao {
  id: number;
  tipo: TipoTransacao;
  nomeOferta: string;
  tipoAtivo: string;
  valor: number; // em centavos
  data: string;
  status: StatusTransacao;
  descricao: string;
}

// Dados mockados para demonstração
const transacoesMock: Transacao[] = [
  {
    id: 1,
    tipo: "rendimento",
    nomeOferta: "Loteamento Solar Valley",
    tipoAtivo: "Loteamento",
    valor: 29167, // R$ 291,67
    data: "2025-01-15",
    status: "concluido",
    descricao: "Pagamento mensal de rendimentos (8/24)",
  },
  {
    id: 2,
    tipo: "rendimento",
    nomeOferta: "Edifício Comercial Centro",
    tipoAtivo: "Imóvel Comercial",
    valor: 66667, // R$ 666,67
    data: "2025-01-01",
    status: "concluido",
    descricao: "Pagamento mensal de rendimentos (11/36)",
  },
  {
    id: 3,
    tipo: "investimento",
    nomeOferta: "Usina Solar Nordeste",
    tipoAtivo: "Energia",
    valor: 2500000, // R$ 25.000
    data: "2024-09-01",
    status: "concluido",
    descricao: "Aporte inicial no projeto",
  },
  {
    id: 4,
    tipo: "rendimento",
    nomeOferta: "Usina Solar Nordeste",
    tipoAtivo: "Energia",
    valor: 20833, // R$ 208,33
    data: "2025-01-01",
    status: "concluido",
    descricao: "Pagamento mensal de rendimentos (5/12)",
  },
  {
    id: 5,
    tipo: "resgate",
    nomeOferta: "Galpão Logístico SP",
    tipoAtivo: "Logística",
    valor: 8250000, // R$ 82.500
    data: "2024-12-01",
    status: "concluido",
    descricao: "Resgate total + rendimentos acumulados",
  },
  {
    id: 6,
    tipo: "investimento",
    nomeOferta: "Loteamento Solar Valley",
    tipoAtivo: "Loteamento",
    valor: 5000000, // R$ 50.000
    data: "2024-06-15",
    status: "concluido",
    descricao: "Aporte inicial no projeto",
  },
  {
    id: 7,
    tipo: "investimento",
    nomeOferta: "Edifício Comercial Centro",
    tipoAtivo: "Imóvel Comercial",
    valor: 10000000, // R$ 100.000
    data: "2024-03-01",
    status: "concluido",
    descricao: "Aporte inicial no projeto",
  },
  {
    id: 8,
    tipo: "rendimento",
    nomeOferta: "Loteamento Solar Valley",
    tipoAtivo: "Loteamento",
    valor: 29167,
    data: "2024-12-15",
    status: "concluido",
    descricao: "Pagamento mensal de rendimentos (7/24)",
  },
  {
    id: 9,
    tipo: "rendimento",
    nomeOferta: "Edifício Comercial Centro",
    tipoAtivo: "Imóvel Comercial",
    valor: 66667,
    data: "2024-12-01",
    status: "concluido",
    descricao: "Pagamento mensal de rendimentos (10/36)",
  },
  {
    id: 10,
    tipo: "cancelamento",
    nomeOferta: "Projeto Cancelado XYZ",
    tipoAtivo: "Outros",
    valor: 1500000, // R$ 15.000 devolvido
    data: "2024-02-15",
    status: "concluido",
    descricao: "Devolução integral por cancelamento do projeto",
  },
];

export default function HistoricoInvestidor() {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile } = useProfile();
  const [, setLocation] = useLocation();
  const [filtro, setFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoTransacao | "todos">("todos");

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
    return new Date(dateStr + "T00:00:00Z").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Filtrar transações
  const transacoesFiltradas = transacoesMock.filter((t) => {
    const matchTipo = tipoFiltro === "todos" || t.tipo === tipoFiltro;
    const matchTexto = 
      t.nomeOferta.toLowerCase().includes(filtro.toLowerCase()) ||
      t.descricao.toLowerCase().includes(filtro.toLowerCase());
    return matchTipo && matchTexto;
  });

  // Calcular totais
  const totalInvestido = transacoesMock
    .filter(t => t.tipo === "investimento" && t.status === "concluido")
    .reduce((acc, t) => acc + t.valor, 0);
  const totalRendimentos = transacoesMock
    .filter(t => t.tipo === "rendimento" && t.status === "concluido")
    .reduce((acc, t) => acc + t.valor, 0);
  const totalResgates = transacoesMock
    .filter(t => t.tipo === "resgate" && t.status === "concluido")
    .reduce((acc, t) => acc + t.valor, 0);

  const getTransacaoIcon = (tipo: TipoTransacao) => {
    switch (tipo) {
      case "investimento":
        return <ArrowUpRight className="h-5 w-5 text-blue-500" />;
      case "rendimento":
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case "resgate":
        return <ArrowDownLeft className="h-5 w-5 text-purple-500" />;
      case "cancelamento":
        return <XCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getTransacaoBadge = (tipo: TipoTransacao) => {
    switch (tipo) {
      case "investimento":
        return <Badge className="bg-blue-600">Investimento</Badge>;
      case "rendimento":
        return <Badge className="bg-green-600">Rendimento</Badge>;
      case "resgate":
        return <Badge className="bg-purple-600">Resgate</Badge>;
      case "cancelamento":
        return <Badge className="bg-orange-600">Cancelamento</Badge>;
    }
  };

  const getStatusIcon = (status: StatusTransacao) => {
    switch (status) {
      case "concluido":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pendente":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelado":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getValorColor = (tipo: TipoTransacao) => {
    switch (tipo) {
      case "investimento":
        return "text-blue-500";
      case "rendimento":
      case "resgate":
      case "cancelamento":
        return "text-green-500";
    }
  };

  const getValorPrefix = (tipo: TipoTransacao) => {
    return tipo === "investimento" ? "-" : "+";
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
            <History className="h-8 w-8 text-purple-500" />
            Histórico de Transações
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe todas as movimentações dos seus investimentos
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
                Total Investido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalInvestido)}</p>
              <p className="text-sm text-muted-foreground">
                {transacoesMock.filter(t => t.tipo === "investimento").length} aportes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                Total Rendimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(totalRendimentos)}</p>
              <p className="text-sm text-muted-foreground">
                {transacoesMock.filter(t => t.tipo === "rendimento").length} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-purple-500" />
                Total Resgates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-500">{formatCurrency(totalResgates)}</p>
              <p className="text-sm text-muted-foreground">
                {transacoesMock.filter(t => t.tipo === "resgate").length} resgates
              </p>
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
                  placeholder="Buscar por oferta ou descrição..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={tipoFiltro === "todos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoFiltro("todos")}
                >
                  Todos
                </Button>
                <Button
                  variant={tipoFiltro === "investimento" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoFiltro("investimento")}
                  className={tipoFiltro === "investimento" ? "bg-blue-600" : ""}
                >
                  Investimentos
                </Button>
                <Button
                  variant={tipoFiltro === "rendimento" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoFiltro("rendimento")}
                  className={tipoFiltro === "rendimento" ? "bg-green-600" : ""}
                >
                  Rendimentos
                </Button>
                <Button
                  variant={tipoFiltro === "resgate" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoFiltro("resgate")}
                  className={tipoFiltro === "resgate" ? "bg-purple-600" : ""}
                >
                  Resgates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Transações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {transacoesFiltradas.length} transações encontradas
            </h2>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>

          {transacoesFiltradas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            transacoesFiltradas.map((transacao) => (
              <Card key={transacao.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Ícone */}
                    <div className="p-2 rounded-full bg-muted">
                      {getTransacaoIcon(transacao.tipo)}
                    </div>

                    {/* Info Principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{transacao.nomeOferta}</h3>
                        {getTransacaoBadge(transacao.tipo)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {transacao.descricao}
                      </p>
                    </div>

                    {/* Data e Status */}
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(transacao.data)}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        {getStatusIcon(transacao.status)}
                        <span className="text-xs capitalize">{transacao.status}</span>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="text-right">
                      <p className={`font-semibold ${getValorColor(transacao.tipo)}`}>
                        {getValorPrefix(transacao.tipo)}{formatCurrency(transacao.valor)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transacao.tipoAtivo}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
