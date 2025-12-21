/**
 * Patch 8: Testes de Cenários (Automático vs Livre)
 * Valida cálculo de múltiplos cenários (Base, Conservador, Otimista)
 */

import { describe, it, expect } from "vitest";
import {
  calcularAnaliseViabilidadeCenarios,
  SCENARIOS_PADRAO,
  type ViabilityInput,
  type ScenarioConfig,
} from "../viabilityCalculations";

describe("Patch 8: Cenários (Automático vs Livre)", () => {
  // Input base para testes
  const inputBase: ViabilityInput = {
    // Captação
    valorCaptacao: 100000000, // R$ 1M
    coInvestimento: 2000, // 20%
    feeFixo: 2500000, // R$ 25k
    taxaSucesso: 500, // 5%
    // Remuneração
    taxaJurosMensal: 185, // 1.85%
    prazoMeses: 48,
    carenciaMeses: 6,
    modeloPagamento: "SAC",
    // CAPEX
    capexObras: 30000000, // R$ 300k
    capexEquipamentos: 20000000, // R$ 200k
    capexLicencas: 5000000, // R$ 50k
    capexMarketing: 5000000, // R$ 50k
    capexCapitalGiro: 10000000, // R$ 100k
    capexOutros: 0,
    // OPEX (legado, não usado no modelo genérico)
    opexAluguel: 0,
    opexPessoal: 0,
    opexRoyalties: 0,
    opexMarketing: 0,
    opexUtilidades: 0,
    opexManutencao: 0,
    opexSeguros: 0,
    opexOutros: 0,
    // Receitas (legado, não usado no modelo genérico)
    ticketMedio: 0,
    capacidadeMaxima: 0,
    mesAbertura: 3,
    clientesInicio: 0,
    taxaCrescimento: 0,
    mesEstabilizacao: 15,
    clientesSteadyState: 0,
    // Patch 6.2: Modelo genérico
    receitas: [
      {
        nome: "Produto A",
        precoUnitario: 10000, // R$ 100
        quantidadeMensal: 1000, // 1000 unidades
        crescimentoMensalPct: 0, // Sem crescimento
        custoVariavelPct: 30, // 30% de custo variável
      },
    ],
    custosFixos: [
      {
        nome: "Aluguel",
        valorMensal: 500000, // R$ 5k
        reajusteAnualPct: 0,
      },
    ],
  };

  it("Teste 1: Presets retornam 3 resultados (Base/Conservador/Otimista)", () => {
    const resultados = calcularAnaliseViabilidadeCenarios(inputBase, SCENARIOS_PADRAO);

    expect(resultados).toHaveLength(3);
    expect(resultados[0].scenario).toBe("Base");
    expect(resultados[1].scenario).toBe("Conservador");
    expect(resultados[2].scenario).toBe("Otimista");

    // Cada resultado tem fluxoCaixa, indicadores e config
    resultados.forEach(r => {
      expect(r.fluxoCaixa).toBeDefined();
      expect(r.fluxoCaixa.length).toBe(60);
      expect(r.indicadores).toBeDefined();
      expect(r.config).toBeDefined();
    });
  });

  it("Teste 2: Conservador tem EBITDA <= Base (em cenário típico)", () => {
    const resultados = calcularAnaliseViabilidadeCenarios(inputBase, SCENARIOS_PADRAO);

    const base = resultados.find(r => r.scenario === "Base")!;
    const conservador = resultados.find(r => r.scenario === "Conservador")!;

    // Mês 12: Conservador deve ter EBITDA menor ou igual ao Base
    const ebitdaBaseMes12 = base.fluxoCaixa[11].ebitda;
    const ebitdaConservadorMes12 = conservador.fluxoCaixa[11].ebitda;

    expect(ebitdaConservadorMes12).toBeLessThanOrEqual(ebitdaBaseMes12);
  });

  it("Teste 3: Otimista tem Receita Bruta mês 12 > Base", () => {
    const resultados = calcularAnaliseViabilidadeCenarios(inputBase, SCENARIOS_PADRAO);

    const base = resultados.find(r => r.scenario === "Base")!;
    const otimista = resultados.find(r => r.scenario === "Otimista")!;

    const receitaBaseMes12 = base.fluxoCaixa[11].receitaBruta;
    const receitaOtimistaMes12 = otimista.fluxoCaixa[11].receitaBruta;

    expect(receitaOtimistaMes12).toBeGreaterThan(receitaBaseMes12);
  });

  it("Teste 4: Custom usa multiplicadores enviados", () => {
    const cenariosCustom: ScenarioConfig[] = [
      { nome: "Base", multiplicadorReceita: 1, multiplicadorCustoVariavel: 1, multiplicadorOpex: 1 },
      { nome: "Conservador", multiplicadorReceita: 0.7, multiplicadorCustoVariavel: 1.2, multiplicadorOpex: 1.2 },
      { nome: "Otimista", multiplicadorReceita: 1.3, multiplicadorCustoVariavel: 0.8, multiplicadorOpex: 0.9 },
    ];

    const resultados = calcularAnaliseViabilidadeCenarios(inputBase, cenariosCustom);

    const base = resultados.find(r => r.scenario === "Base")!;
    const conservador = resultados.find(r => r.scenario === "Conservador")!;
    const otimista = resultados.find(r => r.scenario === "Otimista")!;

    // Receita Base mês 1: 1000 * 10000 = 10.000.000 centavos (R$ 100k)
    const receitaBaseMes1 = base.fluxoCaixa[0].receitaBruta;
    expect(receitaBaseMes1).toBe(10000000); // R$ 100k

    // Receita Conservador mês 1: 10.000.000 * 0.7 = 7.000.000 centavos (R$ 70k)
    const receitaConservadorMes1 = conservador.fluxoCaixa[0].receitaBruta;
    expect(receitaConservadorMes1).toBe(7000000); // R$ 70k

    // Receita Otimista mês 1: 10.000.000 * 1.3 = 13.000.000 centavos (R$ 130k)
    const receitaOtimistaMes1 = otimista.fluxoCaixa[0].receitaBruta;
    expect(receitaOtimistaMes1).toBe(13000000); // R$ 130k
  });

  it("Teste 5: Retrocompatibilidade (input legado retorna Base)", () => {
    const inputLegado: ViabilityInput = {
      ...inputBase,
      receitas: undefined, // Sem modelo genérico
      custosFixos: undefined,
      // Usar campos legados
      ticketMedio: 50000, // R$ 500
      capacidadeMaxima: 200,
      clientesInicio: 50,
      taxaCrescimento: 1000, // 10%
      clientesSteadyState: 150,
      opexAluguel: 500000, // R$ 5k
      opexPessoal: 1000000, // R$ 10k
    };

    const resultados = calcularAnaliseViabilidadeCenarios(inputLegado, SCENARIOS_PADRAO);

    expect(resultados).toHaveLength(3);
    
    // Modelo legado não aplica multiplicadores (sempre Base)
    // Todos os cenários devem ter os mesmos valores
    const base = resultados[0];
    const conservador = resultados[1];
    const otimista = resultados[2];

    expect(base.fluxoCaixa[0].receitaBruta).toBe(conservador.fluxoCaixa[0].receitaBruta);
    expect(base.fluxoCaixa[0].receitaBruta).toBe(otimista.fluxoCaixa[0].receitaBruta);
  });

  it("Teste 6: Custo variável respeita multiplicadorCustoVariavel", () => {
    const resultados = calcularAnaliseViabilidadeCenarios(inputBase, SCENARIOS_PADRAO);

    const base = resultados.find(r => r.scenario === "Base")!;
    const conservador = resultados.find(r => r.scenario === "Conservador")!;

    // Custo variável Base mês 1: 10.000.000 * 30% = 3.000.000 centavos (R$ 30k)
    const custoVarBaseMes1 = base.fluxoCaixa[0].custoVariavel!;
    expect(custoVarBaseMes1).toBe(3000000);

    // Custo variável Conservador mês 1: 3.000.000 * 1.1 = 3.300.000 centavos (R$ 33k)
    const custoVarConservadorMes1 = conservador.fluxoCaixa[0].custoVariavel!;
    expect(custoVarConservadorMes1).toBe(3300000);
  });
});
