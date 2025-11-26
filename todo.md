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
