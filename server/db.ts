import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { cronogramas, InsertCronograma, InsertLead, InsertSimulation, InsertUser, leads, simulations, users } from "../drizzle/schema";
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
