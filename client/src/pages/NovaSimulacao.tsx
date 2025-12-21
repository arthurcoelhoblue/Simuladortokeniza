import { Building2, TrendingUp, Calculator, FileBarChart } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovaSimulacao() {
  const [, setLocation] = useLocation();
  const [captadorChoice, setCaptadorChoice] = useState<null | "menu">(null);

  // Sub-seletor do captador
  if (captadorChoice === "menu") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Como você quer começar?</h1>
              <p className="text-xl text-muted-foreground">
                Escolha o ponto de partida para sua análise
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Card Simulação de Captação */}
              <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calculator className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">Simulação de Captação</CardTitle>
                  <CardDescription className="text-base">
                    Estime custos, taxas e retorno do captador
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Calcule taxas de estruturação e fees</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Simule cronograma de pagamentos</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Visualize custos totais da captação</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={() => setLocation("/new?modo=captador")}
                  >
                    Começar Simulação
                  </Button>
                </CardContent>
              </Card>

              {/* Card Análise de Viabilidade */}
              <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileBarChart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl">Análise de Viabilidade</CardTitle>
                  <CardDescription className="text-base">
                    Comece pela viabilidade do projeto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Calcule payback e ponto de equilíbrio</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Analise viabilidade econômica</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Valide premissas do projeto</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={() => setLocation("/captador/viabilidade/nova")}
                  >
                    Começar Análise
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button 
                variant="ghost" 
                onClick={() => setCaptadorChoice(null)}
              >
                ← Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Nova Simulação</h1>
            <p className="text-xl text-muted-foreground">
              Escolha o tipo de simulação que deseja realizar
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Captador */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">Sou Captador</CardTitle>
                <CardDescription className="text-base">
                  Simule os custos de captação do seu projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Calcule taxas e custos de tokenização</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Análise de viabilidade do seu projeto de tokenização</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Compare diferentes cenários de captação</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => setCaptadorChoice("menu")}
                >
                  Continuar como Captador
                </Button>
              </CardContent>
            </Card>

            {/* Card Investidor */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">Sou Investidor</CardTitle>
                <CardDescription className="text-base">
                  Simule os retornos do seu investimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Calcule retornos e rentabilidade</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Visualize fluxo de pagamentos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Compare diferentes oportunidades</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => setLocation("/new?modo=investidor")}
                >
                  Continuar como Investidor
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Você poderá alterar o tipo de simulação a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
}
