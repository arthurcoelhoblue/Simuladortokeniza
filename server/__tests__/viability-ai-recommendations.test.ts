/**
 * Testes para Patch 9C: Recomendações com IA
 * 
 * Testa a função generateAIRecommendations e seu fallback
 */

import { describe, it, expect } from 'vitest';
import { 
  generateMockAIRecommendations, 
  AIRecommendationsInput,
  AIRecommendationsOutput 
} from '../viabilityAIRecommendations';

describe('Viability AI Recommendations (Patch 9C)', () => {
  
  // Input de teste padrão
  const baseInput: AIRecommendationsInput = {
    nomeProjeto: "Teste Construção Civil",
    riskLevel: "baixo",
    paybackMeses: 24,
    ebitdaMes12: 5000000, // R$ 50k em centavos
    ebitdaMes24: 8000000, // R$ 80k em centavos
    margemBrutaPctMes12: 45,
    ebitdaBase: 5000000,
    ebitdaConservador: 3000000,
    ebitdaOtimista: 7000000,
    receitaMensal: 10000000, // R$ 100k em centavos
    opexMensal: 3000000, // R$ 30k em centavos
    custoVariavelPct: 40,
    valorCaptacao: 200000000, // R$ 2M em centavos
    taxaJurosMensal: 185, // 1.85% em basis points
    prazoMeses: 60,
    modeloPagamento: "SAC",
    quantidadeReceitas: 3,
    receitaPrincipal: "Venda de Apartamentos",
    quantidadeCustosFixos: 4,
    custoPrincipal: "Mão de Obra Fixa",
  };

  describe('generateMockAIRecommendations (fallback)', () => {
    
    it('deve retornar recomendações válidas para projeto saudável', () => {
      const result = generateMockAIRecommendations(baseInput);
      
      expect(result).toBeDefined();
      expect(result.recomendacoes).toBeInstanceOf(Array);
      expect(result.recomendacoes.length).toBeGreaterThan(0);
      expect(result.analiseResumida).toBeDefined();
      expect(result.geradoPorIA).toBe(false); // Mock sempre retorna false
    });

    it('deve gerar recomendação de margem quando margem < 40%', () => {
      const inputBaixaMargem: AIRecommendationsInput = {
        ...baseInput,
        margemBrutaPctMes12: 35,
      };
      
      const result = generateMockAIRecommendations(inputBaixaMargem);
      
      const temRecMargem = result.recomendacoes.some(r => 
        r.toLowerCase().includes('margem') || r.toLowerCase().includes('preço')
      );
      expect(temRecMargem).toBe(true);
    });

    it('deve gerar recomendação de payback quando payback > 36 meses', () => {
      const inputPaybackAlto: AIRecommendationsInput = {
        ...baseInput,
        paybackMeses: 42,
      };
      
      const result = generateMockAIRecommendations(inputPaybackAlto);
      
      const temRecPayback = result.recomendacoes.some(r => 
        r.toLowerCase().includes('payback') || r.toLowerCase().includes('opex')
      );
      expect(temRecPayback).toBe(true);
    });

    it('deve gerar recomendação de diversificação quando há 1 receita', () => {
      const inputUmaReceita: AIRecommendationsInput = {
        ...baseInput,
        quantidadeReceitas: 1,
      };
      
      const result = generateMockAIRecommendations(inputUmaReceita);
      
      const temRecDiversificacao = result.recomendacoes.some(r => 
        r.toLowerCase().includes('diversific') || r.toLowerCase().includes('única fonte')
      );
      expect(temRecDiversificacao).toBe(true);
    });

    it('deve gerar recomendação de volatilidade quando cenários divergem muito', () => {
      const inputAltaVolatilidade: AIRecommendationsInput = {
        ...baseInput,
        ebitdaConservador: 1000000, // R$ 10k
        ebitdaOtimista: 5000000, // R$ 50k (5x maior = 400% divergência)
      };
      
      const result = generateMockAIRecommendations(inputAltaVolatilidade);
      
      const temRecVolatilidade = result.recomendacoes.some(r => 
        r.toLowerCase().includes('volatilidade') || r.toLowerCase().includes('divergência')
      );
      expect(temRecVolatilidade).toBe(true);
    });

    it('deve retornar mensagem positiva quando projeto é saudável', () => {
      // Projeto com todos indicadores bons
      const inputSaudavel: AIRecommendationsInput = {
        ...baseInput,
        margemBrutaPctMes12: 50, // Margem alta
        paybackMeses: 18, // Payback curto
        quantidadeReceitas: 4, // Diversificado
        ebitdaConservador: 4000000,
        ebitdaOtimista: 5000000, // Baixa divergência
      };
      
      const result = generateMockAIRecommendations(inputSaudavel);
      
      const temMensagemPositiva = result.recomendacoes.some(r => 
        r.toLowerCase().includes('saudáve') || 
        r.toLowerCase().includes('monitoramento') ||
        r.toLowerCase().includes('indicadores')
      );
      expect(temMensagemPositiva).toBe(true);
    });

  });

  describe('AIRecommendationsOutput structure', () => {
    
    it('deve ter todos os campos obrigatórios', () => {
      const result = generateMockAIRecommendations(baseInput);
      
      expect(result).toHaveProperty('recomendacoes');
      expect(result).toHaveProperty('analiseResumida');
      expect(result).toHaveProperty('pontosFortesCount');
      expect(result).toHaveProperty('pontosAtencaoCount');
      expect(result).toHaveProperty('geradoPorIA');
    });

    it('deve ter contadores numéricos válidos', () => {
      const result = generateMockAIRecommendations(baseInput);
      
      expect(typeof result.pontosFortesCount).toBe('number');
      expect(typeof result.pontosAtencaoCount).toBe('number');
      expect(result.pontosFortesCount).toBeGreaterThanOrEqual(0);
      expect(result.pontosAtencaoCount).toBeGreaterThanOrEqual(0);
    });

    it('deve ter recomendações como array de strings', () => {
      const result = generateMockAIRecommendations(baseInput);
      
      expect(Array.isArray(result.recomendacoes)).toBe(true);
      result.recomendacoes.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });

  });

  describe('Risk level impact', () => {
    
    it('deve ajustar pontosFortesCount baseado no riskLevel', () => {
      const inputBaixo = { ...baseInput, riskLevel: "baixo" as const };
      const inputAlto = { ...baseInput, riskLevel: "alto" as const };
      
      const resultBaixo = generateMockAIRecommendations(inputBaixo);
      const resultAlto = generateMockAIRecommendations(inputAlto);
      
      expect(resultBaixo.pontosFortesCount).toBeGreaterThan(resultAlto.pontosFortesCount);
    });

  });

});
