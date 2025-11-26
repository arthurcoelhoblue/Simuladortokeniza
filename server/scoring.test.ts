import { describe, it, expect } from "vitest";
import {
  calcularScoreValor,
  calcularScoreIntencao,
  calcularScoreEngajamento,
  calcularScoreUrgencia,
  calcularScoreParaOpportunity,
} from "./scoreEngine";
import type { Simulation, Opportunity, Offer } from "../drizzle/schema";

describe("Sistema de Scoring Tokeniza", () => {
  describe("calcularScoreValor", () => {
    it("deve retornar 0 para valores abaixo de R$ 1.000", () => {
      expect(calcularScoreValor(500)).toBe(0);
      expect(calcularScoreValor(999)).toBe(0);
    });

    it("deve retornar 5 para valores entre R$ 1k e R$ 5k", () => {
      expect(calcularScoreValor(1000)).toBe(5);
      expect(calcularScoreValor(3000)).toBe(5);
    });

    it("deve retornar 40 para valores entre R$ 100k e R$ 250k", () => {
      expect(calcularScoreValor(150000)).toBe(40);
    });

    it("deve retornar 50 (máximo) para valores acima de R$ 250k", () => {
      expect(calcularScoreValor(250000)).toBe(50);
      expect(calcularScoreValor(500000)).toBe(50);
      expect(calcularScoreValor(1000000)).toBe(50);
    });
  });

  describe("calcularScoreIntencao - FATOR DOMINANTE", () => {
    it("deve retornar 0 para simulação manual sem engajamento", () => {
      const score = calcularScoreIntencao("manual", false);
      expect(score).toBe(0);
    });

    it("deve retornar 25 para simulação iniciada por oferta sem engajamento", () => {
      const score = calcularScoreIntencao("oferta_tokeniza", false);
      expect(score).toBe(25);
    });

    it("deve retornar 30 para simulação manual com engajamento posterior", () => {
      const score = calcularScoreIntencao("manual", true);
      expect(score).toBe(30);
    });

    it("deve retornar 40 (máximo) para simulação iniciada por oferta COM engajamento", () => {
      const score = calcularScoreIntencao("oferta_tokeniza", true);
      expect(score).toBe(40);
    });
  });

  describe("calcularScoreEngajamento", () => {
    it("deve retornar 0 para apenas 1 simulação", () => {
      expect(calcularScoreEngajamento(1)).toBe(0);
    });

    it("deve retornar 5 para 2 simulações", () => {
      expect(calcularScoreEngajamento(2)).toBe(5);
    });

    it("deve retornar 10 para 3 simulações", () => {
      expect(calcularScoreEngajamento(3)).toBe(10);
    });

    it("deve retornar 20 (máximo) para 5+ simulações", () => {
      expect(calcularScoreEngajamento(5)).toBe(20);
      expect(calcularScoreEngajamento(10)).toBe(20);
    });
  });

  describe("calcularScoreUrgencia", () => {
    it("deve retornar 0 se não houver oferta", () => {
      expect(calcularScoreUrgencia(null)).toBe(0);
      expect(calcularScoreUrgencia(undefined)).toBe(0);
    });

    it("deve retornar 0 se oferta não tiver dataEncerramento", () => {
      const offer = { dataEncerramento: null } as Offer;
      expect(calcularScoreUrgencia(offer)).toBe(0);
    });

    it("deve retornar 10 (máximo) para oferta encerrando em menos de 48h", () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      
      const offer = { dataEncerramento: amanha } as Offer;
      expect(calcularScoreUrgencia(offer)).toBe(10);
    });

    it("deve retornar 5 para oferta encerrando em 5 dias", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 5);
      
      const offer = { dataEncerramento: futuro } as Offer;
      expect(calcularScoreUrgencia(offer)).toBe(5);
    });

    it("deve retornar 0 para oferta encerrando em mais de 15 dias", () => {
      const futuroDistante = new Date();
      futuroDistante.setDate(futuroDistante.getDate() + 20);
      
      const offer = { dataEncerramento: futuroDistante } as Offer;
      expect(calcularScoreUrgencia(offer)).toBe(0);
    });
  });

  describe("calcularScoreParaOpportunity - Integração Completa", () => {
    it("Cenário 1: Simulação manual, valor baixo, sem oferta (scoreIntencao=0)", () => {
      const simulation = {
        id: 1,
        valorAporte: 200000, // R$ 2.000 (baixo)
        origemSimulacao: "manual",
        engajouComOferta: 0,
        tipoSimulacao: "investimento",
      } as Simulation;

      const opportunity = {
        id: 1,
        leadId: 1,
        simulationId: 1,
      } as Opportunity;

      const result = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 1,
      });

      // scoreValor = 5 (R$ 2k)
      // scoreIntencao = 0 (manual sem engajamento)
      // scoreEngajamento = 0 (1 versão)
      // scoreUrgencia = 0 (sem oferta)
      // rawScore = 5/120 = ~4.17%
      expect(result.scoreValor).toBe(5);
      expect(result.scoreIntencao).toBe(0);
      expect(result.scoreEngajamento).toBe(0);
      expect(result.scoreUrgencia).toBe(0);
      expect(result.tokenizaScore).toBeLessThan(10); // Score muito baixo
    });

    it("Cenário 2: Simulação iniciada por oferta, valor médio (scoreIntencao>=25)", () => {
      const simulation = {
        id: 2,
        valorAporte: 1000000, // R$ 10.000 (médio)
        origemSimulacao: "oferta_tokeniza",
        engajouComOferta: 0,
        tipoSimulacao: "investimento",
      } as Simulation;

      const opportunity = {
        id: 2,
        leadId: 2,
        simulationId: 2,
      } as Opportunity;

      const result = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 1,
      });

      // scoreValor = 15 (R$ 10k)
      // scoreIntencao = 25 (oferta_tokeniza sem engajamento)
      // scoreEngajamento = 0 (1 versão)
      // scoreUrgencia = 0 (sem oferta)
      // rawScore = 40/120 = ~33%
      expect(result.scoreValor).toBe(15);
      expect(result.scoreIntencao).toBe(25);
      expect(result.tokenizaScore).toBeGreaterThan(25); // Score significativamente maior
    });

    it("Cenário 3: Alta intenção + alto ticket + urgência (tokenizaScore 80-100)", () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);

      const simulation = {
        id: 3,
        valorAporte: 30000000, // R$ 300.000 (alto)
        origemSimulacao: "oferta_tokeniza",
        engajouComOferta: 1,
        tipoSimulacao: "investimento",
        offerId: 1,
      } as Simulation;

      const opportunity = {
        id: 3,
        leadId: 3,
        simulationId: 3,
      } as Opportunity;

      const offer = {
        id: 1,
        dataEncerramento: amanha, // Encerra amanhã (urgente)
      } as Offer;

      const result = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer,
        versoesRelacionadas: 3, // Engajamento moderado
      });

      // scoreValor = 50 (R$ 300k+)
      // scoreIntencao = 40 (oferta_tokeniza COM engajamento)
      // scoreEngajamento = 10 (3 versões)
      // scoreUrgencia = 10 (encerra em <48h)
      // rawScore = 110/120 = ~92%
      expect(result.scoreValor).toBe(50);
      expect(result.scoreIntencao).toBe(40);
      expect(result.scoreEngajamento).toBe(10);
      expect(result.scoreUrgencia).toBe(10);
      expect(result.tokenizaScore).toBeGreaterThanOrEqual(80);
      expect(result.tokenizaScore).toBeLessThanOrEqual(100);
    });

    it("Cenário 4: Lead com 3+ versões (scoreEngajamento>0)", () => {
      const simulation = {
        id: 4,
        valorAporte: 5000000, // R$ 50.000
        origemSimulacao: "manual",
        engajouComOferta: 1,
        tipoSimulacao: "investimento",
      } as Simulation;

      const opportunity = {
        id: 4,
        leadId: 4,
        simulationId: 4,
      } as Opportunity;

      const result = calcularScoreParaOpportunity({
        simulation,
        opportunity,
        offer: null,
        versoesRelacionadas: 5, // Alto engajamento
      });

      // scoreValor = 30 (R$ 50k)
      // scoreIntencao = 30 (manual com engajamento)
      // scoreEngajamento = 20 (5+ versões)
      // scoreUrgencia = 0 (sem oferta)
      // rawScore = 80/120 = ~67%
      expect(result.scoreValor).toBe(30);
      expect(result.scoreIntencao).toBe(30);
      expect(result.scoreEngajamento).toBe(20);
      expect(result.tokenizaScore).toBeGreaterThan(50); // Score significativo
    });
  });
});
