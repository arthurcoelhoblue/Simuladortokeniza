/**
 * Cliente para integração com a API da Tokeniza
 * Endpoint: GET https://plataforma.tokeniza.com.br/api/v1/crowdfunding/getCrowdfundingList
 * 
 * Responsável por:
 * - Buscar lista de ofertas de crowdfunding da plataforma Tokeniza
 * - Normalizar dados da API para o schema interno (tabela offers)
 * - Sincronizar ofertas (upsert + desativação de ofertas ausentes)
 */

const TOKENIZA_CROWDFUNDING_URL =
  "https://plataforma.tokeniza.com.br/api/v1/crowdfunding/getCrowdfundingList";

/**
 * Busca lista de ofertas de crowdfunding da plataforma Tokeniza
 * @returns Resposta bruta da API
 * @throws Error se a API retornar erro
 */
export async function fetchCrowdfundingListFromTokeniza(): Promise<any> {
  console.log("📡 Chamando getCrowdfundingList...");
  
  try {
    const res = await fetch(TOKENIZA_CROWDFUNDING_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      // Se em algum momento precisar header/token, centralizar aqui
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Erro ao chamar getCrowdfundingList:", res.status, errorText);
      throw new Error(`Falha ao obter lista de ofertas da Tokeniza: ${res.status}`);
    }

    const data = await res.json();
    console.log("📡 Resposta bruta getCrowdfundingList, chaves topo:", Object.keys(data));
    console.log("📡 Total de ofertas recebidas:", Array.isArray(data.data) ? data.data.length : 0);
    
    return data;
  } catch (error) {
    console.error("❌ Erro ao buscar ofertas da Tokeniza:", error);
    throw error;
  }
}

// Formato real observado em 2025-11-26:
// A API retorna um ARRAY DIRETO (não um objeto {success, data})
// [
//   {
//     id: "f7575a78-4863-11ef-8a04-06aff79fa023" (UUID string),
//     name: "Renda Passiva Com Energia Solar",
//     type: "ESG - Sustentabilidade",
//     minimumContribution: "1000" (string, em reais),
//     targetCapture: "600000" (string, em reais),
//     deadline: "40" (string, prazo em meses),
//     profitability: "24" (string, rentabilidade anual em %),
//     status: "finished" | "open" | "coming_soon" | ...,
//     finalDate: "2025-01-24T00:00:00.000Z" (ISO string),
//     startDate: "2024-07-28T00:00:00.000Z" (ISO string),
//     company: "USE CONDOMINIO LOGISTICO E ENERGIA LTDA",
//     moneyReceived: 574636.49 (number, valor já captado),
//     img: "https://...",
//     ...
//   },
//   ...
// ]

/**
 * Tipo representando um item de crowdfunding retornado pela API da Tokeniza
 * (Será refinado após observar JSON real)
 */
export type TokenizaCrowdfundingItem = {
  id?: string; // UUID string
  name?: string;
  type?: string; // categoria/tipo (ex: "ESG - Sustentabilidade")
  minimumContribution?: string; // string em reais (ex: "1000")
  targetCapture?: string; // string em reais (ex: "600000")
  deadline?: string; // string em meses (ex: "40")
  profitability?: string; // string em % anual (ex: "24")
  status?: string; // "open", "finished", "coming_soon", etc
  finalDate?: string; // ISO date
  startDate?: string; // ISO date
  company?: string;
  moneyReceived?: number; // valor já captado
  img?: string; // URL da imagem
  [key: string]: any; // permitir campos extras
};

/**
 * Tipo normalizado para inserção/atualização na tabela offers
 */
export type NormalizedOffer = {
  externalId: string;
  nome: string;
  descricao?: string | null;
  tipoOferta: "investimento"; // todo crowdfunding aqui é investimento
  tipoGarantia?: string | null;
  tipoAtivo?: string | null;
  valorMinimo?: number | null;      // em centavos
  valorMaximo?: number | null;      // em centavos
  valorTotalOferta: number;         // em centavos
  prazoMeses: number | null;
  taxaAnual: number | null;         // em centésimos (24% → 2400)
  ativo: boolean;
  dataEncerramento?: Date | null;
};

/**
 * Normaliza um item da API da Tokeniza para o formato do schema offers
 * 
 * Conversões importantes:
 * - Valores monetários: API retorna em reais → converter para centavos (*100)
 * - Taxa anual: API retorna decimal (0.24) → converter para centésimos (2400)
 * - Status: API retorna string → converter para boolean ativo
 * 
 * @param raw Item bruto da API
 * @returns Objeto normalizado pronto para upsert
 */
export function normalizeTokenizaOffer(raw: TokenizaCrowdfundingItem): NormalizedOffer {
  // ExternalId: usar id (UUID)
  const externalId = String(raw.id ?? "unknown");
  
  // Nome
  const nome = raw.name ?? "Oferta sem nome";
  
  // Descrição: usar tipo/categoria como descrição
  const descricao = raw.type ?? null;

  // Valor mínimo de investimento (converter de R$ string para centavos)
  const valorMinimo = raw.minimumContribution != null
    ? Math.round(Number(raw.minimumContribution) * 100)
    : null;

  // Valor total da oferta (converter de R$ string para centavos)
  const valorTotalOferta = raw.targetCapture != null
    ? Math.round(Number(raw.targetCapture) * 100)
    : 0;

  // Prazo em meses (converter de string para number)
  const prazoMeses = raw.deadline != null
    ? Number(raw.deadline)
    : null;

  // Taxa anual: API retorna string em % (ex: "24" = 24% a.a.)
  // Converter para centésimos: "24" → 2400
  const taxaAnual = raw.profitability != null
    ? Math.round(Number(raw.profitability) * 100) // "24" * 100 = 2400
    : null;

  // Tipo de garantia e ativo: API não fornece esses campos diretamente
  // Usar tipo/categoria como tipoAtivo
  const tipoGarantia = null;
  const tipoAtivo = raw.type ?? null;

  // Status: considerar ativo se status = "open"
  const ativo = raw.status === "open";

  // Data de encerramento
  const dataEncerramento = raw.finalDate
    ? new Date(raw.finalDate)
    : null;

  return {
    externalId,
    nome,
    descricao,
    tipoOferta: "investimento",
    tipoGarantia,
    tipoAtivo,
    valorMinimo,
    valorMaximo: null, // API não fornece valor máximo
    valorTotalOferta,
    prazoMeses,
    taxaAnual,
    ativo,
    dataEncerramento,
  };
}
