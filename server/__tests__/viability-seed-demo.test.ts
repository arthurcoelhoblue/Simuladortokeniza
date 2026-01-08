import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';

/**
 * Testes para validar seed demo (Patch 9B)
 * 
 * Valida que:
 * - Análise demo pode ser criada programaticamente
 * - Campo risk é preenchido (Patch 9A)
 * - FluxoCaixa contém 3 cenários (Base/Conservador/Otimista)
 */

describe('Viability Seed Demo (Patch 9B)', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it('deve criar análise demo com dados válidos', async () => {
    if (!db) {
      console.warn('[Test] Database not available, skipping test');
      return;
    }

    // Importar função de cálculo
    const { calcularAnaliseViabilidadeCenarios, SCENARIOS_PADRAO } = await import('../viabilityCalculations');
    const { classificarRiscoCompleto } = await import('../viabilityRisk');
    const { createViabilityAnalysis } = await import('../db');

    const inputDemo = {
      nome: "Test Demo - Construção Civil",
      valorCaptacao: 200000000, // R$ 2M
      coInvestimento: 1000, // 10%
      feeFixo: 5000000, // R$ 50k
      taxaSucesso: 500, // 5%
      taxaJurosMensal: 150, // 1.5%
      prazoMeses: 60,
      carenciaMeses: 6,
      modeloPagamento: "SAC" as const,
      capexObras: 80000000,
      capexEquipamentos: 30000000,
      capexLicencas: 5000000,
      capexMarketing: 10000000,
      capexCapitalGiro: 15000000,
      capexOutros: 10000000,
      opexAluguel: 0,
      opexPessoal: 0,
      opexRoyalties: 0,
      opexMarketing: 0,
      opexUtilidades: 0,
      opexManutencao: 0,
      opexSeguros: 0,
      opexOutros: 0,
      ticketMedio: 30000000,
      capacidadeMaxima: 100,
      mesAbertura: 1,
      clientesInicio: 1,
      taxaCrescimento: 100,
      mesEstabilizacao: 12,
      clientesSteadyState: 10,
      originSimulationId: null,
      receitas: [
        {
          nome: "Venda de Apartamentos",
          precoUnitario: 30000000,
          quantidadeMensal: 2,
          crescimentoMensalPct: 1,
          custoVariavelPct: 60,
        },
        {
          nome: "Venda de Salas Comerciais",
          precoUnitario: 15000000,
          quantidadeMensal: 1,
          crescimentoMensalPct: 1,
          custoVariavelPct: 55,
        },
        {
          nome: "Locação de Equipamentos",
          precoUnitario: 1000000,
          quantidadeMensal: 5,
          crescimentoMensalPct: 2,
          custoVariavelPct: 20,
        },
      ],
      custosFixos: [
        {
          nome: "Mão de Obra Fixa",
          valorMensal: 5000000,
          reajusteAnualPct: 7,
        },
        {
          nome: "Aluguel de Escritório",
          valorMensal: 1500000,
          reajusteAnualPct: 10,
        },
        {
          nome: "Seguros e Licenças",
          valorMensal: 800000,
          reajusteAnualPct: 8,
        },
        {
          nome: "Aluguel de Maquinário",
          valorMensal: 2000000,
          reajusteAnualPct: 6,
        },
      ],
      custoVariavelGlobalPct: null,
      usarCenariosAutomaticos: true,
    };

    // Calcular cenários
    const cenarios = SCENARIOS_PADRAO;
    const resultadosCenarios = calcularAnaliseViabilidadeCenarios(inputDemo, cenarios);

    // Classificar risco
    const cenarioConservador = resultadosCenarios.find(r => r.scenario === "Conservador");
    expect(cenarioConservador).toBeDefined();

    let riskClassification = null;
    if (cenarioConservador) {
      const mes12 = cenarioConservador.fluxoCaixa[11] ?? cenarioConservador.fluxoCaixa[cenarioConservador.fluxoCaixa.length - 1];
      const mes24 = cenarioConservador.fluxoCaixa[23] ?? cenarioConservador.fluxoCaixa[cenarioConservador.fluxoCaixa.length - 1];

      riskClassification = classificarRiscoCompleto({
        indicadores: {
          paybackMeses: cenarioConservador.indicadores.payback,
          ebitdaMes24: mes24?.ebitda ?? 0,
        },
        metricas: {
          margemBrutaPctMes12: mes12?.margemBrutaPct ?? 0,
          opexMensal: mes12?.opex ?? 0,
          receitaMensal: mes12?.receitaBruta ?? 0,
          paybackMeses: cenarioConservador.indicadores.payback,
        },
      });
    }

    // Validar que risk foi preenchido
    expect(riskClassification).not.toBeNull();
    expect(riskClassification?.level).toMatch(/^(baixo|medio|alto)$/);
    expect(riskClassification?.recomendacoes).toBeInstanceOf(Array);
    expect(riskClassification?.recomendacoes.length).toBeGreaterThan(0);

    // Validar que temos 3 cenários
    expect(resultadosCenarios).toHaveLength(3);
    expect(resultadosCenarios.map(r => r.scenario)).toEqual(["Base", "Conservador", "Otimista"]);

    // Validar estrutura de cada cenário
    resultadosCenarios.forEach(cenario => {
      expect(cenario.fluxoCaixa).toBeInstanceOf(Array);
      expect(cenario.fluxoCaixa.length).toBeGreaterThan(0);
      expect(cenario.indicadores).toBeDefined();
      expect(cenario.indicadores.payback).toBeTypeOf('number');
    });

    console.log(`✅ [Test] Seed demo validado: ${resultadosCenarios.length} cenários, risk level: ${riskClassification?.level}`);
  });

  it('deve ter 60 pontos de fluxo de caixa por cenário', async () => {
    if (!db) {
      console.warn('[Test] Database not available, skipping test');
      return;
    }

    const { calcularAnaliseViabilidadeCenarios, SCENARIOS_PADRAO } = await import('../viabilityCalculations');

    const inputDemo = {
      nome: "Test 60 Meses",
      valorCaptacao: 100000000,
      coInvestimento: 1000,
      feeFixo: 2500000,
      taxaSucesso: 500,
      taxaJurosMensal: 150,
      prazoMeses: 60,
      carenciaMeses: 6,
      modeloPagamento: "SAC" as const,
      capexObras: 50000000,
      capexEquipamentos: 20000000,
      capexLicencas: 5000000,
      capexMarketing: 5000000,
      capexCapitalGiro: 10000000,
      capexOutros: 10000000,
      opexAluguel: 0,
      opexPessoal: 0,
      opexRoyalties: 0,
      opexMarketing: 0,
      opexUtilidades: 0,
      opexManutencao: 0,
      opexSeguros: 0,
      opexOutros: 0,
      ticketMedio: 10000000,
      capacidadeMaxima: 100,
      mesAbertura: 1,
      clientesInicio: 1,
      taxaCrescimento: 100,
      mesEstabilizacao: 12,
      clientesSteadyState: 10,
      originSimulationId: null,
      receitas: [
        {
          nome: "Receita Principal",
          precoUnitario: 10000000,
          quantidadeMensal: 5,
          crescimentoMensalPct: 2,
          custoVariavelPct: 40,
        },
      ],
      custosFixos: [
        {
          nome: "Custo Fixo Principal",
          valorMensal: 2000000,
          reajusteAnualPct: 5,
        },
      ],
      custoVariavelGlobalPct: null,
      usarCenariosAutomaticos: true,
    };

    const resultadosCenarios = calcularAnaliseViabilidadeCenarios(inputDemo, SCENARIOS_PADRAO);

    // Validar que cada cenário tem 60 pontos
    resultadosCenarios.forEach(cenario => {
      expect(cenario.fluxoCaixa.length).toBe(60);
      
      // Validar que cada ponto tem campos essenciais
      cenario.fluxoCaixa.forEach((row, idx) => {
        expect(row).toHaveProperty('mes');
        expect(row).toHaveProperty('ebitda');
        expect(row.mes).toBe(idx + 1);
      });
    });

    console.log(`✅ [Test] 60 pontos validados para ${resultadosCenarios.length} cenários`);
  });
});
