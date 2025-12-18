import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ClientesChartProps {
  data: Array<{
    mes: number;
    clientes: number;
  }>;
  capacidadeMaxima: number;
  pontoEquilibrio: number;
}

export default function ClientesChart({ data, capacidadeMaxima, pontoEquilibrio }: ClientesChartProps) {
  const chartData = data.map(item => ({
    mes: `Mês ${item.mes}`,
    clientes: item.clientes,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="mes" 
          stroke="#888"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          stroke="#888"
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
        />
        <ReferenceLine 
          y={pontoEquilibrio} 
          stroke="#f59e0b" 
          strokeDasharray="5 5"
          label={{ value: `PE: ${pontoEquilibrio}`, fill: '#f59e0b', fontSize: 12 }}
        />
        <ReferenceLine 
          y={capacidadeMaxima} 
          stroke="#ef4444" 
          strokeDasharray="5 5"
          label={{ value: `Cap: ${capacidadeMaxima}`, fill: '#ef4444', fontSize: 12 }}
        />
        <Area 
          type="monotone" 
          dataKey="clientes" 
          stroke="#3b82f6" 
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorClientes)"
          name="Clientes"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
