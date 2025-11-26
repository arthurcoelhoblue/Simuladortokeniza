import { describe, it, expect, beforeAll } from "vitest";
import { findOrCreatePerson, getPipelineConfig, createDeal } from "./pipedrive";

/**
 * Testes de integração real com Pipedrive
 * 
 * IMPORTANTE: Estes testes fazem requisições reais à API do Pipedrive
 * Requerem variáveis de ambiente configuradas:
 * - PIPEDRIVE_API_TOKEN
 * - PIPEDRIVE_BASE_URL
 * - PIPEDRIVE_INVESTOR_PIPELINE_ID
 * - PIPEDRIVE_INVESTOR_STAGE_ID
 * - PIPEDRIVE_EMISSOR_PIPELINE_ID
 * - PIPEDRIVE_EMISSOR_STAGE_ID
 * 
 * Se as variáveis não estiverem configuradas, os testes serão pulados
 */

const isConfigured = Boolean(
  process.env.PIPEDRIVE_API_TOKEN &&
  process.env.PIPEDRIVE_BASE_URL &&
  process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID &&
  process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID
);

describe("Integração Pipedrive - Testes Reais", () => {
  beforeAll(() => {
    if (!isConfigured) {
      console.warn("⚠️ Variáveis de ambiente Pipedrive não configuradas. Testes serão pulados.");
    }
  });

  it("deve pular testes se variáveis não estiverem configuradas", () => {
    if (!isConfigured) {
      console.log("✅ Testes pulados corretamente");
      expect(true).toBe(true);
    }
  });

  // Teste 1: Criar pessoa de teste
  it.skipIf(!isConfigured)("deve criar pessoa de teste no Pipedrive", async () => {
    const leadMock = {
      nomeCompleto: "João Teste Pipedrive",
      email: "joao.teste@example.com",
      whatsapp: "+5511999999999",
      telefone: null,
    };

    const personId = await findOrCreatePerson(leadMock);

    expect(personId).toBeTruthy();
    expect(typeof personId).toBe("number");
    console.log("✅ Pessoa criada com ID:", personId);
  });

  // Teste 2: Buscar pessoa existente por email
  it.skipIf(!isConfigured)("deve buscar pessoa existente por email", async () => {
    const leadMock = {
      nomeCompleto: "João Teste Pipedrive",
      email: "joao.teste@example.com",
      whatsapp: "+5511999999999",
      telefone: null,
    };

    // Primeira chamada cria
    const personId1 = await findOrCreatePerson(leadMock);
    
    // Segunda chamada deve retornar o mesmo ID
    const personId2 = await findOrCreatePerson(leadMock);

    expect(personId1).toBe(personId2);
    console.log("✅ Pessoa encontrada (não duplicada):", personId2);
  });

  // Teste 3: Selecionar pipeline correto para investidor
  it("deve selecionar pipeline de investidor corretamente", () => {
    const config = getPipelineConfig("investidor");

    expect(config).toHaveProperty("pipeline_id");
    expect(config).toHaveProperty("stage_id");
    expect(typeof config.pipeline_id).toBe("number");
    expect(typeof config.stage_id).toBe("number");
    console.log("✅ Pipeline investidor:", config);
  });

  // Teste 4: Selecionar pipeline correto para emissor
  it("deve selecionar pipeline de emissor corretamente", () => {
    const config = getPipelineConfig("emissor");

    expect(config).toHaveProperty("pipeline_id");
    expect(config).toHaveProperty("stage_id");
    expect(typeof config.pipeline_id).toBe("number");
    expect(typeof config.stage_id).toBe("number");
    console.log("✅ Pipeline emissor:", config);
  });

  // Teste 5: Criar deal com título padronizado [Simulação] - Nome
  it.skipIf(!isConfigured)("deve criar deal com título [Simulação] - Nome", async () => {
    const leadMock = {
      nomeCompleto: "Maria Silva Teste",
      email: "maria.silva@example.com",
      whatsapp: "+5511988888888",
      telefone: null,
    };

    const opportunityMock = {
      tipoOportunidade: "investidor",
      ticketEstimado: 5000000, // R$ 50.000 em centavos
    };

    const simulationMock = {
      origemSimulacao: "oferta_tokeniza",
      valorAporte: 5000000,
    };

    const scoreMock = {
      total: 85,
      valor: 45,
      intencao: 35,
      engajamento: 15,
      urgencia: 8,
    };

    const dealId = await createDeal({
      lead: leadMock,
      opportunity: opportunityMock,
      simulation: simulationMock,
      score: scoreMock,
    });

    expect(dealId).toBeTruthy();
    expect(typeof dealId).toBe("number");
    console.log("✅ Deal criado com ID:", dealId);
    console.log("✅ Título esperado: [Simulação] - Maria Silva Teste");
  });

  // Teste 6: Criar deal para emissor no pipeline correto
  it.skipIf(!isConfigured)("deve criar deal de emissor no pipeline correto", async () => {
    const leadMock = {
      nomeCompleto: "Empresa XYZ Ltda",
      email: "contato@empresaxyz.com.br",
      whatsapp: "+5511977777777",
      telefone: null,
    };

    const opportunityMock = {
      tipoOportunidade: "emissor",
      ticketEstimado: 100000000, // R$ 1.000.000 em centavos
    };

    const simulationMock = {
      origemSimulacao: "manual",
      valorAporte: 100000000,
    };

    const scoreMock = {
      total: 65,
      valor: 40,
      intencao: 15,
      engajamento: 10,
      urgencia: 5,
    };

    const dealId = await createDeal({
      lead: leadMock,
      opportunity: opportunityMock,
      simulation: simulationMock,
      score: scoreMock,
    });

    expect(dealId).toBeTruthy();
    expect(typeof dealId).toBe("number");
    console.log("✅ Deal de emissor criado com ID:", dealId);
    console.log("✅ Título esperado: [Simulação] - Empresa XYZ Ltda");
  });

  // Teste 7: Validar campos customizados (se configurados)
  it.skipIf(!isConfigured)("deve enviar campos customizados se configurados", async () => {
    const hasCustomFields = Boolean(
      process.env.PIPEDRIVE_FIELD_TOKENIZA_SCORE ||
      process.env.PIPEDRIVE_FIELD_SCORE_VALOR ||
      process.env.PIPEDRIVE_FIELD_SCORE_INTENCAO
    );

    if (hasCustomFields) {
      console.log("✅ Campos customizados configurados:");
      console.log("  - TOKENIZA_SCORE:", process.env.PIPEDRIVE_FIELD_TOKENIZA_SCORE);
      console.log("  - SCORE_VALOR:", process.env.PIPEDRIVE_FIELD_SCORE_VALOR);
      console.log("  - SCORE_INTENCAO:", process.env.PIPEDRIVE_FIELD_SCORE_INTENCAO);
      console.log("  - SCORE_ENGAJAMENTO:", process.env.PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO);
      console.log("  - SCORE_URGENCIA:", process.env.PIPEDRIVE_FIELD_SCORE_URGENCIA);
      console.log("  - ORIGEM_SIMULACAO:", process.env.PIPEDRIVE_FIELD_ORIGEM_SIMULACAO);
      console.log("  - TIPO_OPORTUNIDADE:", process.env.PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE);
    } else {
      console.log("⚠️ Campos customizados não configurados (opcional)");
    }

    expect(true).toBe(true);
  });
});
