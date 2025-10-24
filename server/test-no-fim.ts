import { calcularSimulacao, SimulationInput } from "./calculator";

const input: SimulationInput = {
  valorTotalOferta: 50000000,
  valorInvestido: 500000, // R$ 5.000
  dataEncerramentoOferta: "2025-02-24",
  prazoMeses: 12,
  taxaJurosAa: 2500, // ~25% a.a.
  convencaoCalendario: "civil/365",
  tipoCapitalizacao: "simples",
  periodicidadeJuros: "no_fim", // Juros pagos no fim
  periodicidadeAmortizacao: "no_fim", // Amortização no fim
  carenciaJurosMeses: 0, // Será ajustado automaticamente
  carenciaPrincipalMeses: 0, // Será ajustado automaticamente
  capitalizarJurosEmCarencia: true,
  amortizacaoMetodo: "bullet",
  taxaSetupFixaBrl: 0,
  feeSucessoPercentSobreCaptacao: 0,
  feeManutencaoMensalBrl: 0,
  taxaTransacaoPercent: 0,
  aliquotaImpostoRendaPercent: 0,
};

const resultado = calcularSimulacao(input);

console.log("=== TESTE PERIODICIDADE NO FIM ===\n");
console.log("Investimento: R$ 5.000,00");
console.log("Periodicidade: Juros e Amortização no fim");
console.log("Capitalização: SIMPLES\n");

resultado.cronograma.forEach((mes) => {
  console.log(`Mês ${mes.mes}:`);
  console.log(`  Saldo Inicial:  R$ ${(mes.saldoInicial / 100).toFixed(2)}`);
  console.log(`  Juros:          R$ ${(mes.juros / 100).toFixed(2)}`);
  console.log(`  Amortização:    R$ ${(mes.amortizacao / 100).toFixed(2)}`);
  console.log(`  Parcela:        R$ ${(mes.parcela / 100).toFixed(2)}`);
  console.log(`  Saldo Final:    R$ ${(mes.saldoFinal / 100).toFixed(2)}`);
  console.log(`  Observações:    ${mes.observacoes}\n`);
});

console.log("\n=== RESUMO ===");
console.log(`Total de juros: R$ ${(resultado.resumo.totalJurosPagos / 100).toFixed(2)}`);
console.log(`Total recebido: R$ ${(resultado.resumo.totalRecebido / 100).toFixed(2)}`);
