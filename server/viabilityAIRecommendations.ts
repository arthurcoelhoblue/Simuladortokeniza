/**
 * Patch 9C: Recomendações com IA (LLM)
 * 
 * Gera recomendações personalizadas usando LLM baseadas no contexto
 * financeiro completo do projeto de viabilidade.
 * 
 * Fallback: Se LLM falhar, usa recomendações baseadas em regras (Patch 9A)
 */

import { invokeLLM } from "./_core/llm";
import { RiskLevel, gerarRecomendacoesConservadoras } from "./viabilityRisk";

export interface AIRecommendationsInput {
  // Identificação
  nomeProjeto: string;
  
  // Classificação de risco
  riskLevel: RiskLevel;
  
  // Indicadores do cenário Conservador
  paybackMeses: number | null;
  ebitdaMes12: number;
  ebitdaMes24: number;
  margemBrutaPctMes12: number;
  
  // Comparação entre cenários
  ebitdaBase: number;
  ebitdaConservador: number;
  ebitdaOtimista: number;
  
  // Estrutura de custos
  receitaMensal: number;
  opexMensal: number;
  custoVariavelPct: number;
  
  // Captação
  valorCaptacao: number;
  taxaJurosMensal: number;
  prazoMeses: number;
  modeloPagamento: string;
  
  // Receitas (resumo)
  quantidadeReceitas: number;
  receitaPrincipal?: string;
  
  // Custos fixos (resumo)
  quantidadeCustosFixos: number;
  custoPrincipal?: string;
}

export interface AIRecommendationsOutput {
  recomendacoes: string[];
  analiseResumida: string;
  pontosFortesCount: number;
  pontosAtencaoCount: number;
  geradoPorIA: boolean;
}

/**
 * Gera recomendações personalizadas usando LLM
 * 
 * O prompt é estruturado para:
 * 1. Contextualizar o projeto (nome, setor implícito, captação)
 * 2. Apresentar indicadores financeiros chave
 * 3. Comparar cenários (Base vs Conservador vs Otimista)
 * 4. Solicitar 3-5 recomendações acionáveis
 * 
 * Retorna JSON estruturado com recomendações e análise resumida
 */
export async function generateAIRecommendations(
  input: AIRecommendationsInput
): Promise<AIRecommendationsOutput> {
  try {
    const prompt = buildPrompt(input);
    
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um analista financeiro especializado em viabilidade de projetos de investimento tokenizado. 
Sua função é analisar indicadores financeiros e gerar recomendações acionáveis para captadores.
Seja direto, específico e prático. Evite jargões excessivos.
Responda SEMPRE em português brasileiro.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "viability_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              analiseResumida: {
                type: "string",
                description: "Resumo de 1-2 frases sobre a saúde financeira do projeto"
              },
              pontosFortesCount: {
                type: "integer",
                description: "Quantidade de pontos fortes identificados (0-5)"
              },
              pontosAtencaoCount: {
                type: "integer",
                description: "Quantidade de pontos de atenção identificados (0-5)"
              },
              recomendacoes: {
                type: "array",
                items: {
                  type: "string",
                  description: "Recomendação acionável de 1-2 frases"
                },
                description: "Lista de 3-5 recomendações específicas e acionáveis"
              }
            },
            required: ["analiseResumida", "pontosFortesCount", "pontosAtencaoCount", "recomendacoes"],
            additionalProperties: false
          }
        }
      }
    });

    const content = result.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("LLM retornou conteúdo vazio ou inválido");
    }

    const parsed = JSON.parse(content) as {
      analiseResumida: string;
      pontosFortesCount: number;
      pontosAtencaoCount: number;
      recomendacoes: string[];
    };

    // Validar que temos pelo menos 1 recomendação
    if (!parsed.recomendacoes || parsed.recomendacoes.length === 0) {
      throw new Error("LLM não retornou recomendações");
    }

    console.log(`✅ [IA] Recomendações geradas para "${input.nomeProjeto}": ${parsed.recomendacoes.length} itens`);

    return {
      recomendacoes: parsed.recomendacoes,
      analiseResumida: parsed.analiseResumida,
      pontosFortesCount: parsed.pontosFortesCount,
      pontosAtencaoCount: parsed.pontosAtencaoCount,
      geradoPorIA: true,
    };

  } catch (error) {
    console.error(`⚠️ [IA] Falha ao gerar recomendações, usando fallback:`, error);
    
    // Fallback: usar recomendações baseadas em regras (Patch 9A)
    const fallbackRecs = gerarRecomendacoesConservadoras({
      margemBrutaPctMes12: input.margemBrutaPctMes12,
      opexMensal: input.opexMensal,
      receitaMensal: input.receitaMensal,
      paybackMeses: input.paybackMeses ?? undefined,
    });

    return {
      recomendacoes: fallbackRecs,
      analiseResumida: `Análise baseada em regras. Risco: ${input.riskLevel}.`,
      pontosFortesCount: input.riskLevel === "baixo" ? 3 : input.riskLevel === "medio" ? 1 : 0,
      pontosAtencaoCount: input.riskLevel === "alto" ? 3 : input.riskLevel === "medio" ? 2 : 1,
      geradoPorIA: false,
    };
  }
}

/**
 * Constrói o prompt estruturado para o LLM
 */
function buildPrompt(input: AIRecommendationsInput): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100); // Converter centavos para reais
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const riskEmoji = {
    baixo: "🟩",
    medio: "🟨",
    alto: "🟥",
  };

  const divergencia = input.ebitdaOtimista > 0 && input.ebitdaConservador > 0
    ? ((input.ebitdaOtimista - input.ebitdaConservador) / input.ebitdaConservador * 100).toFixed(0)
    : "N/A";

  return `
# Análise de Viabilidade: ${input.nomeProjeto}

## Classificação de Risco
${riskEmoji[input.riskLevel]} **${input.riskLevel.toUpperCase()}** (baseado no cenário Conservador)

## Indicadores do Cenário Conservador
- Payback: ${input.paybackMeses ? `${input.paybackMeses} meses` : "N/A"}
- EBITDA Mês 12: ${formatCurrency(input.ebitdaMes12)}
- EBITDA Mês 24: ${formatCurrency(input.ebitdaMes24)}
- Margem Bruta (Mês 12): ${formatPercent(input.margemBrutaPctMes12)}

## Comparação de Cenários (EBITDA Mês 12)
- Base: ${formatCurrency(input.ebitdaBase)}
- Conservador: ${formatCurrency(input.ebitdaConservador)}
- Otimista: ${formatCurrency(input.ebitdaOtimista)}
- Divergência Otimista/Conservador: ${divergencia}%

## Estrutura Financeira
- Receita Mensal (Mês 12): ${formatCurrency(input.receitaMensal)}
- OPEX Mensal: ${formatCurrency(input.opexMensal)}
- Custo Variável: ${formatPercent(input.custoVariavelPct)}
- Quantidade de Fontes de Receita: ${input.quantidadeReceitas}
- Quantidade de Custos Fixos: ${input.quantidadeCustosFixos}

## Captação
- Valor Total: ${formatCurrency(input.valorCaptacao)}
- Taxa de Juros: ${formatPercent(input.taxaJurosMensal / 100)} a.m.
- Prazo: ${input.prazoMeses} meses
- Modelo: ${input.modeloPagamento}

---

Com base nos dados acima, gere:
1. Uma análise resumida de 1-2 frases sobre a saúde financeira do projeto
2. Conte quantos pontos fortes você identificou (0-5)
3. Conte quantos pontos de atenção você identificou (0-5)
4. Liste 3-5 recomendações específicas e acionáveis para o captador

Foque em:
- Otimização de custos variáveis se margem bruta < 40%
- Diversificação de receitas se há poucas fontes
- Redução de OPEX se payback > 36 meses
- Renegociação de taxas se custo de capital elevado
- Estratégias de crescimento se cenários divergem muito
`;
}

/**
 * Versão simplificada para testes (não chama LLM)
 */
export function generateMockAIRecommendations(
  input: AIRecommendationsInput
): AIRecommendationsOutput {
  const recs: string[] = [];

  // Simular análise inteligente
  if (input.margemBrutaPctMes12 < 40) {
    recs.push(`A margem bruta de ${input.margemBrutaPctMes12.toFixed(1)}% está abaixo do ideal. Considere renegociar contratos com fornecedores ou ajustar preços em ${input.quantidadeReceitas > 1 ? "algumas linhas de receita" : "sua receita principal"}.`);
  }

  if (input.paybackMeses && input.paybackMeses > 36) {
    recs.push(`Payback de ${input.paybackMeses} meses é elevado. Avalie reduzir OPEX em ${Math.round(input.opexMensal * 0.1 / 100).toLocaleString('pt-BR')} R$/mês para acelerar o retorno.`);
  }

  if (input.quantidadeReceitas === 1) {
    recs.push("Projeto depende de uma única fonte de receita. Diversificar pode reduzir risco operacional.");
  }

  if (input.ebitdaOtimista > 0 && input.ebitdaConservador > 0) {
    const divergencia = (input.ebitdaOtimista - input.ebitdaConservador) / input.ebitdaConservador * 100;
    if (divergencia > 100) {
      recs.push(`Alta volatilidade entre cenários (${divergencia.toFixed(0)}% de divergência). Valide premissas de crescimento com dados de mercado.`);
    }
  }

  if (recs.length === 0) {
    recs.push("Projeto apresenta indicadores saudáveis. Mantenha monitoramento mensal de EBITDA e margem.");
  }

  return {
    recomendacoes: recs,
    analiseResumida: `Projeto com risco ${input.riskLevel}. ${recs.length} recomendações identificadas.`,
    pontosFortesCount: input.riskLevel === "baixo" ? 3 : 1,
    pontosAtencaoCount: recs.length,
    geradoPorIA: false,
  };
}
