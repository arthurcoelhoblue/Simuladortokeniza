/**
 * Sistema de Insights Financeiros Inteligentes
 * Analisa indicadores e identifica oportunidades de melhoria
 */

import { Indicadores, MesFluxo } from "./viabilityCalculations";

export interface FinancialInsight {
  type: 'success' | 'warning' | 'error' | 'info';
  severity: number; // 1-10 para ordenação (10 = mais crítico)
  category: 'viabilidade' | 'rentabilidade' | 'liquidez' | 'estrutura';
  title: string;
  message: string;
  recommendation?: string;
  offenders?: Array<{ name: string; value: number; impact: string }>;
  sensitivity?: {
    variable: string;
    currentValue: string;
    suggestedValue: string;
    impact: string;
  };
}

export interface ViabilityAnalysisData {
  // Indicadores calculados
  indicadores: Indicadores;
  fluxoCaixa: MesFluxo[];
  
  // Premissas (valores em centavos e basis points)
  valorCaptacao: number;
  coInvestimento: number; // basis points
  taxaJurosMensal: number; // basis points
  prazoMeses: number;
  carenciaMeses: number;
  modeloPagamento: 'SAC' | 'PRICE' | 'BULLET';
  
  // CAPEX (centavos)
  capexObras: number;
  capexEquipamentos: number;
  capexLicencas: number;
  capexMarketing: number;
  capexCapitalGiro: number;
  capexOutros: number;
  
  // OPEX (centavos)
  opexAluguel: number;
  opexPessoal: number;
  opexRoyalties: number;
  opexMarketing: number;
  opexUtilidades: number;
  opexManutencao: number;
  opexSeguros: number;
  opexOutros: number;
  
  // Receitas
  ticketMedio: number; // centavos
  capacidadeMaxima: number;
  clientesInicio: number;
  taxaCrescimento: number; // basis points
  mesEstabilizacao: number;
  clientesSteadyState: number;
  mesAbertura: number;
}

/**
 * Analisa saúde financeira e gera insights
 */
export function analyzeFinancialHealth(data: ViabilityAnalysisData): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  
  const { indicadores, fluxoCaixa } = data;
  
  // 1. Análise de Viabilidade Geral
  if (indicadores.viavel) {
    insights.push({
      type: 'success',
      severity: 1,
      category: 'viabilidade',
      title: '✅ Projeto Viável',
      message: `O projeto atende aos critérios de viabilidade: payback de ${indicadores.payback} meses (< 48) e saldo final positivo de R$ ${formatCurrency(indicadores.saldoFinal)}.`
    });
  } else {
    const reasons = [];
    if (indicadores.payback >= 48) reasons.push(`payback muito longo (${indicadores.payback} meses)`);
    if (indicadores.saldoFinal <= 0) reasons.push(`saldo final negativo (R$ ${formatCurrency(indicadores.saldoFinal)})`);
    
    insights.push({
      type: 'error',
      severity: 10,
      category: 'viabilidade',
      title: '🚨 Projeto Inviável',
      message: `O projeto não atende aos critérios de viabilidade: ${reasons.join(', ')}.`,
      recommendation: 'Revise premissas de receita, reduza custos ou aumente co-investimento.'
    });
  }
  
  // 2. Análise de Payback
  analyzePayback(data, insights);
  
  // 3. Análise de Ponto de Equilíbrio
  analyzeBreakeven(data, insights);
  
  // 4. Análise de Margem EBITDA
  analyzeEbitdaMargin(data, insights);
  
  // 5. Análise de CAPEX
  analyzeCapex(data, insights);
  
  // 6. Análise de Serviço da Dívida
  analyzeDebtService(data, insights);
  
  // 7. Análise de Fluxo de Caixa
  analyzeCashFlow(data, insights);
  
  // 8. Análise de Crescimento
  analyzeGrowth(data, insights);
  
  // 9. Análise de Estrutura de Capital
  analyzeCapitalStructure(data, insights);
  
  // 10. Análise de Modelo de Amortização
  analyzeAmortizationModel(data, insights);
  
  // Ordenar por severidade (maior primeiro)
  return insights.sort((a, b) => b.severity - a.severity);
}

function analyzePayback(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const { payback } = data.indicadores;
  
  if (payback < 24) {
    insights.push({
      type: 'success',
      severity: 2,
      category: 'viabilidade',
      title: '🚀 Payback Excelente',
      message: `Retorno do investimento em apenas ${payback} meses (< 24). Projeto altamente atrativo para investidores.`
    });
  } else if (payback < 36) {
    insights.push({
      type: 'success',
      severity: 3,
      category: 'viabilidade',
      title: '✅ Payback Bom',
      message: `Retorno do investimento em ${payback} meses está dentro do esperado (24-36 meses).`
    });
  } else if (payback < 48) {
    insights.push({
      type: 'warning',
      severity: 6,
      category: 'viabilidade',
      title: '⚠️ Payback Longo',
      message: `Payback de ${payback} meses está no limite aceitável (36-48 meses). Considere otimizações.`,
      recommendation: 'Aumente receitas (crescimento ou preços) ou reduza OPEX para acelerar retorno.'
    });
  } else {
    insights.push({
      type: 'error',
      severity: 9,
      category: 'viabilidade',
      title: '🚨 Payback Muito Longo',
      message: `Payback de ${payback} meses (> 48) torna o projeto pouco atrativo. Risco elevado.`,
      recommendation: 'Revise modelo de negócio: aumente receitas, reduza custos ou busque financiamento mais barato.'
    });
  }
}

function analyzeBreakeven(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const { pontoEquilibrioOperacional } = data.indicadores;
  const opexTotal = calcularOpexTotal(data);
  const receitaPorCliente = data.ticketMedio;
  const clientesNecessarios = Math.ceil(opexTotal / receitaPorCliente);
  
  if (pontoEquilibrioOperacional > data.mesEstabilizacao) {
    insights.push({
      type: 'warning',
      severity: 7,
      category: 'rentabilidade',
      title: '⚠️ Ponto de Equilíbrio Tardio',
      message: `Ponto de equilíbrio no mês ${pontoEquilibrioOperacional}, após estabilização (mês ${data.mesEstabilizacao}). Período de prejuízo prolongado.`,
      recommendation: `Reduza OPEX ou acelere crescimento de receitas para atingir equilíbrio mais rápido.`,
      offenders: identifyOpexOffenders(data)
    });
  } else if (pontoEquilibrioOperacional > 6) {
    insights.push({
      type: 'info',
      severity: 4,
      category: 'rentabilidade',
      title: 'ℹ️ Ponto de Equilíbrio Normal',
      message: `Ponto de equilíbrio no mês ${pontoEquilibrioOperacional} é típico para negócios em rampa.`
    });
  } else {
    insights.push({
      type: 'success',
      severity: 2,
      category: 'rentabilidade',
      title: '🚀 Ponto de Equilíbrio Rápido',
      message: `Ponto de equilíbrio atingido no mês ${pontoEquilibrioOperacional}. Excelente!`
    });
  }
  
  // Análise de margem de segurança
  const margemSeguranca = data.clientesSteadyState - clientesNecessarios;
  const percentualMargem = (margemSeguranca / data.clientesSteadyState) * 100;
  
  if (percentualMargem < 20) {
    insights.push({
      type: 'warning',
      severity: 6,
      category: 'rentabilidade',
      title: '⚠️ Margem de Segurança Baixa',
      message: `Apenas ${margemSeguranca} clientes (${percentualMargem.toFixed(1)}%) acima do ponto de equilíbrio. Pouca margem para imprevistos.`,
      sensitivity: {
        variable: 'Clientes Steady State',
        currentValue: `${data.clientesSteadyState} clientes`,
        suggestedValue: `${Math.ceil(clientesNecessarios * 1.3)} clientes (+30%)`,
        impact: 'Aumentaria margem de segurança para 30%'
      }
    });
  }
}

function analyzeEbitdaMargin(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const { margemEbitdaMedia } = data.indicadores;
  
  if (margemEbitdaMedia < 0) {
    insights.push({
      type: 'error',
      severity: 10,
      category: 'rentabilidade',
      title: '📉 Margem EBITDA Negativa',
      message: `Margem EBITDA de ${margemEbitdaMedia}% indica operação deficitária. Receitas não cobrem custos.`,
      recommendation: 'URGENTE: Aumente receitas, reduza OPEX ou reavalie viabilidade do projeto.',
      offenders: identifyOpexOffenders(data)
    });
  } else if (margemEbitdaMedia < 15) {
    const receitaSteady = data.ticketMedio * data.clientesSteadyState;
    const opexTotal = calcularOpexTotal(data);
    const ticketNecessario = Math.ceil((opexTotal / data.clientesSteadyState) * 1.2); // +20% margem
    
    insights.push({
      type: 'warning',
      severity: 7,
      category: 'rentabilidade',
      title: '⚠️ Margem EBITDA Baixa',
      message: `Margem EBITDA de ${margemEbitdaMedia}% está abaixo do ideal (15-25%). Rentabilidade comprometida.`,
      recommendation: 'Aumente receitas ou reduza custos operacionais para melhorar margem.',
      offenders: identifyOpexOffenders(data),
      sensitivity: {
        variable: 'Ticket Médio',
        currentValue: formatCurrency(data.ticketMedio),
        suggestedValue: formatCurrency(ticketNecessario),
        impact: `Elevaria margem EBITDA para ~20%`
      }
    });
  } else if (margemEbitdaMedia >= 25) {
    insights.push({
      type: 'success',
      severity: 1,
      category: 'rentabilidade',
      title: '💰 Margem EBITDA Excelente',
      message: `Margem EBITDA de ${margemEbitdaMedia}% está acima da média! Operação altamente rentável.`
    });
  } else {
    insights.push({
      type: 'success',
      severity: 2,
      category: 'rentabilidade',
      title: '✅ Margem EBITDA Saudável',
      message: `Margem EBITDA de ${margemEbitdaMedia}% está dentro do esperado (15-25%).`
    });
  }
}

function analyzeCapex(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const { capexTotal } = data.indicadores;
  const proporcaoCapex = (capexTotal / data.valorCaptacao) * 100;
  
  if (proporcaoCapex > 90) {
    insights.push({
      type: 'warning',
      severity: 6,
      category: 'estrutura',
      title: '⚠️ CAPEX Muito Alto',
      message: `CAPEX de R$ ${formatCurrency(capexTotal)} representa ${proporcaoCapex.toFixed(1)}% da captação. Pouco capital de giro.`,
      recommendation: 'Considere reduzir custos de implantação ou aumentar captação.',
      offenders: identifyCapexOffenders(data)
    });
  } else if (proporcaoCapex < 60) {
    insights.push({
      type: 'info',
      severity: 3,
      category: 'estrutura',
      title: 'ℹ️ CAPEX Conservador',
      message: `CAPEX de R$ ${formatCurrency(capexTotal)} (${proporcaoCapex.toFixed(1)}% da captação) deixa bom capital de giro.`
    });
  }
}

function analyzeDebtService(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const taxaMensal = data.taxaJurosMensal / 10000;
  const taxaAnual = (Math.pow(1 + taxaMensal, 12) - 1) * 100;
  const { totalJurosPagos, valorInvestidores } = data.indicadores;
  const proporcaoJuros = (totalJurosPagos / valorInvestidores) * 100;
  
  if (taxaMensal > 0.02) { // > 2% a.m.
    insights.push({
      type: 'warning',
      severity: 7,
      category: 'estrutura',
      title: '💸 Taxa de Juros Elevada',
      message: `Taxa de ${(taxaMensal * 100).toFixed(2)}% a.m. (${taxaAnual.toFixed(1)}% a.a.) é alta. Total de juros: R$ ${formatCurrency(totalJurosPagos)} (${proporcaoJuros.toFixed(1)}% do valor financiado).`,
      recommendation: 'Negocie taxas menores ou aumente co-investimento para reduzir custo de capital.',
      sensitivity: {
        variable: 'Co-investimento',
        currentValue: `${(data.coInvestimento / 100).toFixed(1)}%`,
        suggestedValue: `${((data.coInvestimento / 100) + 10).toFixed(1)}%`,
        impact: `Reduziria juros totais em ~${formatCurrency(totalJurosPagos * 0.1)}`
      }
    });
  } else if (taxaMensal < 0.015) { // < 1.5% a.m.
    insights.push({
      type: 'success',
      severity: 2,
      category: 'estrutura',
      title: '✅ Taxa de Juros Competitiva',
      message: `Taxa de ${(taxaMensal * 100).toFixed(2)}% a.m. (${taxaAnual.toFixed(1)}% a.a.) é excelente. Total de juros: R$ ${formatCurrency(totalJurosPagos)}.`
    });
  }
}

function analyzeCashFlow(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const mesesNegativos = data.fluxoCaixa.filter(m => m.saldoAcumulado < 0).length;
  const menorSaldo = Math.min(...data.fluxoCaixa.map(m => m.saldoAcumulado));
  
  if (mesesNegativos > 12) {
    insights.push({
      type: 'error',
      severity: 8,
      category: 'liquidez',
      title: '⏰ Período de Caixa Negativo Longo',
      message: `${mesesNegativos} meses com saldo negativo. Pior momento: R$ ${formatCurrency(menorSaldo)}. Risco de liquidez.`,
      recommendation: 'Aumente capital de giro inicial ou acelere crescimento de receitas.'
    });
  } else if (mesesNegativos > 6) {
    insights.push({
      type: 'warning',
      severity: 5,
      category: 'liquidez',
      title: '⚠️ Período de Caixa Negativo Moderado',
      message: `${mesesNegativos} meses com saldo negativo. Certifique-se de ter capital de giro para cobrir R$ ${formatCurrency(Math.abs(menorSaldo))}.`
    });
  } else if (mesesNegativos > 0) {
    insights.push({
      type: 'info',
      severity: 3,
      category: 'liquidez',
      title: 'ℹ️ Período de Rampa Normal',
      message: `${mesesNegativos} meses com saldo negativo é normal. Projeto se recupera rapidamente.`
    });
  } else {
    insights.push({
      type: 'success',
      severity: 1,
      category: 'liquidez',
      title: '🚀 Fluxo de Caixa Positivo',
      message: `Saldo positivo desde o início! Co-investimento de ${(data.coInvestimento / 100).toFixed(1)}% e carência de ${data.carenciaMeses} meses garantem liquidez.`
    });
  }
}

function analyzeGrowth(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const taxaCrescimento = data.taxaCrescimento / 10000;
  const mesesParaCrescimento = data.mesEstabilizacao - data.mesAbertura;
  
  if (taxaCrescimento < 0.05) {
    insights.push({
      type: 'warning',
      severity: 5,
      category: 'rentabilidade',
      title: '🐌 Crescimento Lento',
      message: `Taxa de ${(taxaCrescimento * 100).toFixed(1)}% a.m. levará ${mesesParaCrescimento} meses para atingir ${data.clientesSteadyState} clientes.`,
      recommendation: 'Invista em marketing digital, parcerias ou programas de indicação para acelerar aquisição.'
    });
  } else if (taxaCrescimento > 0.15) {
    insights.push({
      type: 'info',
      severity: 4,
      category: 'rentabilidade',
      title: '🚀 Crescimento Agressivo',
      message: `Taxa de ${(taxaCrescimento * 100).toFixed(1)}% a.m. é otimista. Certifique-se de ter capacidade operacional para suportar.`,
      recommendation: 'Planeje contratações e expansão de infraestrutura com antecedência.'
    });
  }
}

function analyzeCapitalStructure(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const { valorFranqueado, valorInvestidores } = data.indicadores;
  const percentualInvestimento = (valorFranqueado / data.valorCaptacao) * 100;
  
  if (percentualInvestimento > 30) {
    insights.push({
      type: 'warning',
      severity: 5,
      category: 'estrutura',
      title: '💰 Alto Investimento Próprio',
      message: `Co-investimento de R$ ${formatCurrency(valorFranqueado)} (${percentualInvestimento.toFixed(1)}%) compromete muito capital próprio.`,
      recommendation: 'Considere reduzir co-investimento para preservar liquidez, mesmo que aumente custo de capital.'
    });
  } else if (percentualInvestimento < 15) {
    insights.push({
      type: 'info',
      severity: 3,
      category: 'estrutura',
      title: '📊 Baixo Investimento Próprio',
      message: `Co-investimento de apenas R$ ${formatCurrency(valorFranqueado)} (${percentualInvestimento.toFixed(1)}%). Alta alavancagem, mas também maior custo de juros.`
    });
  } else {
    insights.push({
      type: 'success',
      severity: 2,
      category: 'estrutura',
      title: '✅ Estrutura de Capital Equilibrada',
      message: `Co-investimento de ${percentualInvestimento.toFixed(1)}% está balanceado entre risco e custo de capital.`
    });
  }
}

function analyzeAmortizationModel(data: ViabilityAnalysisData, insights: FinancialInsight[]) {
  const { modeloPagamento } = data;
  
  if (modeloPagamento === 'SAC') {
    insights.push({
      type: 'info',
      severity: 3,
      category: 'estrutura',
      title: 'ℹ️ Modelo SAC',
      message: 'Amortização constante reduz juros ao longo do tempo. Parcelas maiores no início, menores no final.'
    });
  } else if (modeloPagamento === 'PRICE') {
    insights.push({
      type: 'info',
      severity: 3,
      category: 'estrutura',
      title: 'ℹ️ Modelo PRICE',
      message: 'Parcelas fixas facilitam planejamento financeiro, mas juros totais são maiores que SAC.'
    });
  } else if (modeloPagamento === 'BULLET') {
    const mesesNegativos = data.fluxoCaixa.filter(m => m.saldoAcumulado < 0).length;
    if (mesesNegativos > data.carenciaMeses) {
      insights.push({
        type: 'warning',
        severity: 6,
        category: 'liquidez',
        title: '⚠️ BULLET com Carência Insuficiente',
        message: `Modelo BULLET exige carência de ${data.carenciaMeses} meses, mas projeto tem ${mesesNegativos} meses de saldo negativo.`,
        recommendation: 'Aumente carência ou escolha SAC/PRICE para distribuir amortização.'
      });
    } else {
      insights.push({
        type: 'success',
        severity: 2,
        category: 'estrutura',
        title: '✅ BULLET Adequado',
        message: `Modelo BULLET com carência de ${data.carenciaMeses} meses está alinhado ao período de rampa.`
      });
    }
  }
}

// Helpers

function calcularOpexTotal(data: ViabilityAnalysisData): number {
  return (
    data.opexAluguel +
    data.opexPessoal +
    data.opexRoyalties +
    data.opexMarketing +
    data.opexUtilidades +
    data.opexManutencao +
    data.opexSeguros +
    data.opexOutros
  );
}

function identifyOpexOffenders(data: ViabilityAnalysisData): Array<{ name: string; value: number; impact: string }> {
  const items = [
    { name: 'Aluguel + Condomínio', value: data.opexAluguel },
    { name: 'Pessoal', value: data.opexPessoal },
    { name: 'Royalties', value: data.opexRoyalties },
    { name: 'Marketing', value: data.opexMarketing },
    { name: 'Utilidades', value: data.opexUtilidades },
    { name: 'Manutenção', value: data.opexManutencao },
    { name: 'Seguros', value: data.opexSeguros },
    { name: 'Outros', value: data.opexOutros },
  ];
  
  const total = items.reduce((sum, item) => sum + item.value, 0);
  
  return items
    .filter(item => item.value > 0)
    .map(item => ({
      name: item.name,
      value: item.value,
      impact: `${((item.value / total) * 100).toFixed(1)}% do OPEX (R$ ${formatCurrency(item.value)})`
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

function identifyCapexOffenders(data: ViabilityAnalysisData): Array<{ name: string; value: number; impact: string }> {
  const items = [
    { name: 'Obras e Infraestrutura', value: data.capexObras },
    { name: 'Equipamentos', value: data.capexEquipamentos },
    { name: 'Licenças', value: data.capexLicencas },
    { name: 'Marketing de Lançamento', value: data.capexMarketing },
    { name: 'Capital de Giro', value: data.capexCapitalGiro },
    { name: 'Outros', value: data.capexOutros },
  ];
  
  const total = items.reduce((sum, item) => sum + item.value, 0);
  
  return items
    .filter(item => item.value > 0)
    .map(item => ({
      name: item.name,
      value: item.value,
      impact: `${((item.value / total) * 100).toFixed(1)}% do CAPEX (R$ ${formatCurrency(item.value)})`
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valueInCents / 100);
}
