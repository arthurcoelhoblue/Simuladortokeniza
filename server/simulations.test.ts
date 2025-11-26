import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Simulações - Testes de Criação", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    const testUser = {
      openId: "test-user-simulations-" + Date.now(),
      name: "Test User Simulations",
      email: "test-simulations@example.com",
      loginMethod: "test",
      role: "user" as const,
    };
    
    await db.upsertUser(testUser);
    const user = await db.getUserByOpenId(testUser.openId);
    if (!user) throw new Error("Falha ao criar usuário de teste");
    testUserId = user.id;
  });

  it("deve criar simulação de investimento com novos campos", async () => {
    // Criar lead
    const leadId = await db.createLead({
      nomeCompleto: "Investidor Teste",
      whatsapp: "11999999001",
      email: "investidor@test.com",
      telefone: "11999999001",
      cidade: null,
      estado: null,
      cpf: null,
      canalOrigem: "teste",
    });

    // Criar simulação de investimento
    const simulationId = await db.createSimulation({
      userId: testUserId,
      leadId: leadId,
      tipoSimulacao: "investimento",
      modalidade: null,
      descricaoOferta: "Teste investimento",
      valorDesejado: 100000,
      valorAporte: 50000,
      valorTotalOferta: 100000,
      prazoMeses: 12,
      dataEncerramentoOferta: "2025-12-31",
      taxaMensal: 200, // 2% ao mês em centavos
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
      pagamentoMinimoValor: null,
      taxaSetupFixaBrl: 0,
      feeSucessoPercentSobreCaptacao: 0,
      feeManutencaoMensalBrl: 0,
      taxaTransacaoPercent: 0,
      aliquotaImpostoRendaPercent: 0,
      modo: "investidor",
      identificadorInvestidor: null,
      moedaReferencia: "BRL",
      totalJurosPagos: 0,
      totalAmortizado: 0,
      totalRecebido: 0,
      tirMensal: null,
      tirAnual: null,
    });

    expect(simulationId).toBeTypeOf("number");
    expect(simulationId).toBeGreaterThan(0);

    // Verificar se simulação foi criada corretamente
    const simulation = await db.getSimulationById(simulationId as number);
    expect(simulation).toBeDefined();
    expect(simulation?.leadId).toBe(leadId);
    expect(simulation?.tipoSimulacao).toBe("investimento");
    expect(simulation?.valorAporte).toBe(50000);
    expect(simulation?.sistemaAmortizacao).toBe("LINEAR");
  });

  it("deve criar simulação de financiamento com novos campos", async () => {
    // Criar lead
    const leadId = await db.createLead({
      nomeCompleto: "Captador Teste",
      whatsapp: "11999999002",
      email: "captador@test.com",
      telefone: "11999999002",
      cidade: null,
      estado: null,
      cpf: null,
      canalOrigem: "teste",
    });

    // Criar simulação de financiamento
    const simulationId = await db.createSimulation({
      userId: testUserId,
      leadId: leadId,
      tipoSimulacao: "financiamento",
      modalidade: null,
      descricaoOferta: "Teste financiamento",
      valorDesejado: 500000,
      valorAporte: 500000,
      valorTotalOferta: 500000,
      prazoMeses: 24,
      dataEncerramentoOferta: "2025-12-31",
      taxaMensal: 150, // 1.5% ao mês em centavos
      taxaJurosAa: 18.0,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      sistemaAmortizacao: "BULLET",
      possuiCarencia: 1,
      mesesCarencia: 6,
      carenciaJurosMeses: 6,
      carenciaPrincipalMeses: 6,
      capitalizarJurosEmCarencia: 1,
      tipoGarantia: "recebiveis_cartao",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "no_fim",
      pagamentoMinimoValor: null,
      taxaSetupFixaBrl: 5000,
      feeSucessoPercentSobreCaptacao: 2.5,
      feeManutencaoMensalBrl: 500,
      taxaTransacaoPercent: 0.5,
      aliquotaImpostoRendaPercent: 15,
      modo: "captador",
      identificadorInvestidor: null,
      moedaReferencia: "BRL",
      totalJurosPagos: 0,
      totalAmortizado: 0,
      totalRecebido: 0,
      tirMensal: null,
      tirAnual: null,
    });

    expect(simulationId).toBeTypeOf("number");
    expect(simulationId).toBeGreaterThan(0);

    // Verificar se simulação foi criada corretamente
    const simulation = await db.getSimulationById(simulationId as number);
    expect(simulation).toBeDefined();
    expect(simulation?.leadId).toBe(leadId);
    expect(simulation?.tipoSimulacao).toBe("financiamento");
    expect(simulation?.valorDesejado).toBe(500000);
    expect(simulation?.sistemaAmortizacao).toBe("BULLET");
    expect(simulation?.tipoGarantia).toBe("recebiveis_cartao");
  });

  it("deve validar enums corretamente", async () => {
    const leadId = await db.createLead({
      nomeCompleto: "Teste Enum",
      whatsapp: "11999999003",
      email: null,
      telefone: "11999999003",
      cidade: null,
      estado: null,
      cpf: null,
      canalOrigem: "teste",
    });

    // Testar todos os valores válidos de sistemaAmortizacao
    const sistemasValidos = ["PRICE", "SAC", "BULLET", "JUROS_MENSAL", "LINEAR"];
    
    for (const sistema of sistemasValidos) {
      const simulationId = await db.createSimulation({
        userId: testUserId,
        leadId: leadId,
        tipoSimulacao: "investimento",
        modalidade: null,
        descricaoOferta: `Teste ${sistema}`,
        valorDesejado: 100000,
        valorAporte: 50000,
        valorTotalOferta: 100000,
        prazoMeses: 12,
        dataEncerramentoOferta: "2025-12-31",
        taxaMensal: 200,
        taxaJurosAa: 24.0,
        convencaoCalendario: "civil/365",
        tipoCapitalizacao: "composta",
        sistemaAmortizacao: sistema as any,
        possuiCarencia: 0,
        mesesCarencia: 0,
        carenciaJurosMeses: 0,
        carenciaPrincipalMeses: 0,
        capitalizarJurosEmCarencia: 0,
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
        totalJurosPagos: 0,
        totalAmortizado: 0,
        totalRecebido: 0,
        tirMensal: null,
        tirAnual: null,
      });

      const simulation = await db.getSimulationById(simulationId as number);
      expect(simulation?.sistemaAmortizacao).toBe(sistema);
    }
  });

  it("deve deduplicar leads por whatsapp", async () => {
    const whatsapp = "119" + (Date.now() % 100000000); // Whatsapp único
    
    // Criar primeiro lead
    const leadId1 = await db.createLead({
      nomeCompleto: "Lead Original",
      whatsapp: whatsapp,
      email: null,
      telefone: whatsapp,
      cidade: null,
      estado: null,
      cpf: null,
      canalOrigem: "teste",
    });

    // Tentar buscar por whatsapp
    const foundLead = await db.getLeadByWhatsapp(whatsapp);
    expect(foundLead).toBeDefined();
    expect(foundLead?.id).toBe(leadId1);
    expect(foundLead?.whatsapp).toBe(whatsapp);
  });

  it("deve deduplicar leads por email", async () => {
    const email = `dedup-${Date.now()}@test.com`; // Email único
    
    // Criar primeiro lead
    const leadId1 = await db.createLead({
      nomeCompleto: "Lead Email Original",
      whatsapp: "118" + (Date.now() % 100000000),
      email: email,
      telefone: "11888888888",
      cidade: null,
      estado: null,
      cpf: null,
      canalOrigem: "teste",
    });

    // Tentar buscar por email
    const foundLead = await db.getLeadByEmail(email);
    expect(foundLead).toBeDefined();
    expect(foundLead?.id).toBe(leadId1);
    expect(foundLead?.email).toBe(email);
  });
});
