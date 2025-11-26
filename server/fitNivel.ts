/**
 * Calcula o fitNivel (classificação de qualidade) baseado no tokenizaScore
 * 
 * Regras:
 * - tokenizaScore >= 75 → prioritario
 * - tokenizaScore >= 50 e < 75 → quente
 * - tokenizaScore >= 25 e < 50 → morno
 * - tokenizaScore < 25 → frio
 * 
 * @param tokenizaScore - Score consolidado (0-100)
 * @returns Nível de fit da oportunidade
 */
export function calcularFitNivel(tokenizaScore: number): "frio" | "morno" | "quente" | "prioritario" {
  if (tokenizaScore >= 75) return "prioritario";
  if (tokenizaScore >= 50) return "quente";
  if (tokenizaScore >= 25) return "morno";
  return "frio";
}
