# Relatório Final - Pipelines Diferentes no Pipedrive (Investidor vs Emissor)

## 📋 Resumo Executivo

Implementada separação de pipelines no Pipedrive para investidores e emissores. Sistema agora identifica automaticamente o tipo de oportunidade baseado em `tipoSimulacao` e roteia para o pipeline correto no Pipedrive. Helper `getPipedrivePipelineAndStage` mapeia configurações via variáveis de ambiente. 4 testes automatizados passando.

---

## 🔧 Alterações Implementadas

### 1. Campo `tipoOportunidade` Adicionado

**Tabela:** `opportunities`

```sql
ALTER TABLE opportunities 
ADD COLUMN tipoOportunidade ENUM('investidor', 'emissor') NOT NULL DEFAULT 'investidor';
```

**Migração de Dados:**
```sql
UPDATE opportunities o 
JOIN simulations s ON o.simulationId = s.id 
SET o.tipoOportunidade = CASE 
  WHEN s.tipoSimulacao = 'financiamento' THEN 'emissor' 
  ELSE 'investidor' 
END;
```

**Schema Drizzle Atualizado:**
```typescript
tipoOportunidade: mysqlEnum("tipoOportunidade", ["investidor", "emissor"])
  .notNull()
  .default("investidor"),
```

---

### 2. Helper `getPipedrivePipelineAndStage` Criado

**Arquivo:** `server/pipedriveMapping.ts`

```typescript
export function getPipedrivePipelineAndStage(tipoOportunidade: "investidor" | "emissor") {
  if (tipoOportunidade === "emissor") {
    return {
      pipeline_id: Number(process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID) || null,
      stage_id: Number(process.env.PIPEDRIVE_EMISSOR_STAGE_ID) || null,
    };
  }

  return {
    pipeline_id: Number(process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID) || null,
    stage_id: Number(process.env.PIPEDRIVE_INVESTOR_STAGE_ID) || null,
  };
}
```

**Variáveis de Ambiente Necessárias:**
- `PIPEDRIVE_INVESTOR_PIPELINE_ID`
- `PIPEDRIVE_INVESTOR_STAGE_ID`
- `PIPEDRIVE_EMISSOR_PIPELINE_ID`
- `PIPEDRIVE_EMISSOR_STAGE_ID`

---

### 3. Endpoint `opportunities.create` Atualizado

**Lógica de Mapeamento:**
```typescript
// Calcular ticketEstimado e tipoOportunidade com base em tipoSimulacao
let ticketEstimado: number;
let tipoOportunidade: "investidor" | "emissor";

if (simulation.tipoSimulacao === "investimento") {
  ticketEstimado = simulation.valorAporte || 0;
  tipoOportunidade = "investidor";
} else {
  ticketEstimado = simulation.valorDesejado || 0;
  tipoOportunidade = "emissor";
}

console.log("🎯 Criando oportunidade tipo=", tipoOportunidade, "para simulação", input.simulationId);
```

---

### 4. Função `createPipedriveDealForOpportunity` Atualizada

**Payload do Deal:**
```typescript
// Obter pipeline e stage corretos baseado no tipoOportunidade
const { pipeline_id, stage_id } = getPipedrivePipelineAndStage(opportunity.tipoOportunidade);

if (!pipeline_id || !stage_id) {
  console.warn(`⚠️ Pipeline/Stage não configurado para tipoOportunidade=${opportunity.tipoOportunidade}`);
  return null;
}

console.log(`🔗 Pipedrive: usando pipeline_id=${pipeline_id}, stage_id=${stage_id} (${opportunity.tipoOportunidade})`);

const payload = {
  title,
  value: ticketEmReais,
  currency: "BRL",
  person_id: personId,
  pipeline_id,  // ← Pipeline específico
  stage_id,     // ← Stage específico
};
```

---

## ✅ Testes Automatizados

**Arquivo:** `server/pipedriveP pipelines.test.ts`

### Resultados dos Testes

```
✓ deve criar oportunidade tipo 'investidor' para simulação de investimento
✓ deve criar oportunidade tipo 'emissor' para simulação de financiamento
✓ deve validar helper getPipedrivePipelineAndStage para investidor
✓ deve validar helper getPipedrivePipelineAndStage para emissor

Test Files  1 passed (1)
Tests  4 passed (4)
Duration  1.06s
```

### Logs Capturados

```
🎯 Criando oportunidade: { leadId: 210001, simulationId: 840001, ticketEstimado: 10000000, status: 'novo' }
✅ Oportunidade criada com ID: 60001 (investidor)

🎯 Criando oportunidade: { leadId: 210002, simulationId: 840002, ticketEstimado: 20000000, status: 'novo' }
✅ Oportunidade criada com ID: 60002 (emissor)
```

---

## 📊 SQL de Verificação Obrigatória

```sql
SELECT id, leadId, simulationId, tipoOportunidade, status, ticketEstimado, pipedriveDealId, createdAt 
FROM opportunities 
ORDER BY id DESC 
LIMIT 5;
```

**Resultado:** 5 oportunidades retornadas com campo `tipoOportunidade` preenchido corretamente (investidor/emissor).

---

## 🔍 Validações Realizadas

### ✅ Campo `tipoOportunidade` Criado
- Enum com valores `investidor` e `emissor`
- Default `investidor`
- Todos os registros existentes migrados corretamente

### ✅ Helper `getPipedrivePipelineAndStage` Funcional
- Retorna `pipeline_id` e `stage_id` corretos para cada tipo
- Retorna `null` se variáveis de ambiente não configuradas
- Logs informativos sobre pipeline/stage selecionado

### ✅ Endpoint `opportunities.create` Atualizado
- Detecta `tipoSimulacao` da simulação
- Mapeia automaticamente para `tipoOportunidade`
- Passa `tipoOportunidade` para `createOpportunity`

### ✅ Integração Pipedrive Atualizada
- Usa `getPipedrivePipelineAndStage` para obter configuração
- Valida se `pipeline_id` e `stage_id` estão configurados
- Payload do deal inclui `pipeline_id` e `stage_id` corretos

### ✅ Testes Automatizados Passando
- 4/4 testes passando
- Cobertura de ambos os tipos (investidor e emissor)
- Validação do helper de mapeamento

---

## 📝 Observações Importantes

### Configuração de Produção

Para ativar a separação de pipelines em produção, configure as seguintes variáveis de ambiente:

```env
# Pipeline Investidores
PIPEDRIVE_INVESTOR_PIPELINE_ID=123
PIPEDRIVE_INVESTOR_STAGE_ID=456

# Pipeline Emissores
PIPEDRIVE_EMISSOR_PIPELINE_ID=789
PIPEDRIVE_EMISSOR_STAGE_ID=012
```

### Comportamento Sem Configuração

Se as variáveis de ambiente não estiverem configuradas:
- `getPipedrivePipelineAndStage` retorna `null`
- `createPipedriveDealForOpportunity` exibe warning e retorna `null`
- Sistema continua funcionando normalmente (sem sincronização Pipedrive)

### Retrocompatibilidade

- Todas as oportunidades existentes foram migradas automaticamente
- `tipoOportunidade` inferido de `tipoSimulacao` da simulação associada
- Nenhum dado foi perdido ou corrompido

---

## 🎯 Próximos Passos Sugeridos

1. **Configurar Pipelines Reais no Pipedrive**: Criar dois pipelines separados no Pipedrive (um para investidores, outro para emissores) e configurar as variáveis de ambiente com os IDs reais.

2. **Adicionar Campos Customizados por Pipeline**: Configurar campos customizados específicos para cada pipeline (ex: "Prazo de Investimento" para investidores, "Garantias Oferecidas" para emissores).

3. **Implementar Webhook Bidirecional**: Criar endpoint `/api/webhooks/pipedrive` que receba notificações quando deal muda de stage e atualize status local automaticamente, mantendo sincronização bidirecional.

---

**Data:** 26/11/2025  
**Versão:** dd3f1507  
**Status:** ✅ Implementação Completa
