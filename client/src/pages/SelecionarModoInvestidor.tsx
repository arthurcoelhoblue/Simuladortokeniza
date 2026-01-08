import { User, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireLeadCapture } from "@/components/RequireLeadCapture";

export default function SelecionarModoInvestidor() {
  const [, setLocation] = useLocation();

  return (
    <RequireLeadCapture variant="investidor">
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Como quer simular?</h1>
            <p className="text-xl text-muted-foreground">
              Escolha o modo de simulação de investimento
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Modo Criador */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">Modo Criador</CardTitle>
                <CardDescription className="text-base">
                  Crie sua própria simulação personalizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Defina todos os parâmetros do investimento</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Simule diferentes cenários de retorno</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Visualize fluxo de pagamentos detalhado</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => setLocation("/new?modo=criador")}
                >
                  Continuar como Criador
                </Button>
              </CardContent>
            </Card>

            {/* Card Modo Captador */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">Modo Captador</CardTitle>
                <CardDescription className="text-base">
                  Simule investimento em ofertas existentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Escolha ofertas de captação disponíveis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Calcule retornos com base em ofertas reais</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Compare múltiplas oportunidades</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => setLocation("/new?modo=captador")}
                >
                  Continuar como Captador
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Você poderá criar simulações em ambos os modos
          </p>
        </div>
      </div>
    </div>
    </RequireLeadCapture>
  );
}
