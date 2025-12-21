import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowLeft, CheckCircle2, Info, TrendingUp, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import FluxoCaixaChart from "@/components/charts/FluxoCaixaChart";
import EbitdaChart from "@/components/charts/EbitdaChart";
import ClientesChart from "@/components/charts/ClientesChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ViabilidadeDetalhes() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: analysis, isLoading, error } = trpc.viability.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id && !!user }
  );
  
  const generatePDF = trpc.viability.generatePDF.useMutation({
    onSuccess: (data) => {
      window.open(data.pdfUrl, '_blank');
    },
    onError: (error) => {
      alert(`Erro ao gerar PDF: ${error.message}`);
    },
  });

  // Redirecionar se não for captador
  useEffect(() => {
    if (user && user.perfil !== 'captador') {
      setLocation('/selecionar-perfil');
    }
  }, [user, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error?.message || "Análise não encontrada"}
            </p>
            <Button onClick={() => setLocation('/captador/viabilidade')}>
              Voltar para Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { indicadores, fluxoCaixa, insights } = analysis;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'error': return 'border-l-red-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/captador/viabilidade')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{analysis.nome}</h1>
              <p className="text-muted-foreground">
                Criado em {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Editar</Button>
            <Button variant="outline">Duplicar</Button>
            <Button 
              onClick={() => generatePDF.mutate({ id: parseInt(id!) })}
              disabled={generatePDF.isPending}
            >
              {generatePDF.isPending ? 'Gerando PDF...' : 'Exportar PDF'}
            </Button>
            <Button
              variant="default"
              onClick={() => setLocation(`/new?modo=captador&fromViabilityId=${id}`)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Criar simulação de captação
            </Button>
          </div>
        </div>

        {/* Patch 5: Banner de Origem */}
        {analysis.originSimulationId && (
          <Alert className="mb-6 border-blue-500 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">Criada a partir de Simulação</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Esta análise foi criada a partir da Simulação #{analysis.originSimulationId}</span>
              <Button 
                variant="link" 
                size="sm"
                className="text-blue-500 hover:text-blue-600"
                onClick={() => setLocation(`/simulation/${analysis.originSimulationId}`)}
              >
                Ver simulação original →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Badge */}
        <div className="mb-6">
          {indicadores.viavel ? (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Projeto Viável</AlertTitle>
              <AlertDescription>
                Este projeto atende aos critérios de viabilidade financeira.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-500 bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-500">Projeto Inviável</AlertTitle>
              <AlertDescription>
                Este projeto não atende aos critérios de viabilidade. Revise as premissas.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Indicadores Principais */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Payback</CardDescription>
              <CardTitle className="text-2xl">{indicadores.payback} meses</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Margem EBITDA</CardDescription>
              <CardTitle className="text-2xl">{indicadores.margemEbitdaMedia}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ponto de Equilíbrio</CardDescription>
              <CardTitle className="text-2xl">Mês {indicadores.pontoEquilibrioOperacional}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo Final</CardDescription>
              <CardTitle className={`text-2xl ${indicadores.saldoFinal > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(indicadores.saldoFinal)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Insights Financeiros */}
        {insights && insights.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Insights Financeiros
              </CardTitle>
              <CardDescription>
                Análise inteligente dos indicadores e recomendações de otimização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight: any, index: number) => (
                <div
                  key={index}
                  className={`border-l-4 ${getInsightBorderColor(insight.type)} bg-card p-4 rounded-r-lg`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
                      
                      {insight.recommendation && (
                        <div className="bg-muted/50 p-3 rounded mt-2">
                          <p className="text-sm font-medium">💡 Recomendação:</p>
                          <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                        </div>
                      )}
                      
                      {insight.offenders && insight.offenders.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">🎯 Principais custos:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {insight.offenders.map((offender: any, i: number) => (
                              <li key={i}>
                                • {offender.name}: {offender.impact}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {insight.sensitivity && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded mt-2">
                          <p className="text-sm font-medium text-blue-400">📊 Análise de Sensibilidade:</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.sensitivity.variable}: {insight.sensitivity.currentValue} → {insight.sensitivity.suggestedValue}
                          </p>
                          <p className="text-sm text-blue-400 mt-1">
                            Impacto: {insight.sensitivity.impact}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Patch 6.2: Visualização de Receitas e Custos Fixos */}
        {analysis.receitas && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Receitas Mensais</CardTitle>
              <CardDescription>Projeção de receitas para os próximos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Receita</th>
                      <th className="text-right py-2 px-4">Preço Unit.</th>
                      <th className="text-right py-2 px-4">Qtd/Mês</th>
                      <th className="text-right py-2 px-4">Crescimento</th>
                      <th className="text-right py-2 px-4">Custo Var.</th>
                      <th className="text-right py-2 px-4">Mês 1</th>
                      <th className="text-right py-2 px-4">Mês 6</th>
                      <th className="text-right py-2 px-4">Mês 12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {JSON.parse(analysis.receitas).map((r: any, idx: number) => {
                      const mes1 = r.precoUnitario * r.quantidadeMensal;
                      const mes6 = r.precoUnitario * r.quantidadeMensal * Math.pow(1 + (r.crescimentoMensalPct || 0) / 100, 5);
                      const mes12 = r.precoUnitario * r.quantidadeMensal * Math.pow(1 + (r.crescimentoMensalPct || 0) / 100, 11);
                      
                      return (
                        <tr key={idx} className="border-b">
                          <td className="py-2 px-4 font-medium">{r.nome}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(r.precoUnitario)}</td>
                          <td className="text-right py-2 px-4">{r.quantidadeMensal}</td>
                          <td className="text-right py-2 px-4">{r.crescimentoMensalPct ? `${r.crescimentoMensalPct}%` : '-'}</td>
                          <td className="text-right py-2 px-4">{r.custoVariavelPct ? `${r.custoVariavelPct}%` : '-'}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(mes1)}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(mes6)}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(mes12)}</td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold">
                      <td colSpan={5} className="py-2 px-4">Total</td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(
                          JSON.parse(analysis.receitas).reduce((sum: number, r: any) => 
                            sum + r.precoUnitario * r.quantidadeMensal, 0
                          )
                        )}
                      </td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(
                          JSON.parse(analysis.receitas).reduce((sum: number, r: any) => 
                            sum + r.precoUnitario * r.quantidadeMensal * Math.pow(1 + (r.crescimentoMensalPct || 0) / 100, 5), 0
                          )
                        )}
                      </td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(
                          JSON.parse(analysis.receitas).reduce((sum: number, r: any) => 
                            sum + r.precoUnitario * r.quantidadeMensal * Math.pow(1 + (r.crescimentoMensalPct || 0) / 100, 11), 0
                          )
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patch 7: Margem Bruta */}
        {analysis.receitas && fluxoCaixa[0]?.margemBrutaPct !== undefined && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader>
              <CardTitle>📊 Margem Bruta</CardTitle>
              <CardDescription>Receita líquida após custos variáveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mês 1</p>
                  <p className="text-2xl font-bold">
                    {fluxoCaixa[0]?.margemBrutaPct?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency((fluxoCaixa[0]?.receitaLiquida ?? 0) / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mês 6</p>
                  <p className="text-2xl font-bold">
                    {fluxoCaixa[5]?.margemBrutaPct?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency((fluxoCaixa[5]?.receitaLiquida ?? 0) / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mês 12</p>
                  <p className="text-2xl font-bold">
                    {fluxoCaixa[11]?.margemBrutaPct?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency((fluxoCaixa[11]?.receitaLiquida ?? 0) / 100)}
                  </p>
                </div>
              </div>
              {analysis.custoVariavelGlobalPct && (
                <p className="text-sm text-muted-foreground mt-4">
                  Custo variável global: {parseFloat(analysis.custoVariavelGlobalPct).toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {analysis.custosFixos && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Custos Fixos Mensais</CardTitle>
              <CardDescription>Projeção de custos fixos para os próximos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Custo</th>
                      <th className="text-right py-2 px-4">Valor Mensal</th>
                      <th className="text-right py-2 px-4">Reajuste Anual</th>
                      <th className="text-right py-2 px-4">Mês 1</th>
                      <th className="text-right py-2 px-4">Mês 6</th>
                      <th className="text-right py-2 px-4">Mês 12</th>
                      <th className="text-right py-2 px-4">Mês 24</th>
                    </tr>
                  </thead>
                  <tbody>
                    {JSON.parse(analysis.custosFixos).map((c: any, idx: number) => {
                      const mes1 = c.valorMensal;
                      const mes6 = c.valorMensal; // Ainda no primeiro ano
                      const mes12 = c.valorMensal; // Ainda no primeiro ano
                      const mes24 = c.valorMensal * Math.pow(1 + (c.reajusteAnualPct || 0) / 100, 1); // Primeiro reajuste
                      
                      return (
                        <tr key={idx} className="border-b">
                          <td className="py-2 px-4 font-medium">{c.nome}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(c.valorMensal)}</td>
                          <td className="text-right py-2 px-4">{c.reajusteAnualPct ? `${c.reajusteAnualPct}%` : '-'}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(mes1)}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(mes6)}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(mes12)}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(mes24)}</td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold">
                      <td colSpan={3} className="py-2 px-4">Total</td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(
                          JSON.parse(analysis.custosFixos).reduce((sum: number, c: any) => sum + c.valorMensal, 0)
                        )}
                      </td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(
                          JSON.parse(analysis.custosFixos).reduce((sum: number, c: any) => sum + c.valorMensal, 0)
                        )}
                      </td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(
                          JSON.parse(analysis.custosFixos).reduce((sum: number, c: any) => sum + c.valorMensal, 0)
                        )}
                      </td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(
                          JSON.parse(analysis.custosFixos).reduce((sum: number, c: any) => 
                            sum + c.valorMensal * Math.pow(1 + (c.reajusteAnualPct || 0) / 100, 1), 0
                          )
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa (60 meses)</CardTitle>
              <CardDescription>Evolução do saldo acumulado, receitas e despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <FluxoCaixaChart data={fluxoCaixa} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>EBITDA Mensal</CardTitle>
              <CardDescription>Resultado operacional antes de juros, impostos e amortização</CardDescription>
            </CardHeader>
            <CardContent>
              <EbitdaChart data={fluxoCaixa} />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Evolução de Clientes</CardTitle>
              <CardDescription>Crescimento da base de clientes até estabilização</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientesChart 
                data={fluxoCaixa.map((m: any) => ({ mes: m.mes, clientes: m.clientes }))} 
                capacidadeMaxima={analysis.capacidadeMaxima}
                pontoEquilibrio={Math.ceil((analysis.opexAluguel + analysis.opexPessoal + analysis.opexRoyalties + analysis.opexMarketing + analysis.opexUtilidades + analysis.opexManutencao + analysis.opexSeguros + analysis.opexOutros) / analysis.ticketMedio * 100)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Detalhes Técnicos */}
        <Card>
          <CardHeader>
            <CardTitle>Premissas da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Captação</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Valor Total:</dt>
                    <dd className="font-medium">{formatCurrency(analysis.valorCaptacao)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Co-investimento:</dt>
                    <dd className="font-medium">{(analysis.coInvestimento / 100).toFixed(1)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Taxa de Juros:</dt>
                    <dd className="font-medium">{(analysis.taxaJurosMensal / 100).toFixed(2)}% a.m.</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Prazo:</dt>
                    <dd className="font-medium">{analysis.prazoMeses} meses</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Modelo:</dt>
                    <dd className="font-medium">{analysis.modeloPagamento}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-3">CAPEX</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Obras:</dt>
                    <dd className="font-medium">{formatCurrency(analysis.capexObras)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Equipamentos:</dt>
                    <dd className="font-medium">{formatCurrency(analysis.capexEquipamentos)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Licenças:</dt>
                    <dd className="font-medium">{formatCurrency(analysis.capexLicencas)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Marketing:</dt>
                    <dd className="font-medium">{formatCurrency(analysis.capexMarketing)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <dt className="font-semibold">Total CAPEX:</dt>
                    <dd className="font-bold">{formatCurrency(indicadores.capexTotal)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Receitas</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ticket Médio:</dt>
                    <dd className="font-medium">{formatCurrency(analysis.ticketMedio)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Capacidade:</dt>
                    <dd className="font-medium">{analysis.capacidadeMaxima} clientes</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Clientes Início:</dt>
                    <dd className="font-medium">{analysis.clientesInicio}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Crescimento:</dt>
                    <dd className="font-medium">{(analysis.taxaCrescimento / 100).toFixed(1)}% a.m.</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Steady State:</dt>
                    <dd className="font-medium">{analysis.clientesSteadyState} clientes</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
