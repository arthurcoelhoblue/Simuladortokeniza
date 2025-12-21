/**
 * Patch 9A: Testes de Visualização de Risco
 * 
 * Valida:
 * 1. Badge de risco renderiza corretamente (baixo/médio/alto)
 * 2. Card de Leitura de Risco exibe recomendações
 * 3. Fallback para análises antigas sem risco
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ViabilidadeDetalhes from '../ViabilidadeDetalhes';

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  useRoute: () => [true, { id: '1' }],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock useAuth
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User' },
    loading: false,
    isAuthenticated: true,
  }),
}));

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    viability: {
      getById: {
        useQuery: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
      duplicate: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
      generatePDF: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
  },
}));

const mockAnalysisWithRisk = {
  id: 1,
  descricao: 'Análise com Risco',
  capexInicial: 100000,
  opexMensal: 5000,
  prazoMeses: 60,
  taxaDesconto: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  scenarios: JSON.stringify({
    Base: {
      scenario: 'Base',
      indicadores: { payback: 24, pontoEquilibrio: 12 },
      fluxoCaixa: Array(60).fill({ mes: 1, ebitda: 10000, margemBrutaPct: 35 }),
    },
    Conservador: {
      scenario: 'Conservador',
      indicadores: { payback: 30, pontoEquilibrio: 15 },
      fluxoCaixa: Array(60).fill({ mes: 1, ebitda: 8000, margemBrutaPct: 28 }),
    },
    Otimista: {
      scenario: 'Otimista',
      indicadores: { payback: 18, pontoEquilibrio: 9 },
      fluxoCaixa: Array(60).fill({ mes: 1, ebitda: 12000, margemBrutaPct: 42 }),
    },
  }),
  risk: JSON.stringify({
    level: 'medio',
    recomendacoes: [
      'Considere aumentar a margem bruta para melhorar a rentabilidade',
      'Monitore o fluxo de caixa nos primeiros 12 meses',
      'Avalie reduzir custos fixos em 10-15%',
    ],
  }),
};

const mockAnalysisWithoutRisk = {
  ...mockAnalysisWithRisk,
  risk: null,
};

describe('Patch 9A: Visualização de Risco', () => {
  it('deve renderizar badge de risco BAIXO corretamente', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.viability.getById.useQuery.mockReturnValue({
      data: {
        ...mockAnalysisWithRisk,
        risk: JSON.stringify({ level: 'baixo', recomendacoes: ['Projeto viável'] }),
      },
      isLoading: false,
    });

    render(<ViabilidadeDetalhes />);
    
    expect(screen.getByText(/🟩/)).toBeInTheDocument();
    expect(screen.getByText(/Baixo Risco/i)).toBeInTheDocument();
  });

  it('deve renderizar badge de risco MÉDIO corretamente', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.viability.getById.useQuery.mockReturnValue({
      data: mockAnalysisWithRisk,
      isLoading: false,
    });

    render(<ViabilidadeDetalhes />);
    
    expect(screen.getByText(/🟨/)).toBeInTheDocument();
    expect(screen.getByText(/Risco Moderado/i)).toBeInTheDocument();
  });

  it('deve renderizar badge de risco ALTO corretamente', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.viability.getById.useQuery.mockReturnValue({
      data: {
        ...mockAnalysisWithRisk,
        risk: JSON.stringify({ level: 'alto', recomendacoes: ['Revisar premissas'] }),
      },
      isLoading: false,
    });

    render(<ViabilidadeDetalhes />);
    
    expect(screen.getByText(/🟥/)).toBeInTheDocument();
    expect(screen.getByText(/Alto Risco/i)).toBeInTheDocument();
  });

  it('deve exibir card de Leitura de Risco com recomendações', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.viability.getById.useQuery.mockReturnValue({
      data: mockAnalysisWithRisk,
      isLoading: false,
    });

    render(<ViabilidadeDetalhes />);
    
    expect(screen.getByText(/Leitura de Risco/i)).toBeInTheDocument();
    expect(screen.getByText(/Sugestões:/i)).toBeInTheDocument();
    expect(screen.getByText(/Considere aumentar a margem bruta/i)).toBeInTheDocument();
    expect(screen.getByText(/Monitore o fluxo de caixa/i)).toBeInTheDocument();
  });

  it('NÃO deve exibir badge nem card para análises antigas sem risco', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.viability.getById.useQuery.mockReturnValue({
      data: mockAnalysisWithoutRisk,
      isLoading: false,
    });

    render(<ViabilidadeDetalhes />);
    
    expect(screen.queryByText(/🟩/)).not.toBeInTheDocument();
    expect(screen.queryByText(/🟨/)).not.toBeInTheDocument();
    expect(screen.queryByText(/🟥/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Leitura de Risco/i)).not.toBeInTheDocument();
  });

  it('deve exibir métricas do cenário Conservador no card de risco', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.viability.getById.useQuery.mockReturnValue({
      data: mockAnalysisWithRisk,
      isLoading: false,
    });

    render(<ViabilidadeDetalhes />);
    
    expect(screen.getByText(/Payback estimado/i)).toBeInTheDocument();
    expect(screen.getByText(/30 meses/i)).toBeInTheDocument();
    expect(screen.getByText(/Margem bruta \(mês 12\)/i)).toBeInTheDocument();
    expect(screen.getByText(/28\.0%/i)).toBeInTheDocument();
  });
});
