import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db";
import { leads, simulations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Leads e Simulações - Integração", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
  });

  it("deve criar um lead e associá-lo a uma simulação", async () => {
    // Criar lead
    const [lead] = await db!.insert(leads).values({
      nomeCompleto: "Teste Lead",
      whatsapp: "11987654321",
      email: "teste@example.com",
    }).$returningId();

    expect(lead.id).toBeDefined();

    // Criar simulação associada ao lead
    const [simulacao] = await db!.insert(simulations).values({
      userId: 1, // ID de usuário de teste
      leadId: lead.id,
      descricaoOferta: "Teste Oferta",
      valorTotalOferta: 1000000,
      valorInvestido: 100000,
      dataEncerramentoOferta: "2025-12-31",
      prazoMeses: 24,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: false,
      amortizacaoMetodo: "linear",
      modo: "investidor",
    }).$returningId();

    expect(simulacao.id).toBeDefined();

    // Verificar associação
    const [result] = await db!
      .select()
      .from(simulations)
      .where(eq(simulations.id, simulacao.id))
      .limit(1);

    expect(result.leadId).toBe(lead.id);

    // Limpar dados de teste
    await db!.delete(simulations).where(eq(simulations.id, simulacao.id));
    await db!.delete(leads).where(eq(leads.id, lead.id));
  });

  it("deve permitir buscar lead por WhatsApp", async () => {
    const whatsappTeste = "11999999999";

    // Criar lead
    const [lead] = await db!.insert(leads).values({
      nomeCompleto: "Lead WhatsApp",
      whatsapp: whatsappTeste,
    }).$returningId();

    // Buscar por WhatsApp
    const [resultado] = await db!
      .select()
      .from(leads)
      .where(eq(leads.whatsapp, whatsappTeste))
      .limit(1);

    expect(resultado).toBeDefined();
    expect(resultado.whatsapp).toBe(whatsappTeste);
    expect(resultado.nomeCompleto).toBe("Lead WhatsApp");

    // Limpar
    await db!.delete(leads).where(eq(leads.id, lead.id));
  });

  it("deve permitir buscar lead por email", async () => {
    const emailTeste = "busca@example.com";

    // Criar lead
    const [lead] = await db!.insert(leads).values({
      nomeCompleto: "Lead Email",
      whatsapp: "11988888888",
      email: emailTeste,
    }).$returningId();

    // Buscar por email
    const [resultado] = await db!
      .select()
      .from(leads)
      .where(eq(leads.email, emailTeste))
      .limit(1);

    expect(resultado).toBeDefined();
    expect(resultado.email).toBe(emailTeste);
    expect(resultado.nomeCompleto).toBe("Lead Email");

    // Limpar
    await db!.delete(leads).where(eq(leads.id, lead.id));
  });

  it("deve permitir múltiplas simulações para o mesmo lead", async () => {
    // Criar lead
    const [lead] = await db!.insert(leads).values({
      nomeCompleto: "Lead Múltiplas Simulações",
      whatsapp: "11977777777",
    }).$returningId();

    // Criar primeira simulação
    const [sim1] = await db!.insert(simulations).values({
      userId: 1, // ID de usuário de teste
      leadId: lead.id,
      descricaoOferta: "Simulação 1",
      valorTotalOferta: 1000000,
      valorInvestido: 100000,
      dataEncerramentoOferta: "2025-12-31",
      prazoMeses: 24,
      taxaJurosAa: 2400,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "composta",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: false,
      amortizacaoMetodo: "linear",
      modo: "investidor",
    }).$returningId();

    // Criar segunda simulação
    const [sim2] = await db!.insert(simulations).values({
      userId: 1, // ID de usuário de teste
      leadId: lead.id,
      descricaoOferta: "Simulação 2",
      valorTotalOferta: 2000000,
      valorInvestido: 200000,
      dataEncerramentoOferta: "2025-12-31",
      prazoMeses: 36,
      taxaJurosAa: 1800,
      convencaoCalendario: "civil/365",
      tipoCapitalizacao: "simples",
      periodicidadeJuros: "mensal",
      periodicidadeAmortizacao: "mensal",
      carenciaJurosMeses: 0,
      carenciaPrincipalMeses: 0,
      capitalizarJurosEmCarencia: false,
      amortizacaoMetodo: "bullet",
      modo: "captador",
    }).$returningId();

    // Verificar que ambas simulações têm o mesmo leadId
    const [result1] = await db!.select().from(simulations).where(eq(simulations.id, sim1.id)).limit(1);
    const [result2] = await db!.select().from(simulations).where(eq(simulations.id, sim2.id)).limit(1);

    expect(result1.leadId).toBe(lead.id);
    expect(result2.leadId).toBe(lead.id);

    // Limpar
    await db!.delete(simulations).where(eq(simulations.id, sim1.id));
    await db!.delete(simulations).where(eq(simulations.id, sim2.id));
    await db!.delete(leads).where(eq(leads.id, lead.id));
  });
});
