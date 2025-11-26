/**
 * Script de teste para sincronizar ofertas da API da Tokeniza
 * Executar: node server/testSync.mjs
 */

import { syncOffersFromTokenizaApi } from "./db.ts";

async function testSync() {
  console.log("🔄 Iniciando sincronização com API da Tokeniza...\n");

  try {
    const result = await syncOffersFromTokenizaApi();
    
    console.log("\n✅ Sincronização concluída com sucesso!");
    console.log("\nResumo:");
    console.log(`  - Total recebidas da API: ${result.totalRecebidas}`);
    console.log(`  - Ofertas ativas: ${result.totalAtivas}`);
    console.log(`  - Ofertas inseridas/atualizadas: ${result.totalUpsert}`);
    console.log(`  - Ofertas desativadas: ${result.totalDesativadas}`);
    
  } catch (error) {
    console.error("\n❌ Erro ao sincronizar:", error.message);
    console.error(error);
  }
}

testSync();
