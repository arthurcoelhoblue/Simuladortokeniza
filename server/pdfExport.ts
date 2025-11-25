/**
 * Módulo de exportação de simulações para PDF
 */

import { SimulationResult } from "./calculator";

interface SimulationData {
  id: number;
  descricaoOferta: string | null;
  valorTotalOferta: number;
  valorAporte: number; // Renomeado de valorInvestido
  valorDesejado: number; // Novo campo
  dataEncerramentoOferta: string;
  prazoMeses: number;
  taxaJurosAa: number;
  tipoCapitalizacao: string;
  sistemaAmortizacao: string; // Renomeado de amortizacaoMetodo
  carenciaJurosMeses: number;
  carenciaPrincipalMeses: number;
  totalJurosPagos: number;
  totalAmortizado: number;
  totalRecebido: number;
  tirMensal: number | null;
  tirAnual: number | null;
}

export function generatePDFHTML(simulation: SimulationData, cronograma: Array<Omit<SimulationResult["cronograma"][0], "observacoes"> & { observacoes: string | null }>): string {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatPercent = (centesimos: number) => {
    return (centesimos / 100).toFixed(2) + "%";
  };

  const cronogramaRows = cronograma
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
      <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${item.observacoes ?? ""}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Simulação de Investimento #${simulation.id}</title>
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
  <h1>Simulação de Investimento Tokenizado</h1>
  
  ${simulation.descricaoOferta ? `<p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">${simulation.descricaoOferta}</p>` : ""}
  
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
      <div class="info-label">Método de Amortização</div>
      <div class="info-value">${simulation.sistemaAmortizacao}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Tipo de Capitalização</div>
      <div class="info-value">${simulation.tipoCapitalizacao === "simples" ? "Simples" : "Composta"}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Carências</div>
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
        <th>Mês</th>
        <th>Data</th>
        <th class="right">Saldo Inicial</th>
        <th class="right">Juros</th>
        <th class="right">Amortização</th>
        <th class="right">Parcela</th>
        <th class="right">Saldo Final</th>
        <th>Observações</th>
      </tr>
    </thead>
    <tbody>
      ${cronogramaRows}
    </tbody>
  </table>

  <div class="footer">
    <p>Simulação gerada em ${new Date().toLocaleString("pt-BR")}</p>
    <p>Sistema de Simulação de Investimentos Tokenizados</p>
  </div>
</body>
</html>
  `;
}

