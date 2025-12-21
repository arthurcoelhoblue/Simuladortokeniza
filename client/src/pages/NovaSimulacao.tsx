import { Building2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovaSimulacao() {
  const [, setLocation] = useLocation();

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
                    <span>Gere propostas comerciais profissionais</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Compare diferentes cenários de captação</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => setLocation("/nova-simulacao/captador")}
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
                  onClick={() => setLocation("/nova-simulacao/investidor")}
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
