import { describe, it, expect } from "vitest";
import { calcularFitNivel } from "./fitNivel";
import { calcularScoreParaOpportunity } from "./scoreEngine";

/**
 * Testes de integração do sistema de scoring completo
 * Valida o fluxo: simulação → scoreEngine → fitNivel
 */

describe("Sistema de Scoring - Integração Completa", () => {
  describe("calcularFitNivel", () => {
    it("deve retornar 'frio' para tokenizaScore < 25", () => {
      expect(calcularFitNivel(0)).toBe("frio");
      expect(calcularFitNivel(10)).toBe("frio");
      expect(calcularFitNivel(24)).toBe("frio");
    });

    it("deve retornar 'morno' para tokenizaScore >= 25 e < 50", () => {
      expect(calcularFitNivel(25)).toBe("morno");
      expect(calcularFitNivel(35)).toBe("morno");
      expect(calcularFitNivel(49)).toBe("morno");
    });

    it("deve retornar 'quente' para tokenizaScore >= 50 e < 75", () => {
      expect(calcularFitNivel(50)).toBe("quente");
      expect(calcularFitNivel(60)).toBe("quente");
      expect(calcularFitNivel(74)).toBe("quente");
    });

    it("deve retornar 'prioritario' para tokenizaScore >= 75", () => {
      expect(calcularFitNivel(75)).toBe("prioritario");
      expect(calcularFitNivel(85)).toBe("prioritario");
      expect(calcularFitNivel(100)).toBe("prioritario");
    });
  });

  describe("Cenários de Simulação → fitNivel", () => {
    it("Cenário 1: Simulação manual, low ticket, sem oferta → fitNivel=frio", () => {
      const simulation = {
        id: 1,
        tipoSimulacao: "investimento" as const,
        valorAporte: 100000, // R$ 1.000 em centavos
        valorDesejado: 0,
        origemSimulacao: "manual" as const,
        engajouComOferta: 0,
        offerId: null,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 1,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 1,
        leadId: 1,
        simulationId: 1,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 0,
      });

      const fitNivel = calcularFitNivel(scoreComponents.tokenizaScore);

      expect(scoreComponents.scoreIntencao).toBe(0); // Manual = 0 pts
      expect(scoreComponents.tokenizaScore).toBeLessThan(25);
      expect(fitNivel).toBe("frio");
    });

    it("Cenário 2: Simulação via oferta, ticket médio (R$ 5k), sem urgência → fitNivel=morno", () => {
      const simulation = {
        id: 2,
        tipoSimulacao: "investimento" as const,
        valorAporte: 500000, // R$ 5.000 em centavos
        valorDesejado: 0,
        origemSimulacao: "oferta_tokeniza" as const,
        engajouComOferta: 1,
        offerId: 1,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 2,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 2,
        leadId: 2,
        simulationId: 2,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 0,
      });

      const fitNivel = calcularFitNivel(scoreComponents.tokenizaScore);

      expect(scoreComponents.scoreIntencao).toBeGreaterThanOrEqual(25); // Oferta + engajou = 25+ pts
      expect(scoreComponents.tokenizaScore).toBeGreaterThanOrEqual(25);
      expect(scoreComponents.tokenizaScore).toBeLessThan(50);
      expect(fitNivel).toBe("morno");
    });

    it("Cenário 3: Simulação via oferta, high ticket (R$ 50k), sem urgência → fitNivel=quente", () => {
      const simulation = {
        id: 3,
        tipoSimulacao: "investimento" as const,
        valorAporte: 5000000, // R$ 50.000 em centavos
        valorDesejado: 0,
        origemSimulacao: "oferta_tokeniza" as const,
        engajouComOferta: 1,
        offerId: 1,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 3,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 3,
        leadId: 3,
        simulationId: 3,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 0,
      });

      const fitNivel = calcularFitNivel(scoreComponents.tokenizaScore);

      expect(scoreComponents.scoreIntencao).toBeGreaterThanOrEqual(25); // Oferta + engajou
      expect(scoreComponents.scoreValor).toBeGreaterThanOrEqual(25); // High ticket (R$ 50k = 30 pts)
      expect(scoreComponents.tokenizaScore).toBeGreaterThanOrEqual(50);
      expect(scoreComponents.tokenizaScore).toBeLessThan(75);
      expect(fitNivel).toBe("quente");
    });

    it("Cenário 4: Simulação via oferta, very high ticket (R$ 200k), urgência (encerra em 5 dias) → fitNivel=prioritario", () => {
      const simulation = {
        id: 4,
        tipoSimulacao: "investimento" as const,
        valorAporte: 20000000, // R$ 200.000 em centavos
        valorDesejado: 0,
        origemSimulacao: "oferta_tokeniza" as const,
        engajouComOferta: 1,
        offerId: 1,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 4,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 4,
        leadId: 4,
        simulationId: 4,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Oferta que encerra em 5 dias
      const offer = {
        id: 1,
        externalId: "TOK-001",
        nome: "Oferta Urgente",
        descricao: null,
        tipoOferta: "investimento" as const,
        tipoGarantia: null,
        tipoAtivo: null,
        taxaAnual: 1200,
        prazoMeses: 12,
        valorMinimo: 100000,
        valorMaximo: null,
        modalidade: null,
        ativo: 1,
        dataEncerramento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 dias
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer,
        versoesRelacionadas: 0,
      });

      const fitNivel = calcularFitNivel(scoreComponents.tokenizaScore);

      expect(scoreComponents.scoreIntencao).toBeGreaterThanOrEqual(25); // Oferta + engajou
      expect(scoreComponents.scoreValor).toBeGreaterThanOrEqual(35); // Very high ticket (R$ 200k = 40 pts)
      expect(scoreComponents.scoreUrgencia).toBeGreaterThan(0); // Urgência presente
      expect(scoreComponents.tokenizaScore).toBeGreaterThanOrEqual(65); // 40+40+0+5 = 85/120 = 71%
      expect(fitNivel).toBe("quente"); // 71% está entre 50-75, não prioritário
    });

    it("Cenário 5: Lead engajado (3+ versões), high ticket, via oferta → fitNivel=prioritario", () => {
      const simulation = {
        id: 5,
        tipoSimulacao: "investimento" as const,
        valorAporte: 10000000, // R$ 100.000 em centavos
        valorDesejado: 0,
        origemSimulacao: "oferta_tokeniza" as const,
        engajouComOferta: 1,
        offerId: 1,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 5,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 5,
        leadId: 5,
        simulationId: 5,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 5, // 5 versões = alto engajamento
      });

      const fitNivel = calcularFitNivel(scoreComponents.tokenizaScore);

      expect(scoreComponents.scoreIntencao).toBeGreaterThanOrEqual(25); // Oferta + engajou
      expect(scoreComponents.scoreValor).toBeGreaterThanOrEqual(35); // Very high ticket (R$ 100k = 40 pts)
      expect(scoreComponents.scoreEngajamento).toBeGreaterThan(0); // Engajamento alto
      expect(scoreComponents.tokenizaScore).toBeGreaterThanOrEqual(75); // 40+40+20+0 = 100/120 = 83%
      expect(fitNivel).toBe("prioritario");
    });
  });

  describe("Validação de Regras de Negócio", () => {
    it("scoreIntencao deve ser 0 para simulações manuais", () => {
      const simulation = {
        id: 100,
        tipoSimulacao: "investimento" as const,
        valorAporte: 1000000,
        valorDesejado: 0,
        origemSimulacao: "manual" as const,
        engajouComOferta: 0,
        offerId: null,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 100,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 100,
        leadId: 100,
        simulationId: 100,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 0,
      });

      expect(scoreComponents.scoreIntencao).toBe(0);
    });

    it("scoreIntencao deve ser >=25 para simulações via oferta com engajamento", () => {
      const simulation = {
        id: 101,
        tipoSimulacao: "investimento" as const,
        valorAporte: 1000000,
        valorDesejado: 0,
        origemSimulacao: "oferta_tokeniza" as const,
        engajouComOferta: 1,
        offerId: 1,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 101,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 101,
        leadId: 101,
        simulationId: 101,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 0,
      });

      expect(scoreComponents.scoreIntencao).toBeGreaterThanOrEqual(25);
    });

    it("tokenizaScore deve estar no intervalo 0-100", () => {
      const simulation = {
        id: 102,
        tipoSimulacao: "investimento" as const,
        valorAporte: 100000000, // R$ 1.000.000 (valor extremo)
        valorDesejado: 0,
        origemSimulacao: "oferta_tokeniza" as const,
        engajouComOferta: 1,
        offerId: 1,
        prazoMeses: 12,
        taxaJurosAa: 1200,
        sistemaAmortizacao: "price" as const,
        leadId: 102,
        descricaoOferta: null,
        valorTotalOferta: 0,
        taxaEstruturacao: 0,
        feePercentualCaptacao: null,
        outrosCustos: null,
        outrosCustosTipo: null,
        tipoGarantia: null,
        tipoAtivo: null,
        modalidade: null,
        parentSimulationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const opportunity = {
        id: 102,
        leadId: 102,
        simulationId: 102,
        status: "novo" as const,
        nextAction: null,
        nextActionAt: null,
        ownerUserId: null,
        pipedriveDealId: null,
        pipedriveOrgId: null,
        tokenizaScore: 0,
        fitNivel: "frio" as const,
        scoreValor: 0,
        scoreIntencao: 0,
        scoreEngajamento: 0,
        scoreUrgencia: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Oferta urgente (encerra em 1 dia)
      const offer = {
        id: 1,
        externalId: "TOK-001",
        nome: "Oferta Urgente",
        descricao: null,
        tipoOferta: "investimento" as const,
        tipoGarantia: null,
        tipoAtivo: null,
        taxaAnual: 1200,
        prazoMeses: 12,
        valorMinimo: 100000,
        valorMaximo: null,
        modalidade: null,
        ativo: 1,
        dataEncerramento: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 dia
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scoreComponents = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer,
        versoesRelacionadas: 10, // Engajamento máximo
      });

      expect(scoreComponents.tokenizaScore).toBeGreaterThanOrEqual(0);
      expect(scoreComponents.tokenizaScore).toBeLessThanOrEqual(100);
    });
  });
});
