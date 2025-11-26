import { Offer, Simulation } from "../drizzle/schema";

export type OfferMatch = {
  offer: Offer;
  scoreCompatibilidade: number; // 0 a 100
  motivos: string[];
};

/**
 * Helper para verificar se dois tipos de garantia são relacionados
 */
function areGuaranteesRelated(
  garantia1: string,
  garantia2: string
): boolean {
  // Recebíveis de cartão e duplicatas são considerados similares
  const receivables = ["recebiveis_cartao", "duplicatas"];
  if (receivables.includes(garantia1) && receivables.includes(garantia2)) {
    return true;
  }

  // Imóvel e veículo são considerados similares (ativos tangíveis)
  const tangible = ["imovel", "veiculo"];
  if (tangible.includes(garantia1) && tangible.includes(garantia2)) {
    return true;
  }

  return false;
}

/**
 * Motor de matching de ofertas para uma simulação
 * 
 * Aplica filtros duros e calcula score de compatibilidade baseado em:
 * - Investimento mínimo (30 pontos)
 * - Prazo (25 pontos)
 * - Tipo de garantia (25 pontos)
 * - Taxa (20 pontos)
 * - Tipo de ativo (5 pontos)
 */
export function matchOffersForSimulation(params: {
  simulation: Simulation;
  offers: Offer[];
  maxResults?: number;
}): OfferMatch[] {
  const { simulation, offers, maxResults } = params;

  console.log(
    `🔍 Matching: buscando ofertas para simulação #${simulation.id} (${simulation.tipoSimulacao})`
  );

  // 1. FILTROS DUROS
  const filteredOffers = offers.filter((offer) => {
    // 1.1. Tipo de oferta compatível
    if (simulation.tipoSimulacao === "investimento") {
      if (offer.tipoOferta !== "investimento") {
        return false;
      }
    } else if (simulation.tipoSimulacao === "financiamento") {
      if (offer.tipoOferta !== "financiamento") {
        return false;
      }
    }

    // 1.2. Status ativo
    if (offer.ativo !== 1) {
      return false;
    }

    // 1.3. Investimento mínimo
    const valorSimulacao =
      simulation.tipoSimulacao === "investimento"
        ? simulation.valorAporte
        : simulation.valorDesejado;

    if (offer.valorMinimo && valorSimulacao < offer.valorMinimo) {
      return false;
    }

    // 1.4. Faixa de prazo (0.5x a 2x)
    const prazoMin = Math.floor(simulation.prazoMeses * 0.5);
    const prazoMax = Math.ceil(simulation.prazoMeses * 2);

    if (offer.prazoMeses < prazoMin || offer.prazoMeses > prazoMax) {
      return false;
    }

    // 1.5. Tipo de garantia (se ambos tiverem, devem ser compatíveis)
    if (offer.tipoGarantia && simulation.tipoGarantia) {
      const sameGuarantee = offer.tipoGarantia === simulation.tipoGarantia;
      const relatedGuarantee = areGuaranteesRelated(
        offer.tipoGarantia,
        simulation.tipoGarantia
      );

      if (!sameGuarantee && !relatedGuarantee) {
        return false;
      }
    }

    return true;
  });

  console.log(
    `✅ Filtros duros: ${filteredOffers.length}/${offers.length} ofertas passaram`
  );

  // 2. CÁLCULO DE SCORE
  const matches: OfferMatch[] = filteredOffers.map((offer) => {
    let score = 0;
    const motivos: string[] = [];

    const valorSimulacao =
      simulation.tipoSimulacao === "investimento"
        ? simulation.valorAporte
        : simulation.valorDesejado;

    // 2.1. Investimento mínimo (peso ALTO: 30 pontos)
    if (offer.valorMinimo && valorSimulacao >= offer.valorMinimo) {
      if (offer.valorMaximo && valorSimulacao <= offer.valorMaximo) {
        score += 30;
        motivos.push(
          "Investimento está dentro da faixa ideal (entre mínimo e máximo)"
        );
      } else if (!offer.valorMaximo) {
        score += 30;
        motivos.push("Investimento é maior ou igual ao mínimo da oferta");
      } else if (valorSimulacao > offer.valorMaximo) {
        score += 20; // Penaliza menos do que antes
        motivos.push("Investimento acima do limite máximo sugerido");
      }
    } else if (!offer.valorMinimo) {
      score += 25;
      motivos.push("Oferta sem investimento mínimo definido");
    }

    // 2.2. Prazo (peso MÉDIO/ALTO: 25 pontos)
    const diffPrazo = Math.abs(simulation.prazoMeses - offer.prazoMeses);

    if (diffPrazo === 0) {
      score += 25;
      motivos.push("Prazo da simulação é idêntico ao da oferta");
    } else if (diffPrazo <= 6) {
      score += 20;
      motivos.push(
        `Prazo da simulação próximo ao da oferta (${diffPrazo} meses de diferença)`
      );
    } else if (diffPrazo <= 12) {
      score += 10;
      motivos.push(
        `Prazo da simulação relativamente próximo (${diffPrazo} meses)`
      );
    }

    // 2.3. Tipo de garantia (peso ALTO: 25 pontos)
    if (offer.tipoGarantia && simulation.tipoGarantia) {
      if (offer.tipoGarantia === simulation.tipoGarantia) {
        score += 25;
        motivos.push("Tipo de garantia é idêntico");
      } else if (
        areGuaranteesRelated(offer.tipoGarantia, simulation.tipoGarantia)
      ) {
        score += 15;
        motivos.push("Tipo de garantia é similar");
      }
    } else if (!offer.tipoGarantia) {
      score += 10;
      motivos.push("Oferta sem tipo de garantia definido");
    }

    // 2.4. Taxa (peso MÉDIO: 20 pontos)
    // Converter taxaAnual de basis points para percentual (ex: 2400 → 24%)
    const taxaOfertaPercent = offer.taxaAnual / 100;
    const taxaSimulacaoPercent = simulation.taxaJurosAa || 0;

    if (simulation.tipoSimulacao === "investimento") {
      // Para investidor: quanto maior a taxa da oferta, melhor
      if (taxaOfertaPercent >= taxaSimulacaoPercent) {
        score += 20;
        motivos.push(
          `Taxa da oferta (${taxaOfertaPercent}% a.a.) é igual ou superior à taxa alvo`
        );
      } else {
        const diffTaxa = taxaSimulacaoPercent - taxaOfertaPercent;
        if (diffTaxa <= 2) {
          score += 10;
          motivos.push(
            `Taxa da oferta (${taxaOfertaPercent}% a.a.) é um pouco abaixo da taxa alvo, mas competitiva`
          );
        }
      }
    } else {
      // Para emissor: quanto menor a taxa da oferta, melhor
      if (taxaOfertaPercent <= taxaSimulacaoPercent) {
        score += 20;
        motivos.push(
          `Taxa da oferta (${taxaOfertaPercent}% a.a.) é igual ou inferior à taxa alvo`
        );
      } else {
        const diffTaxa = taxaOfertaPercent - taxaSimulacaoPercent;
        if (diffTaxa <= 2) {
          score += 10;
          motivos.push(
            `Taxa da oferta (${taxaOfertaPercent}% a.a.) é um pouco acima da taxa alvo, mas competitiva`
          );
        }
      }
    }

    // 2.5. Tipo de ativo (peso SECUNDÁRIO: 5 pontos)
    if (offer.tipoAtivo && simulation.tipoGarantia) {
      // Loteamento com garantia imobiliária
      if (
        simulation.tipoGarantia === "imovel" &&
        offer.tipoAtivo === "loteamento"
      ) {
        score += 5;
        motivos.push("Ativo (loteamento) coerente com garantia imobiliária");
      }
      // Construção civil com garantia imobiliária
      else if (
        simulation.tipoGarantia === "imovel" &&
        offer.tipoAtivo === "construcao_civil"
      ) {
        score += 5;
        motivos.push(
          "Ativo (construção civil) coerente com garantia imobiliária"
        );
      }
      // Varejo/indústria com recebíveis
      else if (
        (simulation.tipoGarantia === "recebiveis_cartao" ||
          simulation.tipoGarantia === "duplicatas") &&
        (offer.tipoAtivo === "varejo" || offer.tipoAtivo === "industria")
      ) {
        score += 5;
        motivos.push("Ativo coerente com tipo de recebível");
      }
    }

    // Garantir score entre 0 e 100
    score = Math.max(0, Math.min(100, score));

    return {
      offer,
      scoreCompatibilidade: score,
      motivos,
    };
  });

  // 3. ORDENAR POR SCORE (maior primeiro)
  matches.sort((a, b) => b.scoreCompatibilidade - a.scoreCompatibilidade);

  // 4. DESCARTAR OFERTAS COM SCORE MUITO BAIXO (<25)
  const qualifiedMatches = matches.filter((m) => m.scoreCompatibilidade >= 25);

  console.log(
    `📊 Scores calculados: ${qualifiedMatches.length} ofertas com score >= 25`
  );

  if (qualifiedMatches.length > 0) {
    console.log(
      `🏆 Melhor match: "${qualifiedMatches[0].offer.nome}" (score: ${qualifiedMatches[0].scoreCompatibilidade})`
    );
  }

  // 5. LIMITAR RESULTADOS
  const finalMatches = maxResults
    ? qualifiedMatches.slice(0, maxResults)
    : qualifiedMatches;

  return finalMatches;
}
