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
          // Dados da oferta
          descricaoOferta: z.string().optional(),
          valorTotalOferta: z.number().positive(),
          valorInvestido: z.number().positive(),
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
          amortizacaoMetodo: z.enum(["PRICE", "SAC", "bullet"]).default("PRICE"),
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
        // Validações
        if (input.valorInvestido > input.valorTotalOferta) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Valor investido não pode ser maior que o valor total da oferta",
          });
        }

        if (input.periodicidadeAmortizacao === "no_fim" && input.amortizacaoMetodo !== "bullet") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Quando periodicidade de amortização é 'no_fim', o método deve ser 'bullet'",
          });
        }

        // Prepara input para cálculo
        const calculoInput: SimulationInput = {
          valorTotalOferta: input.valorTotalOferta,
          valorInvestido: input.valorInvestido,
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
          amortizacaoMetodo: input.amortizacaoMetodo as any,
          pagamentoMinimoValor: input.pagamentoMinimoValor,
          taxaSetupFixaBrl: input.taxaSetupFixaBrl || 0,
          feeSucessoPercentSobreCaptacao: input.feeSucessoPercentSobreCaptacao || 0,
          feeManutencaoMensalBrl: input.feeManutencaoMensalBrl || 0,
          taxaTransacaoPercent: input.taxaTransacaoPercent || 0,
          aliquotaImpostoRendaPercent: input.aliquotaImpostoRendaPercent || 0,
        };

        // Calcula simulação
        const resultado = calcularSimulacao(calculoInput);

        // Salva simulação no banco
        const simulationId = await db.createSimulation({
          userId: ctx.user.id,
          descricaoOferta: input.descricaoOferta || null,
          valorTotalOferta: input.valorTotalOferta,
          valorInvestido: input.valorInvestido,
          dataEncerramentoOferta: input.dataEncerramentoOferta,
          prazoMeses: input.prazoMeses,
          taxaJurosAa: input.taxaJurosAa,
          convencaoCalendario: input.convencaoCalendario,
          tipoCapitalizacao: input.tipoCapitalizacao,
          periodicidadeJuros: input.periodicidadeJuros,
          periodicidadeAmortizacao: input.periodicidadeAmortizacao,
          carenciaJurosMeses: input.carenciaJurosMeses,
          carenciaPrincipalMeses: input.carenciaPrincipalMeses,
          capitalizarJurosEmCarencia: input.capitalizarJurosEmCarencia ? 1 : 0,
          amortizacaoMetodo: input.amortizacaoMetodo,
          pagamentoMinimoValor: input.pagamentoMinimoValor || null,
          taxaSetupFixaBrl: input.taxaSetupFixaBrl || 0,
          feeSucessoPercentSobreCaptacao: input.feeSucessoPercentSobreCaptacao || 0,
          feeManutencaoMensalBrl: input.feeManutencaoMensalBrl || 0,
          taxaTransacaoPercent: input.taxaTransacaoPercent || 0,
          aliquotaImpostoRendaPercent: input.aliquotaImpostoRendaPercent || 0,
          identificadorInvestidor: input.identificadorInvestidor || null,
          moedaReferencia: input.moedaReferencia,
          totalJurosPagos: resultado.resumo.totalJurosPagos,
          totalAmortizado: resultado.resumo.totalAmortizado,
          totalRecebido: resultado.resumo.totalRecebido,
          tirMensal: resultado.resumo.tirMensal || null,
          tirAnual: resultado.resumo.tirAnual || null,
        });

        // Salva cronograma
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
        }));

        await db.createCronogramas(cronogramaItems);

        return {
          simulationId,
          resumo: resultado.resumo,
        };
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
});


export type AppRouter = typeof appRouter;
