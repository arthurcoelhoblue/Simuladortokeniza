/**
 * Módulo de cálculos financeiros para análise de viabilidade
 * Baseado na planilha de simulação de negócios tokenizados
 */

export interface ViabilityInput {
  // 1. CAPTAÇÃO
  valorCaptacao: number; // em centavos
  coInvestimento: number; // em basis points (2000 = 20%)
  feeFixo: number; // em centavos
  taxaSucesso: number; // em basis points (500 = 5%)
  
  // 2. REMUNERAÇÃO
  taxaJurosMensal: number; // em basis points (185 = 1.85%)
  prazoMeses: number;
  carenciaMeses: number;
  modeloPagamento: 'SAC' | 'PRICE' | 'BULLET';
  
  // 3. CAPEX
  capexObras: number;
  capexEquipamentos: number;
  capexLicencas: number;
  capexMarketing: number;
  capexCapitalGiro: number;
  capexOutros: number;
  
  // 4. OPEX
  opexAluguel: number;
  opexPessoal: number;
  opexRoyalties: number;
  opexMarketing: number;
  opexUtilidades: number;
  opexManutencao: number;
  opexSeguros: number;
  opexOutros: number;
  
  // 5. RECEITAS
  ticketMedio: number;
  capacidadeMaxima: number;
  mesAbertura: number;
  clientesInicio: number;
  taxaCrescimento: number; // em basis points
  mesEstabilizacao: number;
  clientesSteadyState: number;
}

export interface MesFluxo {
  mes: number;
  clientes: number;
  receitaBruta: number;
  opex: number;
  ebitda: number;
  amortizacao: number;
  juros: number;
  fluxoCaixaLivre: number;
  saldoAcumulado: number;
}

export interface Indicadores {
  capexTotal: number;
  opexMensal: number;
  valorInvestidores: number;
  valorFranqueado: number;
  successFee: number;
  totalJurosPagos: number;
  pontoEquilibrioOperacional: number; // mês
  payback: number; // mês
  margemEbitdaMedia: number; // percentual
  saldoFinal: number;
  viavel: boolean;
}

/**
 * Calcula valores derivados da captação
 */
function calcularValoresCaptacao(input: ViabilityInput) {
  const valorInvestidores = Math.round(input.valorCaptacao * (1 - input.coInvestimento / 10000));
  const valorFranqueado = input.valorCaptacao - valorInvestidores;
  const successFee = Math.round(input.valorCaptacao * (input.taxaSucesso / 10000));
  
  return { valorInvestidores, valorFranqueado, successFee };
}

/**
 * Calcula CAPEX total
 */
function calcularCapexTotal(input: ViabilityInput): number {
  return (
    input.capexObras +
    input.capexEquipamentos +
    input.capexLicencas +
    input.capexMarketing +
    input.capexCapitalGiro +
    input.capexOutros
  );
}

/**
 * Calcula OPEX mensal total
 */
function calcularOpexMensal(input: ViabilityInput): number {
  return (
    input.opexAluguel +
    input.opexPessoal +
    input.opexRoyalties +
    input.opexMarketing +
    input.opexUtilidades +
    input.opexManutencao +
    input.opexSeguros +
    input.opexOutros
  );
}

/**
 * Calcula número de clientes em um mês específico
 */
function calcularClientes(input: ViabilityInput, mes: number): number {
  // Antes da abertura: 0 clientes
  if (mes < input.mesAbertura) {
    return 0;
  }
  
  // Após estabilização: steady state
  if (mes >= input.mesEstabilizacao) {
    return input.clientesSteadyState;
  }
  
  // Durante crescimento: crescimento exponencial
  const mesesOperacao = mes - input.mesAbertura + 1;
  const taxaCrescimentoDecimal = input.taxaCrescimento / 10000;
  const clientes = Math.round(input.clientesInicio * Math.pow(1 + taxaCrescimentoDecimal, mesesOperacao - 1));
  
  // Limitar à capacidade máxima
  return Math.min(clientes, input.capacidadeMaxima);
}

/**
 * Calcula parcela de amortização e juros para um mês específico
 */
function calcularParcela(
  valorInvestidores: number,
  taxaJurosMensal: number,
  prazoMeses: number,
  carenciaMeses: number,
  modeloPagamento: string,
  mes: number
): { amortizacao: number; juros: number } {
  // Durante carência: só juros
  if (mes <= carenciaMeses) {
    const juros = Math.round(valorInvestidores * (taxaJurosMensal / 10000));
    return { amortizacao: 0, juros };
  }
  
  const mesesAmortizacao = prazoMeses - carenciaMeses;
  const mesAmortizacao = mes - carenciaMeses;
  
  if (mesAmortizacao > mesesAmortizacao) {
    return { amortizacao: 0, juros: 0 };
  }
  
  const taxaDecimal = taxaJurosMensal / 10000;
  
  if (modeloPagamento === 'SAC') {
    // SAC: amortização constante
    const amortizacao = Math.round(valorInvestidores / mesesAmortizacao);
    const saldoDevedor = valorInvestidores - (amortizacao * (mesAmortizacao - 1));
    const juros = Math.round(saldoDevedor * taxaDecimal);
    return { amortizacao, juros };
  }
  
  if (modeloPagamento === 'PRICE') {
    // PRICE: parcela constante
    const parcela = Math.round(
      valorInvestidores * (taxaDecimal * Math.pow(1 + taxaDecimal, mesesAmortizacao)) /
      (Math.pow(1 + taxaDecimal, mesesAmortizacao) - 1)
    );
    const saldoDevedor = valorInvestidores * Math.pow(1 + taxaDecimal, mesAmortizacao - 1) -
      parcela * ((Math.pow(1 + taxaDecimal, mesAmortizacao - 1) - 1) / taxaDecimal);
    const juros = Math.round(saldoDevedor * taxaDecimal);
    const amortizacao = parcela - juros;
    return { amortizacao, juros };
  }
  
  if (modeloPagamento === 'BULLET') {
    // BULLET: só juros durante o prazo, amortização no final
    const juros = Math.round(valorInvestidores * taxaDecimal);
    const amortizacao = mesAmortizacao === mesesAmortizacao ? valorInvestidores : 0;
    return { amortizacao, juros };
  }
  
  return { amortizacao: 0, juros: 0 };
}

/**
 * Calcula fluxo de caixa completo (60 meses)
 */
export function calcularFluxoCaixa(input: ViabilityInput): MesFluxo[] {
  const fluxo: MesFluxo[] = [];
  const { valorInvestidores } = calcularValoresCaptacao(input);
  const capexTotal = calcularCapexTotal(input);
  const opexMensal = calcularOpexMensal(input);
  
  let saldoAcumulado = input.valorCaptacao - capexTotal;
  
  for (let mes = 1; mes <= 60; mes++) {
    const clientes = calcularClientes(input, mes);
    const receitaBruta = clientes * input.ticketMedio;
    const opex = mes >= input.mesAbertura ? opexMensal : 0;
    const ebitda = receitaBruta - opex;
    
    const { amortizacao, juros } = calcularParcela(
      valorInvestidores,
      input.taxaJurosMensal,
      input.prazoMeses,
      input.carenciaMeses,
      input.modeloPagamento,
      mes
    );
    
    const fluxoCaixaLivre = ebitda - amortizacao - juros;
    saldoAcumulado += fluxoCaixaLivre;
    
    fluxo.push({
      mes,
      clientes,
      receitaBruta,
      opex,
      ebitda,
      amortizacao,
      juros,
      fluxoCaixaLivre,
      saldoAcumulado,
    });
  }
  
  return fluxo;
}

/**
 * Calcula ponto de equilíbrio operacional (mês em que EBITDA > 0)
 */
function calcularPontoEquilibrio(fluxo: MesFluxo[]): number {
  const mesEquilibrio = fluxo.findIndex(m => m.ebitda > 0);
  return mesEquilibrio === -1 ? 60 : mesEquilibrio + 1;
}

/**
 * Calcula payback (mês em que saldo acumulado > 0)
 */
function calcularPayback(fluxo: MesFluxo[]): number {
  const mesPayback = fluxo.findIndex(m => m.saldoAcumulado > 0);
  return mesPayback === -1 ? 60 : mesPayback + 1;
}

/**
 * Calcula margem EBITDA média
 */
function calcularMargemEbitda(fluxo: MesFluxo[]): number {
  const mesesOperacionais = fluxo.filter(m => m.receitaBruta > 0);
  if (mesesOperacionais.length === 0) return 0;
  
  const somaMargens = mesesOperacionais.reduce((acc, m) => {
    const margem = m.receitaBruta > 0 ? (m.ebitda / m.receitaBruta) * 100 : 0;
    return acc + margem;
  }, 0);
  
  return Math.round(somaMargens / mesesOperacionais.length);
}

/**
 * Calcula total de juros pagos
 */
function calcularTotalJuros(fluxo: MesFluxo[]): number {
  return fluxo.reduce((acc, m) => acc + m.juros, 0);
}

/**
 * Calcula todos os indicadores financeiros
 */
export function calcularIndicadores(input: ViabilityInput, fluxo: MesFluxo[]): Indicadores {
  const { valorInvestidores, valorFranqueado, successFee } = calcularValoresCaptacao(input);
  const capexTotal = calcularCapexTotal(input);
  const opexMensal = calcularOpexMensal(input);
  const totalJurosPagos = calcularTotalJuros(fluxo);
  const pontoEquilibrioOperacional = calcularPontoEquilibrio(fluxo);
  const payback = calcularPayback(fluxo);
  const margemEbitdaMedia = calcularMargemEbitda(fluxo);
  const saldoFinal = fluxo[fluxo.length - 1].saldoAcumulado;
  
  // Critério de viabilidade: payback < 48 meses E saldo final > 0
  const viavel = payback < 48 && saldoFinal > 0;
  
  return {
    capexTotal,
    opexMensal,
    valorInvestidores,
    valorFranqueado,
    successFee,
    totalJurosPagos,
    pontoEquilibrioOperacional,
    payback,
    margemEbitdaMedia,
    saldoFinal,
    viavel,
  };
}

/**
 * Função principal que calcula tudo
 */
export function calcularAnaliseViabilidade(input: ViabilityInput): {
  fluxoCaixa: MesFluxo[];
  indicadores: Indicadores;
} {
  const fluxoCaixa = calcularFluxoCaixa(input);
  const indicadores = calcularIndicadores(input, fluxoCaixa);
  
  return { fluxoCaixa, indicadores };
}
