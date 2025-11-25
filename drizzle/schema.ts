import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de leads
 * Armazena informações de contato de investidores e captadores
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(), // Campo obrigatório para contato
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cpf: varchar("cpf", { length: 14 }),
  canalOrigem: varchar("canalOrigem", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Tabela de simulações de investimento
 * Armazena os parâmetros e resultados de cada simulação
 */
export const simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(), // Referência ao lead que criou a simulação
  
  // Dados da oferta
  descricaoOferta: text("descricaoOferta"),
  valorTotalOferta: int("valorTotalOferta").notNull(), // em centavos
  valorInvestido: int("valorInvestido").notNull(), // em centavos
  dataEncerramentoOferta: varchar("dataEncerramentoOferta", { length: 10 }).notNull(), // Data de encerramento da captação // YYYY-MM-DD
  prazoMeses: int("prazoMeses").notNull(),
  taxaJurosAa: int("taxaJurosAa").notNull(), // em centésimos de % (ex: 2400 = 24%)
  convencaoCalendario: varchar("convencaoCalendario", { length: 20 }).notNull().default("civil/365"),
  tipoCapitalizacao: varchar("tipoCapitalizacao", { length: 20 }).notNull().default("composta"),
  
  // Regras de pagamento
  periodicidadeJuros: varchar("periodicidadeJuros", { length: 20 }).notNull().default("mensal"),
  periodicidadeAmortizacao: varchar("periodicidadeAmortizacao", { length: 20 }).notNull().default("mensal"),
  carenciaJurosMeses: int("carenciaJurosMeses").notNull().default(0),
  carenciaPrincipalMeses: int("carenciaPrincipalMeses").notNull().default(0),
  capitalizarJurosEmCarencia: int("capitalizarJurosEmCarencia").notNull().default(1), // boolean: 0 ou 1
  amortizacaoMetodo: varchar("amortizacaoMetodo", { length: 20 }).notNull().default("linear"),
  pagamentoMinimoValor: int("pagamentoMinimoValor"), // em centavos, nullable
  
  // Custos e taxas
  taxaSetupFixaBrl: int("taxaSetupFixaBrl").notNull().default(0), // em centavos
  feeSucessoPercentSobreCaptacao: int("feeSucessoPercentSobreCaptacao").notNull().default(0), // em centésimos de %
  feeManutencaoMensalBrl: int("feeManutencaoMensalBrl").notNull().default(0), // em centavos
  taxaTransacaoPercent: int("taxaTransacaoPercent").notNull().default(0), // em centésimos de %
  aliquotaImpostoRendaPercent: int("aliquotaImpostoRendaPercent").notNull().default(0), // em centésimos de %
  
  // Outros
  modo: varchar("modo", { length: 20 }).notNull().default("investidor"), // 'investidor' ou 'captador'
  identificadorInvestidor: varchar("identificadorInvestidor", { length: 100 }),
  moedaReferencia: varchar("moedaReferencia", { length: 10 }).notNull().default("BRL"),
  
  // Resultados calculados (armazenados para performance)
  totalJurosPagos: int("totalJurosPagos").notNull().default(0), // em centavos
  totalAmortizado: int("totalAmortizado").notNull().default(0), // em centavos
  totalRecebido: int("totalRecebido").notNull().default(0), // em centavos
  tirMensal: int("tirMensal"), // em centésimos de % (nullable)
  tirAnual: int("tirAnual"), // em centésimos de % (nullable)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = typeof simulations.$inferInsert;

/**
 * Tabela de cronograma mensal
 * Armazena cada parcela do cronograma de uma simulação
 */
export const cronogramas = mysqlTable("cronogramas", {
  id: int("id").autoincrement().primaryKey(),
  simulationId: int("simulationId").notNull(),
  
  mes: int("mes").notNull(), // 1 a N
  dataParcela: varchar("dataParcela", { length: 10 }).notNull(), // YYYY-MM-DD
  saldoInicial: int("saldoInicial").notNull(), // em centavos
  juros: int("juros").notNull(), // em centavos
  amortizacao: int("amortizacao").notNull(), // em centavos
  parcela: int("parcela").notNull(), // em centavos (juros + amortização + taxas)
  custosFixos: int("custosFixos").notNull().default(0), // em centavos
  saldoFinal: int("saldoFinal").notNull(), // em centavos
  observacoes: text("observacoes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Cronograma = typeof cronogramas.$inferSelect;
export type InsertCronograma = typeof cronogramas.$inferInsert;