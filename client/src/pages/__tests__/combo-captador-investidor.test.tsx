import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NovaSimulacao from '../NovaSimulacao';

// Mock wouter hooks
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
  Link: ({ children, href }: any) => {
    const React = require('react');
    return React.createElement('a', { href }, children);
  },
}));

describe('Patch 2.1 + 3: Combo Captador/Investidor', () => {
  beforeEach(() => {
    mockSetLocation.mockClear();
  });

  // Teste 1: Captador abre sub-menu e navega corretamente
  it('deve abrir sub-menu do captador e exibir 2 opções', async () => {
    render(<NovaSimulacao />);

    // Verificar que tela inicial tem 2 cards
    expect(screen.getByText(/Sou Captador/i)).toBeInTheDocument();
    expect(screen.getByText(/Sou Investidor/i)).toBeInTheDocument();

    // Clicar no botão "Continuar como Captador"
    const captadorButton = screen.getByText(/Continuar como Captador/i);
    fireEvent.click(captadorButton);

    // Aguardar sub-menu aparecer
    await waitFor(() => {
      expect(screen.getByText(/Simulação de Captação/i)).toBeInTheDocument();
    });

    // Verificar que sub-menu tem 2 opções
    expect(screen.getByText(/Simulação de Captação/i)).toBeInTheDocument();
    expect(screen.getByText(/Análise de Viabilidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Voltar/i)).toBeInTheDocument();
  });

  // Teste 2: Navegação para Simulação de Captação
  it('deve navegar para /new?modo=captador ao clicar em "Começar Simulação"', async () => {
    render(<NovaSimulacao />);

    // Abrir sub-menu
    const captadorButton = screen.getByText(/Continuar como Captador/i);
    fireEvent.click(captadorButton);

    await waitFor(() => {
      expect(screen.getByText(/Começar Simulação/i)).toBeInTheDocument();
    });

    // Clicar em "Começar Simulação"
    const comecarSimulacaoButton = screen.getByText(/Começar Simulação/i);
    fireEvent.click(comecarSimulacaoButton);

    // Verificar que setLocation foi chamado com URL correta
    expect(mockSetLocation).toHaveBeenCalledWith('/new?modo=captador');
  });

  // Teste 3: Navegação para Análise de Viabilidade
  it('deve navegar para /captador/viabilidade/nova ao clicar em "Começar Análise"', async () => {
    render(<NovaSimulacao />);

    // Abrir sub-menu
    const captadorButton = screen.getByText(/Continuar como Captador/i);
    fireEvent.click(captadorButton);

    await waitFor(() => {
      expect(screen.getByText(/Começar Análise/i)).toBeInTheDocument();
    });

    // Clicar em "Começar Análise"
    const comecarAnaliseButton = screen.getByText(/Começar Análise/i);
    fireEvent.click(comecarAnaliseButton);

    // Verificar que setLocation foi chamado com URL correta
    expect(mockSetLocation).toHaveBeenCalledWith('/captador/viabilidade/nova');
  });

  // Teste 4: Botão Voltar funciona
  it('deve voltar ao menu principal ao clicar em "Voltar"', async () => {
    render(<NovaSimulacao />);

    // Abrir sub-menu
    const captadorButton = screen.getByText(/Continuar como Captador/i);
    fireEvent.click(captadorButton);

    await waitFor(() => {
      expect(screen.getByText(/Voltar/i)).toBeInTheDocument();
    });

    // Clicar em "Voltar"
    const voltarButton = screen.getByText(/Voltar/i);
    fireEvent.click(voltarButton);

    // Verificar que voltou ao menu principal
    await waitFor(() => {
      expect(screen.getByText(/Sou Captador/i)).toBeInTheDocument();
      expect(screen.getByText(/Sou Investidor/i)).toBeInTheDocument();
    });
  });

  // Teste 5: Investidor navega direto para formulário
  it('deve navegar para /new?modo=investidor ao clicar em "Continuar como Investidor"', () => {
    render(<NovaSimulacao />);

    // Clicar em "Continuar como Investidor"
    const investidorButton = screen.getByText(/Continuar como Investidor/i);
    fireEvent.click(investidorButton);

    // Verificar que setLocation foi chamado com URL correta
    expect(mockSetLocation).toHaveBeenCalledWith('/new?modo=investidor');
  });

  // Teste 6: Sub-menu não aparece inicialmente
  it('não deve exibir sub-menu antes de clicar em "Sou Captador"', () => {
    render(<NovaSimulacao />);

    // Verificar que sub-menu NÃO aparece (textos específicos do sub-menu)
    expect(screen.queryByText(/Como você quer começar?/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Começar Simulação/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Começar Análise/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Voltar/i)).not.toBeInTheDocument();
  });
});
