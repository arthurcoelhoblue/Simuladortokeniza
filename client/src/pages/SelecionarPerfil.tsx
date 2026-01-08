import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile, ProfileType } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Building2, TrendingUp, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Página de seleção de perfil
 * 
 * Permite o usuário escolher entre Captador ou Investidor.
 * O mesmo usuário pode ter ambos os perfis e alternar a qualquer momento.
 * O perfil selecionado é armazenado em localStorage (não no banco).
 */
export default function SelecionarPerfil() {
  const { user, loading } = useAuth();
  const { activeProfile, switchProfile } = useProfile();
  const [, setLocation] = useLocation();

  const handleSelectProfile = (perfil: ProfileType) => {
    switchProfile(perfil);
    
    // Redirecionar para dashboard do perfil selecionado
    if (perfil === 'captador') {
      setLocation('/captador/dashboard');
    } else {
      setLocation('/investidor/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header simplificado */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 object-contain" />
            )}
            <span className="text-xl font-bold">{APP_TITLE}</span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* Título */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">
              {activeProfile ? 'Trocar Perfil' : `Bem-vindo ao ${APP_TITLE}`}
            </h1>
            <p className="text-xl text-muted-foreground">
              {activeProfile 
                ? 'Selecione o perfil que deseja usar agora'
                : 'Como você deseja utilizar a plataforma?'
              }
            </p>
          </div>

          {/* Cards de Seleção */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Captador */}
            <Card 
              className={`relative overflow-hidden border-2 transition-all cursor-pointer group hover:shadow-lg ${
                activeProfile === 'captador' 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-primary'
              }`}
              onClick={() => handleSelectProfile('captador')}
            >
              {activeProfile === 'captador' && (
                <div className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  Ativo
                </div>
              )}
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform" />
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Captador</CardTitle>
                    <CardDescription className="text-base">
                      Capte recursos via tokenização
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Ferramentas disponíveis:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Análise de Viabilidade</strong> - Valide seu negócio antes de tokenizar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Simulação de Custos</strong> - Calcule taxas e estruture sua captação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Propostas Comerciais</strong> - Gere PDFs profissionais automaticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Gestão de Ofertas</strong> - Publique e gerencie suas oportunidades</span>
                  </li>
                </ul>

                <Button 
                  className="w-full mt-6 gap-2" 
                  size="lg"
                  variant={activeProfile === 'captador' ? 'default' : 'outline'}
                >
                  {activeProfile === 'captador' ? 'Perfil Ativo' : 'Entrar como Captador'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Card Investidor */}
            <Card 
              className={`relative overflow-hidden border-2 transition-all cursor-pointer group hover:shadow-lg ${
                activeProfile === 'investidor' 
                  ? 'border-green-500 ring-2 ring-green-500/20' 
                  : 'hover:border-green-500'
              }`}
              onClick={() => handleSelectProfile('investidor')}
            >
              {activeProfile === 'investidor' && (
                <div className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full bg-green-600 text-white">
                  Ativo
                </div>
              )}
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform" />
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Investidor</CardTitle>
                    <CardDescription className="text-base">
                      Invista em ativos tokenizados
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Ferramentas disponíveis:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong>Simulação de Retornos</strong> - Calcule seus ganhos potenciais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong>Oportunidades</strong> - Explore ofertas disponíveis no mercado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong>Comparação de Ativos</strong> - Compare diferentes investimentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong>Portfólio</strong> - Acompanhe seus investimentos</span>
                  </li>
                </ul>

                <Button 
                  className={`w-full mt-6 gap-2 ${
                    activeProfile === 'investidor' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                  }`}
                  size="lg"
                  variant={activeProfile === 'investidor' ? 'default' : 'outline'}
                >
                  {activeProfile === 'investidor' ? 'Perfil Ativo' : 'Entrar como Investidor'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Nota */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            💡 Você pode alternar entre os perfis a qualquer momento pelo menu superior
          </p>
        </div>
      </main>
    </div>
  );
}
