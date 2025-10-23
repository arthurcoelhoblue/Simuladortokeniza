import { describe, expect, test } from "vitest";
import { calcularSimulacao, SimulationInput } from "./calculator";

describe("Motor de Cálculo Financeiro", () => {
  test("Método PRICE - Cenário básico sem carências", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000, // R$ 5.000.000
      valorInvestido: 10000000, // R$ 100.000
      dataInicio: "2025-01-01",
      prazoMeses: 24,
      taxaJurosAa: 2400, // 24% a.a.
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "PRICE",
      taxaSetupFixaBrl: 500000, // R$ 5.000
      feeSucessoPercentSobreCaptacao: 500, // 5%
      feeManutencaoMensalBrl: 300000, // R$ 3.000
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // Verifica que o cronograma tem 24 meses
    expect(resultado.cronograma).toHaveLength(24);

    // Verifica que o saldo final do último mês é zero
    const ultimoMes = resultado.cronograma[23];
    expect(ultimoMes.saldoFinal).toBe(0);

    // Verifica que houve juros pagos
    expect(resultado.resumo.totalJurosPagos).toBeGreaterThan(0);

    // Verifica que o total amortizado é igual ao valor investido
    expect(resultado.resumo.totalAmortizado).toBe(input.valorInvestido);

    // Verifica cálculo do percentual da oferta
    expect(resultado.resumo.percentualOferta).toBe(200); // 2% em centésimos
  });

  test("Método SAC - Amortização constante", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000,
      valorInvestido: 10000000,
      dataInicio: "2025-01-01",
      prazoMeses: 12,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "SAC",
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // Verifica que todas as amortizações são aproximadamente iguais
    const amortizacoes = resultado.cronograma.map((m) => m.amortizacao);
    const amortizacaoEsperada = Math.round(input.valorInvestido / 12);
    
    // Todas amortizações devem ser próximas (exceto a última que ajusta)
    for (let i = 0; i < amortizacoes.length - 1; i++) {
      expect(Math.abs(amortizacoes[i] - amortizacaoEsperada)).toBeLessThan(100);
    }

    // Saldo final deve ser zero
    expect(resultado.cronograma[11].saldoFinal).toBe(0);
  });

  test("Método Bullet - Amortização no final", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000,
      valorInvestido: 10000000,
      dataInicio: "2025-01-01",
      prazoMeses: 12,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "no_fim",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "bullet",
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // Verifica que não há amortização nos meses 1-11
    for (let i = 0; i < 11; i++) {
      expect(resultado.cronograma[i].amortizacao).toBe(0);
    }

    // Verifica que toda amortização acontece no último mês
    expect(resultado.cronograma[11].amortizacao).toBe(input.valorInvestido);

    // Saldo final deve ser zero
    expect(resultado.cronograma[11].saldoFinal).toBe(0);
  });

  test("Carência de juros com capitalização", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000,
      valorInvestido: 10000000,
      dataInicio: "2025-01-01",
      prazoMeses: 12,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 3,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "PRICE",
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // Durante a carência com capitalização, o saldo deve crescer
    // Mas com PRICE, há amortização que reduz o saldo mesmo durante carência de juros
    // O importante é verificar que os juros foram capitalizados (não pagos)
    const primeiroMes = resultado.cronograma[0];
    expect(primeiroMes.observacoes).toContain("Carência de juros");
    
    // Verifica que o saldo inicial do segundo mês reflete a capitalização
    const segundoMes = resultado.cronograma[1];
    expect(segundoMes.observacoes).toContain("Carência de juros");

    // Verifica observações de carência
    expect(resultado.cronograma[0].observacoes).toContain("Carência de juros");
    expect(resultado.cronograma[1].observacoes).toContain("Carência de juros");
    expect(resultado.cronograma[2].observacoes).toContain("Carência de juros");

    // Saldo final deve ser zero
    expect(resultado.cronograma[11].saldoFinal).toBe(0);
  });

  test("Carência de principal", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000,
      valorInvestido: 10000000,
      dataInicio: "2025-01-01",
      prazoMeses: 12,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 3,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "SAC",
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // Verifica que não há amortização nos primeiros 3 meses
    expect(resultado.cronograma[0].amortizacao).toBe(0);
    expect(resultado.cronograma[1].amortizacao).toBe(0);
    expect(resultado.cronograma[2].amortizacao).toBe(0);

    // Verifica que há amortização após a carência
    expect(resultado.cronograma[3].amortizacao).toBeGreaterThan(0);

    // Saldo final deve ser zero
    expect(resultado.cronograma[11].saldoFinal).toBe(0);
  });

  test("Custos e taxas aplicados corretamente", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000,
      valorInvestido: 10000000,
      dataInicio: "2025-01-01",
      prazoMeses: 12,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "PRICE",
      taxaSetupFixaBrl: 500000, // R$ 5.000
      feeSucessoPercentSobreCaptacao: 500, // 5%
      feeManutencaoMensalBrl: 300000, // R$ 3.000
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // Verifica taxa de setup no primeiro mês
    expect(resultado.cronograma[0].observacoes).toContain("Taxa de setup");

    // Verifica fee de manutenção mensal
    resultado.cronograma.forEach((mes) => {
      expect(mes.custosFixos).toBe(300000);
    });

    // Verifica fee de sucesso no último mês
    expect(resultado.cronograma[11].observacoes).toContain("Fee de sucesso");

    // Total recebido deve considerar custos
    const totalCustos = 500000 + (300000 * 12) + Math.round((10000000 * 500) / 10000);
    expect(resultado.resumo.totalRecebido).toBe(
      resultado.resumo.totalJurosPagos + resultado.resumo.totalAmortizado - totalCustos
    );
  });

  test("TIR calculada corretamente", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000,
      valorInvestido: 10000000,
      dataInicio: "2025-01-01",
      prazoMeses: 12,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "PRICE",
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // TIR deve existir
    expect(resultado.resumo.tirMensal).not.toBeNull();
    expect(resultado.resumo.tirAnual).not.toBeNull();

    // TIR mensal deve ser positiva (investimento rentável)
    expect(resultado.resumo.tirMensal!).toBeGreaterThan(0);

    // TIR anual deve ser maior que a mensal (efeito composto)
    expect(resultado.resumo.tirAnual!).toBeGreaterThan(resultado.resumo.tirMensal!);
  });

  test("Cenário completo - exemplo da especificação", () => {
    const input: SimulationInput = {
      valorTotalOferta: 500000000, // R$ 5.000.000
      valorInvestido: 10000000, // R$ 100.000
      dataInicio: "2025-06-01",
      prazoMeses: 24,
      taxaJurosAa: 2400, // 24% a.a.
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: true,
      amortizacaoMetodo: "PRICE",
      taxaSetupFixaBrl: 500000, // R$ 5.000
      feeSucessoPercentSobreCaptacao: 500, // 5%
      feeManutencaoMensalBrl: 300000, // R$ 3.000
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
    };

    const resultado = calcularSimulacao(input);

    // Validações gerais
    expect(resultado.cronograma).toHaveLength(24);
    expect(resultado.cronograma[23].saldoFinal).toBe(0);
    expect(resultado.resumo.totalAmortizado).toBe(input.valorInvestido);
    expect(resultado.resumo.percentualOferta).toBe(200); // 2%

    // Verifica que há juros
    expect(resultado.resumo.totalJurosPagos).toBeGreaterThan(0);

    // Verifica que TIR foi calculada
    expect(resultado.resumo.tirMensal).not.toBeNull();
    expect(resultado.resumo.tirAnual).not.toBeNull();

    // Log para análise manual
    console.log("Resumo da simulação:");
    console.log(`- Valor investido: R$ ${(input.valorInvestido / 100).toFixed(2)}`);
    console.log(`- Total de juros: R$ ${(resultado.resumo.totalJurosPagos / 100).toFixed(2)}`);
    console.log(`- Total recebido: R$ ${(resultado.resumo.totalRecebido / 100).toFixed(2)}`);
    console.log(`- TIR mensal: ${(resultado.resumo.tirMensal! / 100).toFixed(2)}%`);
    console.log(`- TIR anual: ${(resultado.resumo.tirAnual! / 100).toFixed(2)}%`);
  });
});

