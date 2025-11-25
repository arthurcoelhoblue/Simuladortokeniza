/**
 * Script de migração de dados: Criar leads e associar simulações existentes
 * 
 * Este script:
 * 1. Busca todas as simulações existentes
 * 2. Cria um lead genérico para cada usuário único
 * 3. Associa as simulações aos leads criados
 * 4. Mantém retrocompatibilidade total
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { leads, simulations, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Iniciando migração de leads...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  
  try {
    // 1. Buscar todas as simulações existentes
    console.log('📊 Buscando simulações existentes...');
    const allSimulations = await db.select().from(simulations);
    console.log(`   Encontradas ${allSimulations.length} simulações\n`);
    
    if (allSimulations.length === 0) {
      console.log('✅ Nenhuma simulação para migrar');
      return;
    }
    
    // 2. Buscar todos os usuários
    console.log('👥 Buscando usuários...');
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    console.log(`   Encontrados ${allUsers.length} usuários\n`);
    
    // 3. Criar leads para cada usuário único
    console.log('📝 Criando leads...');
    const leadMap = new Map(); // userId -> leadId
    
    for (const user of allUsers) {
      // Criar lead com informações do usuário
      const [result] = await db.insert(leads).values({
        nomeCompleto: user.name || `Usuário ${user.id}`,
        email: user.email || null,
        telefone: null,
        cidade: null,
        estado: null,
        cpf: null,
        canalOrigem: 'migração_automática',
      });
      
      leadMap.set(user.id, result.insertId);
      console.log(`   ✓ Lead criado para usuário ${user.id} (${user.name || 'sem nome'})`);
    }
    
    console.log(`\n✅ ${leadMap.size} leads criados com sucesso\n`);
    
    // 4. Associar simulações aos leads
    console.log('🔗 Associando simulações aos leads...');
    let updated = 0;
    
    for (const simulation of allSimulations) {
      const leadId = leadMap.get(simulation.userId);
      
      if (!leadId) {
        console.warn(`   ⚠️  Simulação ${simulation.id} sem lead correspondente (userId: ${simulation.userId})`);
        continue;
      }
      
      await db.update(simulations)
        .set({ leadId })
        .where(eq(simulations.id, simulation.id));
      
      updated++;
    }
    
    console.log(`\n✅ ${updated} simulações associadas aos leads\n`);
    
    // 5. Verificar integridade
    console.log('🔍 Verificando integridade dos dados...');
    const simulationsWithoutLead = await db.select()
      .from(simulations)
      .where(eq(simulations.leadId, null));
    
    if (simulationsWithoutLead.length > 0) {
      console.warn(`   ⚠️  ${simulationsWithoutLead.length} simulações sem lead`);
    } else {
      console.log('   ✓ Todas as simulações têm lead associado');
    }
    
    console.log('\n✅ Migração concluída com sucesso!\n');
    
    // Resumo
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`   • Simulações processadas: ${allSimulations.length}`);
    console.log(`   • Leads criados: ${leadMap.size}`);
    console.log(`   • Simulações associadas: ${updated}`);
    console.log(`   • Simulações sem lead: ${simulationsWithoutLead.length}\n`);
    
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar migração
migrate()
  .then(() => {
    console.log('🎉 Processo finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  });
