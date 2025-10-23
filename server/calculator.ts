/**
 * Motor de cálculo financeiro para simulações de investimento tokenizado
 * Implementa métodos PRICE, SAC e Bullet com carências configuráveis
 */

export interface SimulationInput {
  // Dados da oferta
  valorTotalOferta: number; // em centavos
  valorInvestido: number; // em centavos
  dataInicio: string; // YYYY-MM-DD
  prazoMeses: number;
  taxaJurosAa: number; // em centésimos de % (ex: 2400 = 24%)
  convencaoCalendario: "civil/365" | "30/360" | "252 úteis";
  tipoCapitalizacao: "simples" | "composta";

  // Regras de pagamento
  periodicidadeJuros: "mensal" | "semestral" | "anual" | "no_fim";
  periodicidadeAmortizacao: "mensal" | "no_fim";
  carenciaJurosMeses: number;
  carenciaPrincipalMeses: number;
  capitalizarJurosEmCarencia: boolean;
  amortizacaoMetodo: "PRICE" | "SAC" | "bullet";
  pagamentoMinimoValor?: number; // em centavos

  // Custos e taxas
  taxaSetupFixaBrl: number; // em centavos
  feeSucessoPercentSobreCaptacao: number; // em centésimos de %
  feeManutencaoMensalBrl: number; // em centavos
  taxaTransacaoPercent: number; // em centésimos de %
  aliquotaImpostoRendaPercent: number; // em centésimos de %
}

export interface CronogramaMes {
  mes: number;
  dataParcela: string;
  saldoInicial: number; // centavos
  juros: number; // centavos
  amortizacao: number; // centavos
  parcela: number; // centavos
  custosFixos: number; // centavos
  saldoFinal: number; // centavos
  observacoes: string;
}

export interface SimulationResult {
  cronograma: CronogramaMes[];
  resumo: {
    percentualOferta: number; // em centésimos de %
    taxaNominalAa: number; // em centésimos de %
    taxaEfetivaMensal: number; // em centésimos de %
    totalJurosPagos: number; // centavos
    totalAmortizado: number; // centavos
    totalRecebido: number; // centavos
    tirMensal: number | null; // em centésimos de %
    tirAnual: number | null; // em centésimos de %
  };
}

/**
 * Converte taxa anual para mensal conforme convenção
 */
function converterTaxaAaParaAm(
  taxaAa: number, // em centésimos de %
  tipo: "simples" | "composta"
): number {
  const taxaDecimal = taxaAa / 10000; // converte para decimal

  if (tipo === "simples") {
    return (taxaDecimal / 12) * 10000; // retorna em centésimos de %
  } else {
    // composta: i_m = (1 + i_a)^(1/12) - 1
    const taxaMensalDecimal = Math.pow(1 + taxaDecimal, 1 / 12) - 1;
    return taxaMensalDecimal * 10000; // retorna em centésimos de %
  }
}

/**
 * Adiciona meses a uma data
 */
function adicionarMeses(dataStr: string, meses: number): string {
  const data = new Date(dataStr + "T00:00:00Z");
  data.setUTCMonth(data.getUTCMonth() + meses);
  return data.toISOString().split("T")[0];
}

/**
 * Arredonda para centavos (half-even)
 */
function arredondar(valor: number): number {
  return Math.round(valor);
}

/**
 * Calcula parcela PRICE (constante)
 */
function calcularParcelaPRICE(
  principal: number,
  taxaMensal: number, // em centésimos de %
  numParcelas: number
): number {
  if (numParcelas === 0) return 0;
  
  const i = taxaMensal / 10000; // converte para decimal
  if (i === 0) return principal / numParcelas;
  
  const parcela = principal * (i * Math.pow(1 + i, numParcelas)) / (Math.pow(1 + i, numParcelas) - 1);
  return arredondar(parcela);
}

/**
 * Calcula TIR (Taxa Interna de Retorno) usando método de Newton-Raphson
 */
function calcularTIR(fluxos: number[]): number | null {
  if (fluxos.length < 2) return null;

  // Chute inicial: 1% ao mês
  let taxa = 0.01;
  const maxIteracoes = 100;
  const tolerancia = 0.0001;

  for (let iter = 0; iter < maxIteracoes; iter++) {
    let vpn = 0;
    let derivada = 0;

    for (let t = 0; t < fluxos.length; t++) {
      const fator = Math.pow(1 + taxa, t);
      vpn += fluxos[t] / fator;
      derivada -= (t * fluxos[t]) / (fator * (1 + taxa));
    }

    if (Math.abs(vpn) < tolerancia) {
      return taxa * 10000; // retorna em centésimos de %
    }

    if (derivada === 0) break;
    taxa = taxa - vpn / derivada;

    // Evita taxas negativas muito extremas
    if (taxa < -0.99) taxa = -0.99;
  }

  return null; // Não convergiu
}

/**
 * Motor principal de cálculo
 */
export function calcularSimulacao(input: SimulationInput): SimulationResult {
  const taxaMensalCentesimos = converterTaxaAaParaAm(
    input.taxaJurosAa,
    input.tipoCapitalizacao
  );
  const taxaMensalDecimal = taxaMensalCentesimos / 10000;

  const cronograma: CronogramaMes[] = [];
  let saldo = input.valorInvestido;
  
  // Determina número de parcelas para amortização
  const mesesComAmortizacao = input.prazoMeses - input.carenciaPrincipalMeses;
  
  // Calcula parcela PRICE se aplicável
  let parcelaPRICE = 0;
  if (input.amortizacaoMetodo === "PRICE" && mesesComAmortizacao > 0) {
    parcelaPRICE = calcularParcelaPRICE(
      input.valorInvestido,
      taxaMensalCentesimos,
      mesesComAmortizacao
    );
  }

  // Calcula amortização SAC se aplicável
  const amortizacaoSAC = input.amortizacaoMetodo === "SAC" && mesesComAmortizacao > 0
    ? arredondar(input.valorInvestido / mesesComAmortizacao)
    : 0;

  let totalJurosPagos = 0;
  let totalAmortizado = 0;
  
  // Custos são do captador, não afetam o fluxo do investidor
  // Mantemos apenas para referência no relatório

  // Gera cronograma mês a mês
  for (let mes = 1; mes <= input.prazoMeses; mes++) {
    const saldoInicial = saldo;
    const dataParcela = adicionarMeses(input.dataInicio, mes);
    
    // Calcula juros do período
    let juros = arredondar(saldoInicial * taxaMensalDecimal);
    
    let amortizacao = 0;
    let observacoes: string[] = [];

    // Verifica carência de juros
    const emCarenciaJuros = mes <= input.carenciaJurosMeses;
    if (emCarenciaJuros) {
      if (input.capitalizarJurosEmCarencia) {
        saldo += juros;
        observacoes.push("Carência de juros (capitalizados)");
      } else {
        observacoes.push("Carência de juros (não pagos)");
      }
    } else {
      totalJurosPagos += juros;
    }

    // Verifica carência de principal
    const emCarenciaPrincipal = mes <= input.carenciaPrincipalMeses;
    if (emCarenciaPrincipal) {
      amortizacao = 0;
      if (!emCarenciaJuros) {
        observacoes.push("Carência de principal");
      }
    } else {
      // Calcula amortização conforme método
      if (input.amortizacaoMetodo === "PRICE") {
        const jurosPagos = emCarenciaJuros ? 0 : juros;
        amortizacao = parcelaPRICE - jurosPagos;
        
        // Ajusta última parcela para zerar saldo
        if (mes === input.prazoMeses) {
          amortizacao = saldo;
        }
      } else if (input.amortizacaoMetodo === "SAC") {
        amortizacao = amortizacaoSAC;
        
        // Ajusta última parcela para zerar saldo
        if (mes === input.prazoMeses) {
          amortizacao = saldo;
        }
      } else if (input.amortizacaoMetodo === "bullet") {
        if (mes === input.prazoMeses) {
          amortizacao = saldo;
          observacoes.push("Amortização bullet (total no vencimento)");
        }
      }

      amortizacao = arredondar(amortizacao);
      totalAmortizado += amortizacao;
      saldo -= amortizacao;
    }

    // Calcula parcela total (juros + amortização que o investidor recebe)
    const jurosPagosNoMes = emCarenciaJuros ? 0 : juros;
    let parcela = jurosPagosNoMes + amortizacao;

    // Custos são do captador, não do investidor
    // Fee de manutenção mensal (apenas para referência, não deduzido do investidor)
    const custosFixos = input.feeManutencaoMensalBrl || 0;

    // Observações sobre custos do captador (informativos)
    if (mes === 1 && input.taxaSetupFixaBrl && input.taxaSetupFixaBrl > 0) {
      observacoes.push(`Taxa de setup (captador): R$ ${(input.taxaSetupFixaBrl / 100).toFixed(2)}`);
    }

    if (mes === input.prazoMeses && input.feeSucessoPercentSobreCaptacao && input.feeSucessoPercentSobreCaptacao > 0) {
      const feeSucesso = arredondar(
        (input.valorInvestido * input.feeSucessoPercentSobreCaptacao) / 10000
      );
      observacoes.push(`Fee de sucesso (captador): R$ ${(feeSucesso / 100).toFixed(2)}`);
    }

    const saldoFinal = saldo;

    cronograma.push({
      mes,
      dataParcela,
      saldoInicial,
      juros,
      amortizacao,
      parcela,
      custosFixos,
      saldoFinal,
      observacoes: observacoes.join("; "),
    });
  }

  // Calcula totais (do ponto de vista do investidor)
  // O investidor recebe juros + principal de volta
  const totalRecebido = totalJurosPagos + totalAmortizado;

  // Calcula TIR do ponto de vista do investidor
  // Fluxo: investimento inicial negativo, recebimentos mensais positivos
  const fluxos: number[] = [-input.valorInvestido]; // Investimento inicial (saída)
  for (const mes of cronograma) {
    // O investidor recebe juros + amortização
    // Custos são do captador, não afetam o fluxo do investidor
    const fluxoMes = mes.juros + mes.amortizacao;
    fluxos.push(fluxoMes);
  }

  const tirMensal = calcularTIR(fluxos);
  const tirAnual = tirMensal !== null
    ? arredondar((Math.pow(1 + tirMensal / 10000, 12) - 1) * 10000)
    : null;

  // Calcula percentual da oferta
  const percentualOferta = arredondar(
    (input.valorInvestido / input.valorTotalOferta) * 10000
  );

  return {
    cronograma,
    resumo: {
      percentualOferta,
      taxaNominalAa: input.taxaJurosAa,
      taxaEfetivaMensal: arredondar(taxaMensalCentesimos),
      totalJurosPagos,
      totalAmortizado,
      totalRecebido,
      tirMensal,
      tirAnual,
    },
  };
}

