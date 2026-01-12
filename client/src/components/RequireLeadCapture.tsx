import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useLead } from "@/contexts/LeadContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface RequireLeadCaptureProps {
  children: ReactNode;
  variant?: "investidor" | "captador";
}

/**
 * Wrapper que verifica se o lead foi capturado antes de renderizar o conteúdo.
 * Se não foi capturado, redireciona para a página de captura.
 */
export function RequireLeadCapture({ children, variant }: RequireLeadCaptureProps) {
  const [location, setLocation] = useLocation();
  const { isLeadCaptured, isLoading: leadLoading, captureLead } = useLead();
  const { activeProfile } = useProfile();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const profileVariant = variant || activeProfile || "investidor";
  const isLoading = leadLoading || authLoading;

  useEffect(() => {
    // Se usuário está logado e tem dados completos, criar lead automaticamente
    if (!isLoading && isAuthenticated && user && !isLeadCaptured) {
      // Verificar se usuário tem dados necessários (nome, email, telefone)
      if (user.name && user.email && user.telefone) {
        // Criar lead automaticamente com dados do cadastro
        captureLead({
          nomeCompleto: user.name,
          email: user.email,
          whatsapp: user.telefone,
        }).catch(console.error);
        return; // Não redirecionar, vai criar o lead
      }
    }
    
    // Se não está logado ou não tem dados completos, redirecionar para captura
    if (!isLoading && !isLeadCaptured && !isAuthenticated) {
      const redirectUrl = encodeURIComponent(location);
      setLocation(`/capturar-lead?redirect=${redirectUrl}&variant=${profileVariant}`);
    }
  }, [isLoading, isLeadCaptured, isAuthenticated, user, location, setLocation, profileVariant, captureLead]);

  // Loading state
  if (isLoading || (isAuthenticated && user && user.name && user.email && user.telefone && !isLeadCaptured)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não tem lead e não está logado, não renderizar (useEffect vai redirecionar)
  if (!isLeadCaptured && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default RequireLeadCapture;
