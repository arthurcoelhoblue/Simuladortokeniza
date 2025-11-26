import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
 * Armazena APENAS parâmetros técnicos e referências (dados de lead estão na tabela leads)
 */
export const simulations = mysqlTable("simulations", {
  // Identificação e referências
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(), // FK → leads.id
  
  // Tipo e modalidade
  tipoSimulacao: mysqlEnum("tipoSimulacao", ["investimento", "financiamento"]).notNull().default("investimento"),
  modalidade: varchar("modalidade", { length: 50 }), // Ex: "capital_giro", "expansao", "imovel"
  descricaoOferta: text("descricaoOferta"),
  
  // Valores (em centavos)
  valorDesejado: int("valorDesejado").notNull(), // Valor total da operação
  valorAporte: int("valorAporte").notNull(), // Valor que o investidor aporta / financiado recebe
  valorTotalOferta: int("valorTotalOferta").notNull(), // Valor total da oferta
  
  // Prazos e datas
  prazoMeses: int("prazoMeses").notNull(),
  dataEncerramentoOferta: varchar("dataEncerramentoOferta", { length: 10 }).notNull(), // YYYY-MM-DD
  
  // Taxas e juros
  taxaMensal: int("taxaMensal").notNull(), // em centésimos de % (ex: 200 = 2%)
  taxaJurosAa: int("taxaJurosAa").notNull(), // em centésimos de % (ex: 2400 = 24%)
  convencaoCalendario: varchar("convencaoCalendario", { length: 20 }).notNull().default("civil/365"),
  tipoCapitalizacao: varchar("tipoCapitalizacao", { length: 20 }).notNull().default("composta"),
  
  // Sistema de amortização
  sistemaAmortizacao: mysqlEnum("sistemaAmortizacao", ["PRICE", "SAC", "BULLET", "JUROS_MENSAL", "LINEAR"]).notNull().default("LINEAR"),
  
  // Carência
  possuiCarencia: int("possuiCarencia").notNull().default(0), // boolean: 0 ou 1
  mesesCarencia: int("mesesCarencia").notNull().default(0),
  carenciaJurosMeses: int("carenciaJurosMeses").notNull().default(0),
  carenciaPrincipalMeses: int("carenciaPrincipalMeses").notNull().default(0),
  capitalizarJurosEmCarencia: int("capitalizarJurosEmCarencia").notNull().default(1), // boolean: 0 ou 1
  
  // Garantias
  tipoGarantia: mysqlEnum("tipoGarantia", ["recebiveis_cartao", "duplicatas", "imovel", "veiculo", "sem_garantia"]).default("sem_garantia"),
  
  // Periodicidade
  periodicidadeJuros: varchar("periodicidadeJuros", { length: 20 }).notNull().default("mensal"),
  periodicidadeAmortizacao: varchar("periodicidadeAmortizacao", { length: 20 }).notNull().default("mensal"),
  pagamentoMinimoValor: int("pagamentoMinimoValor"), // em centavos, nullable
  
  // Custos e taxas
  taxaSetupFixaBrl: int("taxaSetupFixaBrl").notNull().default(0), // em centavos
  feeSucessoPercentSobreCaptacao: int("feeSucessoPercentSobreCaptacao").notNull().default(0), // em centésimos de %
  feeManutencaoMensalBrl: int("feeManutencaoMensalBrl").notNull().default(0), // em centavos
  taxaTransacaoPercent: int("taxaTransacaoPercent").notNull().default(0), // em centésimos de %
  aliquotaImpostoRendaPercent: int("aliquotaImpostoRendaPercent").notNull().default(0), // em centésimos de %
  
  // Modo (mantido para compatibilidade, mas tipoSimulacao é o campo oficial)
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
  
  mes: int("mes").notNull(), // 1 a N (número da parcela)
  dataParcela: varchar("dataParcela", { length: 10 }).notNull(), // YYYY-MM-DD
  saldoInicial: int("saldoInicial").notNull(), // em centavos
  juros: int("juros").notNull(), // em centavos
  amortizacao: int("amortizacao").notNull(), // em centavos
  parcela: int("parcela").notNull(), // em centavos (juros + amortização + taxas)
  custosFixos: int("custosFixos").notNull().default(0), // em centavos
  saldoFinal: int("saldoFinal").notNull(), // em centavos
  observacoes: text("observacoes"),
  
  // Novos campos de normalização
  tipoSistema: mysqlEnum("tipoSistema", ["PRICE", "SAC", "BULLET", "JUROS_MENSAL", "LINEAR"]).notNull().default("LINEAR"),
  versaoCalculo: int("versaoCalculo").notNull().default(1),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Índice composto para melhorar performance de leitura
export const cronogramasIndex = mysqlTable("cronogramas", {
  simulationId: int("simulationId").notNull(),
  mes: int("mes").notNull(),
}, (table) => ({
  simulationMesIdx: index("simulation_mes_idx").on(table.simulationId, table.mes),
}));

export type Cronograma = typeof cronogramas.$inferSelect;
export type InsertCronograma = typeof cronogramas.$inferInsert;