import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl, getRegisterUrl } from "@/const";
import { Link } from "wouter";
import { Calculator, FileText, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { activeProfile } = useProfile();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();

  // Redirecionar usuários autenticados para o dashboard do perfil ativo
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (activeProfile === "captador") {
        setLocation("/captador/dashboard");
      } else if (activeProfile === "investidor") {
        setLocation("/investidor/dashboard");
      } else {
        // Sem perfil selecionado, ir para seleção de perfil
        setLocation("/selecionar-perfil");
      }
    }
  }, [loading, isAuthenticated, activeProfile, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se autenticado, mostrar loading enquanto redireciona
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  // Landing page para usuários não autenticados
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b">
        <div className="container py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <img 
                src={theme === 'dark' ? '/tokeniza-logo-light.svg' : '/tokeniza-logo-dark.svg'} 
                alt="Tokeniza" 
                className="h-20 mx-auto mb-6" 
              />
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-lime-500 to-emerald-500 bg-clip-text text-transparent">
                Simule Investimentos Tokenizados com Precisão Profissional
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                <strong>Investidores:</strong> calcule retornos e analise cronogramas. <strong>Captadores:</strong> simule custos de captação. 
                A plataforma mais completa do mercado de tokenização.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href={getRegisterUrl()}>
                <Button size="lg" className="text-lg px-8">
                  <Calculator className="mr-2 h-5 w-5" />
                  Começar Gratuitamente
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="https://tokeniza.com.br" target="_blank" rel="noopener noreferrer">
                  Conheça a Tokeniza
                </a>
              </Button>
              <Button size="lg" variant="default" className="text-lg px-8 bg-lime-500 hover:bg-lime-600 text-black" asChild>
                <a href="https://plataforma.tokeniza.com.br" target="_blank" rel="noopener noreferrer">
                  Conheça Nossas Ofertas
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-lime-500" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-lime-500" />
                <span>Cálculos Instantâneos</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-lime-500" />
                <span>Relatórios Profissionais</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tudo que você precisa para simular investimentos</h2>
            <p className="text-lg text-muted-foreground">
              Ferramentas profissionais para investidores e captadores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-lime-500 mb-2" />
                <CardTitle className="text-lg">Cálculo de TIR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <strong>Taxa Interna de Retorno:</strong> descubra o rendimento real do seu investimento 
                  considerando todos os fluxos de caixa ao longo do tempo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calculator className="h-8 w-8 text-lime-500 mb-2" />
                <CardTitle className="text-lg">Métodos Flexíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Simule com <strong>amortização linear</strong> (parcelas mensais) ou <strong>bullet</strong> 
                  (pagamento único no vencimento).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-lime-500 mb-2" />
                <CardTitle className="text-lg">Cronograma Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize mês a mês: juros, amortização, saldo devedor e custos. 
                  Exporte em CSV ou PDF profissional.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-lime-500 mb-2" />
                <CardTitle className="text-lg">Carências Configuráveis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure períodos de carência para juros e principal, com capitalização 
                  simples ou composta.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tokeniza Institutional */}
          <Card className="bg-gradient-to-br from-lime-50 to-emerald-100 dark:from-lime-950 dark:to-emerald-900 border-lime-200 dark:border-lime-800">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-lime-600 dark:text-lime-400" />
                Por que escolher a Tokeniza?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base">
                A <strong>Tokeniza</strong> é a <strong>primeira plataforma do Brasil autorizada pela CVM</strong> 
                para operar com tokenização de ativos, garantindo segurança jurídica e regulatória para seus investimentos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-950 rounded-lg p-4 border border-lime-200 dark:border-lime-800">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-lime-600" />
                    Autorização CVM
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Primeira e única plataforma brasileira com autorização da Comissão de Valores Mobiliários.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-950 rounded-lg p-4 border border-lime-200 dark:border-lime-800">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-lime-600" />
                    100% Tokenizado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sistema completamente baseado em blockchain, garantindo transparência e rastreabilidade.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-950 rounded-lg p-4 border border-lime-200 dark:border-lime-800">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-lime-600" />
                    +130 Projetos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mais de 130 projetos tokenizados no Brasil, democratizando o acesso a investimentos alternativos.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-950 rounded-lg p-4 border border-lime-200 dark:border-lime-800">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-lime-600" />
                    Distribuição Global
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Conectamos investidores brasileiros e internacionais a oportunidades únicas de investimento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* About Tokeniza */}
      <div className="border-t bg-muted/30">
        <div className="container py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Sobre a Tokeniza</h2>
            <p className="text-lg text-muted-foreground mb-8">
              A <strong>Tokeniza</strong> é a plataforma líder em tokenização de ativos no Brasil, 
              democratizando o acesso a investimentos alternativos através da tecnologia blockchain.
            </p>
            <p className="text-base text-muted-foreground mb-8">
              Conectamos investidores a oportunidades de investimento em ativos reais tokenizados, 
              com transparência, segurança e liquidez. Nosso simulador permite que você analise 
              retornos antes de investir, tomando decisões mais informadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>
                  Criar Conta Gratuita
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://tokeniza.com.br" target="_blank" rel="noopener noreferrer">
                  Visitar Tokeniza.com.br
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 Tokeniza. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
