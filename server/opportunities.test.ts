import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Oportunidades", () => {
  let testUserId: number;
  let testLeadId: number;
  let testSimulationId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    const userOpenId = `test-user-opp-${Date.now()}`;
    await db.upsertUser({
      openId: userOpenId,
      name: "Test User Opp",
      email: `test-opp-${Date.now()}@example.com`,
    });
    const user = await db.getUserByOpenId(userOpenId);
    if (!user) throw new Error("User not found");
    testUserId = user.id;

    // Criar lead de teste
    testLeadId = await db.createLead({
      nomeCompleto: "Lead Teste Opp",
      whatsapp: `119${Date.now().toString().slice(-8)}`,
      email: `lead-opp-${Date.now()}@example.com`,
    });

    // Criar simulação de teste
    testSimulationId = await db.createSimulation({
      userId: testUserId,
      leadId: testLeadId,
      tipoSimulacao: "investimento",
      modalidade: null,
      descricaoOferta: "Teste oportunidade",
      valorDesejado: 10000000,
      valorAporte: 10000000,
      valorTotalOferta: 50000000,
      prazoMeses: 24,
      dataEncerramentoOferta: "2026-12-31",
      taxaMensal: 181, // 1.81% em centavos
      taxaJurosAa: 24.0,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      sistemaAmortizacao: "LINEAR",
      possuiCarencia: 0,
      mesesCarencia: 0,
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: 0,
      tipoGarantia: "sem_garantia",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      pagamentoMinimoValor: 0,
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
      identificadorInvestidor: null,
      moedaReferencia: "BRL",
      totalJurosPagos: 0,
      totalAmortizado: 0,
      totalRecebido: 0,
      tirMensal: 0,
      tirAnual: 0,
      version: 1,
      parentSimulationId: null,
    });
  });

  it("1. Criar oportunidade a partir de simulação", async () => {
    const opportunityId = await db.createOpportunity({
      leadId: testLeadId,
      simulationId: testSimulationId,
      status: "novo",
      ticketEstimado: 10000000,
      probabilidade: 0,
    });

    expect(opportunityId).toBeGreaterThan(0);

    const opportunity = await db.getOpportunityById(opportunityId);
    expect(opportunity).toBeDefined();
    expect(opportunity?.leadId).toBe(testLeadId);
    expect(opportunity?.simulationId).toBe(testSimulationId);
    expect(opportunity?.status).toBe("novo");
    expect(opportunity?.ticketEstimado).toBe(10000000);
    expect(opportunity?.probabilidade).toBe(0);
  });

  it("2. Listar oportunidades sem filtro", async () => {
    const opportunities = await db.getOpportunities();
    expect(opportunities.length).toBeGreaterThan(0);
  });

  it("3. Filtrar oportunidades por status", async () => {
    const opportunities = await db.getOpportunities({ status: "novo" });
    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities.every((opp) => opp.status === "novo")).toBe(true);
  });

  it("4. Criar oportunidade com ownerUserId e nextAction", async () => {
    const opportunityId = await db.createOpportunity({
      leadId: testLeadId,
      simulationId: testSimulationId,
      ownerUserId: testUserId,
      status: "em_analise",
      ticketEstimado: 20000000,
      probabilidade: 50,
      nextAction: "Ligar para o cliente",
      nextActionAt: new Date("2025-12-01"),
    });

    expect(opportunityId).toBeGreaterThan(0);

    const opportunity = await db.getOpportunityById(opportunityId);
    expect(opportunity).toBeDefined();
    expect(opportunity?.ownerUserId).toBe(testUserId);
    expect(opportunity?.status).toBe("em_analise");
    expect(opportunity?.nextAction).toBe("Ligar para o cliente");
    expect(opportunity?.probabilidade).toBe(50);
  });

  it("5. Filtrar oportunidades por ownerUserId", async () => {
    const opportunities = await db.getOpportunities({ ownerUserId: testUserId });
    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities.every((opp) => opp.ownerUserId === testUserId)).toBe(true);
  });
});
