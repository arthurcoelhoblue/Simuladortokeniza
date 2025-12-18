import puppeteer from "puppeteer";
import { Proposal } from "../drizzle/schema";

/**
 * Gera HTML da proposta replicando design do Canva
 */
function generateProposalHTML(proposal: Proposal): string {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      color: #fff;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      page-break-after: always;
      overflow: hidden;
    }
    
    /* Página 1 - Capa */
    .page-1 {
      background: #2D3436;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px;
    }
    
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #fff;
    }
    
    .geometric-lines {
      position: absolute;
      top: 0;
      right: 0;
      width: 50%;
      height: 100%;
      opacity: 0.3;
    }
    
    .title-section {
      z-index: 10;
      margin-top: 200px;
    }
    
    .main-title {
      font-size: 72px;
      font-weight: bold;
      color: #C6FF00;
      margin-bottom: 20px;
    }
    
    .subtitle {
      font-size: 24px;
      color: #fff;
      line-height: 1.4;
    }
    
    .date-badge {
      background: #FF6B6B;
      color: #fff;
      padding: 12px 24px;
      font-size: 18px;
      font-weight: bold;
      display: inline-block;
      border-radius: 4px;
      z-index: 10;
    }
    
    /* Página 2 - Apresentação */
    .page-2 {
      background: #2D3436;
      padding: 60px;
    }
    
    .header {
      margin-bottom: 40px;
    }
    
    .header-title {
      font-size: 18px;
      margin-bottom: 10px;
    }
    
    .info-box {
      background: #fff;
      color: #2D3436;
      padding: 30px;
      border-left: 4px solid #C6FF00;
      margin-bottom: 40px;
    }
    
    .info-row {
      margin-bottom: 15px;
      display: flex;
    }
    
    .info-label {
      font-weight: bold;
      width: 120px;
    }
    
    .info-value {
      flex: 1;
    }
    
    .section-title {
      font-size: 28px;
      color: #C6FF00;
      margin-bottom: 20px;
      font-weight: bold;
    }
    
    .section-text {
      line-height: 1.8;
      font-size: 16px;
    }
    
    /* Página 3 - Projeto */
    .page-3 {
      background: #2D3436;
      padding: 60px;
    }
    
    .project-header {
      background: #fff;
      color: #2D3436;
      padding: 30px;
      border-left: 4px solid #C6FF00;
      margin-bottom: 40px;
    }
    
    .project-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .project-row {
      display: flex;
      margin-bottom: 12px;
    }
    
    .project-label {
      font-weight: bold;
      width: 150px;
    }
    
    .project-value {
      flex: 1;
      color: #C6FF00;
      font-weight: bold;
    }
    
    .specs-list {
      list-style: none;
      margin-top: 20px;
    }
    
    .specs-list li {
      margin-bottom: 15px;
      padding-left: 20px;
      position: relative;
    }
    
    .specs-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #C6FF00;
      font-size: 24px;
    }
    
    /* Página 6 - Valores */
    .page-6 {
      background: #2D3436;
      padding: 60px;
    }
    
    .values-box {
      background: #fff;
      color: #2D3436;
      padding: 30px;
      border-left: 4px solid #C6FF00;
      margin-bottom: 30px;
    }
    
    .value-item {
      margin-bottom: 25px;
      padding-bottom: 25px;
      border-bottom: 1px solid #ddd;
    }
    
    .value-item:last-child {
      border-bottom: none;
    }
    
    .value-label {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .value-amount {
      font-size: 32px;
      color: #C6FF00;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .value-condition {
      font-size: 14px;
      color: #666;
    }
    
    .total-box {
      background: #C6FF00;
      color: #2D3436;
      padding: 30px;
      text-align: center;
    }
    
    .total-label {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .total-amount {
      font-size: 48px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <!-- Página 1: Capa -->
  <div class="page page-1">
    <div class="logo">Tokeniza</div>
    <div class="title-section">
      <div class="main-title">Proposta</div>
      <div class="subtitle">
        Estruturação para Captação<br>
        via Tokenização no Brasil
      </div>
    </div>
    <div class="date-badge">${proposal.dataMesAno}</div>
  </div>

  <!-- Página 2: Apresentação -->
  <div class="page page-2">
    <div class="header">
      <div class="logo">Tokeniza</div>
      <div class="header-title" style="margin-top: 20px;">
        Tokeniza & Welshman Consultoria Empresarial Ltda<br>
        Aos Cuidados do Sr. Daniel Goldfinger
      </div>
    </div>
    
    <div class="info-box">
      <div class="info-row">
        <div class="info-label">Empresa:</div>
        <div class="info-value">${proposal.empresa}</div>
      </div>
      <div class="info-row">
        <div class="info-label">CNPJ:</div>
        <div class="info-value">${proposal.cnpj}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Endereço:</div>
        <div class="info-value">${proposal.endereco}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Data:</div>
        <div class="info-value">${proposal.dataApresentacao}</div>
      </div>
    </div>
    
    <div class="section-title">Apresentação da Proposta</div>
    <div class="section-text">
      Prezados,<br><br>
      
      É com grande satisfação que apresentamos esta proposta de estruturação 
      para captação de recursos via tokenização. Nossa solução oferece uma 
      abordagem inovadora e regulamentada para viabilizar o financiamento 
      do seu projeto através do mercado de capitais digital.<br><br>
      
      A Tokeniza é pioneira no Brasil em estruturação de ofertas públicas 
      de tokens de investimento, com expertise regulatória e tecnológica 
      para garantir segurança jurídica e eficiência operacional.
    </div>
  </div>

  <!-- Página 3: Projeto -->
  <div class="page page-3">
    <div class="header">
      <div class="logo">Tokeniza</div>
    </div>
    
    <div class="project-header">
      <div class="project-title">Informações sobre a Captação</div>
      <div class="project-row">
        <div class="project-label">Valor:</div>
        <div class="project-value">${formatCurrency(proposal.valorCaptacao)}</div>
      </div>
      <div class="project-row">
        <div class="project-label">Projeto:</div>
        <div class="project-value">${proposal.nomeProjeto}</div>
      </div>
      <div class="project-row">
        <div class="project-label">Lastro/Ativo:</div>
        <div class="project-value">${proposal.lastroAtivo}</div>
      </div>
    </div>
    
    <div class="section-title">Sobre o Projeto ${proposal.nomeProjeto}</div>
    
    <div class="section-title" style="font-size: 20px; margin-top: 30px;">Visão geral</div>
    <div class="section-text">
      ${proposal.visaoGeral}
    </div>
    
    <div class="section-title" style="font-size: 20px; margin-top: 30px;">Especificações principais</div>
    <ul class="specs-list">
      <li><strong>Captação inicial requerida:</strong> ${proposal.captacaoInicial}</li>
      <li><strong>Destinação dos recursos:</strong> ${proposal.destinacaoRecursos}</li>
      <li><strong>Prazo de execução/retorno da obra:</strong> ${proposal.prazoExecucao}</li>
      <li><strong>Prazo de captação/remuneração:</strong> ${proposal.prazoCaptacao}</li>
    </ul>
    
    <div class="section-title" style="font-size: 20px; margin-top: 30px;">Compliance Regulatório</div>
    <div class="section-text">
      Toda a estruturação seguirá as normas da CVM (Comissão de Valores Mobiliários) 
      e demais regulamentações aplicáveis ao mercado de capitais brasileiro.
    </div>
  </div>

  <!-- Página 6: Valores -->
  <div class="page page-6">
    <div class="header">
      <div class="logo">Tokeniza</div>
    </div>
    
    <div class="section-title">Estrutura de Custos</div>
    
    <div class="values-box">
      <div class="value-item">
        <div class="value-label">Valor Fixo Inicial pela Estruturação Completa</div>
        <div class="value-amount">${formatCurrency(proposal.valorFixoInicial)}</div>
        <div class="value-condition">Condições de Pagamento: À vista</div>
      </div>
      
      <div class="value-item">
        <div class="value-label">Taxa de Sucesso</div>
        <div class="value-amount">${formatCurrency(proposal.taxaSucesso)}</div>
        <div class="value-condition">
          Condição: Pagamento condicionado exclusivamente ao êxito da captação
        </div>
      </div>
    </div>
    
    <div class="total-box">
      <div class="total-label">Valor Líquido a ser Transferido ao Cliente</div>
      <div class="total-amount">${formatCurrency(proposal.valorLiquidoTotal)}</div>
    </div>
    
    <div class="section-text" style="margin-top: 40px;">
      <strong>Observações Importantes:</strong><br><br>
      
      • O valor fixo inicial cobre toda a estruturação jurídica, regulatória e tecnológica<br>
      • A taxa de sucesso é calculada sobre o valor efetivamente captado<br>
      • Todos os valores estão sujeitos a ajustes mediante acordo entre as partes<br>
      • Prazo de validade desta proposta: 30 dias
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Gera PDF da proposta usando Puppeteer
 */
export async function generateProposalPDF(proposal: Proposal): Promise<Buffer> {
  console.log("📄 Gerando PDF para proposta:", proposal.id);
  
  const html = generateProposalHTML(proposal);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/home/ubuntu/.cache/puppeteer/chrome/linux-143.0.7499.146/chrome-linux64/chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
      ],
      timeout: 60000, // 60 segundos
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    
    console.log("✅ PDF gerado com sucesso:", pdfBuffer.length, "bytes");
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("❌ Erro ao gerar PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
