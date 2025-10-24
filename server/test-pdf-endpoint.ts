import { calcularSimulacao, SimulationInput } from "./calculator";
import { generatePDFHTML } from "./pdfExport";

const input: SimulationInput = {
  valorTotalOferta: 50000000,
  valorInvestido: 500000,
  dataEncerramentoOferta: "2025-02-24",
  prazoMeses: 12,
  taxaJurosAa: 2500,
  convencaoCalendario: "civil/365",
  tipoCapitalizacao: "simples",
  periodicidadeJuros: "no_fim",
  periodicidadeAmortizacao: "no_fim",
  carenciaJurosMeses: 0,
  carenciaPrincipalMeses: 0,
  capitalizarJurosEmCarencia: true,
  amortizacaoMetodo: "bullet",
  taxaSetupFixaBrl: 0,
  feeSucessoPercentSobreCaptacao: 0,
  feeManutencaoMensalBrl: 0,
  taxaTransacaoPercent: 0,
  aliquotaImpostoRendaPercent: 0,
};

const resultado = calcularSimulacao(input);

const simulationData = {
  id: 1,
  descricaoOferta: "Teste de exportação PDF",
  valorTotalOferta: input.valorTotalOferta,
  valorInvestido: input.valorInvestido,
  dataEncerramentoOferta: input.dataEncerramentoOferta,
  prazoMeses: input.prazoMeses,
  taxaJurosAa: input.taxaJurosAa,
  tipoCapitalizacao: input.tipoCapitalizacao,
  amortizacaoMetodo: input.amortizacaoMetodo,
  carenciaJurosMeses: input.carenciaJurosMeses,
  carenciaPrincipalMeses: input.carenciaPrincipalMeses,
  totalJurosPagos: resultado.resumo.totalJurosPagos,
  totalAmortizado: resultado.resumo.totalAmortizado,
  totalRecebido: resultado.resumo.totalRecebido,
  tirMensal: resultado.resumo.tirMensal,
  tirAnual: resultado.resumo.tirAnual,
};

const cronogramaComNull = resultado.cronograma.map(c => ({
  ...c,
  observacoes: c.observacoes || null
}));

const html = generatePDFHTML(simulationData, cronogramaComNull);

console.log("HTML gerado com sucesso!");
console.log("Tamanho:", html.length, "caracteres");
console.log("Primeiros 200 caracteres:", html.substring(0, 200));
