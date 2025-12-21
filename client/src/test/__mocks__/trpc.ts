import { vi } from 'vitest';

export const trpc = {
  simulation: {
    getById: {
      useQuery: vi.fn(() => ({
        data: {
          id: 1080001,
          modo: 'captador',
          tipoSimulacao: 'financiamento',
          valorTotalOferta: 200000,
          descricaoOferta: 'Test simulation',
        },
        isLoading: false,
        error: null,
      })),
    },
    create: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isSuccess: false,
        isError: false,
      })),
    },
  },
  viability: {
    getById: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
      })),
    },
    create: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isSuccess: false,
        isError: false,
      })),
    },
  },
  offer: {
    list: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    },
  },
};
