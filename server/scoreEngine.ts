import type { Simulation, Opportunity, Offer } from "../drizzle/schema";

/**
 * Componentes individuais do score Tokeniza
 * Cada componente tem um peso específico no score final
 */
export type ScoreComponents = {
  scoreValor: number; // Até 50 pts (30% do peso)
  scoreIntencao: number; // Até 40 pts (40% do peso - FATOR DOMINANTE)
  scoreEngajamento: number; // Até 20 pts (20% do peso)
  scoreUrgencia: number; // Até 10 pts (10% do peso)
  tokenizaScore: number; // Score consolidado (0-100)
};

/**
 * Calcula score baseado no valor do ticket (valorAporte)
 * Faixas progressivas que valorizam tickets maiores
 * 
 * @param valorReais - Valor do aporte em reais
 * @returns Score de 0 a 50 pontos
 */
export function calcularScoreValor(valorReais: number): number {
  if (valorReais < 1000) return 0;
  if (valorReais < 5000) return 5;
  if (valorReais < 10000) return 10;
  if (valorReais < 20000) return 15;
  if (valorReais < 30000) return 20;
  if (valorReais < 50000) return 25;
  if (valorReais < 100000) return 30;
  if (valorReais < 250000) return 40;
  return 50; // 250k+
}

/**
 * Calcula score baseado na INTENÇÃO do lead
 * Este é o FATOR DOMINANTE do sistema de scoring
 * 
 * Lógica:
 * - Simulação manual sem engajamento = 0 pts (apenas explorando)
 * - Simulação iniciada por oferta sem engajamento = 25 pts (interesse moderado)
 * - Simulação manual com engajamento posterior = 30 pts (interesse crescente)
 * - Simulação iniciada por oferta COM engajamento = 40 pts (ALTA INTENÇÃO)
 * 
 * @param origemSimulacao - 'manual' ou 'oferta_tokeniza'
 * @param engajouComOferta - Se o lead aplicou/engajou com uma oferta
 * @returns Score de 0 a 40 pontos
 */
export function calcularScoreIntencao(
  origemSimulacao: "manual" | "oferta_tokeniza",
  engajouComOferta: boolean
): number {
  if (origemSimulacao === "manual" && !engajouComOferta) {
    return 0; // Apenas explorando, sem intenção clara
  }

  if (origemSimulacao === "oferta_tokeniza" && !engajouComOferta) {
    return 25; // Começou pela oferta, mas não avançou muito
  }

  if (origemSimulacao === "oferta_tokeniza" && engajouComOferta) {
    return 40; // ALTA INTENÇÃO: começou pela oferta E aplicou
  }

  // Caso futuro: começou manual mas depois aplicou oferta
  if (origemSimulacao === "manual" && engajouComOferta) {
    return 30; // Interesse crescente
  }

  return 0;
}

/**
 * Calcula score baseado no ENGAJAMENTO do lead
 * Medido pelo número de versões de simulações relacionadas
 * 
 * Quanto mais o lead mexe nas simulações, maior o engajamento
 * 
 * @param versoesRelacionadas - Número de simulações relacionadas (mesmo leadId)
 * @returns Score de 0 a 20 pontos
 */
export function calcularScoreEngajamento(versoesRelacionadas: number): number {
  if (versoesRelacionadas <= 1) return 0; // Só 1 simulação
  if (versoesRelacionadas === 2) return 5;
  if (versoesRelacionadas === 3) return 10;
  if (versoesRelacionadas === 4) return 15;
  return 20; // 5+ versões → lead está mexendo MUITO
}

/**
 * Calcula score baseado na URGÊNCIA da oferta
 * Ofertas próximas do encerramento ganham pontos extras
 * 
 * @param offer - Oferta relacionada (pode ser null)
 * @returns Score de 0 a 10 pontos
 */
export function calcularScoreUrgencia(offer?: Offer | null): number {
  if (!offer || !offer.dataEncerramento) return 0;

  const hoje = new Date();
  const diffMs = offer.dataEncerramento.getTime() - hoje.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  if (diffDias <= 0) return 0; // Já encerrou ou encerra hoje → não favorece
  if (diffDias <= 2) return 10; // <48h → URGENTE
  if (diffDias <= 3) return 7;
  if (diffDias <= 7) return 5;
  if (diffDias <= 15) return 2;
  return 0; // Muito longe, sem pontuação
}

/**
 * Calcula o score completo para uma oportunidade
 * Combina todos os componentes com pesos específicos
 * 
 * Ponderação:
 * - Intenção: 40% (até 40 pts)
 * - Ticket: 30% (até 50 pts)
 * - Engajamento: 20% (até 20 pts)
 * - Urgência: 10% (até 10 pts)
 * 
 * Score máximo possível: 120 pts (normalizado para 0-100)
 * 
 * @param params - Parâmetros para cálculo do score
 * @returns Componentes individuais e score consolidado
 */
export function calcularScoreParaOpportunity(params: {
  simulation: Simulation;
  opportunity: Opportunity;
  offer?: Offer | null;
  versoesRelacionadas: number;
}): ScoreComponents {
  const { simulation, offer, versoesRelacionadas } = params;

  // Converter valorAporte de centavos para reais
  const valorReais = simulation.valorAporte / 100;

  // Calcular componentes individuais
  const scoreValor = calcularScoreValor(valorReais);
  const scoreIntencao = calcularScoreIntencao(
    simulation.origemSimulacao,
    simulation.engajouComOferta === 1
  );
  const scoreEngajamento = calcularScoreEngajamento(versoesRelacionadas);
  const scoreUrgencia = calcularScoreUrgencia(offer);

  // Combinar componentes (máximo: 40 + 50 + 20 + 10 = 120)
  const rawScore = scoreIntencao + scoreValor + scoreEngajamento + scoreUrgencia;

  // Normalizar para 0-100
  const tokenizaScore = Math.max(0, Math.min(100, Math.round((rawScore / 120) * 100)));

  console.log(`🧠 Score calculado para oportunidade ${params.opportunity.id}:`);
  console.log(`  scoreValor=${scoreValor} (ticket: R$ ${valorReais.toLocaleString("pt-BR")})`);
  console.log(`  scoreIntencao=${scoreIntencao} (origem: ${simulation.origemSimulacao}, engajou: ${simulation.engajouComOferta === 1})`);
  console.log(`  scoreEngajamento=${scoreEngajamento} (versões: ${versoesRelacionadas})`);
  console.log(`  scoreUrgencia=${scoreUrgencia}`);
  console.log(`  tokenizaScore=${tokenizaScore} (raw: ${rawScore}/120)`);

  return {
    scoreValor,
    scoreIntencao,
    scoreEngajamento,
    scoreUrgencia,
    tokenizaScore,
  };
}
