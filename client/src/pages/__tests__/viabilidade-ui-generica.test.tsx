import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ViabilidadeNova from "../ViabilidadeNova";

// Mock do wouter
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

// Mock do tRPC
vi.mock("@/lib/trpc", () => {
  const mockMutate = vi.fn();
  const mockQuery = vi.fn(() => ({ data: null, isLoading: false, error: null }));
  
  return {
    trpc: {
      viability: {
        create: {
          useMutation: () => ({
            mutate: mockMutate,
            isPending: false,
          }),
        },
      },
      simulations: {
        getById: {
          useQuery: mockQuery,
        },
      },
    },
    _mockMutate: mockMutate,
    _mockQuery: mockQuery,
  };
});

describe("Patch 6.1: Viabilidade Genérica - UI Dinâmica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.search
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
    });
  });

  it("Teste 1: Renderiza formulário com 1 receita por default", () => {
    render(<ViabilidadeNova />);

    // Verificar que há pelo menos 1 campo de receita
    const receitaInputs = screen.getAllByPlaceholderText(/Ex: Mensalidade/i);
    expect(receitaInputs.length).toBeGreaterThanOrEqual(1);
  });

  it("Teste 2: Clicar 'Adicionar Receita' adiciona nova linha", async () => {
    render(<ViabilidadeNova />);

    // Contar receitas iniciais
    const initialReceitas = screen.getAllByPlaceholderText(/Ex: Mensalidade/i);
    const initialCount = initialReceitas.length;

    // Clicar no botão de adicionar receita
    const addReceitaButton = screen.getByRole("button", { name: /Adicionar Receita/i });
    fireEvent.click(addReceitaButton);

    // Verificar que foi adicionada uma nova linha
    await waitFor(() => {
      const updatedReceitas = screen.getAllByPlaceholderText(/Ex: Mensalidade/i);
      expect(updatedReceitas.length).toBe(initialCount + 1);
    });
  });

  it("Teste 3: Clicar 'Adicionar Custo' adiciona nova linha", async () => {
    render(<ViabilidadeNova />);

    // Contar custos iniciais
    const initialCustos = screen.getAllByPlaceholderText(/Ex: Aluguel/i);
    const initialCount = initialCustos.length;

    // Clicar no botão de adicionar custo
    const addCustoButton = screen.getByRole("button", { name: /Adicionar Custo/i });
    fireEvent.click(addCustoButton);

    // Verificar que foi adicionada uma nova linha
    await waitFor(() => {
      const updatedCustos = screen.getAllByPlaceholderText(/Ex: Aluguel/i);
      expect(updatedCustos.length).toBe(initialCount + 1);
    });
  });

  it("Teste 4: Estados de receitas e custosFixos podem ser manipulados", () => {
    render(<ViabilidadeNova />);

    // Verificar que campos de receita existem e podem ser preenchidos
    const receitaNomeInputs = screen.getAllByPlaceholderText(/Ex: Mensalidade/i);
    expect(receitaNomeInputs.length).toBeGreaterThanOrEqual(1);
    
    fireEvent.change(receitaNomeInputs[0], { target: { value: "Mensalidade" } });
    expect(receitaNomeInputs[0]).toHaveValue("Mensalidade");

    // Verificar que campos de custo fixo existem e podem ser preenchidos
    const custoNomeInputs = screen.getAllByPlaceholderText(/Ex: Aluguel/i);
    expect(custoNomeInputs.length).toBeGreaterThanOrEqual(1);
    
    fireEvent.change(custoNomeInputs[0], { target: { value: "Aluguel" } });
    expect(custoNomeInputs[0]).toHaveValue("Aluguel");
  });
});
