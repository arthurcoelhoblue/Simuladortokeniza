import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Building2, Calculator, FileText, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Dashboard principal do módulo Captador
 */
export default function CaptadorDashboard() {
  const { user, loading } = useAuth();
  const { activeProfile } = useProfile();
  const [, setLocation] = useLocation();

  // Redirecionar se o perfil ativo não for captador
  useEffect(() => {
    if (!loading && activeProfile && activeProfile !== 'captador') {
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
          <h1 className="text-4xl font-bold mb-2">Bem-vindo, {user.name?.split(' ')[0] || 'Captador'}!</h1>
          <p className="text-xl text-muted-foreground">
            Gerencie suas captações e propostas comerciais
          </p>
        </div>

        {/* Cards de Ações Principais */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Análise de Viabilidade */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/captador/viabilidade')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Análise de Viabilidade</CardTitle>
                  <CardDescription>Valide seu negócio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Simule fluxo de caixa, calcule indicadores financeiros e valide a viabilidade do seu projeto.
              </p>
              <Button className="w-full" variant="outline">
                Acessar
              </Button>
            </CardContent>
          </Card>

          {/* Simulação de Custos */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/nova-simulacao')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Simulação de Custos</CardTitle>
                  <CardDescription>Calcule taxas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Simule os custos de captação, taxas de sucesso e estruture sua oferta.
              </p>
              <Button className="w-full" variant="outline">
                Simular
              </Button>
            </CardContent>
          </Card>

          {/* Propostas Comerciais */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/propostas')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Propostas Comerciais</CardTitle>
                  <CardDescription>Gere PDFs profissionais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Crie propostas comerciais automaticamente com base nas suas simulações.
              </p>
              <Button className="w-full" variant="outline">
                Ver Propostas
              </Button>
            </CardContent>
          </Card>

          {/* Comparação de Cenários */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/captador/viabilidade-comparacao')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Comparação de Cenários</CardTitle>
                  <CardDescription>Compare até 3 análises</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Compare diferentes cenários de viabilidade lado a lado (otimista, realista, pessimista).
              </p>
              <Button className="w-full" variant="outline">
                Comparar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Início Rápido */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Comece Agora</CardTitle>
            <CardDescription>Siga estes passos para estruturar sua captação</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  1
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Análise de Viabilidade</h3>
                  <p className="text-sm text-muted-foreground">
                    Valide a viabilidade financeira do seu negócio antes de tokenizar. Calcule fluxo de caixa, ponto de equilíbrio e indicadores.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  2
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Simulação de Custos</h3>
                  <p className="text-sm text-muted-foreground">
                    Simule os custos de captação, incluindo taxas fixas, success fee e remuneração dos investidores.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  3
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Proposta Comercial</h3>
                  <p className="text-sm text-muted-foreground">
                    Gere uma proposta comercial profissional em PDF para apresentar aos investidores.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  4
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Publicar Oferta</h3>
                  <p className="text-sm text-muted-foreground">
                    Publique sua oferta na plataforma para que investidores possam encontrá-la e investir.
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
