import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { cronogramas, InsertCronograma, InsertLead, InsertOpportunity, InsertProposal, InsertSimulation, InsertUser, leads, opportunities, proposals, simulations, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Simulações
export async function createSimulation(simulation: InsertSimulation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(simulations).values(simulation);
  return result[0].insertId;
}

export async function getSimulationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSimulationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(simulations).where(eq(simulations.userId, userId)).orderBy(desc(simulations.createdAt));
}

export async function updateSimulation(id: number, data: Partial<InsertSimulation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(simulations).set(data).where(eq(simulations.id, id));
}

export async function deleteSimulation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deleta cronogramas associados
  await db.delete(cronogramas).where(eq(cronogramas.simulationId, id));
  // Deleta simulação
  await db.delete(simulations).where(eq(simulations.id, id));
}

/**
 * Cria uma nova versão de uma simulação existente
 * @param previousSimulationId ID da simulação anterior
 * @param overrides Campos a sobrescrever na nova versão
 * @returns ID da nova simulação criada
 */
export async function createSimulationVersion(
  previousSimulationId: number,
  overrides: Partial<InsertSimulation>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar simulação anterior
  const previousSimulation = await getSimulationById(previousSimulationId);
  if (!previousSimulation) {
    throw new Error(`Simulação anterior não encontrada: ${previousSimulationId}`);
  }

  console.log("🧬 Criando nova versão de simulação:", {
    anterior: previousSimulationId,
    novaVersao: previousSimulation.version + 1,
  });

  // Criar novo registro copiando campos da anterior e aplicando overrides
  const newSimulation: InsertSimulation = {
    ...previousSimulation,
    ...overrides,
    // Campos de versionamento
    version: previousSimulation.version + 1,
    parentSimulationId: previousSimulationId,
    // Remover campos auto-gerados
    id: undefined as any,
    createdAt: undefined as any,
    updatedAt: undefined as any,
  };

  // Salvar nova simulação
  const newSimulationId = await createSimulation(newSimulation);
  console.log("✅ Nova simulação versão", newSimulation.version, "criada com ID:", newSimulationId);

  return newSimulationId;
}

// Cronogramas
export async function createCronogramas(items: InsertCronograma[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (items.length === 0) return;
  await db.insert(cronogramas).values(items);
}

export async function getCronogramasBySimulationId(simulationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(cronogramas).where(eq(cronogramas.simulationId, simulationId)).orderBy(cronogramas.mes);
}

export async function deleteCronogramasBySimulationId(simulationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cronogramas).where(eq(cronogramas.simulationId, simulationId));
}

// Leads
export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(lead);
  return result[0].insertId;
}

export async function getLeadByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLeadByWhatsapp(whatsapp: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.whatsapp, whatsapp)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ==================== OPPORTUNITIES ====================

export async function createOpportunity(data: InsertOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log("🎯 Criando oportunidade:", {
    leadId: data.leadId,
    simulationId: data.simulationId,
    ticketEstimado: data.ticketEstimado,
    status: data.status || "novo",
  });

  const result = await db.insert(opportunities).values(data);
  const opportunityId = result[0].insertId;

  console.log("✅ Oportunidade criada com ID:", opportunityId);
  return opportunityId;
}

export async function getOpportunitiesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.ownerUserId, userId))
    .orderBy(opportunities.createdAt);

  return result;
}

export async function getOpportunities(filters?: {
  status?: string;
  ownerUserId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  // Build where conditions
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(opportunities.status, filters.status as any));
  }
  if (filters?.ownerUserId) {
    conditions.push(eq(opportunities.ownerUserId, filters.ownerUserId));
  }

  // Execute query with filters
  if (conditions.length > 0) {
    const result = await db
      .select()
      .from(opportunities)
      .where(and(...conditions))
      .orderBy(opportunities.createdAt);
    return result;
  }

  // No filters - return all
  const result = await db
    .select()
    .from(opportunities)
    .orderBy(opportunities.createdAt);
  return result;
}

export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Atualiza um lead existente
 */
export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(leads).set(data).where(eq(leads.id, id));
}

/**
 * Atualiza uma oportunidade existente
 */
export async function updateOpportunity(id: number, data: Partial<InsertOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(opportunities).set(data).where(eq(opportunities.id, id));
}

/**
 * Busca todas as ofertas ativas
 */
export async function getActiveOffers() {
  const db = await getDb();
  if (!db) return [];

  const { offers } = await import("../drizzle/schema");
  const result = await db.select().from(offers).where(eq(offers.ativo, 1));
  return result;
}

/**
 * Busca uma oferta por ID
 */
export async function getOfferById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const { offers } = await import("../drizzle/schema");
  const result = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Conta o número de simulações relacionadas ao mesmo lead
 * Usado para calcular scoreEngajamento
 * 
 * @param leadId - ID do lead
 * @param tipoSimulacao - Tipo da simulação (investimento/financiamento)
 * @returns Número de simulações relacionadas
 */
export async function countRelatedSimulations(leadId: number, tipoSimulacao: "investimento" | "financiamento"): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(simulations)
    .where(
      and(
        eq(simulations.leadId, leadId),
        eq(simulations.tipoSimulacao, tipoSimulacao)
      )
    );

  return result.length;
}

export async function updateOpportunityScores(
  opportunityId: number,
  scores: {
    tokenizaScore: number;
    fitNivel: "frio" | "morno" | "quente" | "prioritario";
    scoreValor: number;
    scoreIntencao: number;
    scoreEngajamento: number;
    scoreUrgencia: number;
  }
) {
  const database = await getDb();
  if (!database) {
    console.warn("[Database] Cannot update opportunity scores: database not available");
    return;
  }

  await database
    .update(opportunities)
    .set({
      tokenizaScore: scores.tokenizaScore,
      fitNivel: scores.fitNivel,
      scoreValor: scores.scoreValor,
      scoreIntencao: scores.scoreIntencao,
      scoreEngajamento: scores.scoreEngajamento,
      scoreUrgencia: scores.scoreUrgencia,
      updatedAt: new Date(),
    })
    .where(eq(opportunities.id, opportunityId));
}

/**
 * Insere ou atualiza uma oferta da Tokeniza baseado em externalId
 * @param data Dados normalizados da oferta
 * @returns ID da oferta inserida/atualizada
 */
export async function upsertOfferFromTokeniza(data: {
  externalId: string;
  nome: string;
  descricao?: string | null;
  tipoOferta: "investimento" | "financiamento";
  tipoGarantia?: string | null;
  tipoAtivo?: string | null;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  valorTotalOferta: number;
  prazoMeses: number | null;
  taxaAnual: number | null;
  ativo: boolean;
  dataEncerramento?: Date | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { offers } = await import("../drizzle/schema");

  // Buscar oferta existente por externalId
  const existing = await db
    .select()
    .from(offers)
    .where(eq(offers.externalId, data.externalId))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar oferta existente
    await db
      .update(offers)
      .set({
        nome: data.nome,
        descricao: data.descricao,
        tipoOferta: data.tipoOferta,
        tipoGarantia: data.tipoGarantia as any,
        tipoAtivo: data.tipoAtivo,
        valorMinimo: data.valorMinimo,
        valorMaximo: data.valorMaximo,
        valorTotalOferta: data.valorTotalOferta,
        prazoMeses: data.prazoMeses ?? 12, // default 12 meses se null
        taxaAnual: data.taxaAnual ?? 0, // default 0 se null
        ativo: data.ativo ? 1 : 0,
        dataEncerramento: data.dataEncerramento,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, existing[0].id));

    return existing[0].id;
  } else {
    // Inserir nova oferta
    const result: any = await db.insert(offers).values({
      externalId: data.externalId,
      nome: data.nome,
      descricao: data.descricao,
      tipoOferta: data.tipoOferta,
      tipoGarantia: data.tipoGarantia as any,
      tipoAtivo: data.tipoAtivo,
      valorMinimo: data.valorMinimo,
      valorMaximo: data.valorMaximo,
      valorTotalOferta: data.valorTotalOferta,
      prazoMeses: data.prazoMeses ?? 12, // default 12 meses se null
      taxaAnual: data.taxaAnual ?? 0, // default 0 se null
      ativo: data.ativo ? 1 : 0,
      dataEncerramento: data.dataEncerramento,
    });

    return Number(result.insertId);
  }
}

/**
 * Sincroniza ofertas da API da Tokeniza com o banco de dados
 * - Upserta ofertas recebidas da API
 * - Desativa ofertas que sumiram da plataforma (ativo = false)
 * 
 * @returns Resumo da sincronização
 */
export async function syncOffersFromTokenizaApi(): Promise<{
  totalRecebidas: number;
  totalAtivas: number;
  totalUpsert: number;
  totalDesativadas: number;
}> {
  const { fetchCrowdfundingListFromTokeniza, normalizeTokenizaOffer } = await import("./tokenizaApiClient");
  
  const raw = await fetchCrowdfundingListFromTokeniza();
  
  // A API retorna um array direto
  const items: any[] = Array.isArray(raw) ? raw : (raw.data ?? raw.offers ?? []);

  const externalIdsDaApi: string[] = [];
  let totalAtivas = 0;
  let totalUpsert = 0;

  for (const item of items) {
    const normalized = normalizeTokenizaOffer(item);

    if (!normalized.externalId || !normalized.nome || !normalized.valorTotalOferta) {
      console.warn("⚠️ Oferta ignorada por dados insuficientes:", normalized);
      continue;
    }

    externalIdsDaApi.push(normalized.externalId);
    await upsertOfferFromTokeniza(normalized);
    totalUpsert++;
    if (normalized.ativo) totalAtivas++;
  }

  // 🔁 ESPELHAR ESTADO: desativar ofertas que sumiram da API
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { offers } = await import("../drizzle/schema");
  const { and, isNotNull } = await import("drizzle-orm");

  const offersControladasPelaApi = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.tipoOferta, "investimento"),
        isNotNull(offers.externalId)
      )
    );

  let totalDesativadas = 0;

  for (const offer of offersControladasPelaApi) {
    if (offer.externalId && !externalIdsDaApi.includes(offer.externalId)) {
      if (offer.ativo) {
        await db
          .update(offers)
          .set({ ativo: 0, updatedAt: new Date() })
          .where(eq(offers.id, offer.id));
        totalDesativadas++;
        console.log(`🔄 Oferta desativada (sumiu da API): ${offer.nome} (externalId: ${offer.externalId})`);
      }
    }
  }

  console.log("✅ syncOffersFromTokenizaApi resumo:", {
    totalRecebidas: items.length,
    totalAtivas,
    totalUpsert,
    totalDesativadas,
  });

  return {
    totalRecebidas: items.length,
    totalAtivas,
    totalUpsert,
    totalDesativadas,
  };
}

// ============================================
// Funções de Propostas (Proposals)
// ============================================

export async function createProposal(data: InsertProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(proposals).values(data);
  return result[0].insertId;
}

export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProposalsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(proposals)
    .where(eq(proposals.createdByUserId, userId))
    .orderBy(desc(proposals.createdAt));
}

export async function getAllProposals() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(proposals)
    .orderBy(desc(proposals.createdAt));
}

export async function updateProposal(id: number, data: Partial<InsertProposal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(proposals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(proposals.id, id));
}

export async function deleteProposal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(proposals).where(eq(proposals.id, id));
}
