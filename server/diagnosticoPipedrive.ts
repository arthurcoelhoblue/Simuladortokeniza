/**
 * Script de Diagnóstico - Integração Pipedrive
 * 
 * Verifica configuração e testa conectividade com Pipedrive
 * 
 * Uso: npx tsx server/diagnosticoPipedrive.ts
 */

import axios from "axios";

console.log("🔍 ===== DIAGNÓSTICO PIPEDRIVE =====\n");

// 1. Verificar variáveis de ambiente
console.log("📋 1. VERIFICANDO VARIÁVEIS DE AMBIENTE\n");

const envVars = {
  PIPEDRIVE_API_TOKEN: process.env.PIPEDRIVE_API_TOKEN,
  PIPEDRIVE_BASE_URL: process.env.PIPEDRIVE_BASE_URL,
  PIPEDRIVE_INVESTOR_PIPELINE_ID: process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID,
  PIPEDRIVE_INVESTOR_STAGE_ID: process.env.PIPEDRIVE_INVESTOR_STAGE_ID,
  PIPEDRIVE_EMISSOR_PIPELINE_ID: process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID,
  PIPEDRIVE_EMISSOR_STAGE_ID: process.env.PIPEDRIVE_EMISSOR_STAGE_ID,
  PIPEDRIVE_DEFAULT_OWNER_ID: process.env.PIPEDRIVE_DEFAULT_OWNER_ID,
  PIPEDRIVE_FIELD_TOKENIZA_SCORE: process.env.PIPEDRIVE_FIELD_TOKENIZA_SCORE,
  PIPEDRIVE_FIELD_SCORE_VALOR: process.env.PIPEDRIVE_FIELD_SCORE_VALOR,
  PIPEDRIVE_FIELD_SCORE_INTENCAO: process.env.PIPEDRIVE_FIELD_SCORE_INTENCAO,
  PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO: process.env.PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO,
  PIPEDRIVE_FIELD_SCORE_URGENCIA: process.env.PIPEDRIVE_FIELD_SCORE_URGENCIA,
  PIPEDRIVE_FIELD_ORIGEM_SIMULACAO: process.env.PIPEDRIVE_FIELD_ORIGEM_SIMULACAO,
  PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE: process.env.PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE,
};

let missingVars: string[] = [];
let configuredVars: string[] = [];

Object.entries(envVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: NÃO CONFIGURADO`);
    missingVars.push(key);
  } else {
    // Mascarar token para segurança
    const displayValue = key === "PIPEDRIVE_API_TOKEN" 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
    configuredVars.push(key);
  }
});

console.log(`\n📊 Resumo: ${configuredVars.length}/${Object.keys(envVars).length} variáveis configuradas\n`);

if (missingVars.includes("PIPEDRIVE_API_TOKEN") || missingVars.includes("PIPEDRIVE_BASE_URL")) {
  console.log("🚨 ERRO CRÍTICO: PIPEDRIVE_API_TOKEN ou PIPEDRIVE_BASE_URL não configurados!");
  console.log("⚠️  A integração NÃO FUNCIONARÁ sem essas credenciais.\n");
  console.log("📝 Para configurar, adicione no painel de controle → Settings → Secrets:\n");
  console.log("   PIPEDRIVE_API_TOKEN=seu_token_aqui");
  console.log("   PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1\n");
  process.exit(1);
}

// 2. Testar conectividade com Pipedrive
console.log("\n🌐 2. TESTANDO CONECTIVIDADE COM PIPEDRIVE\n");

const api = axios.create({
  baseURL: process.env.PIPEDRIVE_BASE_URL,
  params: {
    api_token: process.env.PIPEDRIVE_API_TOKEN,
  },
});

async function testConnection() {
  try {
    console.log("➡️  Fazendo requisição GET /users...");
    const res = await api.get("/users");
    
    if (res.data.success) {
      console.log("✅ Conectividade OK!");
      console.log(`📊 Usuários encontrados: ${res.data.data?.length || 0}\n`);
      
      if (res.data.data && res.data.data.length > 0) {
        console.log("👥 Usuários disponíveis:");
        res.data.data.slice(0, 5).forEach((user: any) => {
          console.log(`   - ID: ${user.id} | Nome: ${user.name} | Email: ${user.email}`);
        });
        console.log();
      }
    } else {
      console.log("⚠️  Resposta inesperada:", res.data);
    }
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.log("❌ ERRO DE CONEXÃO:");
      console.log(`   Status: ${err.response?.status}`);
      console.log(`   Mensagem: ${err.response?.data?.error || err.message}`);
      
      if (err.response?.status === 401) {
        console.log("\n🚨 ERRO 401: Token inválido ou expirado!");
        console.log("   Verifique se o PIPEDRIVE_API_TOKEN está correto.\n");
      }
    } else {
      console.log("❌ ERRO:", err.message);
    }
    process.exit(1);
  }
}

(async () => {
  await testConnection();

// 3. Verificar pipelines
console.log("\n📊 3. VERIFICANDO PIPELINES\n");

async function checkPipelines() {
  try {
    console.log("➡️  Buscando pipelines...");
    const res = await api.get("/pipelines");
    
    if (res.data.success && res.data.data) {
      console.log(`✅ Pipelines encontrados: ${res.data.data.length}\n`);
      
      res.data.data.forEach((pipeline: any) => {
        console.log(`📌 Pipeline ID: ${pipeline.id} | Nome: ${pipeline.name}`);
        
        // Verificar se é o pipeline configurado
        if (pipeline.id === Number(process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID)) {
          console.log(`   ✅ Este é o pipeline de INVESTIDOR configurado`);
        }
        if (pipeline.id === Number(process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID)) {
          console.log(`   ✅ Este é o pipeline de EMISSOR configurado`);
        }
      });
      console.log();
    }
  } catch (err: any) {
    console.log("❌ Erro ao buscar pipelines:", err.response?.data || err.message);
  }
}

await checkPipelines();

// 4. Verificar stages dos pipelines configurados
console.log("\n🎯 4. VERIFICANDO STAGES DOS PIPELINES CONFIGURADOS\n");

async function checkStages(pipelineId: number, tipo: string) {
  try {
    console.log(`➡️  Buscando stages do pipeline ${pipelineId} (${tipo})...`);
    const res = await api.get(`/stages`, {
      params: { pipeline_id: pipelineId }
    });
    
    if (res.data.success && res.data.data) {
      console.log(`✅ Stages encontrados: ${res.data.data.length}\n`);
      
      res.data.data.forEach((stage: any) => {
        console.log(`   🔹 Stage ID: ${stage.id} | Nome: ${stage.name}`);
        
        // Verificar se é o stage configurado
        const configuredStageId = tipo === "INVESTIDOR" 
          ? Number(process.env.PIPEDRIVE_INVESTOR_STAGE_ID)
          : Number(process.env.PIPEDRIVE_EMISSOR_STAGE_ID);
          
        if (stage.id === configuredStageId) {
          console.log(`      ✅ Este é o stage configurado para ${tipo}`);
        }
      });
      console.log();
    }
  } catch (err: any) {
    console.log(`❌ Erro ao buscar stages do pipeline ${pipelineId}:`, err.response?.data || err.message);
  }
}

if (process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID) {
  await checkStages(Number(process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID), "INVESTIDOR");
}

if (process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID) {
  await checkStages(Number(process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID), "EMISSOR");
}

// 5. Verificar campos customizados (se configurados)
console.log("\n🔧 5. VERIFICANDO CAMPOS CUSTOMIZADOS\n");

const customFields = [
  { key: "PIPEDRIVE_FIELD_TOKENIZA_SCORE", name: "Score Tokeniza" },
  { key: "PIPEDRIVE_FIELD_SCORE_VALOR", name: "Score Valor" },
  { key: "PIPEDRIVE_FIELD_SCORE_INTENCAO", name: "Score Intenção" },
  { key: "PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO", name: "Score Engajamento" },
  { key: "PIPEDRIVE_FIELD_SCORE_URGENCIA", name: "Score Urgência" },
  { key: "PIPEDRIVE_FIELD_ORIGEM_SIMULACAO", name: "Origem Simulação" },
  { key: "PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE", name: "Tipo Oportunidade" },
];

const configuredFields = customFields.filter(f => process.env[f.key]);

if (configuredFields.length === 0) {
  console.log("⚠️  Nenhum campo customizado configurado.");
  console.log("   Os scores NÃO serão enviados para o Pipedrive.\n");
  console.log("📝 Para configurar campos customizados:");
  console.log("   1. Acesse Pipedrive → Configurações → Campos Customizados");
  console.log("   2. Crie os campos de score (tipo: número)");
  console.log("   3. Copie os IDs dos campos (ex: abc123def456)");
  console.log("   4. Configure as variáveis de ambiente correspondentes\n");
} else {
  console.log(`✅ ${configuredFields.length}/${customFields.length} campos customizados configurados:\n`);
  configuredFields.forEach(f => {
    console.log(`   ✅ ${f.name}: ${process.env[f.key]}`);
  });
  console.log();
}

// 6. Resumo final
console.log("\n📋 ===== RESUMO DO DIAGNÓSTICO =====\n");

const issues: string[] = [];
const warnings: string[] = [];

if (missingVars.includes("PIPEDRIVE_INVESTOR_PIPELINE_ID") || 
    missingVars.includes("PIPEDRIVE_INVESTOR_STAGE_ID")) {
  issues.push("Pipeline/Stage de INVESTIDOR não configurado");
}

if (missingVars.includes("PIPEDRIVE_EMISSOR_PIPELINE_ID") || 
    missingVars.includes("PIPEDRIVE_EMISSOR_STAGE_ID")) {
  issues.push("Pipeline/Stage de EMISSOR não configurado");
}

if (configuredFields.length === 0) {
  warnings.push("Campos customizados não configurados (scores não serão enviados)");
}

if (!process.env.PIPEDRIVE_DEFAULT_OWNER_ID) {
  warnings.push("PIPEDRIVE_DEFAULT_OWNER_ID não configurado (deals sem dono fixo)");
}

if (issues.length > 0) {
  console.log("🚨 PROBLEMAS CRÍTICOS:");
  issues.forEach(issue => console.log(`   ❌ ${issue}`));
  console.log();
}

if (warnings.length > 0) {
  console.log("⚠️  AVISOS:");
  warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  console.log();
}

if (issues.length === 0 && warnings.length === 0) {
  console.log("✅ TUDO CONFIGURADO CORRETAMENTE!\n");
  console.log("🎉 A integração Pipedrive está pronta para uso.\n");
} else if (issues.length === 0) {
  console.log("✅ CONFIGURAÇÃO BÁSICA OK!\n");
  console.log("⚠️  Há avisos não críticos, mas a integração funcionará.\n");
} else {
  console.log("❌ CONFIGURAÇÃO INCOMPLETA!\n");
  console.log("🔧 Corrija os problemas críticos acima antes de usar a integração.\n");
}

console.log("\n📝 Para mais detalhes, consulte: GUIA_LOGS_PIPEDRIVE.md\n");
})();