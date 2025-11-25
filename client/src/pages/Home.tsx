import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calculator, FileText, Moon, Plus, Sun, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  const { data: simulations, isLoading: loadingSimulations } = trpc.simulations.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
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
                <Button size="lg" className="text-lg px-8" asChild>
                  <a href={getLoginUrl()}>
                    <Calculator className="mr-2 h-5 w-5" />
                    Começar Gratuitamente
                  </a>
                </Button>
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

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00Z").toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={theme === 'dark' ? '/tokeniza-logo-light.svg' : '/tokeniza-logo-dark.svg'} alt="Tokeniza" className="h-8" />
              <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Minhas Simulações</h2>
            <p className="text-muted-foreground mt-1">
              Gerencie e visualize suas simulações de investimento tokenizado
            </p>
          </div>
          <Button size="lg" onClick={() => setLocation("/new")}>
            <Plus className="mr-2 h-5 w-5" />
            Nova Simulação
          </Button>
        </div>

        {loadingSimulations ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando simulações...</p>
          </div>
        ) : simulations && simulations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulations.map((sim) => (
              <Link key={sim.id} href={`/simulation/${sim.id}`}>
                <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Simulação #{sim.id}
                      {sim.modo === 'captador' && (
                        <span className="text-xs bg-lime-500 text-black px-2 py-0.5 rounded-full font-medium">
                          Captador
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {sim.descricaoOferta || (sim.modo === 'captador' ? 'Simulação de Captação' : 'Sem descrição')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          {sim.modo === 'captador' ? 'Valor a Captar:' : 'Investido:'}
                        </span>
                        <span className="font-medium">
                          {sim.modo === 'captador' ? formatCurrency(sim.valorTotalOferta) : formatCurrency(sim.valorAporte)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Método:</span>
                        <span className="font-medium">{sim.sistemaAmortizacao}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Prazo:</span>
                        <span className="font-medium">{sim.prazoMeses} meses</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Início:</span>
                        <span className="font-medium">{formatDate(sim.dataEncerramentoOferta)}</span>
                      </div>
                      {sim.modo === 'captador' ? (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Custo Total:</span>
                          <span className="font-bold text-lime-600">
                            {formatCurrency(
                              sim.totalJurosPagos + 
                              sim.valorAporte + 
                              sim.taxaSetupFixaBrl + 
                              (sim.valorTotalOferta * sim.feeSucessoPercentSobreCaptacao / 10000)
                            )}
                          </span>
                        </div>
                      ) : sim.tirAnual ? (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">TIR a.a.:</span>
                          <span className="font-bold text-primary">
                            {(sim.tirAnual / 100).toFixed(2)}%
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma simulação ainda</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira simulação para começar a analisar investimentos tokenizados.
              </p>
              <Button onClick={() => setLocation("/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Simulação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

