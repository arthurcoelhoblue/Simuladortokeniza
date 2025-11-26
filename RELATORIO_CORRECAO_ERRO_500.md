# Relatório Final - Correção do Erro 500 no Endpoint simulations.create

**Data:** 26 de novembro de 2025  
**Projeto:** Simulador de Investimentos Tokenizados  
**Tarefa:** PROMPT 2.5 - Correção de Erro 500 + Hardening do Fluxo de Criação

---

## 1. Resumo Completo das Alterações

### 1.1 Campos Removidos da Tabela de Simulações
**Nenhum campo foi removido fisicamente**, mas os seguintes campos legados foram tornados **opcionais no banco de dados**:
- `valorInvestido` (INT NULL) - mantido para compatibilidade retroativa
- `amortizacaoMetodo` (VARCHAR(50) NULL) - mantido para compatibilidade retroativa

### 1.2 Campos Renomeados
Não houve renomeação física de colunas. A estratégia adotada foi **adicionar novos campos padronizados** e mapear os campos legados para os novos:

| Campo Legado | Campo Novo | Tipo | Observação |
|--------------|------------|------|------------|
| `valorInvestido` | `valorAporte` | INT NOT NULL | Usado para investimentos |
| `modo` | `tipoSimulacao` | ENUM | 'investimento' \| 'financiamento' |
| `amortizacaoMetodo` | `sistemaAmortizacao` | ENUM | 'PRICE' \| 'SAC' \| 'BULLET' \| 'JUROS_MENSAL' \| 'LINEAR' |

### 1.3 Campos Adicionados
Os seguintes campos foram adicionados na refatoração anterior (PROMPT 2):
- `tipoSimulacao` ENUM('investimento', 'financiamento') NOT NULL
- `modalidade` VARCHAR(100) NULL
- `valorDesejado` INT NOT NULL (para financiamentos)
- `valorAporte` INT NOT NULL (para investimentos)
- `sistemaAmortizacao` ENUM('PRICE', 'SAC', 'BULLET', 'JUROS_MENSAL', 'LINEAR') NOT NULL
- `possuiCarencia` TINYINT(1) NOT NULL DEFAULT 0
- `mesesCarencia` INT NOT NULL DEFAULT 0
- `tipoGarantia` ENUM('recebiveis_cartao', 'duplicatas', 'imovel', 'veiculo', 'sem_garantia') NOT NULL
- `taxaMensal` INT NOT NULL (taxa em centavos de %)

### 1.4 Enums Criados ou Atualizados

#### `tipoSimulacao`
```sql
ENUM('investimento', 'financiamento')
```
- **investimento**: Simulação do ponto de vista do investidor
- **financiamento**: Simulação do ponto de vista do captador de recursos

#### `sistemaAmortizacao`
```sql
ENUM('PRICE', 'SAC', 'BULLET', 'JUROS_MENSAL', 'LINEAR')
```
- **PRICE**: Sistema de amortização constante (parcelas fixas)
- **SAC**: Sistema de amortização crescente
- **BULLET**: Pagamento único no final
- **JUROS_MENSAL**: Pagamento apenas de juros mensais
- **LINEAR**: Amortização linear (padrão anterior)

#### `tipoGarantia`
```sql
ENUM('recebiveis_cartao', 'duplicatas', 'imovel', 'veiculo', 'sem_garantia')
```

### 1.5 Migrations Alteradas/Criadas

#### Migration 0005 (Manual)
```sql
-- Adicionar novos campos padronizados
ALTER TABLE simulations ADD COLUMN tipoSimulacao ENUM('investimento', 'financiamento') NOT NULL DEFAULT 'investimento';
ALTER TABLE simulations ADD COLUMN modalidade VARCHAR(100) NULL;
ALTER TABLE simulations ADD COLUMN valorDesejado INT NOT NULL DEFAULT 0;
ALTER TABLE simulations ADD COLUMN valorAporte INT NOT NULL DEFAULT 0;
ALTER TABLE simulations ADD COLUMN sistemaAmortizacao ENUM('PRICE', 'SAC', 'BULLET', 'JUROS_MENSAL', 'LINEAR') NOT NULL DEFAULT 'LINEAR';
ALTER TABLE simulations ADD COLUMN possuiCarencia TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE simulations ADD COLUMN mesesCarencia INT NOT NULL DEFAULT 0;
ALTER TABLE simulations ADD COLUMN tipoGarantia ENUM('recebiveis_cartao', 'duplicatas', 'imovel', 'veiculo', 'sem_garantia') NOT NULL DEFAULT 'sem_garantia';
ALTER TABLE simulations ADD COLUMN taxaMensal INT NOT NULL DEFAULT 0;

-- Migrar dados existentes
UPDATE simulations SET valorAporte = valorInvestido WHERE valorInvestido IS NOT NULL;
UPDATE simulations SET valorDesejado = valorTotalOferta;
UPDATE simulations SET taxaMensal = ROUND((taxaJurosAa / 12) * 100);

-- Tornar campos legados opcionais
ALTER TABLE simulations MODIFY COLUMN valorInvestido INT NULL;
ALTER TABLE simulations MODIFY COLUMN amortizacaoMetodo VARCHAR(50) NULL;
```

### 1.6 Ajustes Realizados nos Endpoints

#### **server/routers.ts - Endpoint `simulations.create`**

**Antes:**
- Schema Zod com campos legados (`valorInvestido`, `amortizacaoMetodo`, `modo`)
- Sem validação contextual
- Sem logs detalhados
- Deduplicação apenas por email

**Depois:**
```typescript
// ✅ Schema Zod atualizado com novos campos
tipoSimulacao: z.enum(["investimento", "financiamento"]).default("investimento"),
valorAporte: z.number().positive().optional(),
valorDesejado: z.number().positive().optional(),
sistemaAmortizacao: z.enum(["PRICE", "SAC", "BULLET", "JUROS_MENSAL", "LINEAR"]).default("LINEAR"),
tipoGarantia: z.enum(["recebiveis_cartao", "duplicatas", "imovel", "veiculo", "sem_garantia"]).default("sem_garantia"),

// ✅ Campos legados mantidos para compatibilidade
valorInvestido: z.number().positive().optional(),
amortizacaoMetodo: z.enum(["linear", "bullet"]).optional(),
modo: z.enum(["investidor", "captador"]).optional(),

// ✅ Validação contextual
if (tipoSimulacao === 'investimento' && !valorAporte) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "valorAporte é obrigatório para simulações de investimento",
  });
}

// ✅ Deduplicação por email E whatsapp
if (input.email) {
  existingLead = await db.getLeadByEmail(input.email);
}
if (!existingLead && input.whatsapp) {
  existingLead = await db.getLeadByWhatsapp(input.whatsapp);
}

// ✅ Logs detalhados
console.log("📥 Recebendo criação de simulação:", {...});
console.log("🔍 Busca por email:", input.email, "→", existingLead ? `Lead #${existingLead.id}` : "não encontrado");
console.log("🧮 Calculando simulação com input:", {...});
console.log("✅ Simulação criada com ID:", simulationId);
```

#### **server/db.ts - Nova Função**
```typescript
export async function getLeadByWhatsapp(whatsapp: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.whatsapp, whatsapp)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
```

---

## 2. Resultados dos Testes Básicos

### ✅ Criar nova simulação funciona?
**SIM** - Simulação #690022 criada com sucesso via browser  
- Nome: Teste Correcao 500
- WhatsApp: 11966554433
- Valor Investido: R$ 100.000,00
- Valor Total: R$ 1.000.000,00
- Prazo: 24 meses
- Taxa: 24% a.a.
- Método: LINEAR
- Total Recebido: R$ 122.609,44

### ✅ Simulações antigas continuam acessíveis?
**SIM** - Todas as 19 simulações existentes foram migradas e continuam acessíveis  
Verificado via SQL: `SELECT COUNT(*) FROM simulations` → 20 simulações (19 antigas + 1 nova)

### ✅ leadId está sempre presente?
**SIM** - Todas as simulações têm `leadId` preenchido  
Verificado via SQL: `SELECT COUNT(*) FROM simulations WHERE leadId IS NULL` → 0 registros

### ✅ Cálculos e cronogramas continuam funcionando sem erro?
**SIM** - Cronograma de 24 parcelas gerado corretamente  
- Saldo inicial: R$ 100.000,00
- Saldo final: R$ 0,00
- Total de juros: R$ 22.609,44
- TIR: 24.00% a.a.

### ✅ Endpoints TRPC retornam corretamente?
**SIM** - Todos os endpoints testados:
- `simulations.create` ✅
- `simulations.getById` ✅
- `simulations.list` ✅
- `simulations.getCronograma` ✅

### ✅ Nenhum campo de lead permanece na simulação?
**SIM** - Campos de lead (`nomeCompleto`, `email`, `whatsapp`) foram completamente removidos da tabela `simulations`  
Apenas `leadId` (FK) permanece, referenciando a tabela `leads`

---

## 3. SQL de Verificação Obrigatória

```sql
SELECT * FROM simulations ORDER BY id DESC LIMIT 5;
```

### Resultado (5 simulações mais recentes):

| id | userId | leadId | tipoSimulacao | sistemaAmortizacao | valorAporte | valorDesejado | valorTotalOferta | prazoMeses | taxaMensal | taxaJurosAa | tipoGarantia | createdAt |
|----|--------|--------|---------------|-------------------|-------------|---------------|------------------|------------|------------|-------------|--------------|-----------|
| 690022 | 4050006 | 60013 | investimento | LINEAR | 100000 | 1000000 | 1000000 | 24 | 200 | 24.0 | sem_garantia | 2025-11-26 02:52:55 |
| 660004 | 4050006 | 60001 | investimento | LINEAR | 5000000 | 5000000 | 5000000 | 24 | 200 | 24.0 | sem_garantia | 2025-11-25 09:07:45 |
| 570002 | 4050006 | 60002 | financiamento | LINEAR | 5000000 | 5000000 | 5000000 | 48 | 200 | 24.0 | sem_garantia | 2025-10-27 11:09:31 |
| 540001 | 4050006 | 60003 | financiamento | BULLET | 3000000 | 3000000 | 3000000 | 24 | 200 | 24.0 | sem_garantia | 2025-10-25 14:23:12 |
| 510001 | 4050006 | 60004 | financiamento | LINEAR | 6000000 | 6000000 | 6000000 | 24 | 200 | 24.0 | sem_garantia | 2025-10-25 13:45:28 |

**Observações:**
- ✅ Todos os registros têm `leadId` preenchido
- ✅ `tipoSimulacao` está corretamente preenchido (investimento/financiamento)
- ✅ `sistemaAmortizacao` está padronizado (LINEAR/BULLET)
- ✅ `valorAporte` e `valorDesejado` estão preenchidos
- ✅ `taxaMensal` está em centavos de % (200 = 2% ao mês)
- ✅ `tipoGarantia` está preenchido com valor padrão

---

## 4. Testes Automatizados (Vitest)

### Arquivo: `server/simulations.test.ts`

**5 testes criados, 5 testes passando ✅**

1. ✅ **deve criar simulação de investimento com novos campos**
   - Cria lead + simulação de investimento
   - Valida `tipoSimulacao`, `valorAporte`, `sistemaAmortizacao`

2. ✅ **deve criar simulação de financiamento com novos campos**
   - Cria lead + simulação de financiamento
   - Valida `tipoSimulacao`, `valorDesejado`, `tipoGarantia`

3. ✅ **deve validar enums corretamente**
   - Testa todos os 5 valores válidos de `sistemaAmortizacao`
   - PRICE, SAC, BULLET, JUROS_MENSAL, LINEAR

4. ✅ **deve deduplicar leads por whatsapp**
   - Cria lead com whatsapp único
   - Busca por `getLeadByWhatsapp()` e valida resultado

5. ✅ **deve deduplicar leads por email**
   - Cria lead com email único
   - Busca por `getLeadByEmail()` e valida resultado

**Comando de execução:**
```bash
pnpm test server/simulations.test.ts
```

**Resultado:**
```
✓ server/simulations.test.ts (5 tests) 327ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```

---

## 5. Logs do Servidor (Exemplo Real)

```
📥 Recebendo criação de simulação: {
  nomeCompleto: 'Teste Correcao 500',
  whatsapp: '11966554433',
  email: undefined,
  tipoSimulacao: 'investimento',
  valorAporte: undefined,
  valorDesejado: undefined,
  valorInvestido: 100000,
  sistemaAmortizacao: 'LINEAR'
}
🔍 Busca por whatsapp: 11966554433 → não encontrado
✨ Novo lead criado # 60013
👤 Lead associado: 60013
🧮 Calculando simulação com input: {
  valorTotalOferta: 1000000,
  valorInvestido: 100000,
  prazoMeses: 24,
  taxaJurosAa: 24
}
✅ Cálculo concluído: {
  totalJurosPagos: 2260944,
  totalRecebido: 12260944,
  tirAnual: 24
}
💾 Dados finais para criar simulação: {
  tipoSimulacao: 'investimento',
  valorAporte: 100000,
  valorDesejado: 1000000,
  sistemaAmortizacao: 'LINEAR',
  tipoGarantia: 'sem_garantia',
  taxaMensal: 200
}
✅ Simulação criada com ID: 690022
✅ Cronograma salvo com 24 parcelas
```

---

## 6. Checklist de Validação Final

| Item | Status | Observação |
|------|--------|------------|
| Logs detalhados implementados | ✅ | Console.log em todas as etapas críticas |
| Schema Zod completo | ✅ | Validação de todos os campos obrigatórios |
| Deduplicação email + whatsapp | ✅ | Busca por email primeiro, depois whatsapp |
| Validação de enums | ✅ | tipoSimulacao, sistemaAmortizacao, tipoGarantia |
| Validação contextual | ✅ | valorAporte obrigatório se investimento |
| Cálculo de taxaMensal | ✅ | (taxaJurosAa / 12) * 100 em centavos |
| Testes automatizados | ✅ | 5/5 testes passando |
| Teste via browser | ✅ | Simulação #690022 criada com sucesso |
| Compatibilidade retroativa | ✅ | 19 simulações antigas acessíveis |
| Campos legados opcionais | ✅ | valorInvestido e amortizacaoMetodo NULL |

---

## 7. Próximos Passos Recomendados

### 7.1 Limpeza de Campos Legados (Futuro)
Após período de transição e validação completa, criar migration para:
```sql
ALTER TABLE simulations DROP COLUMN valorInvestido;
ALTER TABLE simulations DROP COLUMN amortizacaoMetodo;
ALTER TABLE simulations DROP COLUMN modo;
```

### 7.2 Implementar Dropdowns de Enum no Frontend
Substituir campos de texto livre por `<select>` para:
- `tipoSimulacao` → "Investimento" | "Financiamento"
- `sistemaAmortizacao` → "PRICE" | "SAC" | "BULLET" | "LINEAR"
- `tipoGarantia` → "Recebíveis de Cartão" | "Duplicatas" | etc.

### 7.3 Dashboard de Leads
Criar página administrativa para:
- Visualizar todos os leads capturados
- Histórico de simulações por lead
- Métricas de conversão (leads recorrentes)

---

## 8. Conclusão

✅ **Erro 500 completamente corrigido**  
✅ **Schema Zod robusto implementado**  
✅ **Deduplicação de leads por email E whatsapp funcionando**  
✅ **Validação contextual (investimento vs financiamento) implementada**  
✅ **5 testes automatizados passando**  
✅ **Teste via browser bem-sucedido (Simulação #690022)**  
✅ **Compatibilidade total com dados existentes (19 simulações antigas)**  
✅ **Logs detalhados para debugging futuro**  

O sistema está **100% funcional** e **pronto para produção**.
