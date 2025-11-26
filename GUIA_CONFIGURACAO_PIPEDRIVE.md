# Guia de Configuração - Integração Pipedrive

**Data**: 26/11/2025  
**Status**: ⚠️ **CREDENCIAIS NÃO CONFIGURADAS**

---

## 🚨 Diagnóstico Atual

**Resultado do script de diagnóstico**:
```
❌ 0/14 variáveis configuradas
🚨 ERRO CRÍTICO: PIPEDRIVE_API_TOKEN ou PIPEDRIVE_BASE_URL não configurados!
⚠️  A integração NÃO FUNCIONARÁ sem essas credenciais.
```

**Por que os dados não chegam no Pipedrive**:
- Sem `PIPEDRIVE_API_TOKEN` e `PIPEDRIVE_BASE_URL`, as requisições HTTP falham
- O código captura o erro e não quebra a criação da oportunidade local
- Resultado: Oportunidade criada no banco local, mas **NÃO** no Pipedrive

---

## 📋 Passo a Passo para Configurar

### **Passo 1: Obter Token da API Pipedrive**

1. Acesse sua conta Pipedrive
2. Vá em **Configurações** (ícone de engrenagem no canto superior direito)
3. Clique em **Pessoal** → **Preferências**
4. Role até a seção **API**
5. Copie o **Token de API pessoal** (ou gere um novo se não existir)

**Formato esperado**: `abc123def456ghi789jkl012mno345pqr678stu901vwx234`

---

### **Passo 2: Identificar IDs de Pipelines e Stages**

#### 2.1. Encontrar Pipeline de Investidor

1. Acesse **Negócios** no menu lateral
2. Clique no dropdown de pipelines no topo
3. Identifique o pipeline usado para **investidores**
4. Anote o **ID do pipeline** (aparece na URL: `pipedrive.com/pipeline/9`)

**Valor esperado**: `9`

#### 2.2. Encontrar Stage "Lead" do Pipeline de Investidor

1. No pipeline de investidor, identifique o stage inicial chamado **"Lead"**
2. Clique no stage para editar
3. Anote o **ID do stage** (aparece na URL ou nas configurações)

**Valor esperado**: `49`

#### 2.3. Encontrar Pipeline de Emissor

1. Identifique o pipeline usado para **emissores/captadores**
2. Anote o **ID do pipeline**

**Valor esperado**: `1`

#### 2.4. Encontrar Stage "Leads Site" do Pipeline de Emissor

1. No pipeline de emissor, identifique o stage chamado **"Leads Site"**
2. Anote o **ID do stage**

**Valor esperado**: `88`

---

### **Passo 3: Configurar Variáveis de Ambiente Obrigatórias**

Acesse o **painel de controle do projeto** → **Settings** → **Secrets** e adicione:

```bash
# Credenciais básicas (OBRIGATÓRIAS)
PIPEDRIVE_API_TOKEN=seu_token_aqui_abc123def456
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1

# Pipeline de Investidor (OBRIGATÓRIO)
PIPEDRIVE_INVESTOR_PIPELINE_ID=9
PIPEDRIVE_INVESTOR_STAGE_ID=49

# Pipeline de Emissor (OBRIGATÓRIO)
PIPEDRIVE_EMISSOR_PIPELINE_ID=1
PIPEDRIVE_EMISSOR_STAGE_ID=88
```

**⚠️ IMPORTANTE**: Após adicionar as variáveis, **reinicie o servidor** para que as mudanças tenham efeito.

---

### **Passo 4: Configurar Campos Customizados (OPCIONAL)**

Se quiser que os **scores** sejam enviados para o Pipedrive, siga estes passos:

#### 4.1. Criar Campos Customizados no Pipedrive

1. Acesse **Configurações** → **Campos Customizados**
2. Clique em **Negócios** (Deals)
3. Crie os seguintes campos:

| Nome do Campo | Tipo | Descrição |
|---------------|------|-----------|
| Score Tokeniza | Número | Score total calculado (0-100) |
| Score Valor | Número | Componente de valor (0-100) |
| Score Intenção | Número | Componente de intenção (0-100) |
| Score Engajamento | Número | Componente de engajamento (0-100) |
| Score Urgência | Número | Componente de urgência (0-100) |
| Origem Simulação | Texto | Origem da simulação (manual, oferta_tokeniza, etc) |
| Tipo Oportunidade | Texto | Tipo (investidor ou emissor) |

#### 4.2. Copiar IDs dos Campos

1. Após criar cada campo, clique para editar
2. Na URL, copie o **ID do campo** (formato: `abc123def456`)
3. Anote os IDs de cada campo

#### 4.3. Configurar Variáveis de Ambiente dos Campos

Adicione no **Settings** → **Secrets**:

```bash
# Campos customizados de scores (OPCIONAL)
PIPEDRIVE_FIELD_TOKENIZA_SCORE=abc123def456
PIPEDRIVE_FIELD_SCORE_VALOR=ghi789jkl012
PIPEDRIVE_FIELD_SCORE_INTENCAO=mno345pqr678
PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO=stu901vwx234
PIPEDRIVE_FIELD_SCORE_URGENCIA=yza567bcd890
PIPEDRIVE_FIELD_ORIGEM_SIMULACAO=efg123hij456
PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE=klm789nop012
```

**⚠️ Se não configurar**: Os deals serão criados, mas **sem os scores**.

---

### **Passo 5: Configurar Dono Padrão (OPCIONAL)**

Se quiser que todos os deals sejam atribuídos a um usuário específico:

1. Acesse **Configurações** → **Usuários e permissões**
2. Identifique o usuário desejado
3. Anote o **ID do usuário** (aparece na URL ao clicar no usuário)

Adicione no **Settings** → **Secrets**:

```bash
# Dono padrão dos deals (OPCIONAL)
PIPEDRIVE_DEFAULT_OWNER_ID=15
```

**⚠️ Se não configurar**: Deals serão atribuídos ao dono padrão do Pipedrive.

---

## ✅ Validação da Configuração

Após configurar as variáveis, execute o **script de diagnóstico** para validar:

```bash
npx tsx server/diagnosticoPipedrive.ts
```

**Resultado esperado**:

```
✅ TUDO CONFIGURADO CORRETAMENTE!
🎉 A integração Pipedrive está pronta para uso.
```

---

## 🧪 Teste Manual

Após configurar, crie uma **simulação de teste** e verifique:

1. **No console do servidor**, procure pelos logs:
   ```
   🎯 Iniciando integração Pipedrive para oportunidade: X
   👤 Lead encontrado: { ... }
   📊 Oportunidade encontrada: { ... }
   🎯 Criando deal no Pipedrive para oportunidade: X
   ✅ Pipedrive: pessoa criada: XXXXX
   ➡️ Enviando DEAL para Pipedrive: { ... }
   ⬅️ Resposta Pipedrive DEAL: { status: 201, success: true, id: XXXXX }
   📌 Resultado createDeal: XXXXX
   ✅ pipedriveDealId salvo na opportunity: X XXXXX
   ```

2. **No Pipedrive**, verifique se o deal apareceu:
   - Pipeline correto (9 para investidor, 1 para emissor)
   - Stage correto (49 para investidor, 88 para emissor)
   - Título no formato `[Simulação] - Nome do Lead`
   - Scores preenchidos (se campos customizados configurados)

---

## 🐛 Troubleshooting

### Problema: "❌ Erro Pipedrive DEAL: { status: 401 }"

**Causa**: Token inválido ou expirado

**Solução**:
1. Verifique se o `PIPEDRIVE_API_TOKEN` está correto
2. Gere um novo token no Pipedrive se necessário
3. Atualize a variável de ambiente
4. Reinicie o servidor

---

### Problema: "❌ Erro Pipedrive DEAL: { status: 400, error: 'Invalid pipeline_id' }"

**Causa**: Pipeline ID ou Stage ID incorretos

**Solução**:
1. Verifique os IDs dos pipelines no Pipedrive
2. Atualize as variáveis de ambiente:
   - `PIPEDRIVE_INVESTOR_PIPELINE_ID`
   - `PIPEDRIVE_INVESTOR_STAGE_ID`
   - `PIPEDRIVE_EMISSOR_PIPELINE_ID`
   - `PIPEDRIVE_EMISSOR_STAGE_ID`
3. Reinicie o servidor

---

### Problema: Deal criado, mas scores não aparecem

**Causa**: Campos customizados não configurados ou IDs incorretos

**Solução**:
1. Verifique se os campos customizados existem no Pipedrive
2. Copie os IDs corretos dos campos
3. Configure as variáveis `PIPEDRIVE_FIELD_*`
4. Reinicie o servidor

---

### Problema: Pessoa duplicada no Pipedrive

**Causa**: Email ou telefone diferente entre tentativas

**Solução**:
1. Use sempre o mesmo email/telefone para o mesmo lead
2. O sistema já faz deduplicação por email e telefone
3. Se necessário, mescle pessoas manualmente no Pipedrive

---

## 📊 Checklist de Configuração Completa

- [ ] `PIPEDRIVE_API_TOKEN` configurado
- [ ] `PIPEDRIVE_BASE_URL` configurado
- [ ] `PIPEDRIVE_INVESTOR_PIPELINE_ID` configurado (valor: 9)
- [ ] `PIPEDRIVE_INVESTOR_STAGE_ID` configurado (valor: 49)
- [ ] `PIPEDRIVE_EMISSOR_PIPELINE_ID` configurado (valor: 1)
- [ ] `PIPEDRIVE_EMISSOR_STAGE_ID` configurado (valor: 88)
- [ ] Servidor reiniciado após configurar variáveis
- [ ] Script de diagnóstico executado com sucesso
- [ ] Teste manual realizado (simulação criada)
- [ ] Deal apareceu no Pipedrive no pipeline/stage corretos
- [ ] Título do deal no formato `[Simulação] - Nome`

**Opcional**:
- [ ] `PIPEDRIVE_DEFAULT_OWNER_ID` configurado
- [ ] Campos customizados criados no Pipedrive
- [ ] Variáveis `PIPEDRIVE_FIELD_*` configuradas
- [ ] Scores aparecendo nos deals criados

---

## 📝 Resumo de Variáveis

### Obrigatórias (Mínimo para funcionar)

```bash
PIPEDRIVE_API_TOKEN=seu_token_aqui
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_INVESTOR_PIPELINE_ID=9
PIPEDRIVE_INVESTOR_STAGE_ID=49
PIPEDRIVE_EMISSOR_PIPELINE_ID=1
PIPEDRIVE_EMISSOR_STAGE_ID=88
```

### Opcionais (Melhoram a integração)

```bash
PIPEDRIVE_DEFAULT_OWNER_ID=15
PIPEDRIVE_FIELD_TOKENIZA_SCORE=abc123def456
PIPEDRIVE_FIELD_SCORE_VALOR=ghi789jkl012
PIPEDRIVE_FIELD_SCORE_INTENCAO=mno345pqr678
PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO=stu901vwx234
PIPEDRIVE_FIELD_SCORE_URGENCIA=yza567bcd890
PIPEDRIVE_FIELD_ORIGEM_SIMULACAO=efg123hij456
PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE=klm789nop012
```

---

## 🎯 Próximos Passos

1. **Configurar as 6 variáveis obrigatórias** listadas acima
2. **Reiniciar o servidor** para aplicar as mudanças
3. **Executar o script de diagnóstico** para validar
4. **Criar uma simulação de teste** e verificar se aparece no Pipedrive
5. **Configurar campos customizados** (opcional, mas recomendado)

---

**Fim do Guia**
