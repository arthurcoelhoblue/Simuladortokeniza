/**
 * Teste específico para validar carências conforme exemplo do usuário
 * Investimento: R$ 100.000
 * Taxa: 2% ao mês (simples para facilitar validação)
 * 3 meses de carência de juros (com capitalização)
 * 3 meses de carência de principal
 * Prazo total: 12 meses
 */

import { calcularSimulacao, SimulationInput } from "./calculator";

const input: SimulationInput = {
  valorTotalOferta: 50000000, // R$ 500.000
  valorInvestido: 10000000, // R$ 100.000
  dataInicio: "2025-01-01",
  prazoMeses: 12,
  taxaJurosAa: 2682, // ~26.82% a.a. = 2% a.m. composto
  convencaoCalendario: "civil/365",
  tipoCapitalizacao: "composta",
  periodicidadeJuros: "mensal",
  periodicidadeAmortizacao: "mensal",
  carenciaJurosMeses: 3,
  carenciaPrincipalMeses: 6, // 3 meses de carência de juros + 3 de principal
  capitalizarJurosEmCarencia: true,
  amortizacaoMetodo: "PRICE",
  taxaSetupFixaBrl: 0,
  feeSucessoPercentSobreCaptacao: 0,
  feeManutencaoMensalBrl: 0,
  taxaTransacaoPercent: 0,
  aliquotaImpostoRendaPercent: 0,
};

console.log("=== TESTE DE CARÊNCIAS ===\n");
console.log("Investimento inicial: R$ 100.000,00");
console.log("Taxa: ~2% ao mês");
console.log("Carência de juros: 3 meses (com capitalização)");
console.log("Carência de principal: 6 meses (3 de juros + 3 de principal)");
console.log("Prazo total: 12 meses\n");

const resultado = calcularSimulacao(input);

console.log("=== CRONOGRAMA MÊS A MÊS ===\n");

resultado.cronograma.forEach((mes) => {
  console.log(`\nMês ${mes.mes} (${mes.dataParcela}):`);
  console.log(`  Saldo Inicial:  R$ ${(mes.saldoInicial / 100).toFixed(2)}`);
  console.log(`  Juros:          R$ ${(mes.juros / 100).toFixed(2)}`);
  console.log(`  Amortização:    R$ ${(mes.amortizacao / 100).toFixed(2)}`);
  console.log(`  Parcela:        R$ ${(mes.parcela / 100).toFixed(2)}`);
  console.log(`  Saldo Final:    R$ ${(mes.saldoFinal / 100).toFixed(2)}`);
  if (mes.observacoes) {
    console.log(`  Observações:    ${mes.observacoes}`);
  }
});

console.log("\n=== RESUMO ===\n");
console.log(`Total de Juros Pagos: R$ ${(resultado.resumo.totalJurosPagos / 100).toFixed(2)}`);
console.log(`Total Amortizado:     R$ ${(resultado.resumo.totalAmortizado / 100).toFixed(2)}`);
console.log(`Total Recebido:       R$ ${(resultado.resumo.totalRecebido / 100).toFixed(2)}`);
console.log(`TIR Mensal:           ${(resultado.resumo.tirMensal! / 100).toFixed(2)}%`);
console.log(`TIR Anual:            ${(resultado.resumo.tirAnual! / 100).toFixed(2)}%`);

console.log("\n=== VALIDAÇÕES ===\n");

// Validação 1: Meses 1-3 devem ter saldo crescente (capitalização)
const saldo1 = resultado.cronograma[0].saldoFinal;
const saldo2 = resultado.cronograma[1].saldoFinal;
const saldo3 = resultado.cronograma[2].saldoFinal;

console.log(`✓ Mês 1-3 (carência de juros com capitalização):`);
console.log(`  Saldo cresce: ${saldo1 < saldo2 && saldo2 < saldo3 ? "SIM ✓" : "NÃO ✗"}`);
console.log(`  Saldo mês 1: R$ ${(saldo1 / 100).toFixed(2)}`);
console.log(`  Saldo mês 2: R$ ${(saldo2 / 100).toFixed(2)}`);
console.log(`  Saldo mês 3: R$ ${(saldo3 / 100).toFixed(2)}`);

// Validação 2: Meses 4-6 devem ter saldo constante (carência de principal)
const saldo4 = resultado.cronograma[3].saldoFinal;
const saldo5 = resultado.cronograma[4].saldoFinal;
const saldo6 = resultado.cronograma[5].saldoFinal;

console.log(`\n✓ Mês 4-6 (carência de principal, paga juros):`);
console.log(`  Saldo constante: ${saldo4 === saldo5 && saldo5 === saldo6 ? "SIM ✓" : "NÃO ✗"}`);
console.log(`  Saldo mês 4: R$ ${(saldo4 / 100).toFixed(2)}`);
console.log(`  Saldo mês 5: R$ ${(saldo5 / 100).toFixed(2)}`);
console.log(`  Saldo mês 6: R$ ${(saldo6 / 100).toFixed(2)}`);

// Validação 3: Meses 7-12 devem ter amortização
const temAmortizacao = resultado.cronograma.slice(6).every(m => m.amortizacao > 0);
console.log(`\n✓ Mês 7-12 (pagamento normal):`);
console.log(`  Tem amortização: ${temAmortizacao ? "SIM ✓" : "NÃO ✗"}`);

// Validação 4: Saldo final deve ser zero
const saldoFinal = resultado.cronograma[11].saldoFinal;
console.log(`\n✓ Saldo final:`);
console.log(`  Zerado: ${saldoFinal === 0 ? "SIM ✓" : "NÃO ✗"} (R$ ${(saldoFinal / 100).toFixed(2)})`);

