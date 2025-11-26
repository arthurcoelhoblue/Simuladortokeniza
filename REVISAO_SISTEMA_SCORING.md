# Revisão do Sistema de Scoring - Estado Atual

**Data**: 26 de novembro de 2025  
**Objetivo**: Validar estado atual antes de finalizar integração frontend-backend

---

## ✅ Campos de Banco de Dados

### Tabela `simulations`

**Campos de scoring implementados**:
```typescript
origemSimulacao: mysqlEnum("origemSimulacao", ["manual", "oferta_tokeniza"]).notNull().default("manual")
engajouComOferta: int("engajouComOferta").notNull().default(0) // boolean: 0 ou 1
offerId: int("offerId") // FK → offers.id (nullable)
```

**Status**: ✅ Criados e funcionais  
**Localização**: `drizzle/schema.ts` linhas 122-124

---

### Tabela `offers`

**Campo implementado**:
```typescript
dataEncerramento: datetime("dataEncerramento") // Para cálculo de urgência
```

**Status**: ✅ Criado e funcional  
**Localização**: `drizzle/schema.ts`

---

### Tabela `opportunities`

**Campos de scoring implementados**:
```typescript
tokenizaScore: int("tokenizaScore").notNull().default(0)       // Score consolidado (0-100)
scoreValor: int("scoreValor").notNull().default(0)             // Componente: ticket (até 50 pts)
scoreIntencao: int("scoreIntencao").notNull().default(0)       // Componente: intenção (até 40 pts)
scoreEngajamento: int("scoreEngajamento").notNull().default(0) // Componente: engajamento (até 20 pts)
scoreUrgencia: int("scoreUrgencia").notNull().default(0)       // Componente: urgência (até 10 pts)
```

**Status**: ✅ Criados e funcionais  
**Localização**: `drizzle/schema.ts` linhas 218-222

**Campo pendente**:
```typescript
fitNivel: mysqlEnum("fitNivel", ["frio", "morno", "quente", "prioritario"]) // ❌ NÃO EXISTE AINDA
```

---

## ✅ Score Engine

### Arquivo: `server/scoreEngine.ts`

**Funções implementadas** (5/5):

1. ✅ `calcularScoreValor(ticketEstimado: number): number`
   - Peso: até 50 pontos
   - Faixas: <10k (10pts), 10k-50k (20pts), 50k-100k (30pts), 100k-500k (40pts), >=500k (50pts)

2. ✅ `calcularScoreIntencao(origemSimulacao, engajouComOferta): number`
   - Peso: até 40 pontos (FATOR DOMINANTE)
   - Regras:
     - `manual` + não engajou: 0 pts
     - `manual` + engajou: 30 pts
     - `oferta_tokeniza` + não engajou: 25 pts
     - `oferta_tokeniza` + engajou: 40 pts

3. ✅ `calcularScoreEngajamento(versoesRelacionadas: number): number`
   - Peso: até 20 pontos
   - Regras: 1 versão (0pts), 2 (10pts), 3+ (20pts)

4. ✅ `calcularScoreUrgencia(dataEncerramento?: Date): number`
   - Peso: até 10 pontos
   - Regras: <=7 dias (10pts), <=30 dias (5pts), >30 dias (0pts)

5. ✅ `calcularScoreParaOpportunity(params): ScoreComponents`
   - Orquestra todos os componentes
   - Calcula tokenizaScore = soma dos 4 componentes
   - Retorna objeto com breakdown completo

**Status**: ✅ Implementado e testado  
**Localização**: `server/scoreEngine.ts` (5844 bytes)

---

## ✅ Testes Automatizados

### Arquivo: `server/scoring.test.ts`

**Resultado**: **21/21 testes passando (100%)**

**Suites de teste**:

1. **calcularScoreValor** (5 testes)
   - ✅ Ticket < R$ 10.000 → 10 pontos
   - ✅ Ticket R$ 10.000 - R$ 50.000 → 20 pontos
   - ✅ Ticket R$ 50.000 - R$ 100.000 → 30 pontos
   - ✅ Ticket R$ 100.000 - R$ 500.000 → 40 pontos
   - ✅ Ticket >= R$ 500.000 → 50 pontos

2. **calcularScoreIntencao** (4 testes)
   - ✅ Manual sem engajamento → 0 pontos
   - ✅ Manual com engajamento → 30 pontos
   - ✅ Oferta Tokeniza sem engajamento → 25 pontos
   - ✅ Oferta Tokeniza com engajamento → 40 pontos

3. **calcularScoreEngajamento** (3 testes)
   - ✅ 1 versão → 0 pontos
   - ✅ 2 versões → 10 pontos
   - ✅ 3+ versões → 20 pontos

4. **calcularScoreUrgencia** (4 testes)
   - ✅ Sem data de encerramento → 0 pontos
   - ✅ Encerramento <= 7 dias → 10 pontos
   - ✅ Encerramento <= 30 dias → 5 pontos
   - ✅ Encerramento > 30 dias → 0 pontos

5. **calcularScoreParaOpportunity - Integração Completa** (4 testes)
   - ✅ Cenário 1: Simulação manual, valor baixo, sem oferta
   - ✅ Cenário 2: Simulação iniciada por oferta, valor médio
   - ✅ Cenário 3: Simulação alta intenção + alto ticket + urgência
   - ✅ Cenário 4: Lead com 3+ versões (scoreEngajamento>0)

6. **Validação de Limites** (1 teste)
   - ✅ tokenizaScore nunca excede 100

**Duração**: 447ms  
**Status**: ✅ Todos passando

---

## ✅ Integração Backend Atual

### Endpoint: `opportunities.create`

**Localização**: `server/routers.ts` linhas 392-535

**Fluxo atual**:
1. ✅ Busca simulação por ID
2. ✅ Valida acesso do usuário
3. ✅ Busca leadId da simulação
4. ✅ Calcula ticketEstimado e tipoOportunidade
5. ✅ Cria oportunidade no banco
6. ✅ **Calcula score Tokeniza**:
   - Busca offer relacionada se `simulation.offerId` existir
   - Conta versões relacionadas via `db.countRelatedSimulations()`
   - Chama `calcularScoreParaOpportunity()` com todos os dados
   - Atualiza oportunidade com scores calculados
7. ✅ Integra com Pipedrive (cria deal)

**Status**: ✅ Integração completa implementada

---

## ❌ Pendências Identificadas

### 1. Frontend - Captura de Intenção
**Status**: ❌ NÃO IMPLEMENTADO

O formulário de criação de simulação (`NewSimulation.tsx`) **não captura**:
- Pergunta "Como você quer simular?"
- Opção de escolher oferta Tokeniza
- Campos `origemSimulacao`, `engajouComOferta`, `offerId`

**Impacto**: Todas as simulações criadas pelo frontend têm:
- `origemSimulacao = "manual"` (default)
- `engajouComOferta = false` (default)
- `offerId = null` (default)

Isso significa que **scoreIntencao sempre será 0** para simulações criadas via UI.

---

### 2. Endpoint de Requalificação
**Status**: ❌ NÃO IMPLEMENTADO

Não existe `opportunities.requalify` para recalcular scores de oportunidades existentes.

**Impacto**: Não é possível atualizar scores quando:
- Oferta relacionada muda (ex: dataEncerramento)
- Lead cria novas versões de simulação
- Regras de scoring são ajustadas

---

### 3. Campo fitNivel
**Status**: ❌ NÃO IMPLEMENTADO

A coluna `fitNivel` não existe na tabela `opportunities`.

**Impacto**: Não há classificação visual de oportunidades por qualidade (frio/morno/quente/prioritário).

---

### 4. Integração Pipedrive - fitNivel
**Status**: ❌ NÃO IMPLEMENTADO

O `createPipedriveDealForOpportunity` envia `tokenizaScore`, mas não envia `fitNivel`.

**Impacto**: Time de vendas no Pipedrive não vê classificação de qualidade do lead.

---

## 📋 Arquivos Revisados (Sem Alteração)

Os seguintes arquivos foram **apenas revisados** para validar estado atual:

1. ✅ `drizzle/schema.ts`
   - Validado: campos de scoring em `simulations`, `offers`, `opportunities`
   - Pendente: adicionar `fitNivel` em `opportunities`

2. ✅ `server/scoreEngine.ts`
   - Validado: 5 funções implementadas e funcionais
   - Nenhuma alteração necessária

3. ✅ `server/scoring.test.ts`
   - Validado: 21 testes passando (100%)
   - Pendente: adicionar testes de integração frontend-backend

4. ✅ `server/routers.ts`
   - Validado: `opportunities.create` integrado com scoreEngine
   - Pendente: adicionar `opportunities.requalify`

5. ✅ `server/db.ts`
   - Validado: função `countRelatedSimulations()` implementada
   - Nenhuma alteração necessária

6. ✅ `server/pipedriveClient.ts`
   - Validado: envio de `tokenizaScore` para Pipedrive
   - Pendente: adicionar envio de `fitNivel`

---

## 🎯 Próximos Passos

Para finalizar o sistema de scoring, é necessário:

1. **Frontend**: Implementar captura de intenção e seleção de ofertas
2. **Backend**: Criar endpoint `opportunities.requalify`
3. **Schema**: Adicionar coluna `fitNivel` em `opportunities`
4. **Lógica**: Aplicar regras de fitNivel baseado em tokenizaScore
5. **Pipedrive**: Enviar fitNivel nos deals
6. **Testes**: Adicionar testes de integração completos

---

## ✅ Conclusão da Revisão

**Estado atual**: Backend 90% pronto, frontend 0% integrado

O **motor de scoring está completo e testado**, mas não está sendo alimentado corretamente pelo frontend. Todas as simulações criadas via UI têm valores default, resultando em `scoreIntencao = 0`.

A implementação das fases 2-9 do plano conectará o frontend ao backend existente, finalizando o sistema de scoring com intenção como fator dominante.
