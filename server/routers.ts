import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { calcularSimulacao, SimulationInput } from "./calculator";
import * as db from "./db";
import { generatePDFHTML } from "./pdfExport";

/**
 * Lista de emails com acesso administrativo
 * Usado para proteger dashboards e endpoints internos
 */
const adminEmails = ["arthur@blueconsult.com.br", "arthurcsantos@gmail.com"];

/**
 * Procedure administrativo que verifica se o usuário logado
 * possui email na lista de admins
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const email = ctx.user?.email;

  if (!email || !adminEmails.includes(email)) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso negado. Esta funcionalidade é restrita a administradores." 
    });
  }

  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  simulations: router({
    // Listar simulações do usuário
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getSimulationsByUserId(ctx.user.id);
    }),

    // Obter simulação por ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const simulation = await db.getSimulationById(input.id);
        if (!simulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Simulação não encontrada" });
        }
        if (simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return simulation;
      }),

    // Obter cronograma de uma simulação
    getCronograma: protectedProcedure
      .input(z.object({ simulationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const simulation = await db.getSimulationById(input.simulationId);
        if (!simulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Simulação não encontrada" });
        }
        if (simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return db.getCronogramasBySimulationId(input.simulationId);
      }),

    // Criar nova simulação
    create: protectedProcedure
      .input(
        z.object({
          // Dados do lead
          nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
          whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
          email: z.string().email().optional(),
          
          // Dados da oferta
          descricaoOferta: z.string().optional(),
          valorTotalOferta: z.number().positive(),
          
          // NOVOS CAMPOS PADRONIZADOS
          tipoSimulacao: z.enum(["investimento", "financiamento"]).default("investimento"),
          valorAporte: z.number().positive().optional(), // Obrigatório se tipoSimulacao = investimento
          valorDesejado: z.number().positive().optional(), // Obrigatório se tipoSimulacao = financiamento
          sistemaAmortizacao: z.enum(["PRICE", "SAC", "BULLET", "JUROS_MENSAL", "LINEAR"]).default("LINEAR"),
          tipoGarantia: z.enum(["recebiveis_cartao", "duplicatas", "imovel", "veiculo", "sem_garantia"]).default("sem_garantia"),
          
          // CAMPOS LEGADOS (mantidos para compatibilidade com frontend antigo)
          valorInvestido: z.number().positive().optional(),
          amortizacaoMetodo: z.enum(["linear", "bullet"]).optional(),
          modo: z.enum(["investidor", "captador"]).optional(),
          
          dataEncerramentoOferta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          prazoMeses: z.number().int().positive(),
          taxaJurosAa: z.number().nonnegative(),
          convencaoCalendario: z.enum(["civil/365", "30/360", "252 úteis"]).default("civil/365"),
          tipoCapitalizacao: z.enum(["simples", "composta"]).default("composta"),

          // Regras de pagamento
          periodicidadeJuros: z.enum(["mensal", "semestral", "anual", "no_fim"]).default("mensal"),
          periodicidadeAmortizacao: z.enum(["mensal", "no_fim"]).default("mensal"),
          carenciaJurosMeses: z.number().int().nonnegative().default(0),
          carenciaPrincipalMeses: z.number().int().nonnegative().default(0),
          capitalizarJurosEmCarencia: z.boolean().default(true),
          pagamentoMinimoValor: z.number().optional(),

          // Custos e taxas (opcionais)
          taxaSetupFixaBrl: z.number().nonnegative().optional(),
          feeSucessoPercentSobreCaptacao: z.number().nonnegative().optional(),
          feeManutencaoMensalBrl: z.number().nonnegative().optional(),
          taxaTransacaoPercent: z.number().nonnegative().optional(),
          aliquotaImpostoRendaPercent: z.number().nonnegative().optional(),

          // Outros
          identificadorInvestidor: z.string().optional(),
          moedaReferencia: z.string().default("BRL"),
          
          // Sistema de scoring - intenção
          origemSimulacao: z.enum(["manual", "oferta_tokeniza"]).default("manual"),
          engajouComOferta: z.boolean().default(false),
          offerId: z.number().int().positive().optional().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        console.log("📥 Recebendo criação de simulação:", {
          nomeCompleto: input.nomeCompleto,
          whatsapp: input.whatsapp,
          email: input.email,
          tipoSimulacao: input.tipoSimulacao,
          valorAporte: input.valorAporte,
          valorDesejado: input.valorDesejado,
          valorInvestido: input.valorInvestido,
          sistemaAmortizacao: input.sistemaAmortizacao,
        });

        try {
          // VALIDAÇÃO CONTEXTUAL: investimento vs financiamento
          const tipoSimulacao = input.tipoSimulacao || (input.modo === 'captador' ? 'financiamento' : 'investimento');
          const valorAporte = input.valorAporte || input.valorInvestido;
          const valorDesejado = input.valorDesejado || input.valorTotalOferta;
          const sistemaAmortizacao = input.sistemaAmortizacao || (input.amortizacaoMetodo === 'bullet' ? 'BULLET' : 'LINEAR');

          if (tipoSimulacao === 'investimento' && !valorAporte) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "valorAporte é obrigatório para simulações de investimento",
            });
          }

          if (tipoSimulacao === 'financiamento' && !valorDesejado) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "valorDesejado é obrigatório para simulações de financiamento",
            });
          }

          // Validações
          if (valorAporte && valorAporte > input.valorTotalOferta) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Valor investido não pode ser maior que o valor total da oferta",
            });
          }

          if (input.periodicidadeAmortizacao === "no_fim" && sistemaAmortizacao !== "BULLET") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Quando periodicidade de amortização é 'no_fim', o método deve ser 'BULLET'",
            });
          }

          // DEDUPLICAÇÃO DE LEADS: email → whatsapp → criar novo
          let leadId: number;
          let existingLead = null;

          if (input.email) {
            // 1. Tentar buscar por email
            existingLead = await db.getLeadByEmail(input.email);
            console.log("🔍 Busca por email:", input.email, "→", existingLead ? `Lead #${existingLead.id}` : "não encontrado");
          }

          if (!existingLead && input.whatsapp) {
            // 2. Tentar buscar por whatsapp
            existingLead = await db.getLeadByWhatsapp(input.whatsapp);
            console.log("🔍 Busca por whatsapp:", input.whatsapp, "→", existingLead ? `Lead #${existingLead.id}` : "não encontrado");
          }

          if (existingLead) {
            leadId = existingLead.id;
            console.log("♻️ Reutilizando lead existente #", leadId);
          } else {
            // 3. Criar novo lead
            leadId = await db.createLead({
              nomeCompleto: input.nomeCompleto,
              whatsapp: input.whatsapp,
              email: input.email || null,
              telefone: input.whatsapp,
              cidade: null,
              estado: null,
              cpf: null,
              canalOrigem: 'simulador_web',
            });
            console.log("✨ Novo lead criado #", leadId);
          }

          console.log("👤 Lead associado:", leadId);

          // Prepara input para cálculo
          const calculoInput: SimulationInput = {
            valorTotalOferta: input.valorTotalOferta,
            valorInvestido: valorAporte!,
          dataEncerramentoOferta: input.dataEncerramentoOferta,
          prazoMeses: input.prazoMeses,
          taxaJurosAa: input.taxaJurosAa,
          convencaoCalendario: input.convencaoCalendario as any,
          tipoCapitalizacao: input.tipoCapitalizacao as any,
          periodicidadeJuros: input.periodicidadeJuros as any,
          periodicidadeAmortizacao: input.periodicidadeAmortizacao as any,
          carenciaJurosMeses: input.carenciaJurosMeses,
          carenciaPrincipalMeses: input.carenciaPrincipalMeses,
          capitalizarJurosEmCarencia: input.capitalizarJurosEmCarencia,
          amortizacaoMetodo: (sistemaAmortizacao === 'BULLET' ? 'bullet' : 'linear') as any,
          pagamentoMinimoValor: input.pagamentoMinimoValor,
          taxaSetupFixaBrl: input.taxaSetupFixaBrl || 0,
          feeSucessoPercentSobreCaptacao: input.feeSucessoPercentSobreCaptacao || 0,
          feeManutencaoMensalBrl: input.feeManutencaoMensalBrl || 0,
          taxaTransacaoPercent: input.taxaTransacaoPercent || 0,
          aliquotaImpostoRendaPercent: input.aliquotaImpostoRendaPercent || 0,
        };

          // Calcula simulação
          console.log("🧮 Calculando simulação com input:", {
            valorTotalOferta: calculoInput.valorTotalOferta,
            valorInvestido: calculoInput.valorInvestido,
            prazoMeses: calculoInput.prazoMeses,
            taxaJurosAa: calculoInput.taxaJurosAa,
          });
          const resultado = calcularSimulacao(calculoInput);
          console.log("✅ Cálculo concluído:", {
            totalJurosPagos: resultado.resumo.totalJurosPagos,
            totalRecebido: resultado.resumo.totalRecebido,
            tirAnual: resultado.resumo.tirAnual,
          });

          // Calcula taxaMensal
          const taxaMensal = Math.round((input.taxaJurosAa / 12) * 100); // Converte para centavos de %
          if (isNaN(taxaMensal)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "taxaMensal inválida - verifique taxaJurosAa",
            });
          }

          // Prepara payload para salvar no banco
          const simulationPayload = {
            userId: ctx.user.id,
            leadId: leadId,
            // Novos campos padronizados
            tipoSimulacao: tipoSimulacao,
            modalidade: null,
            descricaoOferta: input.descricaoOferta || null,
            valorDesejado: valorDesejado!,
            valorAporte: valorAporte!,
            valorTotalOferta: input.valorTotalOferta,
            prazoMeses: input.prazoMeses,
            dataEncerramentoOferta: input.dataEncerramentoOferta,
            taxaMensal: taxaMensal,
            taxaJurosAa: input.taxaJurosAa,
            convencaoCalendario: input.convencaoCalendario,
            tipoCapitalizacao: input.tipoCapitalizacao,
            sistemaAmortizacao: sistemaAmortizacao,
            possuiCarencia: (input.carenciaJurosMeses > 0 || input.carenciaPrincipalMeses > 0) ? 1 : 0,
            mesesCarencia: Math.max(input.carenciaJurosMeses, input.carenciaPrincipalMeses),
            carenciaJurosMeses: input.carenciaJurosMeses,
            carenciaPrincipalMeses: input.carenciaPrincipalMeses,
            capitalizarJurosEmCarencia: input.capitalizarJurosEmCarencia ? 1 : 0,
            tipoGarantia: input.tipoGarantia,
            periodicidadeJuros: input.periodicidadeJuros,
            periodicidadeAmortizacao: input.periodicidadeAmortizacao,
            pagamentoMinimoValor: input.pagamentoMinimoValor || null,
            taxaSetupFixaBrl: input.taxaSetupFixaBrl || 0,
            feeSucessoPercentSobreCaptacao: input.feeSucessoPercentSobreCaptacao || 0,
            feeManutencaoMensalBrl: input.feeManutencaoMensalBrl || 0,
            taxaTransacaoPercent: input.taxaTransacaoPercent || 0,
            aliquotaImpostoRendaPercent: input.aliquotaImpostoRendaPercent || 0,
            modo: tipoSimulacao === 'financiamento' ? 'captador' : 'investidor',
            identificadorInvestidor: input.identificadorInvestidor || null,
            moedaReferencia: input.moedaReferencia,
            totalJurosPagos: resultado.resumo.totalJurosPagos,
            totalAmortizado: resultado.resumo.totalAmortizado,
            totalRecebido: resultado.resumo.totalRecebido,
            tirMensal: resultado.resumo.tirMensal || null,
            tirAnual: resultado.resumo.tirAnual || null,
            // Versionamento
            version: 1,
            parentSimulationId: null,
            // Sistema de scoring - intenção
            origemSimulacao: input.origemSimulacao,
            engajouComOferta: input.engajouComOferta ? 1 : 0,
            offerId: input.offerId || null,
          };

          console.log("💾 Dados finais para criar simulação:", {
            tipoSimulacao: simulationPayload.tipoSimulacao,
            valorAporte: simulationPayload.valorAporte,
            valorDesejado: simulationPayload.valorDesejado,
            sistemaAmortizacao: simulationPayload.sistemaAmortizacao,
            tipoGarantia: simulationPayload.tipoGarantia,
            taxaMensal: simulationPayload.taxaMensal,
          });

          // Salva simulação no banco
          const simulationId = await db.createSimulation(simulationPayload);
          console.log("✅ Simulação criada com ID:", simulationId);

          // Salva cronograma
          console.log("📘 Gerando cronograma:", {
            simulacaoId: simulationId,
            sistema: sistemaAmortizacao,
            parcelas: resultado.cronograma.length,
          });

          const cronogramaItems = resultado.cronograma.map((mes) => ({
            simulationId: simulationId as number,
            mes: mes.mes,
            dataParcela: mes.dataParcela,
            saldoInicial: mes.saldoInicial,
            juros: mes.juros,
            amortizacao: mes.amortizacao,
            parcela: mes.parcela,
            custosFixos: mes.custosFixos,
            saldoFinal: mes.saldoFinal,
            observacoes: mes.observacoes || null,
            // Novos campos de normalização
            tipoSistema: sistemaAmortizacao,
            versaoCalculo: 1,
          }));

          await db.createCronogramas(cronogramaItems);
          console.log("✅ Cronograma salvo com", cronogramaItems.length, "parcelas");

          return {
            simulationId,
            resumo: resultado.resumo,
          };
        } catch (err: any) {
          console.error("❌ Erro ao criar simulação:", err);
          throw err;
        }
      }),

    // Deletar simulação
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const simulation = await db.getSimulationById(input.id);
        if (!simulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Simulação não encontrada" });
        }
        if (simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.deleteSimulation(input.id);
        return { success: true };
      }),

    // Exportar simulação como HTML para PDF
    exportPDF: protectedProcedure
      .input(z.object({ simulationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const simulation = await db.getSimulationById(input.simulationId);
        if (!simulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Simulação não encontrada" });
        }
        if (simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const cronograma = await db.getCronogramasBySimulationId(input.simulationId);
        const html = generatePDFHTML(simulation, cronograma);
        
        return { html };
      }),
  }),

  opportunities: router({
    // Criar oportunidade a partir de uma simulação
    create: protectedProcedure
      .input(
        z.object({
          simulationId: z.number().int().positive(),
          ownerUserId: z.number().int().positive().optional(),
          nextAction: z.string().optional(),
          nextActionAt: z.string().datetime().optional(), // ISO string
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Buscar simulação
        const simulation = await db.getSimulationById(input.simulationId);
        if (!simulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Simulação não encontrada" });
        }

        // Verificar se usuário tem acesso à simulação
        if (simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        // 2. Buscar leadId da simulação
        const leadId = simulation.leadId;
        if (!leadId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Simulação não possui lead associado" });
        }

        // 3. Calcular ticketEstimado e tipoOportunidade com base em tipoSimulacao
        let ticketEstimado: number;
        let tipoOportunidade: "investidor" | "emissor";
        
        if (simulation.tipoSimulacao === "investimento") {
          ticketEstimado = simulation.valorAporte || 0;
          tipoOportunidade = "investidor";
        } else {
          ticketEstimado = simulation.valorDesejado || 0;
          tipoOportunidade = "emissor";
        }

        console.log("🎯 Criando oportunidade tipo=", tipoOportunidade, "para simulação", input.simulationId);

        // 4. Calcular scores ANTES de criar oportunidade
        let scoreComponents = {
          tokenizaScore: 0,
          scoreValor: 0,
          scoreIntencao: 0,
          scoreEngajamento: 0,
          scoreUrgencia: 0,
        };
        let fitNivel = "frio" as "frio" | "morno" | "quente" | "prioritario";

        try {
          const { calcularScoreParaOpportunity } = await import("./scoreEngine");
          const { calcularFitNivel } = await import("./fitNivel");
          
          // Buscar oferta relacionada se existir
          let offer = null;
          if (simulation.offerId) {
            offer = await db.getOfferById(simulation.offerId);
          }

          // Contar versões relacionadas para scoreEngajamento
          const versoesRelacionadas = await db.countRelatedSimulations(
            leadId,
            simulation.tipoSimulacao
          );

          // Calcular componentes de score (não precisa de opportunity completa)
          scoreComponents = calcularScoreParaOpportunity({
            simulation,
            opportunity: {
              tipoOportunidade,
              ticketEstimado,
            } as any, // Apenas campos necessários para cálculo
            offer,
            versoesRelacionadas,
          });
          
          // Calcular fitNivel baseado em tokenizaScore
          fitNivel = calcularFitNivel(scoreComponents.tokenizaScore);

          console.log("🏆 Score Tokeniza calculado:", scoreComponents.tokenizaScore, "fitNivel:", fitNivel);
        } catch (error) {
          console.error("❌ Erro ao calcular score Tokeniza:", error);
          // Continua com scores zerados se falhar
        }

        // 5. Criar oportunidade JÁ COM scores calculados
        const opportunityId = await db.createOpportunity({
          leadId,
          simulationId: input.simulationId,
          ownerUserId: input.ownerUserId || null,
          status: "novo",
          probabilidade: 0,
          ticketEstimado,
          tipoOportunidade,
          nextAction: input.nextAction || null,
          nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null,
          // Scores calculados ANTES
          tokenizaScore: scoreComponents.tokenizaScore,
          fitNivel,
          scoreValor: scoreComponents.scoreValor,
          scoreIntencao: scoreComponents.scoreIntencao,
          scoreEngajamento: scoreComponents.scoreEngajamento,
          scoreUrgencia: scoreComponents.scoreUrgencia,
        });

        console.log("✅ Oportunidade criada com ID:", opportunityId, "tokenizaScore:", scoreComponents.tokenizaScore);


        // 6. Integração com Pipedrive (NOVA VERSÃO)
        try {
          console.log("🎯 Iniciando integração Pipedrive para oportunidade:", opportunityId);

          // Buscar lead completo
          const lead = await db.getLeadById(leadId);
          if (!lead) {
            throw new Error("Lead não encontrado");
          }
          console.log("👤 Lead encontrado:", { id: lead.id, nome: lead.nomeCompleto, email: lead.email });

          // Buscar oportunidade recém-criada com scores atualizados
          const opportunity = await db.getOpportunityById(opportunityId);
          if (!opportunity) {
            throw new Error("Oportunidade não encontrada");
          }
          console.log("📊 Oportunidade encontrada:", {
            id: opportunity.id,
            tipo: opportunity.tipoOportunidade,
            tokenizaScore: opportunity.tokenizaScore,
            ticketEstimado: opportunity.ticketEstimado,
          });

          // Criar deal no Pipedrive com título [Simulação] - Nome
          console.log("🎯 Criando deal no Pipedrive para oportunidade:", opportunityId);
          const { createDeal } = await import("./pipedrive");
          const dealId = await createDeal({
            lead,
            opportunity,
            simulation,
            score: {
              total: opportunity.tokenizaScore || 0,
              valor: opportunity.scoreValor || 0,
              intencao: opportunity.scoreIntencao || 0,
              engajamento: opportunity.scoreEngajamento || 0,
              urgencia: opportunity.scoreUrgencia || 0,
            },
          });

          console.log("📌 Resultado createDeal:", dealId);

          if (dealId) {
            // Atualizar oportunidade com pipedriveDealId
            await db.updateOpportunity(opportunityId, {
              pipedriveDealId: dealId.toString(),
            });
            console.log("✅ pipedriveDealId salvo na opportunity:", opportunityId, dealId);
          } else {
            console.warn("⚠️ Nenhum dealId retornado. Oportunidade criada apenas localmente:", opportunityId);
          }
        } catch (error) {
          console.error("❌ Erro ao integrar com Pipedrive:", error);
          // Não falhar a criação da oportunidade se Pipedrive falhar
        }

        return { id: opportunityId };
      }),

    // Listar oportunidades com filtros
    list: protectedProcedure
      .input(
        z
          .object({
            status: z.string().optional(),
            ownerUserId: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        const opportunities = await db.getOpportunities(input);

        // Enriquecer com dados de lead e simulação
        const enriched = await Promise.all(
          opportunities.map(async (opp) => {
            const lead = await db.getLeadById(opp.leadId);
            const simulation = await db.getSimulationById(opp.simulationId);
            const owner = opp.ownerUserId ? await db.getUserByOpenId(String(opp.ownerUserId)) : null;

            return {
              ...opp,
              lead: lead
                ? {
                    nome: lead.nomeCompleto,
                    whatsapp: lead.whatsapp,
                    email: lead.email,
                  }
                : null,
              simulation: simulation
                ? {
                    tipoSimulacao: simulation.tipoSimulacao,
                    valorAporte: simulation.valorAporte,
                    valorDesejado: simulation.valorDesejado,
                    prazoMeses: simulation.prazoMeses,
                  }
                : null,
              owner: owner ? { nome: owner.name } : null,
            };
          })
        );

        return enriched;
      }),
    
    // Requalificar oportunidade (recalcular scores)
    requalify: protectedProcedure
      .input(
        z.object({
          opportunityId: z.number().int().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Buscar oportunidade
        const opportunity = await db.getOpportunityById(input.opportunityId);
        if (!opportunity) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Oportunidade não encontrada" });
        }
        
        // 2. Buscar simulação relacionada
        const simulation = await db.getSimulationById(opportunity.simulationId);
        if (!simulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Simulação não encontrada" });
        }
        
        // 3. Buscar offer relacionada (se offerId existir)
        let offer = null;
        if (simulation.offerId) {
          offer = await db.getOfferById(simulation.offerId);
        }
        
        // 4. Contar versões relacionadas para scoreEngajamento
        const versoesRelacionadas = await db.countRelatedSimulations(
          simulation.leadId!,
          simulation.tipoSimulacao
        );
        
        // 5. Recalcular scores via scoreEngine
        const { calcularScoreParaOpportunity } = await import("./scoreEngine");
        
        const scoreComponents = calcularScoreParaOpportunity({
          simulation,
          opportunity,
          offer,
          versoesRelacionadas,
        });
        
        // 6. Calcular fitNivel baseado em tokenizaScore
        const { calcularFitNivel } = await import("./fitNivel");
        const fitNivel = calcularFitNivel(scoreComponents.tokenizaScore);
        
        // 7. Atualizar oportunidade com novos scores e fitNivel
        await db.updateOpportunityScores(input.opportunityId, {
          tokenizaScore: scoreComponents.tokenizaScore,
          fitNivel,
          scoreValor: scoreComponents.scoreValor,
          scoreIntencao: scoreComponents.scoreIntencao,
          scoreEngajamento: scoreComponents.scoreEngajamento,
          scoreUrgencia: scoreComponents.scoreUrgencia,
        });
        
        console.log("♻️ Requalificando oportunidade", input.opportunityId, "→ novo tokenizaScore:", scoreComponents.tokenizaScore);
        
        // 7. Retornar novos valores
        return {
          opportunityId: input.opportunityId,
          ...scoreComponents,
        };
      }),
    
    // Atualizar oportunidade (status, probabilidade, próximas ações)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(['novo', 'em_analise', 'aguardando_cliente', 'em_oferta', 'ganho', 'perdido']).optional(),
          probabilidade: z.number().min(0).max(100).optional(),
          nextAction: z.string().max(255).nullable().optional(),
          nextActionAt: z.string().datetime().nullable().optional(),
          reasonLost: z.string().max(255).nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Buscar oportunidade
        const opportunity = await db.getOpportunityById(input.id);
        if (!opportunity) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Oportunidade não encontrada" });
        }
        
        // 2. Validar permissão (owner ou admin)
        const isOwner = opportunity.ownerUserId === ctx.user.id;
        const isAdmin = ctx.user.email === "arthur@blueconsult.com.br";
        
        if (!isOwner && !isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        // 3. Se status = perdido, exigir reasonLost
        if (input.status === 'perdido' && !input.reasonLost && !opportunity.reasonLost) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "reasonLost é obrigatório quando status = perdido" });
        }
        
        // 4. Atualizar apenas campos enviados
        await db.updateOpportunity(input.id, {
          status: input.status,
          probabilidade: input.probabilidade,
          nextAction: input.nextAction,
          nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : undefined,
          reasonLost: input.reasonLost,
        });
        
        console.log("🎯 Oportunidade atualizada", {
          id: input.id,
          status: input.status,
          probabilidade: input.probabilidade,
        });
        
        // 5. Retornar oportunidade atualizada
        return await db.getOpportunityById(input.id);
      }),
    
    // Buscar oportunidade por ID (com dados enriquecidos)
    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const opportunity = await db.getOpportunityById(input.id);
        if (!opportunity) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Oportunidade não encontrada" });
        }
        
        // Enriquecer com lead, simulação e owner
        const lead = await db.getLeadById(opportunity.leadId);
        const simulation = await db.getSimulationById(opportunity.simulationId);
        const owner = opportunity.ownerUserId ? await db.getUserByOpenId(String(opportunity.ownerUserId)) : null;
        
        return {
          ...opportunity,
          lead: lead
            ? {
                id: lead.id,
                nomeCompleto: lead.nomeCompleto,
                whatsapp: lead.whatsapp,
                email: lead.email,
              }
            : null,
          simulation: simulation
            ? {
                id: simulation.id,
                tipoSimulacao: simulation.tipoSimulacao,
                valorAporte: simulation.valorAporte,
                valorDesejado: simulation.valorDesejado,
                prazoMeses: simulation.prazoMeses,
              }
            : null,
          owner: owner ? { id: owner.id, name: owner.name } : null,
        };
      }),
  }),

  // Dashboard administrativo (acesso restrito)
  dashboard: router({
    getLeadMetrics: adminProcedure.query(async ({ ctx }) => {
      console.log("📊 Dashboard Leads: métricas carregadas para userId=", ctx.user.id);

      const db = await import("./db").then(m => m);
      const { getDb } = db;
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const { leads, simulations, opportunities } = await import("../drizzle/schema");
      const { sql, count, eq, and, gte, desc } = await import("drizzle-orm");

      // Períodos de tempo
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // 1. Total de leads
      const totalLeadsResult = await database.select({ count: count() }).from(leads);
      const totalLeads = totalLeadsResult[0]?.count || 0;

      // 2. Leads por período
      const leadsHojeResult = await database.select({ count: count() }).from(leads).where(gte(leads.createdAt, hoje));
      const leadsHoje = leadsHojeResult[0]?.count || 0;

      const leadsSemanaResult = await database.select({ count: count() }).from(leads).where(gte(leads.createdAt, inicioSemana));
      const leadsSemana = leadsSemanaResult[0]?.count || 0;

      const leadsMesResult = await database.select({ count: count() }).from(leads).where(gte(leads.createdAt, inicioMes));
      const leadsMes = leadsMesResult[0]?.count || 0;

      // 3. Leads com/sem simulações
      const allLeads = await database.select({ id: leads.id }).from(leads);
      const leadsComSimulacoesSet = new Set();
      const allSimulations = await database.select({ leadId: simulations.leadId }).from(simulations);
      allSimulations.forEach(s => { if (s.leadId) leadsComSimulacoesSet.add(s.leadId); });
      const leadsComSimulacoes = leadsComSimulacoesSet.size;
      const leadsSemSimulacoes = totalLeads - leadsComSimulacoes;

      // 4. Leads com/sem oportunidades
      const leadsComOportunidadesSet = new Set();
      const allOpportunities = await database.select({ leadId: opportunities.leadId }).from(opportunities);
      allOpportunities.forEach(o => leadsComOportunidadesSet.add(o.leadId));
      const leadsComOportunidades = leadsComOportunidadesSet.size;
      const leadsSemOportunidades = totalLeads - leadsComOportunidades;

      // 5. Por origem
      const porOrigemResult = await database
        .select({ canalOrigem: leads.canalOrigem, total: count() })
        .from(leads)
        .groupBy(leads.canalOrigem);
      const porOrigem = porOrigemResult.map(r => ({ canalOrigem: r.canalOrigem || "desconhecido", total: r.total }));

      // 6. Por tipo (investidor vs emissor)
      const simulacoesPorLead = await database.select().from(simulations);
      const leadsPorTipo = new Map<number, Set<string>>();
      simulacoesPorLead.forEach(s => {
        if (!s.leadId) return;
        if (!leadsPorTipo.has(s.leadId)) leadsPorTipo.set(s.leadId, new Set());
        leadsPorTipo.get(s.leadId)!.add(s.tipoSimulacao);
      });
      let investidorCount = 0;
      let emissorCount = 0;
      leadsPorTipo.forEach(tipos => {
        if (tipos.has("investimento")) investidorCount++;
        if (tipos.has("financiamento")) emissorCount++;
      });
      const porTipo = { investidor: investidorCount, emissor: emissorCount };

      // 7. TOP 10 por intenção (tokenizaScore)
      const topIntencaoRaw = await database
        .select({
          leadId: opportunities.leadId,
          tokenizaScore: opportunities.tokenizaScore,
          simulationId: opportunities.simulationId,
        })
        .from(opportunities)
        .orderBy(desc(opportunities.tokenizaScore))
        .limit(10);

      const topIntencao = await Promise.all(
        topIntencaoRaw.map(async (opp) => {
          const lead = await db.getLeadById(opp.leadId);
          const simulation = await db.getSimulationById(opp.simulationId);
          return {
            leadId: opp.leadId,
            nome: lead?.nomeCompleto || "Desconhecido",
            whatsapp: lead?.whatsapp || null,
            email: lead?.email || null,
            tokenizaScore: opp.tokenizaScore,
            ultimaSimulacaoId: opp.simulationId,
            tipoSimulacao: simulation?.tipoSimulacao || "investimento",
          };
        })
      );

      // 8. Dados faltantes
      const semWhatsappResult = await database.select({ count: count() }).from(leads).where(sql`${leads.whatsapp} IS NULL OR ${leads.whatsapp} = ''`);
      const semWhatsapp = semWhatsappResult[0]?.count || 0;

      const semEmailResult = await database.select({ count: count() }).from(leads).where(sql`${leads.email} IS NULL OR ${leads.email} = ''`);
      const semEmail = semEmailResult[0]?.count || 0;

      const semCidadeOuEstadoResult = await database.select({ count: count() }).from(leads).where(sql`${leads.cidade} IS NULL OR ${leads.estado} IS NULL`);
      const semCidadeOuEstado = semCidadeOuEstadoResult[0]?.count || 0;

      const dadosFaltantes = { semWhatsapp, semEmail, semCidadeOuEstado };

      return {
        totalLeads,
        leadsHoje,
        leadsSemana,
        leadsMes,
        leadsComSimulacoes,
        leadsSemSimulacoes,
        leadsComOportunidades,
        leadsSemOportunidades,
        porOrigem,
        porTipo,
        topIntencao,
        dadosFaltantes,
      };
    }),
  }),

  // Router de ofertas Tokeniza
  offers: router({
    // Listar ofertas ativas da API da Tokeniza (fonte única de verdade)
    listActiveFromTokeniza: publicProcedure
      .input(
        z.object({
          forceRefresh: z.boolean().optional().default(false),
        })
      )
      .query(async ({ input, ctx }) => {
        // Se forceRefresh = true, sincronizar com a API antes de retornar
        if (input.forceRefresh) {
          console.log("🔄 Forçando sincronização com API da Tokeniza...");
          await db.syncOffersFromTokenizaApi();
        }

        // Buscar ofertas ativas do banco
        const activeOffers = await db.getActiveOffers();
        
        // Ordenar por dataEncerramento (próxima primeiro) e valorMinimo (crescente)
        const sorted = activeOffers.sort((a, b) => {
          // Ofertas sem dataEncerramento vão pro final
          if (!a.dataEncerramento && !b.dataEncerramento) {
            return (a.valorMinimo || 0) - (b.valorMinimo || 0);
          }
          if (!a.dataEncerramento) return 1;
          if (!b.dataEncerramento) return -1;
          
          // Ordenar por data de encerramento
          const dateA = new Date(a.dataEncerramento).getTime();
          const dateB = new Date(b.dataEncerramento).getTime();
          if (dateA !== dateB) return dateA - dateB;
          
          // Se datas iguais, ordenar por valor mínimo
          return (a.valorMinimo || 0) - (b.valorMinimo || 0);
        });

        // Retornar apenas campos necessários para o modal
        return sorted.map((o) => ({
          id: o.id,
          nome: o.nome,
          descricao: o.descricao,
          valorMinimo: o.valorMinimo,
          valorTotalOferta: o.valorTotalOferta,
          prazoMeses: o.prazoMeses,
          taxaAnual: o.taxaAnual,
          tipoGarantia: o.tipoGarantia,
          tipoAtivo: o.tipoAtivo,
          dataEncerramento: o.dataEncerramento,
        }));
      }),

    // Listar ofertas ativas (para seleção no formulário) - DEPRECATED, usar listActiveFromTokeniza
    listActive: publicProcedure
      .query(async () => {
        const activeOffers = await db.getActiveOffers();
        
        // Ordenar por dataEncerramento (próxima primeiro) e valorMinimo (crescente)
        return activeOffers.sort((a, b) => {
          // Ofertas sem dataEncerramento vão pro final
          if (!a.dataEncerramento && !b.dataEncerramento) {
            return (a.valorMinimo || 0) - (b.valorMinimo || 0);
          }
          if (!a.dataEncerramento) return 1;
          if (!b.dataEncerramento) return -1;
          
          // Ordenar por data de encerramento
          const dateA = new Date(a.dataEncerramento).getTime();
          const dateB = new Date(b.dataEncerramento).getTime();
          if (dateA !== dateB) return dateA - dateB;
          
          // Se datas iguais, ordenar por valor mínimo
          return (a.valorMinimo || 0) - (b.valorMinimo || 0);
        });
      }),
    
    // Buscar ofertas compatíveis para uma simulação
    matchForSimulation: protectedProcedure
      .input(
        z.object({
          simulationId: z.number().int().positive(),
          maxResults: z.number().int().positive().max(20).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const simulation = await db.getSimulationById(input.simulationId);
        if (!simulation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Simula\u00e7\u00e3o n\u00e3o encontrada",
          });
        }

        const activeOffers = await db.getActiveOffers();
        const { matchOffersForSimulation } = await import("./offerMatchingEngine");

        const matches = matchOffersForSimulation({
          simulation,
          offers: activeOffers,
          maxResults: input.maxResults ?? 5,
        });

        return matches;
      }),
  }),

  dashboardSimulations: router({
    getOverview: adminProcedure
      .input(
        z.object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
          tipoSimulacao: z.enum(["investimento", "financiamento"]).optional(),
          origemSimulacao: z.enum(["manual", "oferta_tokeniza"]).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        console.log("📊 DashboardSimulations.getOverview", {
          from: input.from,
          to: input.to,
          tipoSimulacao: input.tipoSimulacao,
          origemSimulacao: input.origemSimulacao,
        });

        // Implementação das métricas (será feita na próxima fase)
        return {
          filtrosAplicados: {
            from: input.from,
            to: input.to,
            tipoSimulacao: input.tipoSimulacao,
            origemSimulacao: input.origemSimulacao,
          },
          kpisGerais: {
            totalSimulacoes: 0,
            totalInvestimento: 0,
            totalFinanciamento: 0,
            totalPorOrigem: {
              manual: 0,
              oferta_tokeniza: 0,
            },
            simulacoesComOfertaSelecionada: 0,
            simulacoesComOportunidade: 0,
            taxaConversaoSimulacaoParaOportunidade: 0,
            mediaTokenizaScore: null,
          },
          distribuicaoPorValor: [],
          distribuicaoPorScoreIntencao: [],
          distribuicaoPorSistemaAmortizacao: [],
          distribuicaoPorOrigem: [],
          timelineSimulacoesDiarias: [],
          clustersComportamento: {
            highIntentHighTicket: {
              descricao: "Alta intenção + Alto ticket (≥R$ 10k)",
              quantidade: 0,
            },
            highIntentLowTicket: {
              descricao: "Alta intenção + Baixo ticket (<R$ 10k)",
              quantidade: 0,
            },
            highTicketLowIntent: {
              descricao: "Alto ticket (≥R$ 30k) + Baixa intenção",
              quantidade: 0,
            },
            multiVersion: {
              descricao: "Re-simulações (versões múltiplas)",
              quantidade: 0,
            },
          },
          topSimulacoesAltaIntencao: [],
          simulacoesRiscoPerdaUrgencia: [],
        };
      }),
  }),

  // Router de propostas (apenas admin)
  proposals: router({
    // Criar nova proposta
    create: adminProcedure
      .input(
        z.object({
          dataMesAno: z.string().min(1),
          empresa: z.string().min(1),
          cnpj: z.string().min(1),
          endereco: z.string().min(1),
          dataApresentacao: z.string().min(1),
          valorCaptacao: z.number().int().positive(),
          nomeProjeto: z.string().min(1),
          lastroAtivo: z.string().min(1),
          visaoGeral: z.string().min(1),
          captacaoInicial: z.string().min(1),
          destinacaoRecursos: z.string().min(1),
          prazoExecucao: z.string().min(1),
          prazoCaptacao: z.string().min(1),
          valorFixoInicial: z.number().int().positive(),
          taxaSucesso: z.number().int().positive(),
          valorLiquidoTotal: z.number().int().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        console.log("📝 Criando proposta para empresa:", input.empresa);
        
        const proposalId = await db.createProposal({
          createdByUserId: ctx.user.id,
          ...input,
          status: "rascunho",
        });
        
        console.log("✅ Proposta criada com ID:", proposalId);
        return { id: proposalId };
      }),
    
    // Listar todas as propostas (admin)
    list: adminProcedure.query(async ({ ctx }) => {
      console.log("📊 Listando propostas para admin:", ctx.user.email);
      return await db.getAllProposals();
    }),
    
    // Buscar proposta por ID
    getById: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const proposal = await db.getProposalById(input.id);
        if (!proposal) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Proposta não encontrada" });
        }
        return proposal;
      }),
    
    // Atualizar proposta
    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          pdfUrl: z.string().optional(),
          pdfKey: z.string().optional(),
          status: z.enum(["rascunho", "gerado", "enviado"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateProposal(input.id, {
          pdfUrl: input.pdfUrl,
          pdfKey: input.pdfKey,
          status: input.status,
        });
        
        console.log("✅ Proposta atualizada:", input.id);
        return { success: true };
      }),
    
    // Deletar proposta
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteProposal(input.id);
        console.log("🗑️ Proposta deletada:", input.id);
        return { success: true };
      }),
  }),
});


export type AppRouter = typeof appRouter;
