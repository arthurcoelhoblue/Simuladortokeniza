import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";

/**
 * Página de detalhes e resultados da análise de viabilidade
 */
export default function ViabilidadeDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: analysis, isLoading } = trpc.viability.getById.useQuery({ 
    id: parseInt(id!) 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Análise não encontrada</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const indicadores = analysis.indicadores;
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation('/captador/viabilidade')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{analysis.nome}</h1>
              <p className="text-xl text-muted-foreground">
                Análise de Viabilidade Financeira
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-lg font-medium ${
              analysis.status === 'viavel' 
                ? 'bg-green-500/10 text-green-600' 
                : analysis.status === 'inviavel'
                ? 'bg-red-500/10 text-red-600'
                : 'bg-yellow-500/10 text-yellow-600'
            }`}>
              {analysis.status === 'viavel' ? '✓ Projeto Viável' : analysis.status === 'inviavel' ? '✗ Projeto Inviável' : '⏳ Em Análise'}
            </div>
          </div>
        </div>

        {/* Indicadores Principais */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>CAPEX Total</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(indicadores.capexTotal)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>OPEX Mensal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(indicadores.opexMensal)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Payback</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{indicadores.payback} meses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Saldo Final (60 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${indicadores.saldoFinal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(indicadores.saldoFinal)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes da Captação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estrutura da Captação</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Investidores</p>
              <p className="text-2xl font-semibold">{formatCurrency(indicadores.valorInvestidores)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Franqueado</p>
              <p className="text-2xl font-semibold">{formatCurrency(indicadores.valorFranqueado)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Success Fee</p>
              <p className="text-2xl font-semibold">{formatCurrency(indicadores.successFee)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores Operacionais */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Indicadores Operacionais</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ponto de Equilíbrio</p>
              <p className="text-2xl font-semibold">Mês {indicadores.pontoEquilibrioOperacional}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Margem EBITDA Média</p>
              <p className="text-2xl font-semibold">{indicadores.margemEbitdaMedia}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Juros Pagos</p>
              <p className="text-2xl font-semibold">{formatCurrency(indicadores.totalJurosPagos)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros da Análise */}
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros da Análise</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Remuneração</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Juros Mensal:</span>
                  <span className="font-medium">{(analysis.taxaJurosMensal / 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className="font-medium">{analysis.prazoMeses} meses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carência:</span>
                  <span className="font-medium">{analysis.carenciaMeses} meses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo:</span>
                  <span className="font-medium">{analysis.modeloPagamento}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Projeção de Receitas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Médio:</span>
                  <span className="font-medium">{formatCurrency(analysis.ticketMedio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacidade Máxima:</span>
                  <span className="font-medium">{analysis.capacidadeMaxima} clientes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clientes Início:</span>
                  <span className="font-medium">{analysis.clientesInicio} clientes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clientes Steady State:</span>
                  <span className="font-medium">{analysis.clientesSteadyState} clientes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
