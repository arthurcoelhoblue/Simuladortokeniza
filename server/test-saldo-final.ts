import { calcularSimulacao, SimulationInput } from "./calculator";

const input: SimulationInput = {
  valorTotalOferta: 50000000,
  valorInvestido: 500000, // R$ 5.000
  dataEncerramentoOferta: "2025-01-01",
  prazoMeses: 12,
  taxaJurosAa: 2500, // ~25% a.a. para dar ~2% a.m.
  convencaoCalendario: "civil/365",
  tipoCapitalizacao: "simples",
  periodicidadeJuros: "mensal",
  periodicidadeAmortizacao: "no_fim",
  carenciaJurosMeses: 11, // Juros capitalizados nos primeiros 11 meses
  carenciaPrincipalMeses: 11,
  capitalizarJurosEmCarencia: true,
  amortizacaoMetodo: "bullet",
  taxaSetupFixaBrl: 0,
  feeSucessoPercentSobreCaptacao: 0,
  feeManutencaoMensalBrl: 0,
  taxaTransacaoPercent: 0,
  aliquotaImpostoRendaPercent: 0,
};

const resultado = calcularSimulacao(input);

console.log("=== TESTE SALDO FINAL COM CARÊNCIA ===\n");
console.log("Investimento: R$ 5.000,00");
console.log("Carência de juros: 11 meses (capitalizados)");
console.log("Capitalização: SIMPLES (juros fixos sobre principal)");
console.log("Método: Bullet\n");

resultado.cronograma.slice(0, 5).forEach((mes) => {
  console.log(`Mês ${mes.mes}:`);
  console.log(`  Saldo Inicial:  R$ ${(mes.saldoInicial / 100).toFixed(2)}`);
  console.log(`  Juros:          R$ ${(mes.juros / 100).toFixed(2)}`);
  console.log(`  Amortização:    R$ ${(mes.amortizacao / 100).toFixed(2)}`);
  console.log(`  Saldo Final:    R$ ${(mes.saldoFinal / 100).toFixed(2)}`);
  console.log(`  Esperado:       R$ ${((mes.saldoInicial + mes.juros - mes.amortizacao) / 100).toFixed(2)}`);
  console.log(`  Observações:    ${mes.observacoes}\n`);
});

console.log("\n=== VALIDAÇÃO ===");
const mes1 = resultado.cronograma[0];
const esperado1 = mes1.saldoInicial + mes1.juros;
console.log(`Mês 1: Saldo Final = ${mes1.saldoFinal}, Esperado = ${esperado1}, OK? ${mes1.saldoFinal === esperado1 ? "✓" : "✗"}`);

const mes2 = resultado.cronograma[1];
const esperado2 = mes2.saldoInicial + mes2.juros;
console.log(`Mês 2: Saldo Final = ${mes2.saldoFinal}, Esperado = ${esperado2}, OK? ${mes2.saldoFinal === esperado2 ? "✓" : "✗"}`);

