import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  telefone: varchar("telefone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  perfil: mysqlEnum("perfil", ["captador", "investidor"]),
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
  pipedrivePersonId: varchar("pipedrivePersonId", { length: 50 }),
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
  
  // Versionamento
  version: int("version").notNull().default(1),
  parentSimulationId: int("parentSimulationId"),
  
  // Sistema de scoring - origem e engajamento
  origemSimulacao: mysqlEnum("origemSimulacao", ["manual", "oferta_tokeniza"]).notNull().default("manual"),
  engajouComOferta: int("engajouComOferta").notNull().default(0), // boolean: 0 ou 1
  offerId: int("offerId"), // FK → offers.id (nullable)
  
  // Rastreabilidade de origem cruzada (Patch 5)
  originViabilityId: int("originViabilityId"), // FK → viability_analysis.id (nullable)
  
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

/**
 * Tabela de oportunidades (funil de vendas)
 * Conecta leads e simulações ao pipeline comercial
 */
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  simulationId: int("simulationId").notNull(),
  ownerUserId: int("ownerUserId"), // Responsável interno (FK → users.id)
  
  // Tipo de oportunidade (investidor ou emissor)
  tipoOportunidade: mysqlEnum("tipoOportunidade", ["investidor", "emissor"]).notNull().default("investidor"),
  
  // Status do funil
  status: mysqlEnum("status", [
    "novo",
    "em_analise",
    "aguardando_cliente",
    "em_oferta",
    "ganho",
    "perdido"
  ]).notNull().default("novo"),
  
  reasonLost: varchar("reasonLost", { length: 255 }), // Motivo da perda
  
  // Stage (opcional, para funil mais detalhado)
  stage: mysqlEnum("stage", [
    "lead_inicial",
    "lead_qualificado",
    "proposta_em_construcao",
    "proposta_enviada",
    "negociacao",
    "fechado"
  ]),
  
  // Métricas e estimativas
  ticketEstimado: int("ticketEstimado").notNull(), // em centavos
  probabilidade: int("probabilidade").notNull().default(0), // 0-100
  
  // Próxima ação
  nextAction: varchar("nextAction", { length: 255 }),
  nextActionAt: timestamp("nextActionAt"),
  
  // Integração Pipedrive
  pipedriveDealId: varchar("pipedriveDealId", { length: 50 }),
  pipedriveOrgId: varchar("pipedriveOrgId", { length: 50 }),
  
  // Sistema de scoring Tokeniza
  tokenizaScore: int("tokenizaScore").notNull().default(0), // Score consolidado (0-100)
  fitNivel: mysqlEnum("fitNivel", ["frio", "morno", "quente", "prioritario"]).notNull().default("frio"), // Classificação de qualidade
  scoreValor: int("scoreValor").notNull().default(0), // Componente: ticket (até 50 pts)
  scoreIntencao: int("scoreIntencao").notNull().default(0), // Componente: intenção (até 40 pts)
  scoreEngajamento: int("scoreEngajamento").notNull().default(0), // Componente: engajamento (até 20 pts)
  scoreUrgencia: int("scoreUrgencia").notNull().default(0), // Componente: urgência (até 10 pts)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerStatusIdx: index("owner_status_idx").on(table.ownerUserId, table.status),
  leadIdx: index("lead_idx").on(table.leadId),
  simulationIdx: index("simulation_idx").on(table.simulationId),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * Tabela de ofertas Tokeniza para matching com simulações
 */
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 100 }).unique(), // ID externo da Tokeniza
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  
  // Tipo e características
  tipoOferta: mysqlEnum("tipoOferta", ["investimento", "financiamento"]).notNull(),
  tipoGarantia: mysqlEnum("tipoGarantia", ["recebiveis_cartao", "duplicatas", "imovel", "veiculo", "sem_garantia"]),
  tipoAtivo: varchar("tipoAtivo", { length: 100 }), // ex: "loteamento", "construcao_civil", "consignado"
  
  // Valores
  valorMinimo: int("valorMinimo"), // em centavos
  valorMaximo: int("valorMaximo"), // em centavos
  valorTotalOferta: int("valorTotalOferta").notNull(), // em centavos
  
  // Prazo e taxa
  prazoMeses: int("prazoMeses").notNull(),
  taxaAnual: int("taxaAnual").notNull(), // em basis points (ex: 2400 = 24%)
  
  // Status
  ativo: int("ativo").notNull().default(1), // 1 = ativo, 0 = inativo
  
  // Urgência da oferta
  dataEncerramento: timestamp("dataEncerramento"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tipoOfertaIdx: index("tipo_oferta_idx").on(table.tipoOferta),
  ativoIdx: index("ativo_idx").on(table.ativo),
}));

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

/**
 * Tabela de propostas comerciais
 * Armazena propostas geradas para clientes (apenas admin)
 */
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull(), // FK → users.id (admin que criou)
  
  // Página 1 - Capa
  dataMesAno: varchar("dataMesAno", { length: 50 }).notNull(), // ex: "Dezembro de 2025"
  
  // Página 2 - Apresentação
  empresa: varchar("empresa", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }).notNull(),
  endereco: text("endereco").notNull(),
  dataApresentacao: varchar("dataApresentacao", { length: 50 }).notNull(), // ex: "dezembro de 2025"
  
  // Página 3 - Projeto
  valorCaptacao: int("valorCaptacao").notNull(), // em centavos
  nomeProjeto: varchar("nomeProjeto", { length: 255 }).notNull(),
  lastroAtivo: varchar("lastroAtivo", { length: 255 }).notNull(),
  visaoGeral: text("visaoGeral").notNull(),
  captacaoInicial: text("captacaoInicial").notNull(),
  destinacaoRecursos: text("destinacaoRecursos").notNull(),
  prazoExecucao: varchar("prazoExecucao", { length: 255 }).notNull(),
  prazoCaptacao: varchar("prazoCaptacao", { length: 255 }).notNull(),
  
  // Página 6 - Valores
  valorFixoInicial: int("valorFixoInicial").notNull(), // em centavos
  taxaSucesso: int("taxaSucesso").notNull(), // em centavos
  valorLiquidoTotal: int("valorLiquidoTotal").notNull(), // em centavos
  
  // Armazenamento do PDF gerado
  pdfUrl: text("pdfUrl"), // URL do PDF no S3
  pdfKey: varchar("pdfKey", { length: 255 }), // Chave do arquivo no S3
  
  // Status
  status: mysqlEnum("status", ["rascunho", "gerado", "enviado"]).notNull().default("rascunho"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdx: index("created_by_idx").on(table.createdByUserId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

/**
 * Tabela de análises de viabilidade
 * Armazena análises financeiras de negócios para tokenização
 */
export const viabilityAnalysis = mysqlTable("viability_analysis", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  nome: varchar("nome", { length: 255 }).notNull(),
  
  // 1. DADOS DA CAPTAÇÃO (TOKENIZAÇÃO)
  valorCaptacao: int("valorCaptacao").notNull(), // em centavos
  coInvestimento: int("coInvestimento").notNull(), // percentual em basis points (ex: 2000 = 20%)
  feeFixo: int("feeFixo").notNull(), // em centavos
  taxaSucesso: int("taxaSucesso").notNull(), // percentual em basis points (ex: 500 = 5%)
  
  // 2. REMUNERAÇÃO DOS INVESTIDORES
  taxaJurosMensal: int("taxaJurosMensal").notNull(), // percentual em basis points (ex: 185 = 1.85%)
  prazoMeses: int("prazoMeses").notNull(),
  carenciaMeses: int("carenciaMeses").notNull(),
  modeloPagamento: mysqlEnum("modeloPagamento", ["SAC", "PRICE", "BULLET"]).notNull(),
  
  // 3. CUSTOS DE IMPLANTAÇÃO (CAPEX)
  capexObras: int("capexObras").notNull(), // em centavos
  capexEquipamentos: int("capexEquipamentos").notNull(),
  capexLicencas: int("capexLicencas").notNull(),
  capexMarketing: int("capexMarketing").notNull(),
  capexCapitalGiro: int("capexCapitalGiro").notNull(),
  capexOutros: int("capexOutros").notNull(),
  
  // 4. CUSTOS OPERACIONAIS MENSAIS (OPEX)
  opexAluguel: int("opexAluguel").notNull(), // em centavos
  opexPessoal: int("opexPessoal").notNull(),
  opexRoyalties: int("opexRoyalties").notNull(),
  opexMarketing: int("opexMarketing").notNull(),
  opexUtilidades: int("opexUtilidades").notNull(),
  opexManutencao: int("opexManutencao").notNull(),
  opexSeguros: int("opexSeguros").notNull(),
  opexOutros: int("opexOutros").notNull(),
  
  // 5. PROJEÇÃO DE RECEITAS
  ticketMedio: int("ticketMedio").notNull(), // em centavos
  capacidadeMaxima: int("capacidadeMaxima").notNull(), // número de clientes
  mesAbertura: int("mesAbertura").notNull(), // mês após CAPEX
  clientesInicio: int("clientesInicio").notNull(), // clientes no mês 1 de operação
  taxaCrescimento: int("taxaCrescimento").notNull(), // percentual em basis points (ex: 1000 = 10%)
  mesEstabilizacao: int("mesEstabilizacao").notNull(),
  clientesSteadyState: int("clientesSteadyState").notNull(),
  
  // RESULTADOS CALCULADOS (JSON)
  fluxoCaixa: text("fluxoCaixa"), // JSON array de 60 meses
  indicadores: text("indicadores"), // JSON com indicadores calculados
  
  // Status
  status: mysqlEnum("status", ["em_analise", "viavel", "inviavel"]).notNull().default("em_analise"),
  
  // Rastreabilidade de origem cruzada (Patch 5)
  originSimulationId: int("originSimulationId"), // FK → simulations.id (nullable)
  
  // Patch 6.1: Viabilidade Genérica - Múltiplas receitas e custos fixos
  receitas: text("receitas"), // JSON array de ReceitaItem[]
  custosFixos: text("custosFixos"), // JSON array de CustoFixoItem[]
  // Patch 7: Custo variável global
  custoVariavelGlobalPct: decimal("custoVariavelGlobalPct", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type ViabilityAnalysis = typeof viabilityAnalysis.$inferSelect;
export type InsertViabilityAnalysis = typeof viabilityAnalysis.$inferInsert;
