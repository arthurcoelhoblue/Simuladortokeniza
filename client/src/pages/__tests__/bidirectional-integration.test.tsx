import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SimulationView from '../SimulationView';
import ViabilidadeDetalhes from '../ViabilidadeDetalhes';

// Mock wouter hooks
const mockSetLocation = vi.fn();
let currentParamsId = '1080001';

vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
  useParams: () => ({ id: currentParamsId }),
  useRoute: (pattern: string) => {
    if (pattern === '/simulation/:id') {
      return [true, { id: currentParamsId }];
    }
    if (pattern === '/captador/viabilidade/:id') {
      return [true, { id: currentParamsId }];
    }
    return [false, null];
  },
  Link: ({ children, href }: any) => {
    const React = require('react');
    return React.createElement('a', { href }, children);
  },
}));

// Mock useAuth
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' },
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

// Mock tRPC
const mockSimulationData = {
  id: 1080001,
  descricaoOferta: 'Teste Captador',
  valorTotalOferta: 20000000,
  prazoMeses: 18,
  taxaJurosAa: 18,
  taxaSetupFixaBrl: 2500000,
  feeSucessoPercentSobreCaptacao: 5,
  modo: 'captador',
  tipoSimulacao: 'financiamento' as const,
  userId: 1,
  leadId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockViabilidadeData = {
  id: 1,
  nomeProjeto: 'Teste Viabilidade',
  valorTotalCaptacao: 50000000,
  percentualCoInvestimento: 20,
  feeFixo: 2500000,
  taxaSucesso: 5,
  taxaJurosMensal: 1.5,
  prazoTotal: 18,
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('@/lib/trpc', () => ({
  trpc: {
    simulations: {
      getById: {
        useQuery: vi.fn((params: any) => ({
          data: params?.id === 1080001 ? mockSimulationData : undefined,
          isLoading: false,
          error: null,
        })),
      },
      getCronograma: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          error: null,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
        }),
      },
    },
    viability: {
      getById: {
        useQuery: vi.fn((params: any) => ({
          data: params?.id === 1 ? mockViabilidadeData : undefined,
          isLoading: false,
          error: null,
        })),
      },
      generatePDF: {
        useMutation: () => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
        }),
      },
    },
    cronograma: {
      getBySimulationId: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));

// Helper para renderizar com QueryClient
const renderWithClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Patch 4: Integração Bidirecional + Prefill', () => {
  beforeEach(() => {
    mockSetLocation.mockClear();
    currentParamsId = '1080001';
  });

  /**
   * Teste 1: SimulationView (captador) mostra botão "Criar análise de viabilidade"
   * 
   * DoD: Verifica que o botão de navegação bidirecional aparece em simulações de captador
   */
  it('deve mostrar botão "Criar análise de viabilidade" em simulação de captador', async () => {
    renderWithClient(<SimulationView />);

    // Aguardar carregamento do título da simulação
    await screen.findByText(/Simulação #1080001/i);

    // Verificar que botão existe
    const viabilidadeButton = screen.getByText(/Criar análise de viabilidade/i);
    expect(viabilidadeButton).toBeInTheDocument();

    // Verificar que botão está em um elemento clicável
    const buttonElement = viabilidadeButton.closest('button') || viabilidadeButton.closest('a');
    expect(buttonElement).toBeInTheDocument();
  });

  /**
   * Teste 2: ViabilidadeDetalhes mostra botão "Criar simulação de captação"
   * 
   * DoD: Verifica que o botão de navegação bidirecional aparece em análises de viabilidade
   */
  it('deve mostrar botão "Criar simulação de captação" em análise de viabilidade', async () => {
    // Configurar mock para retornar ID de viabilidade
    currentParamsId = '1';

    renderWithClient(<ViabilidadeDetalhes />);

    // Aguardar carregamento do título
    await screen.findByText(/Análise de Viabilidade #1/i);

    // Verificar que botão existe
    const simulacaoButton = screen.getByText(/Criar simulação de captação/i);
    expect(simulacaoButton).toBeInTheDocument();

    // Verificar que botão está em um elemento clicável
    const buttonElement = simulacaoButton.closest('button') || simulacaoButton.closest('a');
    expect(buttonElement).toBeInTheDocument();
  });

  /**
   * Teste 3: Navegação de SimulationView para ViabilidadeNova com fromSimulationId
   * 
   * DoD: Verifica que ao clicar no botão, a navegação acontece com o parâmetro correto
   */
  it('deve navegar para ViabilidadeNova com fromSimulationId ao clicar no botão', async () => {
    renderWithClient(<SimulationView />);

    // Aguardar carregamento
    await screen.findByText(/Simulação #1080001/i);

    // Encontrar e clicar no botão
    const viabilidadeButton = screen.getByText(/Criar análise de viabilidade/i);
    const buttonElement = viabilidadeButton.closest('button') || viabilidadeButton.closest('a');
    
    // Simular clique
    buttonElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Verificar que setLocation foi chamado com URL correta
    expect(mockSetLocation).toHaveBeenCalledWith(
      expect.stringContaining('/captador/viabilidade/nova?fromSimulationId=1080001')
    );
  });

  /**
   * Teste 4: Navegação de ViabilidadeDetalhes para NewSimulation com fromViabilityId
   * 
   * DoD: Verifica que ao clicar no botão, a navegação acontece com o parâmetro correto
   */
  it('deve navegar para NewSimulation com fromViabilityId ao clicar no botão', async () => {
    // Configurar mock para retornar ID de viabilidade
    currentParamsId = '1';

    renderWithClient(<ViabilidadeDetalhes />);

    // Aguardar carregamento
    await screen.findByText(/Análise de Viabilidade #1/i);

    // Encontrar e clicar no botão
    const simulacaoButton = screen.getByText(/Criar simulação de captação/i);
    const buttonElement = simulacaoButton.closest('button') || simulacaoButton.closest('a');
    
    // Simular clique
    buttonElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Verificar que setLocation foi chamado com URL correta
    expect(mockSetLocation).toHaveBeenCalledWith(
      expect.stringContaining('/new?modo=captador&fromViabilityId=1')
    );
  });
});
