import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export interface CapturedLead {
  id: number;
  nomeCompleto: string;
  email: string;
  whatsapp: string;
  empresa?: string;
  capturedAt: string;
}

interface LeadContextType {
  lead: CapturedLead | null;
  isLeadCaptured: boolean;
  captureLead: (data: {
    nomeCompleto: string;
    email: string;
    whatsapp: string;
    empresa?: string;
  }) => Promise<CapturedLead>;
  clearLead: () => void;
  isLoading: boolean;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

const LEAD_STORAGE_KEY = "tokeniza_captured_lead";

export function LeadProvider({ children }: { children: ReactNode }) {
  const [lead, setLead] = useState<CapturedLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mutation para criar/atualizar lead no backend
  const createLeadMutation = trpc.leads.createOrUpdate.useMutation();

  // Carregar lead do localStorage na inicialização
  useEffect(() => {
    const stored = localStorage.getItem(LEAD_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CapturedLead;
        // Verificar se o lead ainda é válido (capturado nas últimas 24h)
        const capturedAt = new Date(parsed.capturedAt);
        const now = new Date();
        const hoursSinceCaptured = (now.getTime() - capturedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCaptured < 24) {
          setLead(parsed);
        } else {
          // Lead expirado, limpar
          localStorage.removeItem(LEAD_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(LEAD_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const captureLead = async (data: {
    nomeCompleto: string;
    email: string;
    whatsapp: string;
    empresa?: string;
  }): Promise<CapturedLead> => {
    // Enviar para o backend
    const result = await createLeadMutation.mutateAsync({
      nomeCompleto: data.nomeCompleto,
      email: data.email,
      whatsapp: data.whatsapp,
      canalOrigem: "simulador_web",
    });

    const capturedLead: CapturedLead = {
      id: result.id,
      nomeCompleto: data.nomeCompleto,
      email: data.email,
      whatsapp: data.whatsapp,
      empresa: data.empresa,
      capturedAt: new Date().toISOString(),
    };

    // Salvar no localStorage
    localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(capturedLead));
    setLead(capturedLead);

    return capturedLead;
  };

  const clearLead = () => {
    localStorage.removeItem(LEAD_STORAGE_KEY);
    setLead(null);
  };

  return (
    <LeadContext.Provider
      value={{
        lead,
        isLeadCaptured: !!lead,
        captureLead,
        clearLead,
        isLoading,
      }}
    >
      {children}
    </LeadContext.Provider>
  );
}

export function useLead() {
  const context = useContext(LeadContext);
  if (context === undefined) {
    throw new Error("useLead must be used within a LeadProvider");
  }
  return context;
}
