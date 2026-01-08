import { useLocation, useSearch } from "wouter";
import { useEffect } from "react";
import { LeadCaptureForm, LeadData } from "@/components/LeadCaptureForm";
import { useLead } from "@/contexts/LeadContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Loader2 } from "lucide-react";

/**
 * Página intermediária de captura de leads.
 * Exibida antes de simulações/análises para capturar dados do usuário.
 * 
 * Query params:
 * - redirect: URL para redirecionar após captura (obrigatório)
 * - variant: "investidor" | "captador" (opcional, default: perfil ativo)
 */
export default function LeadCapturePage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { lead, isLeadCaptured, captureLead, isLoading } = useLead();
  const { activeProfile } = useProfile();

  // Parse query params
  const params = new URLSearchParams(searchString);
  const redirectUrl = params.get("redirect") || "/";
  const variant = (params.get("variant") as "investidor" | "captador") || activeProfile || "investidor";

  // Se já tem lead capturado, redirecionar direto
  useEffect(() => {
    if (!isLoading && isLeadCaptured) {
      setLocation(redirectUrl);
    }
  }, [isLoading, isLeadCaptured, redirectUrl, setLocation]);

  const handleSubmit = async (data: LeadData) => {
    await captureLead({
      nomeCompleto: data.nomeCompleto,
      email: data.email,
      whatsapp: data.whatsapp,
      empresa: data.empresa,
    });
    setLocation(redirectUrl);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se já tem lead, não deveria chegar aqui (useEffect redireciona)
  if (isLeadCaptured) {
    return null;
  }

  const titles = {
    investidor: {
      title: "Antes de simular seu investimento...",
      subtitle: "Preencha seus dados para receber os resultados por email e acompanhar suas simulações",
    },
    captador: {
      title: "Antes de analisar seu projeto...",
      subtitle: "Preencha seus dados para receber o relatório completo e falar com um especialista",
    },
  };

  return (
    <LeadCaptureForm
      title={titles[variant].title}
      subtitle={titles[variant].subtitle}
      onSubmit={handleSubmit}
      variant={variant}
    />
  );
}
