import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * Tipos de perfil disponíveis no sistema
 * - captador: Cria ofertas, análises de viabilidade, propostas
 * - investidor: Explora ofertas, faz simulações de investimento
 */
export type ProfileType = "captador" | "investidor";

interface ProfileContextType {
  /** Perfil ativo atual */
  activeProfile: ProfileType | null;
  /** Se está carregando o perfil */
  loading: boolean;
  /** Alterna para o perfil especificado */
  switchProfile: (profile: ProfileType) => void;
  /** Verifica se o perfil ativo é o especificado */
  isProfile: (profile: ProfileType) => boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

/**
 * Provider que gerencia o perfil ativo do usuário
 * 
 * O perfil é persistido tanto em localStorage (para acesso rápido) quanto
 * no banco de dados (para sincronização entre dispositivos).
 * O mesmo usuário pode alternar entre Captador e Investidor a qualquer momento.
 */
export function ProfileProvider({ children }: ProfileProviderProps) {
  const [activeProfile, setActiveProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  
  // Mutation para salvar perfil no banco
  const selecionarPerfilMutation = trpc.auth.selecionarPerfil.useMutation();

  // Carregar perfil ao iniciar - prioriza banco, depois localStorage
  useEffect(() => {
    const loadProfile = () => {
      // Se usuário está autenticado e tem perfil salvo no banco, usar esse
      if (isAuthenticated && user?.perfil) {
        setActiveProfile(user.perfil as ProfileType);
        localStorage.setItem("activeProfile", user.perfil);
        setLoading(false);
        return;
      }
      
      // Senão, tentar carregar do localStorage
      const savedProfile = localStorage.getItem("activeProfile") as ProfileType | null;
      if (savedProfile && (savedProfile === "captador" || savedProfile === "investidor")) {
        setActiveProfile(savedProfile);
      }
      setLoading(false);
    };

    loadProfile();
  }, [isAuthenticated, user?.perfil]);

  // Função para alternar perfil - salva em localStorage E no banco
  const switchProfile = (profile: ProfileType) => {
    setActiveProfile(profile);
    localStorage.setItem("activeProfile", profile);
    
    // Salvar no banco se usuário estiver autenticado
    if (isAuthenticated) {
      selecionarPerfilMutation.mutate({ perfil: profile }, {
        onError: (error) => {
          console.error("[ProfileContext] Erro ao salvar perfil no banco:", error);
        },
      });
    }
  };

  // Função para verificar perfil ativo
  const isProfile = (profile: ProfileType): boolean => {
    return activeProfile === profile;
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        loading,
        switchProfile,
        isProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de perfil
 */
export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

/**
 * Hook que redireciona para seleção de perfil se não houver perfil ativo
 */
export function useRequireProfile() {
  const { activeProfile, loading } = useProfile();
  
  return {
    hasProfile: activeProfile !== null,
    loading,
    activeProfile,
  };
}
