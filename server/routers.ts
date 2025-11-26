import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { calcularSimulacao, SimulationInput } from "./calculator";
import * as db from "./db";
import { generatePDFHTML } from "./pdfExport";

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

        // 3. Calcular ticketEstimado com base em tipoSimulacao
        let ticketEstimado: number;
        if (simulation.tipoSimulacao === "investimento") {
          ticketEstimado = simulation.valorAporte || 0;
        } else {
          ticketEstimado = simulation.valorDesejado || 0;
        }

        console.log("🎯 Criando oportunidade a partir da simulação", input.simulationId, "para o lead", leadId);

        // 4. Criar oportunidade
        const opportunityId = await db.createOpportunity({
          leadId,
          simulationId: input.simulationId,
          ownerUserId: input.ownerUserId || null,
          status: "novo",
          probabilidade: 0,
          ticketEstimado,
          nextAction: input.nextAction || null,
          nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null,
        });

        console.log("✅ Oportunidade criada com ID:", opportunityId, "ticketEstimado:", ticketEstimado);

        // 5. Integração com Pipedrive
        try {
          // Buscar lead completo
          const lead = await db.getLeadById(leadId);
          if (!lead) {
            throw new Error("Lead não encontrado");
          }

          // Buscar oportunidade recém-criada
          const opportunity = await db.getOpportunityById(opportunityId);
          if (!opportunity) {
            throw new Error("Oportunidade não encontrada");
          }

          // Criar/buscar pessoa no Pipedrive
          const { findOrCreatePipedrivePersonForLead, createPipedriveDealForOpportunity } = await import("./pipedriveClient");
          const personId = await findOrCreatePipedrivePersonForLead(lead);

          if (personId) {
            // Criar deal no Pipedrive
            const dealId = await createPipedriveDealForOpportunity({
              lead,
              simulation,
              opportunity,
              personId,
            });

            if (dealId) {
              // Atualizar oportunidade com pipedriveDealId
              await db.updateOpportunity(opportunityId, {
                pipedriveDealId: dealId.toString(),
              });
            }
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
  }),
});


export type AppRouter = typeof appRouter;
