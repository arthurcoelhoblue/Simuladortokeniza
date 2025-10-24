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
    if (!simulation || !cronograma) return;

    try {
      // Gera HTML localmente
      const html = generatePDFHTML();
      
      // Abre em nova janela e imprime
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const generatePDFHTML = () => {
    const formatCurrency = (cents: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cents / 100);
    };

    const formatPercent = (centesimos: number) => {
      return (centesimos / 100).toFixed(2) + "%";
    };

    const cronogramaRows = (cronograma || [])
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.mes}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.dataParcela}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.saldoInicial)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.juros)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.amortizacao)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(item.parcela)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.saldoFinal)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${item.observacoes || ""}</td>
      </tr>
    `
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Simula\u00e7\u00e3o de Investimento #${simulationId}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .info-item {
      padding: 10px;
      background: #f8fafc;
      border-left: 4px solid #2563eb;
    }
    .info-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 16px;
      font-weight: bold;
      color: #1e293b;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 10px 8px;
      text-align: left;
      border: 1px solid #1e40af;
    }
    th.right {
      text-align: right;
    }
    .summary {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #64748b;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
      <img src="/tokeniza-logo.svg" alt="Tokeniza" style="height: 40px;" />
    </div>
    <h1 style="margin: 0; border: none; padding: 0; color: #3b82f6; font-size: 36px;">${simulation.descricaoOferta || 'Simula\u00e7\u00e3o de Investimento'}</h1>
    <p style="color: #64748b; margin-top: 5px; font-size: 14px;">Simula\u00e7\u00e3o de Investimento Tokenizado</p>
  </div>
  
  <h2>Dados da Oferta</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Valor Total da Oferta</div>
      <div class="info-value">${formatCurrency(simulation.valorTotalOferta)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Valor Investido</div>
      <div class="info-value">${formatCurrency(simulation.valorInvestido)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Data de Encerramento</div>
      <div class="info-value">${simulation.dataEncerramentoOferta}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Prazo</div>
      <div class="info-value">${simulation.prazoMeses} meses</div>
    </div>
    <div class="info-item">
      <div class="info-label">Taxa de Juros</div>
      <div class="info-value">${formatPercent(simulation.taxaJurosAa)} a.a.</div>
    </div>
    <div class="info-item">
      <div class="info-label">M\u00e9todo de Amortiza\u00e7\u00e3o</div>
      <div class="info-value">${simulation.amortizacaoMetodo.toUpperCase()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Tipo de Capitaliza\u00e7\u00e3o</div>
      <div class="info-value">${simulation.tipoCapitalizacao === "simples" ? "Simples" : "Composta"}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Car\u00eancias</div>
      <div class="info-value">Juros: ${simulation.carenciaJurosMeses}m | Principal: ${simulation.carenciaPrincipalMeses}m</div>
    </div>
  </div>

  <h2>Resumo Financeiro</h2>
  <div class="summary">
    <div class="summary-grid">
      <div>
        <div class="info-label">Total de Juros Pagos</div>
        <div class="info-value" style="color: #059669;">${formatCurrency(simulation.totalJurosPagos)}</div>
      </div>
      <div>
        <div class="info-label">Total Amortizado</div>
        <div class="info-value">${formatCurrency(simulation.totalAmortizado)}</div>
      </div>
      <div>
        <div class="info-label">Total Recebido</div>
        <div class="info-value" style="color: #2563eb;">${formatCurrency(simulation.totalRecebido)}</div>
      </div>
      ${
        simulation.tirMensal && simulation.tirAnual
          ? `
      <div>
        <div class="info-label">TIR Mensal</div>
        <div class="info-value">${formatPercent(simulation.tirMensal)}</div>
      </div>
      <div>
        <div class="info-label">TIR Anual</div>
        <div class="info-value">${formatPercent(simulation.tirAnual)}</div>
      </div>
      `
          : ""
      }
    </div>
  </div>

  <h2>Cronograma Mensal</h2>
  <table>
    <thead>
      <tr>
        <th>M\u00eas</th>
        <th>Data</th>
        <th class="right">Saldo Inicial</th>
        <th class="right">Juros</th>
        <th class="right">Amortiza\u00e7\u00e3o</th>
        <th class="right">Parcela</th>
        <th class="right">Saldo Final</th>
        <th>Observa\u00e7\u00f5es</th>
      </tr>
    </thead>
    <tbody>
      ${cronogramaRows}
    </tbody>
  </table>

  <div class="footer">
    <p>Simula\u00e7\u00e3o gerada em ${new Date().toLocaleString("pt-BR")}</p>
    <p>Sistema de Simula\u00e7\u00e3o de Investimentos Tokenizados</p>
  </div>
</body>
</html>
    `;
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

