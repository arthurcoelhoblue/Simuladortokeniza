import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * Página de seleção de perfil após login
 * Permite usuário escolher entre Captador ou Investidor
 */
export default function SelecionarPerfil() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const selecionarPerfilMutation = trpc.auth.selecionarPerfil.useMutation({
    onSuccess: (data) => {
      toast.success(`Perfil ${data.perfil === 'captador' ? 'Captador' : 'Investidor'} selecionado!`);
      utils.auth.me.invalidate();
      
      // Redirecionar para módulo correto
      if (data.perfil === 'captador') {
        setLocation('/captador/dashboard');
      } else {
        setLocation('/investidor/dashboard');
      }
    },
    onError: (error) => {
      toast.error(`Erro ao selecionar perfil: ${error.message}`);
    },
  });

  // Se já tem perfil, redirecionar
  useEffect(() => {
    if (user?.perfil === 'captador') {
      setLocation('/captador/dashboard');
    } else if (user?.perfil === 'investidor') {
      setLocation('/investidor/dashboard');
    }
  }, [user, setLocation]);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 object-contain" />
            )}
            <span className="text-xl font-bold">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* Título */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">Bem-vindo ao {APP_TITLE}</h1>
            <p className="text-xl text-muted-foreground">
              Como você deseja utilizar a plataforma?
            </p>
          </div>

          {/* Cards de Seleção */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Captador */}
            <Card 
              className="relative overflow-hidden border-2 hover:border-primary transition-all cursor-pointer group hover:shadow-lg"
              onClick={() => selecionarPerfilMutation.mutate({ perfil: 'captador' })}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform" />
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Sou Captador</CardTitle>
                    <CardDescription className="text-base">
                      Quero captar recursos via tokenização
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Acesse ferramentas para:
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
                  className="w-full mt-6" 
                  size="lg"
                  disabled={selecionarPerfilMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    selecionarPerfilMutation.mutate({ perfil: 'captador' });
                  }}
                >
                  {selecionarPerfilMutation.isPending ? 'Selecionando...' : 'Continuar como Captador'}
                </Button>
              </CardContent>
            </Card>

            {/* Card Investidor */}
            <Card 
              className="relative overflow-hidden border-2 hover:border-green-500 transition-all cursor-pointer group hover:shadow-lg"
              onClick={() => selecionarPerfilMutation.mutate({ perfil: 'investidor' })}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform" />
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Sou Investidor</CardTitle>
                    <CardDescription className="text-base">
                      Quero investir em ativos tokenizados
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Acesse ferramentas para:
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
                  className="w-full mt-6 bg-green-600 hover:bg-green-700" 
                  size="lg"
                  disabled={selecionarPerfilMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    selecionarPerfilMutation.mutate({ perfil: 'investidor' });
                  }}
                >
                  {selecionarPerfilMutation.isPending ? 'Selecionando...' : 'Continuar como Investidor'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Nota */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Você poderá trocar de perfil a qualquer momento nas configurações da sua conta.
          </p>
        </div>
      </main>
    </div>
  );
}
