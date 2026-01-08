import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

interface ScenarioSeries {
  scenario: "Base" | "Conservador" | "Otimista";
  points: { mes: number; ebitda: number }[];
  paybackMeses?: number | null;
}

interface MultiScenarioEbitdaChartProps {
  series: ScenarioSeries[];
}

export default function MultiScenarioEbitdaChart({ series }: MultiScenarioEbitdaChartProps) {
  // Transformar séries em formato Recharts (um objeto por mês com todas as séries)
  const maxMeses = Math.max(...series.map(s => s.points.length));
  
  const chartData = Array.from({ length: maxMeses }, (_, idx) => {
    const mes = idx + 1;
    const dataPoint: Record<string, number | string> = { mes: `M${mes}` };
    
    series.forEach(s => {
      const point = s.points.find(p => p.mes === mes);
      if (point) {
        dataPoint[s.scenario] = point.ebitda / 100; // Converter centavos para reais
      }
    });
    
    return dataPoint;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Cores por cenário
  const scenarioColors: Record<string, string> = {
    Base: "#3b82f6", // Azul
    Conservador: "#ef4444", // Vermelho
    Otimista: "#10b981", // Verde
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="mes" 
            stroke="#888"
            tick={{ fontSize: 12 }}
            interval={5} // Mostrar a cada 5 meses para não poluir
          />
          <YAxis 
            stroke="#888"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          
          {/* Linhas por cenário */}
          {series.map(s => (
            <Line 
              key={s.scenario}
              type="monotone"
              dataKey={s.scenario}
              stroke={scenarioColors[s.scenario]}
              strokeWidth={2}
              dot={false}
              name={`EBITDA ${s.scenario}`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Marcadores de Payback */}
      <div className="flex flex-wrap gap-4 text-sm">
        {series.map(s => {
          if (!s.paybackMeses || s.paybackMeses <= 0) return null;
          
          return (
            <div key={s.scenario} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: scenarioColors[s.scenario] }}
              />
              <span className="text-muted-foreground">
                Payback {s.scenario}: <span className="font-semibold text-foreground">{s.paybackMeses} meses</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
