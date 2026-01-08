import { describe, it, expect } from 'vitest';

/**
 * Testes para validar parser de cenários e montagem de séries (Patch 9B)
 * 
 * Não renderiza o chart (evita complexidade de mock Recharts)
 * Testa apenas a lógica de transformação de dados
 */

type ResultadoCenario = {
  scenario: "Base" | "Conservador" | "Otimista";
  fluxoCaixa: any[];
  indicadores: any;
  config?: any;
};

// Função de parser (copiada de ViabilidadeDetalhes.tsx)
function parseCenarios(analysis: any): ResultadoCenario[] {
  const rawFluxo = typeof analysis.fluxoCaixa === 'string' 
    ? JSON.parse(analysis.fluxoCaixa) 
    : analysis.fluxoCaixa;

  // Novo formato: array de resultados com .scenario
  if (Array.isArray(rawFluxo) && rawFluxo[0]?.scenario) {
    return rawFluxo as ResultadoCenario[];
  }

  // Legado: fluxo simples
  const rawIndicadores = analysis.indicadores 
    ? (typeof analysis.indicadores === 'string' ? JSON.parse(analysis.indicadores) : analysis.indicadores)
    : null;

  return [{
    scenario: "Base",
    fluxoCaixa: rawFluxo,
    indicadores: rawIndicadores,
  }];
}

// Função de montagem de séries (lógica de ViabilidadeDetalhes.tsx)
function buildSeries(cenarios: ResultadoCenario[]) {
  return cenarios.map(c => ({
    scenario: c.scenario,
    paybackMeses: c.indicadores?.payback ?? null,
    points: c.fluxoCaixa.map((row: any, idx: number) => ({
      mes: idx + 1,
      ebitda: row.ebitda ?? 0,
    })),
  }));
}

describe('Parser de Cenários (Patch 9B)', () => {
  it('deve parsear 3 cenários quando JSON tem .scenario', () => {
    const analysis = {
      fluxoCaixa: JSON.stringify([
        {
          scenario: "Base",
          fluxoCaixa: [{ mes: 1, ebitda: 10000 }, { mes: 2, ebitda: 12000 }],
          indicadores: { payback: 24 },
        },
        {
          scenario: "Conservador",
          fluxoCaixa: [{ mes: 1, ebitda: 8000 }, { mes: 2, ebitda: 9000 }],
          indicadores: { payback: 30 },
        },
        {
          scenario: "Otimista",
          fluxoCaixa: [{ mes: 1, ebitda: 12000 }, { mes: 2, ebitda: 15000 }],
          indicadores: { payback: 18 },
        },
      ]),
    };

    const cenarios = parseCenarios(analysis);

    expect(cenarios).toHaveLength(3);
    expect(cenarios.map(c => c.scenario)).toEqual(["Base", "Conservador", "Otimista"]);
    expect(cenarios[0].fluxoCaixa).toHaveLength(2);
    expect(cenarios[1].fluxoCaixa).toHaveLength(2);
    expect(cenarios[2].fluxoCaixa).toHaveLength(2);
  });

  it('deve parsear 1 cenário (legado) quando JSON não tem .scenario', () => {
    const analysis = {
      fluxoCaixa: JSON.stringify([
        { mes: 1, ebitda: 10000 },
        { mes: 2, ebitda: 12000 },
        { mes: 3, ebitda: 15000 },
      ]),
      indicadores: JSON.stringify({ payback: 24 }),
    };

    const cenarios = parseCenarios(analysis);

    expect(cenarios).toHaveLength(1);
    expect(cenarios[0].scenario).toBe("Base");
    expect(cenarios[0].fluxoCaixa).toHaveLength(3);
    expect(cenarios[0].indicadores.payback).toBe(24);
  });

  it('deve montar séries com 60 pontos cada', () => {
    const cenarios: ResultadoCenario[] = [
      {
        scenario: "Base",
        fluxoCaixa: Array.from({ length: 60 }, (_, idx) => ({ mes: idx + 1, ebitda: (idx + 1) * 1000 })),
        indicadores: { payback: 24 },
      },
      {
        scenario: "Conservador",
        fluxoCaixa: Array.from({ length: 60 }, (_, idx) => ({ mes: idx + 1, ebitda: (idx + 1) * 800 })),
        indicadores: { payback: 30 },
      },
      {
        scenario: "Otimista",
        fluxoCaixa: Array.from({ length: 60 }, (_, idx) => ({ mes: idx + 1, ebitda: (idx + 1) * 1200 })),
        indicadores: { payback: 18 },
      },
    ];

    const series = buildSeries(cenarios);

    expect(series).toHaveLength(3);
    
    series.forEach((s, idx) => {
      expect(s.points).toHaveLength(60);
      expect(s.paybackMeses).toBe(cenarios[idx].indicadores.payback);
      
      // Validar estrutura dos pontos
      s.points.forEach((p, mesIdx) => {
        expect(p.mes).toBe(mesIdx + 1);
        expect(p.ebitda).toBeTypeOf('number');
      });
    });
  });

  it('deve lidar com cenário legado (1 série)', () => {
    const cenarios: ResultadoCenario[] = [
      {
        scenario: "Base",
        fluxoCaixa: Array.from({ length: 60 }, (_, idx) => ({ mes: idx + 1, ebitda: (idx + 1) * 1000 })),
        indicadores: { payback: 24 },
      },
    ];

    const series = buildSeries(cenarios);

    expect(series).toHaveLength(1);
    expect(series[0].scenario).toBe("Base");
    expect(series[0].points).toHaveLength(60);
  });

  it('deve aceitar fluxoCaixa como objeto (não string)', () => {
    const analysis = {
      fluxoCaixa: [
        {
          scenario: "Base",
          fluxoCaixa: [{ mes: 1, ebitda: 10000 }],
          indicadores: { payback: 24 },
        },
      ],
    };

    const cenarios = parseCenarios(analysis);

    expect(cenarios).toHaveLength(1);
    expect(cenarios[0].scenario).toBe("Base");
  });

  it('deve lidar com payback ausente (null)', () => {
    const cenarios: ResultadoCenario[] = [
      {
        scenario: "Base",
        fluxoCaixa: [{ mes: 1, ebitda: 10000 }],
        indicadores: {}, // Sem payback
      },
    ];

    const series = buildSeries(cenarios);

    expect(series[0].paybackMeses).toBeNull();
  });
});
