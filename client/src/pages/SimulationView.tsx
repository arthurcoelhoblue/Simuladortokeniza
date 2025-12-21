import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, Download, FileText, Trash2, TrendingUp } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SimulationView() {
  const [, params] = useRoute("/simulation/:id");
  const [, setLocation] = useLocation();
  const simulationId = parseInt(params?.id || "0");
  const [showCaptadorModal, setShowCaptadorModal] = useState(false);
  const [pendingPdfExport, setPendingPdfExport] = useState(false);

  const { data: simulation, isLoading } = trpc.simulations.getById.useQuery({ id: simulationId });
  const { data: cronograma } = trpc.simulations.getCronograma.useQuery({ simulationId });

  // Função para mostrar modal quando captador tentar sair
  const handleBackClick = () => {
    if (simulation?.modo === 'captador' && !sessionStorage.getItem(`modal-shown-${simulationId}`)) {
      setShowCaptadorModal(true);
      sessionStorage.setItem(`modal-shown-${simulationId}`, 'true');
    } else {
      setLocation("/");
    }
  };

  const deleteMutation = trpc.simulations.delete.useMutation({
    onSuccess: () => {
      toast.success("Simulação deletada com sucesso!");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar simulação");
    },
  });

  const duplicateMutation = trpc.simulations.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success("Simulação duplicada com sucesso!");
      setLocation(`/simulation/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao duplicar simulação");
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

  const exportPDF = () => {
    if (!simulation || !cronograma) return;

    // Se for captador, abre modal ANTES de gerar PDF
    if (simulation.modo === 'captador') {
      setPendingPdfExport(true);
      setShowCaptadorModal(true);
      return;
    }

    // Se não for captador, gera PDF diretamente
    generateAndOpenPDF();
  };

  const generateAndOpenPDF = () => {
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
    if (simulation?.modo === 'captador') {
      return generateCaptadorPDFHTML();
    }
    return generateInvestidorPDFHTML();
  };

  const generateCaptadorPDFHTML = () => {
    const formatCurrency = (cents: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cents / 100);
    };

    const formatPercent = (centesimos: number) => {
      return (centesimos / 100).toFixed(2) + "%";
    };

    const custosInvestidores = simulation.totalJurosPagos + simulation.valorAporte;
    const custosTokeniza = simulation.taxaSetupFixaBrl + (simulation.valorTotalOferta * simulation.feeSucessoPercentSobreCaptacao / 10000);
    const custoTotal = custosInvestidores + custosTokeniza;
    const custoMedioMensal = custoTotal / simulation.prazoMeses;

    const cronogramaRows = (cronograma || [])
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.mes}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.dataParcela}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.juros)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.amortizacao)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #84cc16;">${formatCurrency(item.parcela)}</td>
      </tr>
    `
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Custos de Captação #${simulationId}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #84cc16;
      border-bottom: 3px solid #84cc16;
      padding-bottom: 10px;
    }
    h2 {
      color: #65a30d;
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
      background: #f7fee7;
      border-left: 4px solid #84cc16;
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
      background: #84cc16;
      color: black;
      padding: 10px 8px;
      text-align: left;
      border: 1px solid #65a30d;
      font-weight: bold;
    }
    th.right {
      text-align: right;
    }
    .summary {
      background: #f7fee7;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 2px solid #84cc16;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .cost-breakdown {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
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
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #84cc16; padding-bottom: 20px;">
    <div style="padding: 20px 0; margin-bottom: 20px;">
      <h2 style="color: #1a1a1a; font-size: 42px; margin: 0 0 5px 0; font-weight: bold; letter-spacing: 4px;">TOKENIZA</h2>
      <p style="color: #84cc16; font-size: 14px; margin: 0; font-weight: bold;">Plataforma Líder em Tokenização de Ativos</p>
    </div>
    <h1 style="margin: 0; border: none; padding: 0; color: #84cc16; font-size: 36px;">Relatório de Custos de Captação</h1>
    <p style="color: #64748b; margin-top: 5px; font-size: 14px;">${simulation.descricaoOferta || 'Simulação de Captação'}</p>
    <p style="color: #84cc16; font-weight: bold; font-size: 12px; margin-top: 10px; background: #f7fee7; display: inline-block; padding: 5px 15px; border-radius: 20px;">MODO CAPTADOR</p>
  </div>

  <h2>Resumo Executivo</h2>
  <div class="summary">
    <div class="summary-grid">
      <div>
        <div class="info-label">Valor a Captar</div>
        <div class="info-value" style="color: #84cc16; font-size: 24px;">${formatCurrency(simulation.valorTotalOferta)}</div>
      </div>
      <div>
        <div class="info-label">Custo Total da Operação</div>
        <div class="info-value" style="color: #dc2626; font-size: 24px;">${formatCurrency(custoTotal)}</div>
      </div>
      <div>
        <div class="info-label">Custo Médio Mensal</div>
        <div class="info-value">${formatCurrency(custoMedioMensal)}</div>
      </div>
      <div>
        <div class="info-label">Percentual do Captado</div>
        <div class="info-value">${formatPercent(custoTotal * 10000 / simulation.valorTotalOferta)}</div>
      </div>
    </div>
  </div>

  <h2>Detalhamento de Custos</h2>
  <div class="cost-breakdown">
    <h3 style="margin-top: 0; color: #92400e;">Custos com Investidores</h3>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Principal a Devolver</div>
        <div class="info-value">${formatCurrency(simulation.valorAporte)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Juros Totais</div>
        <div class="info-value">${formatCurrency(simulation.totalJurosPagos)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Subtotal Investidores</div>
        <div class="info-value" style="color: #ea580c;">${formatCurrency(custosInvestidores)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">% do Captado</div>
        <div class="info-value">${formatPercent(custosInvestidores * 10000 / simulation.valorTotalOferta)}</div>
      </div>
    </div>
  </div>

  <div class="cost-breakdown">
    <h3 style="margin-top: 0; color: #92400e;">Custos com Tokeniza</h3>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Taxa de Estruturação</div>
        <div class="info-value">${formatCurrency(simulation.taxaSetupFixaBrl)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Fee sobre Captação (${formatPercent(simulation.feeSucessoPercentSobreCaptacao)})</div>
        <div class="info-value">${formatCurrency(simulation.valorTotalOferta * simulation.feeSucessoPercentSobreCaptacao / 10000)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Subtotal Tokeniza</div>
        <div class="info-value" style="color: #dc2626;">${formatCurrency(custosTokeniza)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">% do Captado</div>
        <div class="info-value">${formatPercent(custosTokeniza * 10000 / simulation.valorTotalOferta)}</div>
      </div>
    </div>
  </div>

  <h2>Parâmetros da Operação</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Prazo</div>
      <div class="info-value">${simulation.prazoMeses} meses</div>
    </div>
    <div class="info-item">
      <div class="info-label">Taxa de Juros</div>
      <div class="info-value">${formatPercent(simulation.taxaJurosAa)} a.a.</div>
    </div>
    <div class="info-item">
      <div class="info-label">Método de Amortização</div>
      <div class="info-value">${simulation.sistemaAmortizacao}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Tipo de Capitalização</div>
      <div class="info-value">${simulation.tipoCapitalizacao === "simples" ? "Simples" : "Composta"}</div>
    </div>
  </div>

  <h2>Cronograma de Pagamentos aos Investidores</h2>
  <table>
    <thead>
      <tr>
        <th>Mês</th>
        <th>Data</th>
        <th class="right">Juros</th>
        <th class="right">Amortização</th>
        <th class="right">Pagamento Total</th>
      </tr>
    </thead>
    <tbody>
      ${cronogramaRows}
    </tbody>
  </table>

  <div class="footer">
    <div style="background: #f7fee7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #84cc16;">
      <h3 style="color: #84cc16; margin-top: 0; text-align: center;">Quer captar recursos com a Tokeniza?</h3>
      <p style="text-align: center; color: #333; margin: 10px 0;">
        <strong>Autorização CVM</strong> • <strong>+130 Projetos</strong> • <strong>Blockchain</strong>
      </p>
      <p style="text-align: center; color: #333; font-size: 14px;">
        Acesse: <strong style="color: #84cc16;">tokeniza.com.br/tokeniza-captadores</strong>
      </p>
    </div>
    <p>Relatório gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <p>Sistema de Simulação de Investimentos Tokenizados - Tokeniza</p>
    <p style="font-size: 10px; margin-top: 10px;">www.tokeniza.com.br | plataforma.tokeniza.com.br</p>
  </div>
</body>
</html>
    `;
  };

  const generateInvestidorPDFHTML = () => {
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
      <div class="info-value">${formatCurrency(simulation.valorAporte)}</div>
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
      <div class="info-value">${simulation.sistemaAmortizacao}</div>
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
            <Button variant="ghost" onClick={handleBackClick} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Simulação #{simulationId}</h1>
            {simulation.descricaoOferta && (
              <p className="text-muted-foreground mt-2">{simulation.descricaoOferta}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => {
                // Criar proposta a partir da simulação
                const proposalData = {
                  valorCaptacao: simulation.valorDesejado * 100, // converter para centavos
                  nomeProjeto: simulation.descricaoOferta || "Projeto de Captação",
                  empresa: "A definir",
                  cnpj: "",
                  endereco: "",
                  lastroAtivo: "A definir",
                  visaoGeral: `Projeto de captação de R$ ${(simulation.valorDesejado / 1000000).toFixed(2)}M via tokenização.`,
                  captacaoInicial: `R$ ${(simulation.valorDesejado / 1000000).toFixed(2)}M`,
                  destinacaoRecursos: "A definir",
                  prazoExecucao: `${simulation.prazoMeses} meses`,
                  prazoCaptacao: `${simulation.prazoMeses} meses`,
                  dataMesAno: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
                  dataApresentacao: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
                  valorFixoInicial: 0,
                  taxaSucesso: 0,
                  valorLiquidoTotal: simulation.valorDesejado * 100,
                };
                // Armazenar no sessionStorage para preencher formulário
                sessionStorage.setItem("proposal-draft", JSON.stringify(proposalData));
                setLocation("/propostas/nova");
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Criar Proposta
            </Button>
            {simulation.modo === 'captador' && (
              <Button
                variant="default"
                onClick={() => setLocation(`/captador/viabilidade/nova?fromSimulationId=${simulationId}`)}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Criar análise de viabilidade
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => duplicateMutation.mutate({ id: simulationId })}
              disabled={duplicateMutation.isPending}
            >
              <Copy className="w-4 h-4 mr-2" />
              {duplicateMutation.isPending ? "Duplicando..." : "Duplicar"}
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
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
        {simulation.modo === 'captador' ? (
          // Visualização para Captador
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Captado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(simulation.valorTotalOferta)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total da oferta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Custos Investidores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(simulation.totalJurosPagos + simulation.valorAporte)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPercent((simulation.totalJurosPagos + simulation.valorAporte) * 10000 / simulation.valorTotalOferta)} do captado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Custos Tokeniza</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    simulation.taxaSetupFixaBrl + 
                    (simulation.valorTotalOferta * simulation.feeSucessoPercentSobreCaptacao / 10000)
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPercent(
                    (simulation.taxaSetupFixaBrl + 
                    (simulation.valorTotalOferta * simulation.feeSucessoPercentSobreCaptacao / 10000)) * 10000 / simulation.valorTotalOferta
                  )} do captado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-lime-600">
                  {formatCurrency(
                    simulation.totalJurosPagos + 
                    simulation.valorAporte + 
                    simulation.taxaSetupFixaBrl + 
                    (simulation.valorTotalOferta * simulation.feeSucessoPercentSobreCaptacao / 10000)
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Custo médio: {formatCurrency(
                    (simulation.totalJurosPagos + simulation.valorAporte + simulation.taxaSetupFixaBrl + 
                    (simulation.valorTotalOferta * simulation.feeSucessoPercentSobreCaptacao / 10000)) / simulation.prazoMeses
                  )}/mês
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* CTA para Captar com Tokeniza */}
          <Card className="mb-6 bg-gradient-to-r from-lime-500 to-lime-600 border-lime-600">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    🚀 Torne esse plano realidade!
                  </h3>
                  <p className="text-lime-50 text-lg">
                    Capte recursos com a plataforma líder em tokenização de ativos no Brasil
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => window.open('https://tokeniza.com.br/tokeniza-captadores/', '_blank')}
                  className="bg-white text-lime-600 hover:bg-lime-50 font-bold text-lg px-8 py-6 shadow-xl"
                >
                  Captar com a Tokeniza →
                </Button>
              </div>
            </CardContent>
          </Card>
          </>
        ) : (
          // Visualização para Investidor
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Investido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(simulation.valorAporte)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPercent(simulation.valorAporte * 10000 / simulation.valorTotalOferta)} da oferta
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
        )}

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
                <p className="font-medium">{simulation.sistemaAmortizacao}</p>
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
            <CardDescription>
              Detalhamento mês a mês do investimento
              {cronograma && cronograma.length > 0 && cronograma[0].tipoSistema && (
                <span className="ml-2 text-muted-foreground">
                  • Sistema: {cronograma[0].tipoSistema}
                </span>
              )}
            </CardDescription>
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

      {/* Modal para Captador */}
      <Dialog open={showCaptadorModal} onOpenChange={(open) => {
        setShowCaptadorModal(open);
        if (!open) {
          // Se estava pendente exportação de PDF, gera agora
          if (pendingPdfExport) {
            setPendingPdfExport(false);
            setTimeout(() => generateAndOpenPDF(), 300);
          } else if (simulation?.modo === 'captador') {
            // Se não era PDF, volta para home
            setLocation("/");
          }
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-center">
              🎉 Simulação Criada com Sucesso!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                Deseja captar recursos através da Tokeniza?
              </p>
            </div>
            
            <div className="bg-lime-50 dark:bg-lime-950/20 border border-lime-200 dark:border-lime-800 rounded-lg p-4">
              <p className="text-sm text-center text-foreground leading-relaxed">
                A Tokeniza é a <strong>plataforma líder em tokenização de ativos</strong> no Brasil
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="text-lime-500">✓</span> Autorização CVM
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-lime-500">✓</span> +130 Projetos
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-lime-500">✓</span> Blockchain
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCaptadorModal(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Agora não
            </Button>
            <Button
              onClick={() => {
                window.open('https://tokeniza.com.br/tokeniza-captadores/', '_blank');
                setShowCaptadorModal(false);
              }}
              className="w-full sm:w-auto bg-lime-500 hover:bg-lime-600 text-white font-semibold order-1 sm:order-2"
            >
              🚀 Sim, quero captar com a Tokeniza!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

