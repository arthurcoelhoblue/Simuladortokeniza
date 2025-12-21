/**
 * Patch 7: Testes de Custos Variáveis + Margem Bruta
 * 
 * Valida o cálculo de custo variável, receita líquida e margem bruta
 */

import { describe, it, expect } from 'vitest';
import { calcularAnaliseViabilidade } from '../viabilityCalculations';

describe('Patch 7: Custos Variáveis + Margem Bruta', () => {
  const baseInput = {
    nome: 'Teste Custo Variável',
    valorCaptacao: 20000000, // R$ 200k
    coInvestimento: 0,
    feeFixo: 200000, // R$ 2k
    taxaSucesso: 2000, // 20%
    taxaJurosMensal: 200, // 2%
    prazoMeses: 12,
    carenciaMeses: 3,
    modeloPagamento: 'BULLET' as const,
    capexObras: 5000000,
    capexEquipamentos: 3000000,
    capexLicencas: 1000000,
    capexMarketing: 500000,
    capexCapitalGiro: 500000,
    capexOutros: 0,
    opexAluguel: 1000000,
    opexPessoal: 2000000,
    opexMarketing: 500000,
    opexAdministrativo: 300000,
    opexOutros: 200000,
    ticketMedio: 15000,
    taxaCrescimentoMensal: 500,
    mesEstabilizacao: 12,
    clientesSteadyState: 100,
  };

  // Teste 1: Custo variável por receita (35%)
  it('Teste 1: Custo variável por receita (35%)', () => {
    const input = {
      ...baseInput,
      receitas: [
        {
          nome: 'Produto A',
          precoUnitario: 10000, // R$ 100
          quantidadeMensal: 100,
          crescimentoMensalPct: 0,
          custoVariavelPct: 35, // 35% de custo variável
        },
      ],
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];

    // Receita bruta = 100 * R$ 100 = R$ 10.000
    expect(mes1.receitaBruta).toBe(1000000); // R$ 10k em centavos

    // Custo variável = R$ 10.000 * 35% = R$ 3.500
    expect(mes1.custoVariavel).toBe(350000); // R$ 3.5k em centavos

    // Receita líquida = R$ 10.000 - R$ 3.500 = R$ 6.500
    expect(mes1.receitaLiquida).toBe(650000); // R$ 6.5k em centavos

    // Margem bruta = (R$ 6.500 / R$ 10.000) * 100 = 65%
    expect(mes1.margemBrutaPct).toBeCloseTo(65, 1);
  });

  // Teste 2: Custo variável global (20%)
  it('Teste 2: Custo variável global (20%)', () => {
    const input = {
      ...baseInput,
      receitas: [
        {
          nome: 'Produto A',
          precoUnitario: 10000,
          quantidadeMensal: 100,
          crescimentoMensalPct: 0,
          // Sem custoVariavelPct próprio
        },
      ],
      custoVariavelGlobalPct: 20, // 20% global
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];

    // Custo variável = R$ 10.000 * 20% = R$ 2.000
    expect(mes1.custoVariavel).toBe(200000);

    // Receita líquida = R$ 10.000 - R$ 2.000 = R$ 8.000
    expect(mes1.receitaLiquida).toBe(800000);

    // Margem bruta = 80%
    expect(mes1.margemBrutaPct).toBeCloseTo(80, 1);
  });

  // Teste 3: Custo variável próprio sobrescreve global
  it('Teste 3: Custo variável próprio sobrescreve global', () => {
    const input = {
      ...baseInput,
      receitas: [
        {
          nome: 'Produto A',
          precoUnitario: 10000,
          quantidadeMensal: 100,
          crescimentoMensalPct: 0,
          custoVariavelPct: 50, // 50% próprio
        },
      ],
      custoVariavelGlobalPct: 20, // 20% global (deve ser ignorado)
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];

    // Custo variável = R$ 10.000 * 50% = R$ 5.000 (usa próprio, não global)
    expect(mes1.custoVariavel).toBe(500000);

    // Margem bruta = 50%
    expect(mes1.margemBrutaPct).toBeCloseTo(50, 1);
  });

  // Teste 4: Múltiplas receitas com custos variáveis diferentes
  it('Teste 4: Múltiplas receitas com custos variáveis diferentes', () => {
    const input = {
      ...baseInput,
      receitas: [
        {
          nome: 'Produto A',
          precoUnitario: 10000, // R$ 100
          quantidadeMensal: 100,
          crescimentoMensalPct: 0,
          custoVariavelPct: 30, // 30%
        },
        {
          nome: 'Produto B',
          precoUnitario: 20000, // R$ 200
          quantidadeMensal: 50,
          crescimentoMensalPct: 0,
          custoVariavelPct: 40, // 40%
        },
      ],
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];

    // Receita bruta = (100 * R$ 100) + (50 * R$ 200) = R$ 10k + R$ 10k = R$ 20k
    expect(mes1.receitaBruta).toBe(2000000);

    // Custo variável = (R$ 10k * 30%) + (R$ 10k * 40%) = R$ 3k + R$ 4k = R$ 7k
    expect(mes1.custoVariavel).toBe(700000);

    // Receita líquida = R$ 20k - R$ 7k = R$ 13k
    expect(mes1.receitaLiquida).toBe(1300000);

    // Margem bruta = (R$ 13k / R$ 20k) * 100 = 65%
    expect(mes1.margemBrutaPct).toBeCloseTo(65, 1);
  });

  // Teste 5: Custo variável com crescimento mensal
  it('Teste 5: Custo variável com crescimento mensal', () => {
    const input = {
      ...baseInput,
      receitas: [
        {
          nome: 'Produto A',
          precoUnitario: 10000,
          quantidadeMensal: 100,
          crescimentoMensalPct: 10, // 10% crescimento
          custoVariavelPct: 30,
        },
      ],
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];
    const mes2 = result.fluxoCaixa[1];

    // Mês 1: Receita = R$ 10k, Custo var = R$ 3k
    expect(mes1.receitaBruta).toBe(1000000);
    expect(mes1.custoVariavel).toBe(300000);

    // Mês 2: Receita = R$ 10k * 1.1 = R$ 11k, Custo var = R$ 11k * 30% = R$ 3.3k
    expect(mes2.receitaBruta).toBeCloseTo(1100000, -2);
    expect(mes2.custoVariavel).toBeCloseTo(330000, -2);

    // Margem bruta permanece 70% (custo variável escala proporcionalmente)
    expect(mes1.margemBrutaPct).toBeCloseTo(70, 1);
    expect(mes2.margemBrutaPct).toBeCloseTo(70, 1);
  });

  // Teste 6: Sem custo variável (0%)
  it('Teste 6: Sem custo variável (0%)', () => {
    const input = {
      ...baseInput,
      receitas: [
        {
          nome: 'Serviço Puro',
          precoUnitario: 10000,
          quantidadeMensal: 100,
          crescimentoMensalPct: 0,
          custoVariavelPct: 0, // 0% custo variável
        },
      ],
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];

    // Custo variável = 0
    expect(mes1.custoVariavel).toBe(0);

    // Receita líquida = Receita bruta
    expect(mes1.receitaLiquida).toBe(mes1.receitaBruta);

    // Margem bruta = 100%
    expect(mes1.margemBrutaPct).toBe(100);
  });

  // Teste 7: EBITDA usa receita líquida (não bruta)
  it('Teste 7: EBITDA usa receita líquida (não bruta)', () => {
    const input = {
      ...baseInput,
      receitas: [
        {
          nome: 'Produto A',
          precoUnitario: 10000,
          quantidadeMensal: 100,
          crescimentoMensalPct: 0,
          custoVariavelPct: 40, // 40% custo variável
        },
      ],
      custosFixos: [
        {
          nome: 'OPEX Total',
          valorMensal: 4000000, // R$ 40k
          reajusteAnualPct: 0,
        },
      ],
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];

    // Receita bruta = R$ 10k (1000000 centavos)
    expect(mes1.receitaBruta).toBe(1000000);

    // Custo variável = R$ 4k (400000 centavos)
    expect(mes1.custoVariavel).toBe(400000);

    // Receita líquida = R$ 6k (600000 centavos)
    expect(mes1.receitaLiquida).toBe(600000);

    // OPEX = R$ 40k (4000000 centavos) - vem de custosFixos
    const opexTotal = 4000000;
    expect(opexTotal).toBe(4000000);

    // EBITDA = Receita líquida - OPEX = R$ 6k - R$ 40k = -R$ 34k
    // (negativo porque OPEX > Receita líquida)
    expect(mes1.ebitda).toBe(mes1.receitaLiquida - opexTotal);
    expect(mes1.ebitda).toBe(-3400000); // Confirma valor esperado
  });

  // Teste 8: Fallback legado (sem receitas[])
  it('Teste 8: Fallback legado (sem receitas[])', () => {
    const input = {
      ...baseInput,
      // Sem receitas[] → usa modelo legado
    };

    const result = calcularAnaliseViabilidade(input);
    const mes1 = result.fluxoCaixa[0];

    // Modelo legado não calcula custoVariavel, receitaLiquida, margemBrutaPct
    expect(mes1.custoVariavel).toBeUndefined();
    expect(mes1.receitaLiquida).toBeUndefined();
    expect(mes1.margemBrutaPct).toBeUndefined();

    // Mas EBITDA ainda existe (usa receita bruta - opex)
    expect(mes1.ebitda).toBeDefined();
  });
});
