# Relatório Patch 7: Custos Variáveis + Margem Bruta

**Data:** 21/12/2025  
**Status:** ✅ Concluído (8/8 testes passando)

---

## 📋 Resumo Executivo

Implementado sistema completo de custos variáveis com cálculo de margem bruta, permitindo que o simulador modele negócios com estrutura de custos realista (custos fixos + variáveis). Sistema suporta custo variável **por receita** (granular) ou **global** (simplificado), com fallback automático e retrocompatibilidade total.

---

## 🎯 Objetivos Alcançados

### 1. Schema Backend ✅
- [x] Campo `custoVariavelPct` (0-100%) adicionado ao tipo `ReceitaItem`
- [x] Campo `custoVariavelGlobalPct` (0-100%) adicionado ao input de viabilidade
- [x] Colunas criadas no banco de dados (`receitas.custoVariavelPct`, `viability_analysis.custoVariavelGlobalPct`)
- [x] Persistência como JSON implementada

### 2. Motor de Cálculo ✅
- [x] Helper `calcularCustoVariavelMensal()` criado
- [x] Regra de fallback: próprio → global → 0%
- [x] Campos adicionados ao fluxo de caixa: `custoVariavel`, `receitaLiquida`, `margemBrutaPct`
- [x] EBITDA atualizado para usar `receitaLiquida` (não bruta)
- [x] Fallback legado preservado (sem custo variável)

### 3. Frontend ✅
- [x] Campo "Custo Variável Global (%)" adicionado antes dos templates
- [x] Campo "Custo var. (%)" adicionado em cada linha de receita (5ª coluna)
- [x] Payload do submit inclui ambos os campos
- [x] Tipo `ReceitaItem` atualizado com `custoVariavelPct`

### 4. Visualização de Detalhes ✅
- [x] Coluna "Custo Var." adicionada na tabela de receitas
- [x] Card "📊 Margem Bruta" com 3 métricas (mês 1, 6, 12)
- [x] Exibe margem bruta % e receita líquida em R$
- [x] Mostra custo variável global se configurado

### 5. Templates de Negócio ✅
- [x] Academia: 0% (serviço puro)
- [x] Restaurante: 35% almoço/jantar, 25% bebidas (food cost típico)
- [x] SaaS: 5% planos (cloud), 20% implementação (consultoria)
- [x] Clínica: 10-30% dependendo do serviço (materiais/reagentes)

### 6. Testes Automatizados ✅
- [x] 8/8 testes passando
- [x] Cobertura completa: custo próprio, global, fallback, múltiplas receitas, crescimento, EBITDA

---

## 🧪 Testes Automatizados (8/8 Passando)

| # | Teste | Status |
|---|-------|--------|
| 1 | Custo variável por receita (35%) | ✅ |
| 2 | Custo variável global (20%) | ✅ |
| 3 | Custo variável próprio sobrescreve global | ✅ |
| 4 | Múltiplas receitas com custos variáveis diferentes | ✅ |
| 5 | Custo variável com crescimento mensal | ✅ |
| 6 | Sem custo variável (0%) | ✅ |
| 7 | EBITDA usa receita líquida (não bruta) | ✅ |
| 8 | Fallback legado (sem receitas[]) | ✅ |

**Comando para rodar testes:**
```bash
pnpm test viability-variable-cost.test.ts
```

---

## 📊 Exemplo de Cálculo

### Cenário: Restaurante com Food Cost de 35%

**Receitas:**
- Almoço Executivo: R$ 35 × 600 unidades/mês = R$ 21.000
- Jantar À La Carte: R$ 80 × 300 unidades/mês = R$ 24.000
- Bebidas: R$ 15 × 800 unidades/mês = R$ 12.000
- **Receita Bruta Total:** R$ 57.000

**Custos Variáveis:**
- Almoço: R$ 21.000 × 35% = R$ 7.350
- Jantar: R$ 24.000 × 35% = R$ 8.400
- Bebidas: R$ 12.000 × 25% = R$ 3.000
- **Custo Variável Total:** R$ 18.750

**Margem Bruta:**
- Receita Líquida: R$ 57.000 - R$ 18.750 = **R$ 38.250**
- Margem Bruta %: (R$ 38.250 / R$ 57.000) × 100 = **67,1%**

**EBITDA:**
- OPEX (custos fixos): R$ 50.000
- EBITDA: R$ 38.250 - R$ 50.000 = **-R$ 11.750** (negativo no início)

---

## 🔄 Regra de Fallback

O sistema usa a seguinte hierarquia para determinar o custo variável:

1. **Custo próprio da receita** (`custoVariavelPct` na receita) → **prioridade máxima**
2. **Custo global** (`custoVariavelGlobalPct` na análise) → **fallback**
3. **0%** → **padrão** (se nenhum configurado)

**Exemplo:**
```typescript
// Receita A: usa próprio (50%)
{ nome: "A", custoVariavelPct: 50 }

// Receita B: usa global (20%)
{ nome: "B" } // sem custoVariavelPct

// Análise:
{ custoVariavelGlobalPct: 20 }
```

---

## 🎨 Interface do Usuário

### Formulário (ViabilidadeNova.tsx)

**Campo Global:**
```
┌─────────────────────────────────────────────┐
│ Custo Variável Global (%)                   │
│ ┌─────────────────────────────────────────┐ │
│ │ 20                                      │ │
│ └─────────────────────────────────────────┘ │
│ Opcional: aplica a todas as receitas        │
└─────────────────────────────────────────────┘
```

**Tabela de Receitas:**
```
┌──────────┬────────┬──────┬────────────┬──────────┐
│ Nome     │ Preço  │ Qtd  │ Cresc. (%) │ Custo var│
├──────────┼────────┼──────┼────────────┼──────────┤
│ Produto A│ 100,00 │ 100  │ 5          │ 35       │
│ Produto B│ 200,00 │ 50   │ 3          │ 40       │
└──────────┴────────┴──────┴────────────┴──────────┘
```

### Detalhes (ViabilidadeDetalhes.tsx)

**Card de Margem Bruta:**
```
┌─────────────────────────────────────────────┐
│ 📊 Margem Bruta                             │
│ Receita líquida após custos variáveis       │
│                                             │
│ Mês 1         Mês 6         Mês 12         │
│ 65.0%         67.5%         70.0%          │
│ R$ 38.250     R$ 42.100     R$ 45.800      │
│                                             │
│ Custo variável global: 35.0%                │
└─────────────────────────────────────────────┘
```

---

## 🔍 Validação Manual

### Checklist de Validação

- [x] Criar análise com custo variável por receita (35%)
- [x] Criar análise com custo variável global (20%)
- [x] Verificar que custo próprio sobrescreve global
- [x] Verificar margem bruta exibida corretamente
- [x] Verificar EBITDA usa receita líquida
- [x] Abrir análise antiga e verificar fallback legado
- [x] Aplicar template de Restaurante e verificar custos variáveis pré-preenchidos

---

## 📁 Arquivos Modificados

### Backend
- `server/routers.ts` → Input Zod + persistência
- `server/viabilityCalculations.ts` → Motor de cálculo
- `drizzle/schema.ts` → Schema Drizzle
- `server/__tests__/viability-variable-cost.test.ts` → Testes (novo)

### Frontend
- `client/src/pages/ViabilidadeNova.tsx` → Formulário
- `client/src/pages/ViabilidadeDetalhes.tsx` → Visualização
- `client/src/lib/businessTemplates.ts` → Templates

### Banco de Dados
- Coluna `custoVariavelGlobalPct` em `viability_analysis`
- Campo `custoVariavelPct` em JSON `receitas`

---

## 🚀 Próximos Passos Sugeridos

1. **Gráfico de Margem Bruta:** Adicionar gráfico de linha mostrando evolução da margem bruta ao longo de 60 meses, permitindo identificar tendências e sazonalidade.

2. **Alertas de Margem Baixa:** Criar sistema de alertas que notifica quando margem bruta cai abaixo de threshold configurável (ex: <40% para restaurantes), sugerindo ações corretivas.

3. **Comparação de Cenários:** Permitir que usuários criem múltiplas versões de uma análise com diferentes custos variáveis (otimista/realista/pessimista) e comparem side-by-side.

---

## ✅ Conclusão

O Patch 7 transforma o simulador em uma ferramenta profissional de análise financeira, permitindo modelar qualquer tipo de negócio com estrutura de custos realista. Sistema totalmente retrocompatível, testado e pronto para produção.

**Impacto:** Usuários agora podem simular negócios de **qualquer setor** (varejo, serviços, SaaS, indústria) com precisão profissional, não apenas academias.
