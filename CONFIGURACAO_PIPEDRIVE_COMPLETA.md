# Configuração Completa - Integração Pipedrive

**Data**: 26/11/2025  
**Status**: ✅ **PRONTO PARA CONFIGURAR**

---

## 📋 Variáveis de Ambiente - Copiar e Colar

Copie **TODAS** as variáveis abaixo e adicione no painel de controle → **Settings** → **Secrets**:

```bash
# ===== CREDENCIAIS BÁSICAS (OBRIGATÓRIAS) =====
PIPEDRIVE_API_TOKEN=a38c755e08ca299b1f292bcb052381f0be9774ab
PIPEDRIVE_BASE_URL=https://grupoblue.pipedrive.com/api/v1

# ===== PIPELINE DE INVESTIDOR (OBRIGATÓRIO) =====
# Pipeline: "Tokeniza - Ofertas públicas"
PIPEDRIVE_INVESTOR_PIPELINE_ID=9
PIPEDRIVE_INVESTOR_STAGE_ID=49

# ===== PIPELINE DE EMISSOR (OBRIGATÓRIO) =====
# Pipeline: "Tokeniza - Novas ofertas"
PIPEDRIVE_EMISSOR_PIPELINE_ID=1
PIPEDRIVE_EMISSOR_STAGE_ID=88

# ===== CAMPOS CUSTOMIZADOS DE SCORES (OPCIONAL) =====
PIPEDRIVE_FIELD_TOKENIZA_SCORE=ac9e3b9be66dcc323c70a1005e3f807b49c726f5
PIPEDRIVE_FIELD_SCORE_VALOR=a5cfe2ac68341fae17c94d1553132b8d4fa3718a
PIPEDRIVE_FIELD_SCORE_INTENCAO=a534856f19fe07d5aa75649d6f19573aa0fc6edc
PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO=3ccd1f789374a5ce942de47090ca31b82713e990
PIPEDRIVE_FIELD_SCORE_URGENCIA=3a33e386d129080f97cfcc58a9a832cd154dbcbf
PIPEDRIVE_FIELD_ORIGEM_SIMULACAO=d5dc3f722ca98f10a83afb2a31ca5ea69597e73d
PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE=d73f69850dad780bc73dff1f97a8cfa437515b8f
```

---

## 📊 Detalhes da Configuração

### Pipeline de Investidor
- **Nome**: "Tokeniza - Ofertas públicas"
- **Pipeline ID**: 9
- **Stage Inicial**: 49 ("Lead")
- **Outros stages disponíveis**:
  - 50: Contato Iniciado
  - 59: Contato estabelecido
  - 51: Apresentação
  - 87: Cadastrado na Plataforma
  - 61: Forecasting
  - 52: Carteira

### Pipeline de Emissor
- **Nome**: "Tokeniza - Novas ofertas"
- **Pipeline ID**: 1
- **Stage Inicial**: 88 ("Leads Site")
- **Outros stages disponíveis**:
  - 1: Stand by
  - 2: Contatado
  - 18: Fase negociação
  - 3: Fase contratual
  - 4: Oferta em estruturação
  - 17: Lançada

### Campos Customizados Configurados
| Campo | Tipo | ID |
|-------|------|-----|
| Score Tokeniza | Número | ac9e3b9be66dcc323c70a1005e3f807b49c726f5 |
| Score Valor | Número | a5cfe2ac68341fae17c94d1553132b8d4fa3718a |
| Score Intenção | Número | a534856f19fe07d5aa75649d6f19573aa0fc6edc |
| Score Engajamento | Número | 3ccd1f789374a5ce942de47090ca31b82713e990 |
| Score Urgência | Número | 3a33e386d129080f97cfcc58a9a832cd154dbcbf |
| Origem da Simulação | Texto | d5dc3f722ca98f10a83afb2a31ca5ea69597e73d |
| Tipo de Oportunidade | Lista | d73f69850dad780bc73dff1f97a8cfa437515b8f |

### Usuários Disponíveis (para PIPEDRIVE_DEFAULT_OWNER_ID)
Se quiser fixar um dono padrão para os deals, escolha um usuário abaixo:

| ID | Nome | Email |
|----|------|-------|
| 20626619 | Alex Godoy | alexgodoyrodrigues@gmail.com |
| 22659837 | André | andre@blueconsult.com.br |
| 20529912 | Arthur Coelho | arthur@blueconsult.com.br |
| 22932076 | Bruno da Cruz Portes | bruno.portes@tokeniza.com.br |
| 23084184 | Débora Martins | debora.martins@blueconsult.com.br |

**Exemplo**: Para atribuir deals ao Bruno, adicione:
```bash
PIPEDRIVE_DEFAULT_OWNER_ID=22932076
```

---

## ✅ Passo a Passo para Configurar

### 1. Acessar Painel de Controle
1. Abra o painel de controle do projeto
2. Clique no ícone de **Settings** (engrenagem) no canto superior direito
3. Selecione **Secrets** no menu lateral

### 2. Adicionar Variáveis
Para cada variável acima:
1. Clique em **Add Secret** ou **New Secret**
2. Cole o **nome** da variável (ex: `PIPEDRIVE_API_TOKEN`)
3. Cole o **valor** correspondente (ex: `a38c755e08ca299b1f292bcb052381f0be9774ab`)
4. Clique em **Save** ou **Add**

**💡 Dica**: Copie e cole uma variável por vez para evitar erros.

### 3. Reiniciar Servidor
Após adicionar **TODAS** as variáveis:
1. Volte para a página principal do projeto
2. Clique em **Restart Server** (ou aguarde reinicialização automática)
3. Aguarde ~30 segundos para o servidor reiniciar

### 4. Validar Configuração
Execute o script de diagnóstico para confirmar:
```bash
npx tsx server/diagnosticoPipedrive.ts
```

**Resultado esperado**:
```
✅ TUDO CONFIGURADO CORRETAMENTE!
🎉 A integração Pipedrive está pronta para uso.
```

---

## 🧪 Teste de Integração

Após configurar e reiniciar:

### 1. Criar Simulação de Teste
1. Acesse o sistema
2. Clique em **Nova Simulação**
3. Preencha os dados:
   - Nome: "Teste Integração Pipedrive"
   - Email: "teste@example.com"
   - WhatsApp: "+5511999999999"
   - Valor: R$ 100.000,00
   - Método: LINEAR
   - Prazo: 24 meses
4. Clique em **Criar Simulação**

### 2. Verificar Logs do Servidor
No console do servidor, procure por:
```
🎯 Iniciando integração Pipedrive para oportunidade: X
👤 Lead encontrado: { id: X, nome: 'Teste Integração Pipedrive', email: 'teste@example.com' }
📊 Oportunidade encontrada: { id: X, tipo: 'investidor', tokenizaScore: XX, ticketEstimado: 10000000 }
🎯 Criando deal no Pipedrive para oportunidade: X
✅ Pipedrive: pessoa criada: XXXXX (ou pessoa encontrada)
➡️ Enviando DEAL para Pipedrive: { title: '[Simulação] - Teste Integração Pipedrive', value: 100000, pipeline_id: 9, stage_id: 49 }
⬅️ Resposta Pipedrive DEAL: { status: 201, success: true, id: XXXXX }
📌 Resultado createDeal: XXXXX
✅ pipedriveDealId salvo na opportunity: X XXXXX
```

### 3. Verificar no Pipedrive
1. Acesse https://grupoblue.pipedrive.com
2. Vá para **Negócios**
3. Selecione pipeline **"Tokeniza - Ofertas públicas"**
4. Procure por deal com título **"[Simulação] - Teste Integração Pipedrive"**
5. Verifique:
   - ✅ Está no stage **"Lead"** (49)
   - ✅ Valor: R$ 100.000,00
   - ✅ Pessoa: "Teste Integração Pipedrive"
   - ✅ Campos de score preenchidos (se configurados)

---

## 🐛 Troubleshooting

### Problema: Variável não aparece após adicionar

**Solução**:
1. Verifique se salvou a variável
2. Reinicie o servidor
3. Execute o diagnóstico novamente

---

### Problema: Deal criado no pipeline errado

**Causa**: Tipo de oportunidade incorreto

**Solução**:
- Simulações de **investimento** → pipeline 9 (investidor)
- Simulações de **captação** → pipeline 1 (emissor)

---

### Problema: Scores não aparecem no deal

**Causa**: Campos customizados não configurados ou IDs incorretos

**Solução**:
1. Verifique se as 7 variáveis `PIPEDRIVE_FIELD_*` estão configuradas
2. Confirme os IDs no Pipedrive → Configurações → Campos Customizados
3. Reinicie o servidor

---

## 📊 Checklist Final

- [ ] 13 variáveis copiadas e coladas no painel Secrets
- [ ] Servidor reiniciado
- [ ] Diagnóstico executado com sucesso (✅ TUDO CONFIGURADO)
- [ ] Simulação de teste criada
- [ ] Logs verificados no console (🎯 ➡️ ⬅️ ✅)
- [ ] Deal apareceu no Pipedrive no pipeline/stage corretos
- [ ] Título do deal: `[Simulação] - Nome do Lead`
- [ ] Scores preenchidos nos campos customizados

---

## 🎉 Próximos Passos

Após validar a integração:

1. **Testar com diferentes tipos**:
   - Criar simulação de investidor (deve ir para pipeline 9)
   - Criar simulação de emissor (deve ir para pipeline 1)

2. **Monitorar logs**:
   - Acompanhar console do servidor durante criações
   - Verificar se todos os deals estão sendo criados

3. **Ajustar configuração** (se necessário):
   - Adicionar `PIPEDRIVE_DEFAULT_OWNER_ID` para fixar dono
   - Ajustar pipelines/stages se necessário

---

**Configuração Completa! 🚀**
