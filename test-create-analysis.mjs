import { drizzle } from "drizzle-orm/mysql2";
import { analises } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

// Dados mínimos para criar uma análise válida
const novaAnalise = {
  nome: "Teste Patch 9A - Validação Risco",
  captadorId: 1, // ID do Arthur Coelho
  valorCaptacao: 1000000,
  percentualCoinvestimento: 20,
  feeFixo: 25000,
  taxaSucesso: 5,
  taxaJurosMensal: 1.85,
  prazoMeses: 48,
  carenciaMeses: 6,
  modalidadePagamento: "SAC",
  
  // CAPEX
  capexObras: 1200000,
  capexEquipamentos: 800000,
  capexLicencas: 100000,
  capexMarketing: 150000,
  capexCapitalGiro: 200000,
  
  // OPEX (custos fixos mensais)
  opexAluguel: 80000,
  opexPessoal: 350000,
  opexRoyalties: 0,
  opexMarketing: 40000,
  opexUtilidades: 20000,
  opexManutencao: 0,
  opexSeguros: 30000,
  
  // Receitas mensais
  ticketMedio: 200,
  qtdMesInicio: 200,
  crescimentoMensal: 3,
  crescimentoAte: 10,
  custoVariavelPct: 10,
  
  // Campos adicionais
  capacidadeMaxima: 500,
  clientesInicio: 50,
  clientesSteadyState: 400,
  
  // Cenários automáticos
  usarCenariosAutomaticos: true,
};

try {
  console.log("🔄 Inserindo análise de teste...");
  
  const [result] = await db.insert(analises).values(novaAnalise);
  
  console.log("✅ Análise criada com sucesso!");
  console.log("ID:", result.insertId);
  console.log("\n📊 Acesse em: /captador/viabilidade/" + result.insertId);
  
  process.exit(0);
} catch (error) {
  console.error("❌ Erro ao criar análise:", error.message);
  process.exit(1);
}
