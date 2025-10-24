// Arquivo temporário para refatoração
// TODO: Substituir calculator.ts por esta versão simplificada

// A lógica simplificada de amortização:
// 1. Linear: divide o principal igualmente pelos meses (após carência)
// 2. Bullet: paga tudo no último mês

// Exemplo de código simplificado:
/*
  // Determina número de parcelas para amortização
  const mesesComAmortizacao = input.prazoMeses - carenciaPrincipalEfetiva;
  
  // Calcula amortização linear (constante por mês)
  let amortizacaoLinear = 0;
  if (input.amortizacaoMetodo === "linear" && mesesComAmortizacao > 0) {
    const saldoTotal = principal + jurosAcumulados;
    amortizacaoLinear = arredondar(saldoTotal / mesesComAmortizacao);
  }
  
  // No loop mensal:
  if (!emCarenciaPrincipal) {
    const saldoTotal = principal + jurosAcumulados;
    
    if (input.amortizacaoMetodo === "linear") {
      amortizacao = amortizacaoLinear;
      
      // Ajusta última parcela para zerar saldo
      if (mes === input.prazoMeses) {
        amortizacao = saldoTotal;
      }
    } else if (input.amortizacaoMetodo === "bullet") {
      if (mes === input.prazoMeses) {
        amortizacao = saldoTotal;
        observacoes.push("Amortização bullet (total no vencimento)");
      }
    }
  }
*/

