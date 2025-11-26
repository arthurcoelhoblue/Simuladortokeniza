import { describe, it, expect, beforeAll } from "vitest";
import { getDb, createSimulation, upsertUser, getUserByOpenId, createLead, createOpportunity } from "./db";

describe("Pipedrive Pipelines - Investidor vs Emissor", () => {
  let userId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    await upsertUser({
      openId: "test-pipedrive-pipelines-user",
      name: "Test Pipedrive User",
      email: "pipedrive@test.com",
      lastSignedIn: new Date(),
    });

    const user = await getUserByOpenId("test-pipedrive-pipelines-user");
    if (!user) throw new Error("Usuário não encontrado");
    userId = user.id;
  });

  it("deve criar oportunidade tipo 'investidor' para simulação de investimento", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Criar lead
    const leadId = await createLead({
      nomeCompleto: "João Investidor",
      whatsapp: `11${Date.now().toString().slice(-8)}`,
      email: `investidor${Date.now()}@test.com`,
    });

    // 2. Criar simulação de INVESTIMENTO
    const simulationId = await createSimulation({
      userId,
      leadId,
      tipoSimulacao: "investimento",
      sistemaAmortizacao: "LINEAR",
      valorAporte: 10000000, // R$ 100.000,00
      valorDesejado: 10000000,
      valorTotalOferta: 10000000,
      prazoMeses: 24,
      taxaMensal: 2.0,
      taxaJurosAa: 24.0,
      totalJurosPagos: 0,
      totalAmortizado: 0,
      saldoDevedor: 10000000,
      version: 1,
      parentSimulationId: null,
      dataEncerramentoOferta: "2026-12-31",
    });

    // 3. Criar oportunidade
    const opportunityId = await createOpportunity({
      leadId,
      simulationId,
      ownerUserId: userId,
      status: "novo",
      probabilidade: 0,
      ticketEstimado: 10000000,
      tipoOportunidade: "investidor", // INVESTIDOR
    });

    // 4. Buscar oportunidade criada
    const [opportunity] = await db.select().from(await import("../drizzle/schema").then(m => m.opportunities)).where(
      (await import("drizzle-orm")).eq((await import("../drizzle/schema")).opportunities.id, opportunityId)
    );

    expect(opportunity).toBeDefined();
    expect(opportunity.tipoOportunidade).toBe("investidor");
    expect(opportunity.ticketEstimado).toBe(10000000);
  });

  it("deve criar oportunidade tipo 'emissor' para simulação de financiamento", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Criar lead
    const leadId = await createLead({
      nomeCompleto: "Maria Emissora",
      whatsapp: `11${Date.now().toString().slice(-8)}`,
      email: `emissora${Date.now()}@test.com`,
    });

    // 2. Criar simulação de FINANCIAMENTO
    const simulationId = await createSimulation({
      userId,
      leadId,
      tipoSimulacao: "financiamento",
      sistemaAmortizacao: "SAC",
      valorAporte: 5000000,
      valorDesejado: 20000000, // R$ 200.000,00
      valorTotalOferta: 20000000,
      prazoMeses: 36,
      taxaMensal: 1.5,
      taxaJurosAa: 18.0,
      totalJurosPagos: 0,
      totalAmortizado: 0,
      saldoDevedor: 20000000,
      version: 1,
      parentSimulationId: null,
      dataEncerramentoOferta: "2026-12-31",
    });

    // 3. Criar oportunidade
    const opportunityId = await createOpportunity({
      leadId,
      simulationId,
      ownerUserId: userId,
      status: "novo",
      probabilidade: 0,
      ticketEstimado: 20000000,
      tipoOportunidade: "emissor", // EMISSOR
    });

    // 4. Buscar oportunidade criada
    const [opportunity] = await db.select().from(await import("../drizzle/schema").then(m => m.opportunities)).where(
      (await import("drizzle-orm")).eq((await import("../drizzle/schema")).opportunities.id, opportunityId)
    );

    expect(opportunity).toBeDefined();
    expect(opportunity.tipoOportunidade).toBe("emissor");
    expect(opportunity.ticketEstimado).toBe(20000000);
  });

  it("deve validar helper getPipedrivePipelineAndStage para investidor", async () => {
    const { getPipedrivePipelineAndStage } = await import("./pipedriveMapping");
    
    const result = getPipedrivePipelineAndStage("investidor");
    
    expect(result).toHaveProperty("pipeline_id");
    expect(result).toHaveProperty("stage_id");
    // Se não configurado, retorna null
    expect(typeof result.pipeline_id === "number" || result.pipeline_id === null).toBe(true);
  });

  it("deve validar helper getPipedrivePipelineAndStage para emissor", async () => {
    const { getPipedrivePipelineAndStage } = await import("./pipedriveMapping");
    
    const result = getPipedrivePipelineAndStage("emissor");
    
    expect(result).toHaveProperty("pipeline_id");
    expect(result).toHaveProperty("stage_id");
    // Se não configurado, retorna null
    expect(typeof result.pipeline_id === "number" || result.pipeline_id === null).toBe(true);
  });
});
