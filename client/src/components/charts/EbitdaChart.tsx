import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EbitdaChartProps {
  data: Array<{
    mes: number;
    receitaMensal: number;
    despesaTotal: number;
  }>;
}

export default function EbitdaChart({ data }: EbitdaChartProps) {
  const chartData = data.map(item => {
    const receita = item.receitaMensal / 100;
    const despesa = item.despesaTotal / 100;
    const ebitda = receita - despesa;
    const margemEbitda = receita > 0 ? (ebitda / receita) * 100 : 0;
    
    return {
      mes: `M${item.mes}`,
      ebitda: ebitda,
      margem: margemEbitda,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="mes" 
          stroke="#888"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#888"
          tickFormatter={formatCurrency}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => {
            if (name === 'Margem EBITDA') {
              return `${value.toFixed(1)}%`;
            }
            return formatCurrency(value);
          }}
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
        <Bar dataKey="ebitda" fill="#10b981" name="EBITDA Mensal" />
      </BarChart>
    </ResponsiveContainer>
  );
}
