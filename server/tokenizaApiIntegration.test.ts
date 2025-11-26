import { describe, it, expect } from "vitest";
import { normalizeTokenizaOffer, type TokenizaCrowdfundingItem } from "./tokenizaApiClient";

describe("Integração API Tokeniza", () => {
  describe("normalizeTokenizaOffer", () => {
    it("deve normalizar oferta real da API corretamente", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "f7575a78-4863-11ef-8a04-06aff79fa023",
        name: "Renda Passiva Com Energia Solar",
        type: "ESG - Sustentabilidade",
        minimumContribution: "1000",
        targetCapture: "600000",
        deadline: "40",
        profitability: "24",
        status: "active",
        finalDate: "2025-12-31T00:00:00.000Z",
        startDate: "2024-07-28T00:00:00.000Z",
        company: "USE CONDOMINIO LOGISTICO E ENERGIA LTDA",
        moneyReceived: 574636.49,
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.externalId).toBe("f7575a78-4863-11ef-8a04-06aff79fa023");
      expect(normalized.nome).toBe("Renda Passiva Com Energia Solar");
      expect(normalized.descricao).toBe("ESG - Sustentabilidade");
      expect(normalized.valorMinimo).toBe(100000); // 1000 * 100 centavos
      expect(normalized.valorTotalOferta).toBe(60000000); // 600000 * 100 centavos
      expect(normalized.prazoMeses).toBe(40);
      expect(normalized.taxaAnual).toBe(2400); // 24 * 100 centésimos
      expect(normalized.ativo).toBe(true); // status = "open"
      expect(normalized.tipoAtivo).toBe("ESG - Sustentabilidade");
      expect(normalized.dataEncerramento).toEqual(new Date("2025-12-31T00:00:00.000Z"));
    });

    it("deve marcar como inativa ofertas com status finished", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "abc123",
        name: "Oferta Encerrada",
        type: "Imobiliário",
        minimumContribution: "5000",
        targetCapture: "1000000",
        deadline: "24",
        profitability: "18",
        status: "finished",
        finalDate: "2024-01-01T00:00:00.000Z",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.ativo).toBe(false); // status = "finished"
    });

    it("deve usar valores padrão quando campos são null/undefined", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "xyz789",
        name: "Oferta Mínima",
        targetCapture: "100000",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.externalId).toBe("xyz789");
      expect(normalized.nome).toBe("Oferta Mínima");
      expect(normalized.descricao).toBe(null);
      expect(normalized.valorMinimo).toBe(null);
      expect(normalized.valorTotalOferta).toBe(10000000); // 100000 * 100
      expect(normalized.prazoMeses).toBe(null);
      expect(normalized.taxaAnual).toBe(null);
      expect(normalized.ativo).toBe(false); // status undefined → não é "open"
      expect(normalized.tipoAtivo).toBe(null);
      expect(normalized.dataEncerramento).toBe(null);
    });

    it("deve converter valores string corretamente", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "test-123",
        name: "Teste Conversão",
        minimumContribution: "2500.50", // com decimal
        targetCapture: "750000",
        deadline: "36",
        profitability: "15.5", // com decimal
        status: "active",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.valorMinimo).toBe(250050); // 2500.50 * 100 = 250050 centavos
      expect(normalized.valorTotalOferta).toBe(75000000); // 750000 * 100
      expect(normalized.prazoMeses).toBe(36);
      expect(normalized.taxaAnual).toBe(1550); // 15.5 * 100 = 1550 centésimos
    });

    it("deve tratar externalId ausente como 'unknown'", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        name: "Sem ID",
        targetCapture: "50000",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.externalId).toBe("unknown");
    });

    it("deve usar 'Oferta sem nome' quando nome ausente", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "test-456",
        targetCapture: "50000",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.nome).toBe("Oferta sem nome");
    });

    it("deve sempre retornar tipoOferta como 'investimento'", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "test-789",
        name: "Qualquer Oferta",
        targetCapture: "100000",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.tipoOferta).toBe("investimento");
    });

    it("deve sempre retornar tipoGarantia como null (API não fornece)", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "test-101",
        name: "Sem Garantia",
        targetCapture: "100000",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.tipoGarantia).toBe(null);
    });

    it("deve sempre retornar valorMaximo como null (API não fornece)", () => {
      const rawOffer: TokenizaCrowdfundingItem = {
        id: "test-102",
        name: "Sem Valor Máximo",
        targetCapture: "100000",
      };

      const normalized = normalizeTokenizaOffer(rawOffer);

      expect(normalized.valorMaximo).toBe(null);
    });
  });
});
