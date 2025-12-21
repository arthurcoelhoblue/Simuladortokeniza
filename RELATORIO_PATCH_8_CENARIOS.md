# 📊 Relatório Patch 8: Cenários (Automático vs Livre)

**Data:** 21/12/2025  
**Status:** ✅ CONCLUÍDO  
**Testes:** 6/6 backend passando

---

## 🎯 Objetivo

Permitir análise de viabilidade em **3 cenários simultâneos** (Base, Conservador, Otimista) com multiplicadores **automáticos** (presets recomendados) ou **customizáveis** (modo livre).

---

## ✅ Implementação

### 1. Backend

#### Tipos e Presets (`server/viabilityCalculations.ts`)

```typescript
export type ScenarioConfig = {
  nome: "Base" | "Conservador" | "Otimista";
  multiplicadorReceita: number;
  multiplicadorCustoVariavel: number;
  multiplicadorOpex: number;
};

export const SCENARIOS_PADRAO: ScenarioConfig[] = [
  { nome: "Base", multiplicadorReceita: 1, multiplicadorCustoVariavel: 1, multiplicadorOpex: 1 },
  { nome: "Conservador", multiplicadorReceita: 0.8, multiplicadorCustoVariavel: 1.1, multiplicadorOpex: 1.1 },
  { nome: "Otimista", multiplicadorReceita: 1.2, multiplicadorCustoVariavel: 0.9, multiplicadorOpex: 0.95 },
];
```

#### Motor de Cálculo

- **Função:** `calcularAnaliseViabilidadeCenarios(input, cenarios)`
- **Retorno:** Array com 3 resultados (scenario, fluxoCaixa, indicadores, config)
- **Lógica:** Aplica multiplicadores no loop mensal do modelo genérico
  - `receitaBruta *= multiplicadorReceita`
  - `custoVariavel *= multiplicadorCustoVariavel`
  - `opex *= multiplicadorOpex`

#### Router tRPC (`server/routers.ts`)

- **Input aceita:**
  - `usarCenariosAutomaticos?: boolean` (default `true`)
  - `cenariosCustom?: ScenarioConfig[]` (opcional)
- **Lógica de seleção:**
  - Se `usarCenariosAutomaticos !== false` → usa `SCENARIOS_PADRAO`
  - Senão, se `cenariosCustom` existir → usa custom
  - Senão → fallback para `SCENARIOS_PADRAO`
- **Persistência:** Resultados de todos os cenários salvos como JSON em `fluxoCaixa` e `indicadores`

### 2. Frontend

#### Estados (`client/src/pages/ViabilidadeNova.tsx`)

```typescript
const [usarCenariosAutomaticos, setUsarCenariosAutomaticos] = useState(true);
const [cenariosCustom, setCenariosCustom] = useState<CenarioCustom[]>([
  { nome: "Base", multiplicadorReceita: 1, ... },
  { nome: "Conservador", multiplicadorReceita: 0.85, ... },
  { nome: "Otimista", multiplicadorReceita: 1.15, ... },
]);
```

#### UI

**Card "6. Cenários de Análise":**
- ✅ Checkbox "Usar cenários automáticos (recomendado)" (default ON)
- ✅ Preview read-only dos presets quando automático (3 colunas: Base/Conservador/Otimista)
- ✅ Tabela de inputs (3 linhas × 3 colunas) quando livre
  - Colunas: Receita, Custo Var., OPEX
  - Linhas: Base, Conservador, Otimista

#### Payload

```typescript
const payload = {
  ...input,
  usarCenariosAutomaticos,
  ...(usarCenariosAutomaticos ? {} : { cenariosCustom }),
};
```

---

## 🧪 Testes (6/6 Backend)

| # | Teste | Status |
|---|-------|--------|
| 1 | Presets retornam 3 resultados (Base/Conservador/Otimista) | ✅ |
| 2 | Conservador tem EBITDA <= Base (em cenário típico) | ✅ |
| 3 | Otimista tem Receita Bruta mês 12 > Base | ✅ |
| 4 | Custom usa multiplicadores enviados | ✅ |
| 5 | Retrocompatibilidade (input legado retorna Base) | ✅ |
| 6 | Custo variável respeita multiplicadorCustoVariavel | ✅ |

---

## 📊 Exemplo de Uso

### Cenário 1: Automático (Padrão)

**Input:**
- Checkbox "Usar cenários automáticos" = ON
- Receita Base: R$ 100k/mês
- OPEX Base: R$ 50k/mês

**Output (Mês 12):**
| Cenário | Receita | OPEX | EBITDA |
|---------|---------|------|--------|
| Base | R$ 100k | R$ 50k | R$ 50k |
| Conservador | R$ 80k (-20%) | R$ 55k (+10%) | R$ 25k |
| Otimista | R$ 120k (+20%) | R$ 47.5k (-5%) | R$ 72.5k |

### Cenário 2: Livre (Customizado)

**Input:**
- Checkbox "Usar cenários automáticos" = OFF
- Multiplicadores customizados:
  - Conservador: Receita 0.7x, Custo Var. 1.2x, OPEX 1.2x
  - Otimista: Receita 1.3x, Custo Var. 0.8x, OPEX 0.9x

**Output:** Cálculo usa multiplicadores customizados

---

## 🔄 Retrocompatibilidade

✅ **Análises antigas continuam funcionando:**
- Input sem `usarCenariosAutomaticos` → usa presets automáticos (default)
- Input sem `cenariosCustom` → fallback para presets
- Modelo legado (sem `receitas[]`) → retorna 3 cenários idênticos (Base)

---

## 📝 Decisões de Design

1. **Default Automático:** Checkbox inicia marcado (ON) para simplificar onboarding
2. **Presets Conservadores:** Multiplicadores baseados em práticas de mercado
   - Conservador: -20% receita, +10% custos (pessimista realista)
   - Otimista: +20% receita, -5-10% custos (otimista realista)
3. **Persistência JSON:** Resultados de todos os cenários salvos no banco para comparação futura
4. **Status baseado em Base:** Viabilidade determinada pelo cenário Base (não Otimista)

---

## 🚀 Próximos Passos Sugeridos

1. **Visualização de Cenários em Detalhes:** Criar cards comparativos em ViabilidadeDetalhes mostrando indicadores lado a lado (Payback, TIR, VPL) para os 3 cenários

2. **Gráfico de Sensibilidade:** Adicionar gráfico de linha mostrando evolução de EBITDA ao longo de 60 meses para os 3 cenários simultaneamente

3. **Análise de Risco:** Calcular probabilidade de sucesso baseada na distribuição dos cenários (ex: "70% de chance de payback < 36 meses")

---

## 📦 Arquivos Modificados

### Backend
- `server/viabilityCalculations.ts` (+80 linhas)
  - Tipos `ScenarioConfig`, `SCENARIOS_PADRAO`
  - Função `calcularAnaliseViabilidadeCenarios()`
  - Aplicação de multiplicadores no loop mensal
- `server/routers.ts` (+15 linhas)
  - Input aceita `usarCenariosAutomaticos` e `cenariosCustom`
  - Lógica de seleção de cenários
  - Persistência de resultados como JSON

### Frontend
- `client/src/pages/ViabilidadeNova.tsx` (+120 linhas)
  - Estados `usarCenariosAutomaticos` e `cenariosCustom`
  - Card "6. Cenários de Análise" com checkbox e tabela
  - Payload do submit inclui cenários

### Testes
- `server/__tests__/viability-scenarios.test.ts` (+180 linhas)
  - 6 testes de backend (todos passando)

---

## ✅ Checklist de Validação

- [x] Checkbox "Usar cenários automáticos" funciona
- [x] Preview de presets aparece quando automático
- [x] Tabela de inputs aparece quando livre
- [x] Payload do submit inclui `usarCenariosAutomaticos` e `cenariosCustom`
- [x] Backend calcula 3 cenários corretamente
- [x] Multiplicadores aplicados no loop mensal
- [x] Resultados persistidos como JSON no banco
- [x] Retrocompatibilidade mantida (análises antigas funcionam)
- [x] 6 testes de backend passando (6/6)

---

**Conclusão:** Patch 8 implementado com sucesso! Sistema agora permite análise de viabilidade em 3 cenários simultâneos, facilitando tomada de decisão baseada em múltiplas projeções.
