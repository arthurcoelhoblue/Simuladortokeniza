import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface FluxoCaixaChartProps {
  data: Array<{
    mes: number;
    saldoAcumulado: number;
    receitaMensal: number;
    despesaTotal: number;
  }>;
}

export default function FluxoCaixaChart({ data }: FluxoCaixaChartProps) {
  const chartData = data.map(item => ({
    mes: `Mês ${item.mes}`,
    saldo: item.saldoAcumulado / 100, // converter centavos para reais
    receita: item.receitaMensal / 100,
    despesa: -item.despesaTotal / 100,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="mes" 
          stroke="#888"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          stroke="#888"
          tickFormatter={formatCurrency}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
        <Line 
          type="monotone" 
          dataKey="saldo" 
          stroke="#10b981" 
          strokeWidth={3}
          name="Saldo Acumulado"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="receita" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Receita Mensal"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="despesa" 
          stroke="#ef4444" 
          strokeWidth={2}
          name="Despesa Mensal"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
