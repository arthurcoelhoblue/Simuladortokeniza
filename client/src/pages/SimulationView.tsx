import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function SimulationView() {
  const [, params] = useRoute("/simulation/:id");
  const [, setLocation] = useLocation();
  const simulationId = parseInt(params?.id || "0");

  const { data: simulation, isLoading } = trpc.simulations.getById.useQuery({ id: simulationId });
  const { data: cronograma } = trpc.simulations.getCronograma.useQuery({ simulationId });

  const deleteMutation = trpc.simulations.delete.useMutation({
    onSuccess: () => {
      toast.success("Simulação deletada com sucesso!");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar simulação");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Simulação não encontrada</p>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatPercent = (centesimos: number) => {
    return (centesimos / 100).toFixed(2) + "%";
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja deletar esta simulação?")) {
      deleteMutation.mutate({ id: simulationId });
    }
  };

  const handleExportPDF = async () => {
    try {
      // Chama a API diretamente via fetch
      const response = await fetch(`/api/trpc/simulations.exportPDF?input=${encodeURIComponent(JSON.stringify({ simulationId }))}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.result?.data?.html) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(data.result.data.html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    }
  };

  const handleExportCSV = () => {
    if (!cronograma) return;

    const headers = [
      "Mês",
      "Data",
      "Saldo Inicial",
      "Juros",
      "Amortização",
      "Parcela",
      "Custos Fixos",
      "Saldo Final",
      "Observações",
    ];

    const rows = cronograma.map((item) => [
      item.mes,
      item.dataParcela,
      formatCurrency(item.saldoInicial),
      formatCurrency(item.juros),
      formatCurrency(item.amortizacao),
      formatCurrency(item.parcela),
      formatCurrency(item.custosFixos),
      formatCurrency(item.saldoFinal),
      item.observacoes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cronograma-${simulationId}.csv`;
    link.click();

    toast.success("CSV exportado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Simulação #{simulationId}</h1>
            {simulation.descricaoOferta && (
              <p className="text-muted-foreground mt-2">{simulation.descricaoOferta}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar
            </Button>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Investido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(simulation.valorInvestido)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatPercent(simulation.valorInvestido * 10000 / simulation.valorTotalOferta)} da oferta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Juros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(simulation.totalJurosPagos)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Taxa: {formatPercent(simulation.taxaJurosAa)} a.a.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(simulation.totalRecebido)}</p>
              {simulation.tirAnual && (
                <p className="text-sm text-muted-foreground mt-1">TIR: {formatPercent(simulation.tirAnual)} a.a.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes da Simulação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalhes da Simulação</CardTitle>
            <CardDescription>Parâmetros configurados para esta simulação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prazo</p>
                <p className="font-medium">{simulation.prazoMeses} meses</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Encerramento</p>
                <p className="font-medium">{simulation.dataEncerramentoOferta}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Método</p>
                <p className="font-medium">{simulation.amortizacaoMetodo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capitalização</p>
                <p className="font-medium">{simulation.tipoCapitalizacao}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carência Juros</p>
                <p className="font-medium">{simulation.carenciaJurosMeses} meses</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carência Principal</p>
                <p className="font-medium">{simulation.carenciaPrincipalMeses} meses</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Setup</p>
                <p className="font-medium">{formatCurrency(simulation.taxaSetupFixaBrl)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fee Sucesso</p>
                <p className="font-medium">{formatPercent(simulation.feeSucessoPercentSobreCaptacao)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cronograma Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Cronograma Mensal</CardTitle>
            <CardDescription>Detalhamento mês a mês do investimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Mês</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Saldo Inicial</TableHead>
                    <TableHead className="text-right">Juros</TableHead>
                    <TableHead className="text-right">Amortização</TableHead>
                    <TableHead className="text-right">Parcela</TableHead>
                    <TableHead className="text-right">Custos</TableHead>
                    <TableHead className="text-right">Saldo Final</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cronograma?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.mes}</TableCell>
                      <TableCell>{item.dataParcela}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.saldoInicial)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.juros)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amortizacao)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.parcela)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.custosFixos)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.saldoFinal)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.observacoes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

