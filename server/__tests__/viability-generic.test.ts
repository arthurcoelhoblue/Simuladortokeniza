/**
 * Patch 6.2: Testes de Cálculo Genérico de Viabilidade
 * Valida motor genérico com N receitas e N custos fixos
 */

import { describe, it, expect } from 'vitest';
import { calcularFluxoCaixa, ViabilityInput, ReceitaItem, CustoFixoItem } from '../viabilityCalculations';

// Base input para testes (valores mínimos necessários)
const baseInput: ViabilityInput = {
  // Captação
  valorCaptacao: 20000000, // R$ 200k
  coInvestimento: 2000, // 20%
  feeFixo: 500000, // R$ 5k
  taxaSucesso: 500, // 5%
  
  // Remuneração
  taxaJurosMensal: 185, // 1.85%
  prazoMeses: 18,
  carenciaMeses: 3,
  modeloPagamento: 'SAC',
  
  // CAPEX
  capexObras: 5000000,
  capexEquipamentos: 3000000,
  capexLicencas: 500000,
  capexMarketing: 1000000,
  capexCapitalGiro: 2000000,
  capexOutros: 500000,
  
  // OPEX (legado - não usado no modelo genérico)
  opexAluguel: 500000,
  opexPessoal: 1500000,
  opexRoyalties: 300000,
  opexMarketing: 200000,
  opexUtilidades: 150000,
  opexManutencao: 100000,
  opexSeguros: 50000,
  opexOutros: 200000,
  
  // Receitas (legado - não usado no modelo genérico)
  ticketMedio: 20000,
  capacidadeMaxima: 500,
  mesAbertura: 1,
  clientesInicio: 50,
  taxaCrescimento: 500, // 5%
  mesEstabilizacao: 12,
  clientesSteadyState: 200,
};

describe('Patch 6.2: Cálculo Genérico de Viabilidade', () => {
  
  it('Teste 1: Receita simples (1 receita sem crescimento)', () => {
    const receitas: ReceitaItem[] = [
      {
        nome: 'Produto A',
        precoUnitario: 10000, // R$ 100
        quantidadeMensal: 100,
        crescimentoMensalPct: 0, // sem crescimento
      },
    ];
    
    const input: ViabilityInput = {
      ...baseInput,
      receitas,
      custosFixos: [],
    };
    
    const fluxo = calcularFluxoCaixa(input);
    
    // Validar receita constante nos primeiros 3 meses
    expect(fluxo[0].receitaBruta).toBe(1000000); // R$ 10k (100 * R$ 100)
    expect(fluxo[1].receitaBruta).toBe(1000000);
    expect(fluxo[2].receitaBruta).toBe(1000000);
  });
  
  it('Teste 2: Múltiplas receitas (2 receitas diferentes)', () => {
    const receitas: ReceitaItem[] = [
      {
        nome: 'Produto A',
        precoUnitario: 10000, // R$ 100
        quantidadeMensal: 50,
      },
      {
        nome: 'Produto B',
        precoUnitario: 20000, // R$ 200
        quantidadeMensal: 30,
      },
    ];
    
    const input: ViabilityInput = {
      ...baseInput,
      receitas,
      custosFixos: [],
    };
    
    const fluxo = calcularFluxoCaixa(input);
    
    // Receita total = (50 * R$ 100) + (30 * R$ 200) = R$ 5k + R$ 6k = R$ 11k
    expect(fluxo[0].receitaBruta).toBe(1100000); // R$ 11k
  });
  
  it('Teste 3: Crescimento mensal (1 receita com crescimento)', () => {
    const receitas: ReceitaItem[] = [
      {
        nome: 'Produto A',
        precoUnitario: 10000, // R$ 100
        quantidadeMensal: 100,
        crescimentoMensalPct: 5, // 5% a.m.
      },
    ];
    
    const input: ViabilityInput = {
      ...baseInput,
      receitas,
      custosFixos: [],
    };
    
    const fluxo = calcularFluxoCaixa(input);
    
    // Mês 1: R$ 10k * 1.05^0 = R$ 10k
    expect(fluxo[0].receitaBruta).toBe(1000000);
    
    // Mês 2: R$ 10k * 1.05^1 = R$ 10.5k
    expect(fluxo[1].receitaBruta).toBe(1050000);
    
    // Mês 12: R$ 10k * 1.05^11 ≈ R$ 17.1k
    expect(fluxo[11].receitaBruta).toBeGreaterThan(1700000);
    expect(fluxo[11].receitaBruta).toBeLessThan(1720000);
  });
  
  it('Teste 4: Custos fixos (2 custos fixos)', () => {
    const receitas: ReceitaItem[] = [
      {
        nome: 'Produto A',
        precoUnitario: 10000,
        quantidadeMensal: 200, // R$ 20k/mês
      },
    ];
    
    const custosFixos: CustoFixoItem[] = [
      {
        nome: 'Aluguel',
        valorMensal: 500000, // R$ 5k
      },
      {
        nome: 'Pessoal',
        valorMensal: 1000000, // R$ 10k
      },
    ];
    
    const input: ViabilityInput = {
      ...baseInput,
      receitas,
      custosFixos,
    };
    
    const fluxo = calcularFluxoCaixa(input);
    
    // OPEX = R$ 5k + R$ 10k = R$ 15k
    expect(fluxo[0].opex).toBe(1500000);
    
    // EBITDA = R$ 20k - R$ 15k = R$ 5k
    expect(fluxo[0].ebitda).toBe(500000);
  });
  
  it('Teste 5: Fallback legado (input sem receitas)', () => {
    const input: ViabilityInput = {
      ...baseInput,
      // Sem receitas[] → deve usar modelo legado
    };
    
    const fluxo = calcularFluxoCaixa(input);
    
    // Modelo legado: receita = clientes * ticketMedio
    // Mês 1: 50 clientes * R$ 200 = R$ 10k
    expect(fluxo[0].clientes).toBe(50);
    expect(fluxo[0].receitaBruta).toBe(1000000);
    
    // OPEX legado: soma de todos os campos opex*
    const opexEsperado = 
      baseInput.opexAluguel +
      baseInput.opexPessoal +
      baseInput.opexRoyalties +
      baseInput.opexMarketing +
      baseInput.opexUtilidades +
      baseInput.opexManutencao +
      baseInput.opexSeguros +
      baseInput.opexOutros;
    
    expect(fluxo[0].opex).toBe(opexEsperado);
  });
  
  it('Teste Extra: Reajuste anual de custos fixos', () => {
    const receitas: ReceitaItem[] = [
      {
        nome: 'Produto A',
        precoUnitario: 10000,
        quantidadeMensal: 300, // R$ 30k/mês
      },
    ];
    
    const custosFixos: CustoFixoItem[] = [
      {
        nome: 'Aluguel',
        valorMensal: 1000000, // R$ 10k
        reajusteAnualPct: 10, // 10% a.a.
      },
    ];
    
    const input: ViabilityInput = {
      ...baseInput,
      receitas,
      custosFixos,
    };
    
    const fluxo = calcularFluxoCaixa(input);
    
    // Mês 1: R$ 10k
    expect(fluxo[0].opex).toBe(1000000);
    
    // Mês 12: R$ 10k (ainda não reajustou)
    expect(fluxo[11].opex).toBe(1000000);
    
    // Mês 13: R$ 10k * 1.10 = R$ 11k (primeiro reajuste)
    expect(fluxo[12].opex).toBe(1100000);
    
    // Mês 24: R$ 10k * 1.10 = R$ 11k (ainda no primeiro ano de reajuste)
    expect(fluxo[23].opex).toBe(1100000);
    
    // Mês 25: R$ 10k * 1.10^2 = R$ 12.1k (segundo reajuste)
    expect(fluxo[24].opex).toBe(1210000);
  });
});
