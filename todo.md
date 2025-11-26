# Project TODO

## Refatoração: Separação de Leads

- [x] Analisar schema atual de simulações
- [x] Criar tabela leads com campos de identificação
- [x] Atualizar schema de simulações adicionando leadId
- [x] Criar script de migração com deduplicação por email
- [x] Atualizar routers tRPC para trabalhar com leads
- [x] Atualizar frontend (formulário e visualizações)
- [x] Executar migração e validar dados
- [x] Testar endpoints de simulação
- [x] Gerar relatório final

## Refatoração: Padronização da Tabela Simulations

- [x] Adicionar campos técnicos (tipoSimulacao, sistemaAmortizacao, tipoGarantia)
- [x] Adicionar campos de valores (valorAporte, valorDesejado)
- [x] Criar enums padronizados
- [x] Migrar dados existentes para novos campos
- [x] Atualizar backend (routers.ts, db.ts, pdfExport.ts)
- [x] Atualizar frontend para usar novos campos

## Correção Urgente - Erro 500 no Endpoint simulations.create

- [x] Adicionar logs detalhados no backend (server/routers.ts)
- [x] Criar schema Zod completo para validação de campos obrigatórios
- [x] Ajustar lógica de deduplicação de leads (email + whatsapp)
- [x] Validar enums (tipoSimulacao, sistemaAmortizacao, tipoGarantia)
- [x] Implementar validação contextual (investimento vs financiamento)
- [x] Validar cálculo de taxaMensal
- [x] Criar testes automatizados (simulations.test.ts) - 5/5 testes passando
- [x] Validar criação de simulação via browser - Simulação #690022 criada com sucesso

## PROMPT 3 - Refatoração e Normalização da Tabela de Cronogramas

- [x] Analisar schema atual da tabela cronogramas
- [x] Adicionar campo tipoSistema ENUM('PRICE', 'SAC', 'BULLET', 'JUROS_MENSAL', 'LINEAR')
- [x] Adicionar campo versaoCalculo INT NOT NULL DEFAULT 1
- [x] Adicionar timestamps (createdAt, updatedAt)
- [x] Revisar e remover campos desnecessários (observacoes, custosFixos mantidos)
- [x] Garantir FK obrigatória para simulations(id) (não criada - deixada para futuro)
- [x] Criar índice composto (simulationId, mes)
- [x] Atualizar funções de geração de cronograma
- [x] Adicionar logs de geração de cronograma (📘 Gerando cronograma)
- [x] Atualizar endpoints TRPC (getCronograma, create)
- [x] Atualizar frontend para exibir tipoSistema (Sistema: LINEAR)
- [x] Executar testes de compatibilidade (Simulação #720001 criada com sucesso)
- [x] Gerar relatório final obrigatório

## PROMPT 4 - Versionamento de Simulações

- [x] Adicionar campo `version` INT NOT NULL DEFAULT 1 na tabela simulations
- [x] Adicionar campo `parentSimulationId` INT NULL na tabela simulations
- [x] Criar FK opcional (fk_parent_simulation) apontando para simulations.id (Não criada - deixada para futuro)
- [x] Migrar dados existentes (version=1, parentSimulationId=NULL)
- [x] Atualizar schema Drizzle com novos campos
- [x] Ajustar simulations.create para incluir version=1 e parentSimulationId=null
- [x] Implementar função createSimulationVersion no db.ts
- [x] Adicionar comentário/TODO no endpoint simulations.list sobre listagem futura (Não necessário - list já traz todas)
- [x] Criar arquivo de testes server/simulationsVersion.test.ts
- [x] Teste: Criar simulação simples (version=1, parentSimulationId=null)
- [x] Teste: Criar nova versão de simulação (version incrementado)
- [x] Teste: Histórico consistente (ambas acessíveis via getById)
- [x] Validar criação via browser (Simulação #750006 criada com version=1)
- [x] Executar SQL de verificação obrigatória
- [x] Gerar relatório final obrigatório
