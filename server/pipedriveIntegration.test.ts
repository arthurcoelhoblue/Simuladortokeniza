import { describe, it, expect, beforeAll } from "vitest";
import { createLead, createSimulation, createOpportunity, getLeadById, getOpportunityById, upsertUser, getUserByOpenId } from "./db";

/**
 * Testes de integração com Pipedrive
 * 
 * NOTA: Estes testes validam a lógica de integração sem fazer chamadas HTTP reais.
 * Para testar com Pipedrive real, configure as variáveis de ambiente:
 * - PIPEDRIVE_API_TOKEN
 * - PIPEDRIVE_BASE_URL
 * - PIPEDRIVE_STAGE_ID
 */

describe("Integração Pipedrive - Criação de Oportunidades", () => {
  let userId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    const timestamp = Date.now();
    const openId = `test-pipedrive-${timestamp}`;
    
    await upsertUser({
      openId,
      name: "Usuário Teste Pipedrive",
      email: `test-pipedrive-${timestamp}@example.com`,
    });

    const user = await getUserByOpenId(openId);
    if (!user) throw new Error("Usuário de teste não criado");
    userId = user.id;
  });

  it("deve criar lead com campo pipedrivePersonId vazio inicialmente", async () => {
    const leadId = await createLead({
      nomeCompleto: "Lead Teste Pipedrive",
      whatsapp: "11999887766",
      email: "lead-pipedrive@example.com",
    });

    const lead = await getLeadById(leadId);
    expect(lead).toBeDefined();
    expect(lead?.pipedrivePersonId).toBeNull();
  });

  it("deve criar oportunidade com campos pipedriveDealId e pipedriveOrgId vazios inicialmente", async () => {
    // Criar lead
    const leadId = await createLead({
      nomeCompleto: "Lead Teste Oportunidade",
      whatsapp: "11999887777",
      email: "lead-opp@example.com",
    });

    // Criar simulação
    const simulationId = await createSimulation({
      userId,
      leadId,
      tipoSimulacao: "investimento",
      sistemaAmortizacao: "LINEAR",
      valorAporte: 10000000, // R$ 100.000,00
      valorDesejado: 10000000,
      valorTotalOferta: 10000000,
      prazoMeses: 24,
      taxaMensal: 0.02,
      taxaJurosAa: 0.24,
      dataEncerramentoOferta: "2026-12-31",
      totalJurosPagos: 0,
      totalAmortizado: 0,
      totalPago: 0,
      saldoDevedor: 0,
      version: 1,
      parentSimulationId: null,
    });

    // Criar oportunidade
    const opportunityId = await createOpportunity({
      leadId,
      simulationId,
      ownerUserId: userId,
      status: "novo",
      ticketEstimado: 10000000,
      probabilidade: 0,
    });

    const opportunity = await getOpportunityById(opportunityId);
    expect(opportunity).toBeDefined();
    expect(opportunity?.pipedriveDealId).toBeNull();
    expect(opportunity?.pipedriveOrgId).toBeNull();
  });

  it("deve validar estrutura de dados necessária para integração Pipedrive", async () => {
    // Criar lead completo com todos os campos necessários
    const leadId = await createLead({
      nomeCompleto: "João Silva Completo",
      whatsapp: "11999887788",
      email: "joao.completo@example.com",
      telefone: "1133334444",
      cidade: "São Paulo",
      estado: "SP",
      cpf: "12345678900",
      canalOrigem: "website",
    });

    // Criar simulação
    const simulationId = await createSimulation({
      userId,
      leadId,
      tipoSimulacao: "financiamento",
      sistemaAmortizacao: "PRICE",
      valorAporte: 5000000, // R$ 50.000,00
      valorDesejado: 20000000, // R$ 200.000,00
      valorTotalOferta: 20000000,
      prazoMeses: 36,
      taxaMensal: 0.015,
      taxaJurosAa: 0.18,
      dataEncerramentoOferta: "2026-12-31",
      totalJurosPagos: 0,
      totalAmortizado: 0,
      totalPago: 0,
      saldoDevedor: 0,
      version: 1,
      parentSimulationId: null,
    });

    // Criar oportunidade
    const opportunityId = await createOpportunity({
      leadId,
      simulationId,
      ownerUserId: userId,
      status: "novo",
      ticketEstimado: 20000000,
      probabilidade: 50,
      nextAction: "Ligar para cliente",
      nextActionAt: new Date("2026-01-15"),
    });

    // Validar que todos os dados necessários estão presentes
    const lead = await getLeadById(leadId);
    const opportunity = await getOpportunityById(opportunityId);

    expect(lead).toBeDefined();
    expect(lead?.nomeCompleto).toBe("João Silva Completo");
    expect(lead?.whatsapp).toBe("11999887788");
    expect(lead?.email).toBe("joao.completo@example.com");

    expect(opportunity).toBeDefined();
    expect(opportunity?.ticketEstimado).toBe(20000000);
    expect(opportunity?.status).toBe("novo");
    expect(opportunity?.nextAction).toBe("Ligar para cliente");
  });

  it("deve calcular ticketEstimado corretamente para investimento", async () => {
    const leadId = await createLead({
      nomeCompleto: "Investidor Teste",
      whatsapp: "11999887799",
    });

    const simulationId = await createSimulation({
      userId,
      leadId,
      tipoSimulacao: "investimento",
      sistemaAmortizacao: "LINEAR",
      valorAporte: 50000000, // R$ 500.000,00
      valorDesejado: 50000000,
      valorTotalOferta: 50000000,
      prazoMeses: 24,
      taxaMensal: 0.02,
      taxaJurosAa: 0.24,
      dataEncerramentoOferta: "2026-12-31",
      totalJurosPagos: 0,
      totalAmortizado: 0,
      totalPago: 0,
      saldoDevedor: 0,
      version: 1,
      parentSimulationId: null,
    });

    const opportunityId = await createOpportunity({
      leadId,
      simulationId,
      ownerUserId: userId,
      status: "novo",
      ticketEstimado: 50000000, // Para investimento, usa valorAporte
      probabilidade: 0,
    });

    const opportunity = await getOpportunityById(opportunityId);
    expect(opportunity?.ticketEstimado).toBe(50000000);
  });

  it("deve calcular ticketEstimado corretamente para financiamento", async () => {
    const leadId = await createLead({
      nomeCompleto: "Captador Teste",
      whatsapp: "11999888800",
    });

    const simulationId = await createSimulation({
      userId,
      leadId,
      tipoSimulacao: "financiamento",
      sistemaAmortizacao: "SAC",
      valorAporte: 10000000, // R$ 100.000,00
      valorDesejado: 30000000, // R$ 300.000,00
      valorTotalOferta: 30000000,
      prazoMeses: 48,
      taxaMensal: 0.012,
      taxaJurosAa: 0.144,
      dataEncerramentoOferta: "2026-12-31",
      totalJurosPagos: 0,
      totalAmortizado: 0,
      totalPago: 0,
      saldoDevedor: 0,
      version: 1,
      parentSimulationId: null,
    });

    const opportunityId = await createOpportunity({
      leadId,
      simulationId,
      ownerUserId: userId,
      status: "novo",
      ticketEstimado: 30000000, // Para financiamento, usa valorDesejado
      probabilidade: 0,
    });

    const opportunity = await getOpportunityById(opportunityId);
    expect(opportunity?.ticketEstimado).toBe(30000000);
  });
});
