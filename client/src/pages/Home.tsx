import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calculator, FileText, Moon, Plus, Sun } from "lucide-react";
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
        <div className="container py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <Calculator className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h1 className="text-4xl font-bold mb-4">{APP_TITLE}</h1>
              <p className="text-xl text-muted-foreground">
                Simule investimentos tokenizados com cálculos precisos de cronograma mensal,
                carências configuráveis e métodos PRICE, SAC e Bullet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cálculos Precisos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Motor de cálculo financeiro com suporte a PRICE, SAC e Bullet, incluindo TIR e carências.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cronograma Detalhado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualize mês a mês juros, amortização, saldo devedor e custos associados.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Exportação Fácil</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Exporte relatórios em CSV para análise externa e compartilhamento.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Entrar para Começar</a>
            </Button>
          </div>
        </div>
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
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
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
                    </CardTitle>
                    <CardDescription>
                      {sim.descricaoOferta || "Sem descrição"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Investido:</span>
                        <span className="font-medium">{formatCurrency(sim.valorInvestido)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Método:</span>
                        <span className="font-medium">{sim.amortizacaoMetodo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Prazo:</span>
                        <span className="font-medium">{sim.prazoMeses} meses</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Início:</span>
                        <span className="font-medium">{formatDate(sim.dataEncerramentoOferta)}</span>
                      </div>
                      {sim.tirAnual && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">TIR a.a.:</span>
                          <span className="font-bold text-primary">
                            {(sim.tirAnual / 100).toFixed(2)}%
                          </span>
                        </div>
                      )}
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
