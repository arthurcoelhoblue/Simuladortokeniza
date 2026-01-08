import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useLead } from "@/contexts/LeadContext";
import { useProfile } from "@/contexts/ProfileContext";
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
  const { isLeadCaptured, isLoading } = useLead();
  const { activeProfile } = useProfile();

  const profileVariant = variant || activeProfile || "investidor";

  useEffect(() => {
    if (!isLoading && !isLeadCaptured) {
      // Redirecionar para captura de lead com URL de retorno
      const redirectUrl = encodeURIComponent(location);
      setLocation(`/capturar-lead?redirect=${redirectUrl}&variant=${profileVariant}`);
    }
  }, [isLoading, isLeadCaptured, location, setLocation, profileVariant]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não tem lead, não renderizar (useEffect vai redirecionar)
  if (!isLeadCaptured) {
    return null;
  }

  return <>{children}</>;
}

export default RequireLeadCapture;
