/**
 * Patch 9A: Narrativa de Risco & Recomendações Inteligentes
 * 
 * Classifica risco de projetos baseado no cenário Conservador e gera
 * recomendações automáticas acionáveis.
 * 
 * Princípios:
 * - Cenário Conservador é o teste de estresse
 * - Nunca usar Otimista como referência de risco
 * - Se Conservador quebra → projeto é arriscado
 */

export type RiskLevel = "baixo" | "medio" | "alto";

export interface RiskClassification {
  level: RiskLevel;
  baseScenario: "Conservador";
  recomendacoes: string[];
}

/**
 * Classifica risco baseado no cenário Conservador
 * 
 * Critérios:
 * - 🟥 Alto risco: Payback > 48 meses OU EBITDA negativo no mês 24
 * - 🟨 Médio risco: Payback entre 36–48 meses
 * - 🟩 Baixo risco: Payback ≤ 36 meses
 */
export function classificarRiscoConservador(indicadores: {
  paybackMeses?: number;
  ebitdaMes24?: number;
}): RiskLevel {
  if (!indicadores) return "alto";

  // Alto risco: Payback > 48 meses
  if (
    indicadores.paybackMeses &&
    indicadores.paybackMeses > 48
  ) return "alto";

  // Alto risco: EBITDA negativo no mês 24
  if (
    indicadores.ebitdaMes24 !== undefined &&
    indicadores.ebitdaMes24 < 0
  ) return "alto";

  // Médio risco: Payback entre 36–48 meses
  if (
    indicadores.paybackMeses &&
    indicadores.paybackMeses > 36
  ) return "medio";

  // Baixo risco: Payback ≤ 36 meses
  return "baixo";
}

/**
 * Gera recomendações automáticas baseadas em métricas do cenário Conservador
 * 
 * Regras:
 * - Margem bruta < 40% → sugerir reajuste de preços ou redução de custos variáveis
 * - Payback > 36 meses → sugerir redução de OPEX ou aumento de crescimento
 * - Caso saudável → mensagem positiva
 */
export function gerarRecomendacoesConservadoras(input: {
  margemBrutaPctMes12?: number;
  opexMensal?: number;
  receitaMensal?: number;
  paybackMeses?: number;
}): string[] {
  const recs: string[] = [];

  // Margem bruta baixa
  if (input.margemBrutaPctMes12 !== undefined && input.margemBrutaPctMes12 < 40) {
    recs.push("Margem bruta abaixo de 40%. Avalie reajuste de preços ou redução de custos variáveis.");
  }

  // Payback elevado
  if (input.paybackMeses && input.paybackMeses > 36) {
    recs.push("Payback elevado. Reduzir OPEX ou aumentar crescimento pode melhorar a atratividade.");
  }

  // Caso saudável (sem recomendações críticas)
  if (recs.length === 0) {
    recs.push("Projeto apresenta boa resiliência mesmo em cenário conservador.");
  }

  return recs;
}

/**
 * Classifica risco completo e gera recomendações
 * 
 * Função principal que combina classificação + recomendações
 */
export function classificarRiscoCompleto(input: {
  indicadores: {
    paybackMeses?: number;
    ebitdaMes24?: number;
  };
  metricas: {
    margemBrutaPctMes12?: number;
    opexMensal?: number;
    receitaMensal?: number;
    paybackMeses?: number;
  };
}): RiskClassification {
  const level = classificarRiscoConservador(input.indicadores);
  const recomendacoes = gerarRecomendacoesConservadoras(input.metricas);

  return {
    level,
    baseScenario: "Conservador",
    recomendacoes,
  };
}
