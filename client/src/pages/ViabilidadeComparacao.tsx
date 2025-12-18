import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ViabilidadeComparacao() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: analyses, isLoading } = trpc.viability.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Redirecionar se não for captador
  useEffect(() => {
    if (user && user.perfil !== 'captador') {
      setLocation('/selecionar-perfil');
    }
  }, [user, setLocation]);

  // Buscar detalhes das análises selecionadas
  const analysis1 = trpc.viability.getById.useQuery(
    { id: selectedIds[0] },
    { enabled: selectedIds.length >= 1 }
  );
  const analysis2 = trpc.viability.getById.useQuery(
    { id: selectedIds[1] },
    { enabled: selectedIds.length >= 2 }
  );
  const analysis3 = trpc.viability.getById.useQuery(
    { id: selectedIds[2] },
    { enabled: selectedIds.length >= 3 }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  const handleSelectAnalysis = (index: number, value: string) => {
    const newIds = [...selectedIds];
    newIds[index] = parseInt(value);
    setSelectedIds(newIds);
  };

  const selectedAnalyses = [analysis1.data, analysis2.data, analysis3.data].filter(Boolean);

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
              <h1 className="text-3xl font-bold">Comparação de Cenários</h1>
              <p className="text-muted-foreground">
                Compare até 3 análises de viabilidade lado a lado
              </p>
            </div>
          </div>
        </div>

        {/* Seletores de Análises */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Selecione as Análises</CardTitle>
            <CardDescription>Escolha até 3 análises para comparar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cenário 1</label>
                <Select onValueChange={(value) => handleSelectAnalysis(0, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma análise" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyses?.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cenário 2</label>
                <Select onValueChange={(value) => handleSelectAnalysis(1, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma análise" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyses?.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cenário 3 (Opcional)</label>
                <Select onValueChange={(value) => handleSelectAnalysis(2, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma análise" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyses?.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Comparação */}
        {selectedAnalyses.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Indicadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Indicador</th>
                      {selectedAnalyses.map((analysis, index) => (
                        <th key={index} className="text-left p-3 font-semibold">
                          {analysis?.nome}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Status */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">Status</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis?.indicadores.viavel ? (
                            <span className="inline-flex items-center gap-1 text-green-500">
                              <CheckCircle2 className="h-4 w-4" />
                              Viável
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <XCircle className="h-4 w-4" />
                              Inviável
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Payback */}
                    <tr className="border-b bg-muted/30">
                      <td className="p-3 font-medium">Payback</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis?.indicadores.payback} meses
                        </td>
                      ))}
                    </tr>

                    {/* Margem EBITDA */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">Margem EBITDA</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis?.indicadores.margemEbitdaMedia}%
                        </td>
                      ))}
                    </tr>

                    {/* Ponto de Equilíbrio */}
                    <tr className="border-b bg-muted/30">
                      <td className="p-3 font-medium">Ponto de Equilíbrio</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          Mês {analysis?.indicadores.pontoEquilibrioOperacional}
                        </td>
                      ))}
                    </tr>

                    {/* Saldo Final */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">Saldo Final</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          <span className={analysis?.indicadores.saldoFinal && analysis.indicadores.saldoFinal > 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                            {analysis?.indicadores.saldoFinal && formatCurrency(analysis.indicadores.saldoFinal)}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Valor da Captação */}
                    <tr className="border-b bg-muted/30">
                      <td className="p-3 font-medium">Valor da Captação</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis && formatCurrency(analysis.valorCaptacao)}
                        </td>
                      ))}
                    </tr>

                    {/* Co-investimento */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">Co-investimento</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis && (analysis.coInvestimento / 100).toFixed(1)}%
                        </td>
                      ))}
                    </tr>

                    {/* Taxa de Juros */}
                    <tr className="border-b bg-muted/30">
                      <td className="p-3 font-medium">Taxa de Juros</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis && (analysis.taxaJurosMensal / 100).toFixed(2)}% a.m.
                        </td>
                      ))}
                    </tr>

                    {/* Prazo */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">Prazo</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis?.prazoMeses} meses
                        </td>
                      ))}
                    </tr>

                    {/* Modelo de Pagamento */}
                    <tr className="border-b bg-muted/30">
                      <td className="p-3 font-medium">Modelo de Pagamento</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis?.modeloPagamento}
                        </td>
                      ))}
                    </tr>

                    {/* CAPEX Total */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">CAPEX Total</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis?.indicadores.capexTotal && formatCurrency(analysis.indicadores.capexTotal)}
                        </td>
                      ))}
                    </tr>

                    {/* Ticket Médio */}
                    <tr className="border-b bg-muted/30">
                      <td className="p-3 font-medium">Ticket Médio</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis && formatCurrency(analysis.ticketMedio)}
                        </td>
                      ))}
                    </tr>

                    {/* Clientes Steady State */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">Clientes Steady State</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis?.clientesSteadyState} clientes
                        </td>
                      ))}
                    </tr>

                    {/* Taxa de Crescimento */}
                    <tr className="border-b bg-muted/30">
                      <td className="p-3 font-medium">Taxa de Crescimento</td>
                      {selectedAnalyses.map((analysis, index) => (
                        <td key={index} className="p-3">
                          {analysis && (analysis.taxaCrescimento / 100).toFixed(1)}% a.m.
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há análises selecionadas */}
        {selectedAnalyses.length < 2 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Selecione pelo menos 2 análises para começar a comparação
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
