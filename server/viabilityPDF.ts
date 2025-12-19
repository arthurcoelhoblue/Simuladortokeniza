/**
 * Gerador de PDF para Análise de Viabilidade
 */

import puppeteer from 'puppeteer';
import { ViabilityAnalysis } from '../drizzle/schema';
import { Indicadores, MesFluxo } from './viabilityCalculations';
import { FinancialInsight } from './viabilityInsights';

interface PDFData extends Omit<ViabilityAnalysis, 'fluxoCaixa' | 'indicadores'> {
  fluxoCaixa: MesFluxo[];
  indicadores: Indicadores;
  insights: FinancialInsight[];
}

export async function generateViabilityPDF(data: PDFData): Promise<Buffer> {
  const html = generateHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generateHTML(data: PDFData): string {
  const { nome, indicadores, insights, fluxoCaixa } = data;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '🚨';
      default: return 'ℹ️';
    }
  };

  const insightsHTML = insights.map(insight => `
    <div class="insight ${insight.type}">
      <div class="insight-header">
        <span class="insight-icon">${getInsightIcon(insight.type)}</span>
        <h3>${insight.title}</h3>
      </div>
      <p>${insight.message}</p>
      ${insight.recommendation ? `
        <div class="recommendation">
          <strong>💡 Recomendação:</strong>
          <p>${insight.recommendation}</p>
        </div>
      ` : ''}
      ${insight.offenders && insight.offenders.length > 0 ? `
        <div class="offenders">
          <strong>🎯 Principais custos:</strong>
          <ul>
            ${insight.offenders.map(o => `<li>${o.name}: ${o.impact}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');

  const fluxoCaixaTable = `
    <table class="flux-table">
      <thead>
        <tr>
          <th>Mês</th>
          <th>Clientes</th>
          <th>Receita</th>
          <th>Despesa</th>
          <th>Saldo</th>
        </tr>
      </thead>
      <tbody>
        ${fluxoCaixa.slice(0, 24).map(m => `
          <tr>
            <td>${m.mes}</td>
            <td>${m.clientes}</td>
            <td>${formatCurrency(m.receitaBruta)}</td>
            <td>${formatCurrency(m.opex + m.amortizacao + m.juros)}</td>
            <td class="${m.saldoAcumulado >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(m.saldoAcumulado)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          font-size: 18px;
          opacity: 0.9;
        }
        
        .status-badge {
          display: inline-block;
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: bold;
          margin-top: 15px;
        }
        
        .status-badge.viavel {
          background: #10b981;
        }
        
        .status-badge.inviavel {
          background: #ef4444;
        }
        
        .indicators {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .indicator-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        
        .indicator-card .label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        
        .indicator-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #111827;
          border-bottom: 2px solid #667eea;
          padding-bottom: 8px;
        }
        
        .insight {
          background: white;
          border: 1px solid #e5e7eb;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .insight.success { border-left-color: #10b981; }
        .insight.warning { border-left-color: #f59e0b; }
        .insight.error { border-left-color: #ef4444; }
        .insight.info { border-left-color: #3b82f6; }
        
        .insight-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .insight-icon {
          font-size: 20px;
        }
        
        .insight h3 {
          font-size: 16px;
          color: #111827;
        }
        
        .insight p {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 10px;
        }
        
        .recommendation {
          background: #f3f4f6;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
        }
        
        .recommendation strong {
          display: block;
          margin-bottom: 5px;
          color: #111827;
        }
        
        .offenders {
          margin-top: 10px;
        }
        
        .offenders strong {
          display: block;
          margin-bottom: 5px;
          color: #111827;
        }
        
        .offenders ul {
          list-style: none;
          padding-left: 0;
        }
        
        .offenders li {
          font-size: 13px;
          color: #6b7280;
          padding: 3px 0;
        }
        
        .flux-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        .flux-table th {
          background: #f3f4f6;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .flux-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .flux-table .positive {
          color: #10b981;
          font-weight: 600;
        }
        
        .flux-table .negative {
          color: #ef4444;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        
        @page {
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${nome}</h1>
        <div class="subtitle">Análise de Viabilidade Financeira</div>
        <div class="status-badge ${indicadores.viavel ? 'viavel' : 'inviavel'}">
          ${indicadores.viavel ? '✅ PROJETO VIÁVEL' : '🚨 PROJETO INVIÁVEL'}
        </div>
      </div>

      <div class="indicators">
        <div class="indicator-card">
          <div class="label">Payback</div>
          <div class="value">${indicadores.payback} meses</div>
        </div>
        <div class="indicator-card">
          <div class="label">Margem EBITDA</div>
          <div class="value">${indicadores.margemEbitdaMedia}%</div>
        </div>
        <div class="indicator-card">
          <div class="label">Ponto de Equilíbrio</div>
          <div class="value">Mês ${indicadores.pontoEquilibrioOperacional}</div>
        </div>
        <div class="indicator-card">
          <div class="label">Saldo Final</div>
          <div class="value" style="color: ${indicadores.saldoFinal > 0 ? '#10b981' : '#ef4444'}">
            ${formatCurrency(indicadores.saldoFinal)}
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📊 Insights Financeiros</h2>
        ${insightsHTML}
      </div>

      <div class="section">
        <h2 class="section-title">💰 Fluxo de Caixa (Primeiros 24 meses)</h2>
        ${fluxoCaixaTable}
      </div>

      <div class="section">
        <h2 class="section-title">📋 Premissas da Análise</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          <div>
            <h3 style="font-size: 14px; margin-bottom: 10px;">Captação</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td>Valor Total:</td><td style="text-align: right; font-weight: 600;">${formatCurrency(data.valorCaptacao)}</td></tr>
              <tr><td>Co-investimento:</td><td style="text-align: right; font-weight: 600;">${(data.coInvestimento / 100).toFixed(1)}%</td></tr>
              <tr><td>Taxa de Juros:</td><td style="text-align: right; font-weight: 600;">${(data.taxaJurosMensal / 100).toFixed(2)}% a.m.</td></tr>
              <tr><td>Prazo:</td><td style="text-align: right; font-weight: 600;">${data.prazoMeses} meses</td></tr>
              <tr><td>Modelo:</td><td style="text-align: right; font-weight: 600;">${data.modeloPagamento}</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; margin-bottom: 10px;">CAPEX</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td>Obras:</td><td style="text-align: right; font-weight: 600;">${formatCurrency(data.capexObras)}</td></tr>
              <tr><td>Equipamentos:</td><td style="text-align: right; font-weight: 600;">${formatCurrency(data.capexEquipamentos)}</td></tr>
              <tr><td>Licenças:</td><td style="text-align: right; font-weight: 600;">${formatCurrency(data.capexLicencas)}</td></tr>
              <tr><td>Marketing:</td><td style="text-align: right; font-weight: 600;">${formatCurrency(data.capexMarketing)}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td><strong>Total:</strong></td><td style="text-align: right; font-weight: 700;">${formatCurrency(indicadores.capexTotal)}</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; margin-bottom: 10px;">Receitas</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td>Ticket Médio:</td><td style="text-align: right; font-weight: 600;">${formatCurrency(data.ticketMedio)}</td></tr>
              <tr><td>Capacidade:</td><td style="text-align: right; font-weight: 600;">${data.capacidadeMaxima} clientes</td></tr>
              <tr><td>Clientes Início:</td><td style="text-align: right; font-weight: 600;">${data.clientesInicio}</td></tr>
              <tr><td>Crescimento:</td><td style="text-align: right; font-weight: 600;">${(data.taxaCrescimento / 100).toFixed(1)}% a.m.</td></tr>
              <tr><td>Steady State:</td><td style="text-align: right; font-weight: 600;">${data.clientesSteadyState} clientes</td></tr>
            </table>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Relatório gerado automaticamente pelo Simulador de Investimentos Tokenizados</p>
        <p>Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}
