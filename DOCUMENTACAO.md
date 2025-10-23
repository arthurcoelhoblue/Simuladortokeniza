# Simulador de Investimentos Tokenizados

Sistema web completo para simulação de investimentos em ofertas tokenizadas, com cálculo preciso de cronograma mensal, carências configuráveis e métodos de amortização PRICE, SAC e Bullet.

## Funcionalidades Principais

### Motor de Cálculo Financeiro

O sistema implementa um motor de cálculo determinístico e testado que suporta:

- **Métodos de Amortização**:
  - **PRICE**: Parcelas constantes ao longo do tempo
  - **SAC**: Sistema de Amortização Constante
  - **Bullet**: Amortização total no vencimento

- **Carências Configuráveis**:
  - Carência de juros (com ou sem capitalização)
  - Carência de principal

- **Taxas e Custos**:
  - Taxa de setup fixa (cobrada no início)
  - Fee de sucesso sobre captação (cobrado no final)
  - Fee de manutenção mensal
  - Imposto de renda (opcional)

- **Cálculos Avançados**:
  - TIR (Taxa Interna de Retorno) mensal e anual
  - Conversão de taxa anual para mensal (simples ou composta)
  - Convenções de calendário (civil/365, 30/360, 252 úteis)

### Interface do Usuário

- **Dashboard**: Visualização de todas as simulações do usuário
- **Formulário de Criação**: Interface intuitiva para configurar simulações
- **Visualização Detalhada**: Cronograma mês a mês com todas as informações
- **Exportação**: Download de cronograma em formato CSV
- **Tema Claro/Escuro**: Alternância de temas para melhor experiência

## Estrutura Técnica

### Backend

- **Framework**: Express + tRPC
- **Banco de Dados**: MySQL/TiDB via Drizzle ORM
- **Autenticação**: OAuth integrado com Manus
- **Testes**: Vitest com 8 casos de teste cobrindo todos os cenários

### Frontend

- **Framework**: React 19 + TypeScript
- **Estilização**: Tailwind CSS 4 + shadcn/ui
- **Roteamento**: Wouter
- **Formulários**: Validação em tempo real

### Banco de Dados

#### Tabela `simulations`
Armazena os parâmetros e resultados calculados de cada simulação.

**Campos principais**:
- Dados da oferta (valor, prazo, taxa de juros)
- Regras de pagamento (periodicidade, carências, método)
- Custos e taxas (setup, sucesso, manutenção)
- Resultados calculados (totais, TIR)

#### Tabela `cronogramas`
Armazena o cronograma mensal detalhado de cada simulação.

**Campos principais**:
- Mês e data da parcela
- Saldo inicial e final
- Juros e amortização
- Custos fixos
- Observações

## Fórmulas e Convenções

### Conversão de Taxa Anual para Mensal

**Capitalização Composta** (padrão):
```
i_mensal = (1 + i_anual)^(1/12) - 1
```

**Capitalização Simples**:
```
i_mensal = i_anual / 12
```

### Método PRICE

Parcela constante calculada por:
```
PMT = PV × [i × (1 + i)^n] / [(1 + i)^n - 1]
```

Onde:
- PMT = Parcela
- PV = Valor Presente (investido)
- i = Taxa de juros mensal
- n = Número de parcelas

### Método SAC

Amortização constante:
```
Amortização = Valor_Investido / Número_de_Parcelas
Juros = Saldo_Devedor × Taxa_Mensal
Parcela = Amortização + Juros
```

### Método Bullet

- Juros pagos periodicamente (se configurado)
- Amortização total no último mês
- Saldo devedor permanece constante até o vencimento

### Cálculo da TIR

Utiliza método de Newton-Raphson para encontrar a taxa que zera o VPL (Valor Presente Líquido):

```
VPL = -Investimento_Inicial + Σ(Fluxo_t / (1 + TIR)^t) = 0
```

## Armazenamento de Valores

Todos os valores monetários são armazenados em **centavos** (inteiros) para evitar erros de arredondamento:
- R$ 100.000,00 → 10.000.000 centavos
- 24% → 2.400 centésimos de %

## Validações Implementadas

1. Valor investido não pode ser maior que valor total da oferta
2. Se periodicidade de amortização é "no_fim", método deve ser "bullet"
3. Todas as taxas devem ser não-negativas
4. Prazo deve ser maior que zero
5. Carências não podem ser maiores que o prazo total

## Casos de Teste

O sistema inclui 8 testes unitários validando:

1. ✅ Método PRICE sem carências
2. ✅ Método SAC com amortização constante
3. ✅ Método Bullet com pagamento no fim
4. ✅ Carência de juros com capitalização
5. ✅ Carência de principal
6. ✅ Aplicação correta de custos e taxas
7. ✅ Cálculo da TIR
8. ✅ Cenário completo conforme especificação

## Exemplo de Uso

### Cenário Padrão (conforme especificação)

```typescript
{
  valorTotalOferta: 5.000.000,00 BRL
  valorInvestido: 100.000,00 BRL
  prazoMeses: 24
  taxaJurosAa: 24% (composta, civil/365)
  periodicidadeJuros: mensal
  periodicidadeAmortizacao: mensal
  carenciaJurosMeses: 0
  carenciaPrincipalMeses: 0
  amortizacaoMetodo: PRICE
  taxaSetupFixaBrl: 5.000,00 BRL
  feeSucessoPercentSobreCaptacao: 5%
  feeManutencaoMensalBrl: 3.000,00 BRL
}
```

### Resultado Esperado

- Cronograma com 24 parcelas mensais
- Saldo final zerado no último mês
- Total de juros pagos calculado
- TIR mensal e anual
- Percentual da oferta (2%)

## Limitações Conhecidas

1. **Convenções de calendário**: Atualmente, as convenções "30/360" e "252 úteis" usam a mesma lógica da "civil/365". Para implementação completa, seria necessário ajustar o cálculo de dias úteis.

2. **Periodicidade não mensal**: O sistema calcula mês a mês, mas periodicidades semestrais/anuais ainda geram cronograma mensal (com pagamentos zerados nos meses intermediários).

3. **Exportação PDF**: Atualmente apenas CSV é suportado. Para PDF, seria necessário integrar biblioteca como PDFKit ou Puppeteer.

## Próximos Passos Sugeridos

1. **Gráficos**: Adicionar visualizações de evolução do saldo devedor e composição das parcelas
2. **Comparação**: Permitir comparar múltiplas simulações lado a lado
3. **Exportação PDF**: Implementar relatório executivo em PDF
4. **Cenários salvos**: Permitir duplicar e modificar simulações existentes
5. **API pública**: Expor endpoints para integração com outras plataformas

## Execução Local

```bash
# Instalar dependências
pnpm install

# Aplicar migrações do banco
pnpm db:push

# Executar testes
pnpm test

# Iniciar servidor de desenvolvimento
pnpm dev
```

## Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Wouter
- **Backend**: Node.js, Express, tRPC 11, Drizzle ORM
- **Banco de Dados**: MySQL/TiDB
- **Testes**: Vitest
- **Autenticação**: Manus OAuth

## Licença

Sistema desenvolvido para simulação de investimentos tokenizados conforme especificação técnica fornecida.

