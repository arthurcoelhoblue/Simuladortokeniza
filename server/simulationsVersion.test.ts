import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { InsertSimulation } from "../drizzle/schema";

describe("Versionamento de Simulações", () => {
  let testUserId: number;
  let testLeadId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    await db.upsertUser({
      openId: `test-version-${Date.now()}`,
      name: "Teste Versionamento",
      email: "teste.version@example.com",
    });
    const user = await db.getUserByOpenId(`test-version-${Date.now() - 1}`);
    testUserId = user?.id || 1;

    // Criar lead de teste
    testLeadId = await db.createLead({
      nomeCompleto: "Lead Teste Versionamento",
      whatsapp: `119${Date.now().toString().slice(-8)}`,
      email: `lead.version.${Date.now()}@example.com`,
    });
  });

  it("1. Criar simulação simples - version=1, parentSimulationId=null", async () => {
    const simulationData: InsertSimulation = {
      userId: testUserId,
      leadId: testLeadId,
      tipoSimulacao: "investimento",
      modalidade: null,
      descricaoOferta: "Teste de versionamento",
      valorDesejado: 10000000, // R$ 100.000,00
      valorAporte: 10000000,
      valorTotalOferta: 50000000,
      prazoMeses: 24,
      dataEncerramentoOferta: "2025-12-31",
      taxaMensal: 200, // 2%
      taxaJurosAa: 2400, // 24%
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      sistemaAmortizacao: "LINEAR",
      possuiCarencia: 0,
      mesesCarencia: 0,
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: 1,
      tipoGarantia: "sem_garantia",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      pagamentoMinimoValor: null,
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
      modo: "investidor",
      identificadorInvestidor: null,
      moedaReferencia: "BRL",
      totalJurosPagos: 2260944,
      totalAmortizado: 10000000,
      totalRecebido: 12260944,
      tirMensal: 200,
      tirAnual: 2400,
      version: 1,
      parentSimulationId: null,
    };

    const simulationId = await db.createSimulation(simulationData);
    expect(simulationId).toBeGreaterThan(0);

    const simulation = await db.getSimulationById(simulationId);
    expect(simulation).toBeDefined();
    expect(simulation?.version).toBe(1);
    expect(simulation?.parentSimulationId).toBeNull();
  });

  it("2. Criar nova versão de simulação - version incrementado", async () => {
    // Criar simulação A
    const simulationA: InsertSimulation = {
      userId: testUserId,
      leadId: testLeadId,
      tipoSimulacao: "investimento",
      modalidade: null,
      descricaoOferta: "Simulação A - Original",
      valorDesejado: 10000000,
      valorAporte: 10000000,
      valorTotalOferta: 50000000,
      prazoMeses: 24,
      dataEncerramentoOferta: "2025-12-31",
      taxaMensal: 200,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      sistemaAmortizacao: "LINEAR",
      possuiCarencia: 0,
      mesesCarencia: 0,
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: 1,
      tipoGarantia: "sem_garantia",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      pagamentoMinimoValor: null,
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
      modo: "investidor",
      identificadorInvestidor: null,
      moedaReferencia: "BRL",
      totalJurosPagos: 2260944,
      totalAmortizado: 10000000,
      totalRecebido: 12260944,
      tirMensal: 200,
      tirAnual: 2400,
      version: 1,
      parentSimulationId: null,
    };

    const idA = await db.createSimulation(simulationA);
    expect(idA).toBeGreaterThan(0);

    // Criar simulação B com base em A (alterando prazo)
    const idB = await db.createSimulationVersion(idA, {
      prazoMeses: 36, // Alterar prazo de 24 para 36 meses
      descricaoOferta: "Simulação B - Nova Versão",
    });

    expect(idB).toBeGreaterThan(idA);

    const simA = await db.getSimulationById(idA);
    const simB = await db.getSimulationById(idB);

    expect(simA).toBeDefined();
    expect(simB).toBeDefined();

    // Verificar versionamento
    expect(simA?.version).toBe(1);
    expect(simA?.parentSimulationId).toBeNull();

    expect(simB?.version).toBe(2);
    expect(simB?.parentSimulationId).toBe(idA);

    // Verificar que campos foram clonados corretamente
    expect(simB?.valorAporte).toBe(simA?.valorAporte);
    expect(simB?.sistemaAmortizacao).toBe(simA?.sistemaAmortizacao);
    expect(simB?.leadId).toBe(simA?.leadId);

    // Verificar que override foi aplicado
    expect(simB?.prazoMeses).toBe(36);
    expect(simB?.descricaoOferta).toBe("Simulação B - Nova Versão");
  });

  it("3. Histórico consistente - ambas acessíveis via getById", async () => {
    // Criar simulação A
    const simulationA: InsertSimulation = {
      userId: testUserId,
      leadId: testLeadId,
      tipoSimulacao: "financiamento",
      modalidade: null,
      descricaoOferta: "Histórico - Versão 1",
      valorDesejado: 20000000,
      valorAporte: 5000000,
      valorTotalOferta: 20000000,
      prazoMeses: 12,
      dataEncerramentoOferta: "2026-01-31",
      taxaMensal: 150,
      taxaJurosAa: 1800,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      sistemaAmortizacao: "BULLET",
      possuiCarencia: 0,
      mesesCarencia: 0,
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: 1,
      tipoGarantia: "recebiveis_cartao",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      pagamentoMinimoValor: null,
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
      modo: "captador",
      identificadorInvestidor: null,
      moedaReferencia: "BRL",
      totalJurosPagos: 900000,
      totalAmortizado: 5000000,
      totalRecebido: 5900000,
      tirMensal: 150,
      tirAnual: 1800,
      version: 1,
      parentSimulationId: null,
    };

    const idA = await db.createSimulation(simulationA);

    // Criar B com base em A
    const idB = await db.createSimulationVersion(idA, {
      prazoMeses: 18,
      descricaoOferta: "Histórico - Versão 2",
    });

    // Verificar que ambas continuam acessíveis
    const simA = await db.getSimulationById(idA);
    const simB = await db.getSimulationById(idB);

    expect(simA).toBeDefined();
    expect(simB).toBeDefined();
    expect(simA?.id).toBe(idA);
    expect(simB?.id).toBe(idB);

    // Verificar que list traz ambas (por enquanto)
    const allSimulations = await db.getSimulationsByUserId(testUserId);
    const simulationIds = allSimulations.map((s) => s.id);

    expect(simulationIds).toContain(idA);
    expect(simulationIds).toContain(idB);
  });
});
