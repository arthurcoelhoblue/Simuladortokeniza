# Guia de Logs - Integração Pipedrive

**Data**: 26/11/2025  
**Versão**: 2.0 (com logs detalhados)

---

## 📋 Visão Geral

Este documento descreve todos os logs implementados na integração com Pipedrive, facilitando o debug e monitoramento da sincronização de leads.

---

## 🔍 Fluxo Completo de Logs

### 1. Início da Integração (opportunities.create)

```
🎯 Iniciando integração Pipedrive para oportunidade: 123
```

**Quando aparece**: Imediatamente após calcular scores  
**Significa**: Sistema vai tentar criar deal no Pipedrive  
**Próximo passo**: Buscar lead e oportunidade no banco

---

### 2. Busca de Lead

```
👤 Lead encontrado: { id: 45, nome: 'João Silva', email: 'joao@example.com' }
```

**Quando aparece**: Após buscar lead no banco local  
**Significa**: Lead existe e tem dados válidos  
**Próximo passo**: Buscar oportunidade no banco

---

### 3. Busca de Oportunidade

```
📊 Oportunidade encontrada: {
  id: 123,
  tipo: 'investidor',
  tokenizaScore: 85,
  ticketEstimado: 5000000
}
```

**Quando aparece**: Após buscar oportunidade no banco local  
**Significa**: Oportunidade existe com scores calculados  
**Próximo passo**: Chamar função createDeal

---

### 4. Criação de Deal (Início)

```
🎯 Criando deal no Pipedrive para oportunidade: 123
```

**Quando aparece**: Antes de chamar createDeal()  
**Significa**: Vai iniciar chamada à API Pipedrive  
**Próximo passo**: Buscar/criar pessoa no Pipedrive

---

### 5. Busca/Criação de Pessoa

#### 5.1. Pessoa Encontrada por Email

```
🔍 Pipedrive: pessoa encontrada via email: 12345
```

**Quando aparece**: Pessoa já existe no Pipedrive (busca por email)  
**Significa**: Não vai duplicar pessoa, vai reutilizar ID  
**Próximo passo**: Criar deal com person_id existente

#### 5.2. Pessoa Encontrada por Telefone

```
🔍 Pipedrive: pessoa encontrada via telefone: 12345
```

**Quando aparece**: Pessoa não foi encontrada por email, mas existe por telefone  
**Significa**: Deduplicação funcionou, vai reutilizar ID  
**Próximo passo**: Criar deal com person_id existente

#### 5.3. Pessoa Criada

```
✅ Pipedrive: pessoa criada: 67890
```

**Quando aparece**: Pessoa não existia, foi criada agora  
**Significa**: Nova pessoa adicionada ao Pipedrive  
**Próximo passo**: Criar deal com novo person_id

#### 5.4. Erro ao Buscar/Criar Pessoa

```
❌ Erro criar/buscar pessoa: { status: 401, data: { error: 'Unauthorized' } }
```

**Quando aparece**: Falha na API Pipedrive (credenciais, rede, etc)  
**Significa**: Integração vai falhar, mas oportunidade local será criada  
**Próximo passo**: Verificar credenciais e conectividade

---

### 6. Envio de Deal para Pipedrive

```
➡️ Enviando DEAL para Pipedrive: {
  title: '[Simulação] - João Silva',
  value: 50000,
  pipeline_id: 1,
  stage_id: 1,
  owner_id: 15
}
```

**Quando aparece**: Antes de fazer POST /deals  
**Significa**: Payload montado, vai enviar para API  
**Campos importantes**:
- `title`: Sempre formato `[Simulação] - Nome`
- `value`: Ticket em reais (ticketEstimado / 100)
- `pipeline_id`: 1 = investidor, 2 = emissor
- `stage_id`: Stage inicial configurado
- `owner_id`: Aparece apenas se `PIPEDRIVE_DEFAULT_OWNER_ID` estiver configurado

**Próximo passo**: Aguardar resposta da API

---

### 7. Resposta do Pipedrive

#### 7.1. Sucesso

```
⬅️ Resposta Pipedrive DEAL: {
  status: 201,
  success: true,
  id: 98765
}
```

**Quando aparece**: Deal criado com sucesso  
**Significa**: Lead sincronizado no Pipedrive  
**Próximo passo**: Salvar pipedriveDealId no banco local

#### 7.2. Erro HTTP

```
❌ Erro Pipedrive DEAL: {
  status: 400,
  data: {
    success: false,
    error: 'Invalid pipeline_id',
    error_info: 'Pipeline with ID 999 does not exist'
  }
}
```

**Quando aparece**: API retornou erro (400, 401, 403, 404, 500, etc)  
**Significa**: Problema na requisição ou configuração  
**Causas comuns**:
- `400`: Dados inválidos (pipeline_id, stage_id, campos customizados)
- `401`: Token inválido ou expirado
- `403`: Sem permissão para criar deals
- `404`: Recurso não encontrado (pipeline, stage, person)
- `500`: Erro interno do Pipedrive

**Próximo passo**: Verificar configuração e corrigir

#### 7.3. Erro de Rede

```
❌ Erro Pipedrive DEAL (não Axios): Error: Network timeout
```

**Quando aparece**: Erro de rede, timeout, DNS, etc  
**Significa**: Problema de conectividade  
**Próximo passo**: Verificar conexão com internet

---

### 8. Resultado da Criação

#### 8.1. Deal Criado com Sucesso

```
📌 Resultado createDeal: 98765
✅ pipedriveDealId salvo na opportunity: 123 98765
```

**Quando aparece**: Deal criado e ID salvo no banco  
**Significa**: Sincronização 100% completa  
**Próximo passo**: Nenhum, processo concluído

#### 8.2. Deal Não Criado

```
📌 Resultado createDeal: null
⚠️ Nenhum dealId retornado. Oportunidade criada apenas localmente: 123
```

**Quando aparece**: createDeal retornou null (erro na API)  
**Significa**: Oportunidade existe localmente, mas não no Pipedrive  
**Próximo passo**: Investigar erro anterior nos logs

---

### 9. Erro Geral na Integração

```
❌ Erro ao integrar com Pipedrive: Error: Lead não encontrado
```

**Quando aparece**: Erro inesperado no fluxo de integração  
**Significa**: Problema no código ou dados inconsistentes  
**Próximo passo**: Verificar logs anteriores e stack trace

---

## 🎯 Cenários Comuns e Logs Esperados

### Cenário 1: Sucesso Total (Pessoa Nova)

```
🎯 Iniciando integração Pipedrive para oportunidade: 123
👤 Lead encontrado: { id: 45, nome: 'João Silva', email: 'joao@example.com' }
📊 Oportunidade encontrada: { id: 123, tipo: 'investidor', tokenizaScore: 85, ticketEstimado: 5000000 }
🎯 Criando deal no Pipedrive para oportunidade: 123
✅ Pipedrive: pessoa criada: 67890
➡️ Enviando DEAL para Pipedrive: { title: '[Simulação] - João Silva', value: 50000, pipeline_id: 1, stage_id: 1 }
⬅️ Resposta Pipedrive DEAL: { status: 201, success: true, id: 98765 }
📌 Resultado createDeal: 98765
✅ pipedriveDealId salvo na opportunity: 123 98765
```

**Resultado**: ✅ Lead sincronizado com sucesso

---

### Cenário 2: Sucesso Total (Pessoa Existente)

```
🎯 Iniciando integração Pipedrive para oportunidade: 124
👤 Lead encontrado: { id: 45, nome: 'João Silva', email: 'joao@example.com' }
📊 Oportunidade encontrada: { id: 124, tipo: 'investidor', tokenizaScore: 75, ticketEstimado: 3000000 }
🎯 Criando deal no Pipedrive para oportunidade: 124
🔍 Pipedrive: pessoa encontrada via email: 67890
➡️ Enviando DEAL para Pipedrive: { title: '[Simulação] - João Silva', value: 30000, pipeline_id: 1, stage_id: 1 }
⬅️ Resposta Pipedrive DEAL: { status: 201, success: true, id: 98766 }
📌 Resultado createDeal: 98766
✅ pipedriveDealId salvo na opportunity: 124 98766
```

**Resultado**: ✅ Lead sincronizado (pessoa não duplicada)

---

### Cenário 3: Credenciais Inválidas

```
🎯 Iniciando integração Pipedrive para oportunidade: 125
👤 Lead encontrado: { id: 46, nome: 'Maria Santos', email: 'maria@example.com' }
📊 Oportunidade encontrada: { id: 125, tipo: 'emissor', tokenizaScore: 65, ticketEstimado: 100000000 }
🎯 Criando deal no Pipedrive para oportunidade: 125
❌ Erro criar/buscar pessoa: { status: 401, data: { error: 'Unauthorized' } }
⚠️ Pipedrive: não foi possível obter person_id.
📌 Resultado createDeal: null
⚠️ Nenhum dealId retornado. Oportunidade criada apenas localmente: 125
```

**Resultado**: ⚠️ Oportunidade criada localmente, mas não no Pipedrive  
**Ação**: Verificar `PIPEDRIVE_API_TOKEN`

---

### Cenário 4: Pipeline Inválido

```
🎯 Iniciando integração Pipedrive para oportunidade: 126
👤 Lead encontrado: { id: 47, nome: 'Pedro Costa', email: 'pedro@example.com' }
📊 Oportunidade encontrada: { id: 126, tipo: 'investidor', tokenizaScore: 90, ticketEstimado: 10000000 }
🎯 Criando deal no Pipedrive para oportunidade: 126
✅ Pipedrive: pessoa criada: 67891
➡️ Enviando DEAL para Pipedrive: { title: '[Simulação] - Pedro Costa', value: 100000, pipeline_id: 999, stage_id: 1 }
❌ Erro Pipedrive DEAL: { status: 400, data: { success: false, error: 'Invalid pipeline_id' } }
📌 Resultado createDeal: null
⚠️ Nenhum dealId retornado. Oportunidade criada apenas localmente: 126
```

**Resultado**: ⚠️ Pessoa criada, mas deal falhou  
**Ação**: Verificar `PIPEDRIVE_INVESTOR_PIPELINE_ID` e `PIPEDRIVE_EMISSOR_PIPELINE_ID`

---

### Cenário 5: Pipedrive Offline

```
🎯 Iniciando integração Pipedrive para oportunidade: 127
👤 Lead encontrado: { id: 48, nome: 'Ana Lima', email: 'ana@example.com' }
📊 Oportunidade encontrada: { id: 127, tipo: 'investidor', tokenizaScore: 80, ticketEstimado: 7500000 }
🎯 Criando deal no Pipedrive para oportunidade: 127
❌ Erro criar/buscar pessoa: { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 104.18.0.1:443' }
⚠️ Pipedrive: não foi possível obter person_id.
📌 Resultado createDeal: null
⚠️ Nenhum dealId retornado. Oportunidade criada apenas localmente: 127
```

**Resultado**: ⚠️ Erro de rede  
**Ação**: Verificar conectividade com `api.pipedrive.com`

---

## 🔧 Troubleshooting

### Problema: Nenhum log de integração aparece

**Sintoma**: Não aparece `🎯 Iniciando integração Pipedrive`

**Causas possíveis**:
1. Endpoint `opportunities.create` não está sendo chamado
2. Erro antes da integração (criação de lead, simulação ou oportunidade)
3. Código de integração comentado ou removido

**Solução**: Verificar logs anteriores no console

---

### Problema: Pessoa duplicada no Pipedrive

**Sintoma**: Sempre aparece `✅ Pipedrive: pessoa criada` mesmo para leads existentes

**Causas possíveis**:
1. Email diferente entre tentativas
2. Telefone diferente entre tentativas
3. Busca do Pipedrive não encontrando por formatação

**Solução**: Normalizar email e telefone antes de enviar

---

### Problema: Deal criado no pipeline errado

**Sintoma**: `pipeline_id` no log `➡️ Enviando DEAL` está incorreto

**Causas possíveis**:
1. `tipoOportunidade` incorreto (deveria ser "investidor" ou "emissor")
2. ENVs `PIPEDRIVE_INVESTOR_PIPELINE_ID` ou `PIPEDRIVE_EMISSOR_PIPELINE_ID` trocados

**Solução**: Verificar campo `tipo` no log `📊 Oportunidade encontrada`

---

### Problema: Campos customizados não aparecem no Pipedrive

**Sintoma**: Deal criado, mas scores não aparecem

**Causas possíveis**:
1. ENVs de campos customizados não configurados
2. IDs de campos customizados incorretos
3. Campos não existem no Pipedrive

**Solução**: 
1. Verificar se ENVs `PIPEDRIVE_FIELD_*` estão configurados
2. Validar IDs dos campos no Pipedrive → Configurações → Campos Customizados

---

### Problema: owner_id não aparece no log

**Sintoma**: `owner_id: undefined` no log `➡️ Enviando DEAL`

**Causas possíveis**:
1. ENV `PIPEDRIVE_DEFAULT_OWNER_ID` não configurado (comportamento esperado)
2. Deal será atribuído ao dono padrão do Pipedrive

**Solução**: Se quiser fixar dono, adicionar `PIPEDRIVE_DEFAULT_OWNER_ID=15` (ID do usuário)

---

## 📊 Variáveis de Ambiente Relacionadas

```bash
# Obrigatórias
PIPEDRIVE_API_TOKEN=your_token_here
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_INVESTOR_PIPELINE_ID=1
PIPEDRIVE_INVESTOR_STAGE_ID=1
PIPEDRIVE_EMISSOR_PIPELINE_ID=2
PIPEDRIVE_EMISSOR_STAGE_ID=5

# Opcionais
PIPEDRIVE_DEFAULT_OWNER_ID=15  # Fixar dono do deal
PIPEDRIVE_FIELD_TOKENIZA_SCORE=abc123def456
PIPEDRIVE_FIELD_SCORE_VALOR=ghi789jkl012
PIPEDRIVE_FIELD_SCORE_INTENCAO=mno345pqr678
PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO=stu901vwx234
PIPEDRIVE_FIELD_SCORE_URGENCIA=yza567bcd890
PIPEDRIVE_FIELD_ORIGEM_SIMULACAO=efg123hij456
PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE=klm789nop012
```

---

## 🎯 Checklist de Validação

Ao criar uma simulação, você deve ver **TODOS** estes logs (em ordem):

- [ ] `🎯 Iniciando integração Pipedrive para oportunidade: X`
- [ ] `👤 Lead encontrado: { ... }`
- [ ] `📊 Oportunidade encontrada: { ... }`
- [ ] `🎯 Criando deal no Pipedrive para oportunidade: X`
- [ ] `🔍 Pipedrive: pessoa encontrada` OU `✅ Pipedrive: pessoa criada`
- [ ] `➡️ Enviando DEAL para Pipedrive: { ... }`
- [ ] `⬅️ Resposta Pipedrive DEAL: { ... }`
- [ ] `📌 Resultado createDeal: XXXXX`
- [ ] `✅ pipedriveDealId salvo na opportunity: X XXXXX`

**Se algum log estiver faltando**, consulte a seção de Troubleshooting acima.

---

## 📝 Notas Importantes

1. **Logs são síncronos**: Aparecem na ordem exata do fluxo
2. **Erros não bloqueiam criação local**: Oportunidade sempre é criada no banco, mesmo se Pipedrive falhar
3. **person_id é reutilizado**: Sistema evita duplicação de pessoas
4. **Título é obrigatório**: Sempre formato `[Simulação] - Nome do Lead`
5. **Pipeline é selecionado automaticamente**: Baseado em `tipoOportunidade`

---

**Fim do Guia**
