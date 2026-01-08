import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Briefcase, Search, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Dashboard principal do módulo Investidor
 */
export default function InvestidorDashboard() {
  const { user, loading } = useAuth();
  const { activeProfile } = useProfile();
  const [, setLocation] = useLocation();

  // Redirecionar se o perfil ativo não for investidor
  useEffect(() => {
    if (!loading && activeProfile && activeProfile !== 'investidor') {
      setLocation('/selecionar-perfil');
    }
  }, [activeProfile, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Bem-vindo, {user.name?.split(' ')[0] || 'Investidor'}!</h1>
          <p className="text-xl text-muted-foreground">
            Explore oportunidades e simule seus investimentos
          </p>
        </div>

        {/* Cards de Ações Principais */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Simulação de Retornos */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/investidor/simulacoes/nova')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Simulação de Retornos</CardTitle>
                  <CardDescription>Calcule seus ganhos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Simule diferentes cenários de investimento e calcule seus retornos potenciais.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Simular Agora
              </Button>
            </CardContent>
          </Card>

          {/* Oportunidades */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/investidor/ofertas')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Oportunidades</CardTitle>
                  <CardDescription>Explore ofertas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Navegue pelas ofertas disponíveis e encontre investimentos alinhados ao seu perfil.
              </p>
              <Button className="w-full" variant="outline">
                Explorar
              </Button>
            </CardContent>
          </Card>

          {/* Comparação de Ativos */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Comparação de Ativos</CardTitle>
                  <CardDescription>Compare investimentos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Compare diferentes ativos lado a lado para tomar decisões informadas.
              </p>
              <Button className="w-full" variant="outline">
                Comparar
              </Button>
            </CardContent>
          </Card>

          {/* Portfólio */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/investidor/investimentos')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Briefcase className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Meu Portfólio</CardTitle>
                  <CardDescription>Acompanhe investimentos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Visualize e gerencie todos os seus investimentos em um só lugar.
              </p>
              <Button className="w-full" variant="outline">
                Ver Portfólio
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Início Rápido */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Como Começar a Investir</CardTitle>
            <CardDescription>Siga estes passos para fazer seu primeiro investimento tokenizado</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center font-bold text-green-600">
                  1
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Explore Oportunidades</h3>
                  <p className="text-sm text-muted-foreground">
                    Navegue pelas ofertas disponíveis e filtre por tipo de ativo, prazo, rentabilidade e garantias.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center font-bold text-green-600">
                  2
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Simule Seus Retornos</h3>
                  <p className="text-sm text-muted-foreground">
                    Use o simulador para calcular quanto você pode ganhar com diferentes valores de investimento e prazos.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center font-bold text-green-600">
                  3
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Compare Ativos</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare diferentes oportunidades lado a lado para identificar a melhor opção para seu perfil.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center font-bold text-green-600">
                  4
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Invista e Acompanhe</h3>
                  <p className="text-sm text-muted-foreground">
                    Realize seu investimento e acompanhe o desempenho em tempo real no seu portfólio.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
