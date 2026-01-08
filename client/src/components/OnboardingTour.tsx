import { useState, useEffect } from "react";
import { useProfile, ProfileType } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  BarChart3,
  FileText,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Wallet,
  History,
  CheckCircle2
} from "lucide-react";

interface TourStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}

// Passos do tour para Captador
const captadorSteps: TourStep[] = [
  {
    id: 1,
    title: "Bem-vindo ao modo Captador!",
    description: "Aqui você pode criar e gerenciar suas captações de recursos via tokenização. Vamos conhecer as principais funcionalidades.",
    icon: <Sparkles className="h-12 w-12 text-blue-500" />,
    tip: "Você pode alternar entre Captador e Investidor a qualquer momento pelo menu superior.",
  },
  {
    id: 2,
    title: "Análise de Viabilidade",
    description: "Valide a viabilidade financeira do seu projeto antes de tokenizar. Calcule cenários, analise riscos e receba recomendações inteligentes.",
    icon: <BarChart3 className="h-12 w-12 text-green-500" />,
    tip: "Use os templates de negócio para preencher rapidamente os dados do seu projeto.",
  },
  {
    id: 3,
    title: "Simulação de Captação",
    description: "Simule diferentes estruturas de captação: taxas, prazos, garantias e sistemas de amortização. Compare cenários e encontre a melhor estrutura.",
    icon: <FileText className="h-12 w-12 text-purple-500" />,
    tip: "Exporte suas simulações em PDF para apresentar aos investidores.",
  },
  {
    id: 4,
    title: "Gestão de Leads e Oportunidades",
    description: "Acompanhe todos os interessados em suas ofertas. Gerencie o funil de vendas e integre com o Pipedrive automaticamente.",
    icon: <Users className="h-12 w-12 text-orange-500" />,
    tip: "Leads com maior score de intenção aparecem no topo da lista.",
  },
];

// Passos do tour para Investidor
const investidorSteps: TourStep[] = [
  {
    id: 1,
    title: "Bem-vindo ao modo Investidor!",
    description: "Aqui você pode explorar oportunidades de investimento tokenizado e acompanhar seu portfólio. Vamos conhecer as principais funcionalidades.",
    icon: <Sparkles className="h-12 w-12 text-green-500" />,
    tip: "Você pode alternar entre Captador e Investidor a qualquer momento pelo menu superior.",
  },
  {
    id: 2,
    title: "Simulação de Retornos",
    description: "Simule seus ganhos potenciais antes de investir. Compare diferentes cenários de rentabilidade e prazos.",
    icon: <TrendingUp className="h-12 w-12 text-blue-500" />,
    tip: "Simule a partir de uma oferta específica para ver projeções mais precisas.",
  },
  {
    id: 3,
    title: "Explorar Oportunidades",
    description: "Navegue pelas ofertas disponíveis no mercado. Filtre por tipo de ativo, rentabilidade, prazo e valor mínimo.",
    icon: <Search className="h-12 w-12 text-purple-500" />,
    tip: "Use o motor de matching para encontrar ofertas compatíveis com seu perfil.",
  },
  {
    id: 4,
    title: "Meus Investimentos",
    description: "Acompanhe todos os seus investimentos em um só lugar. Veja rendimentos, pagamentos recebidos e próximos vencimentos.",
    icon: <Wallet className="h-12 w-12 text-emerald-500" />,
    tip: "O histórico de transações mostra todos os aportes, rendimentos e resgates.",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { activeProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Verificar se deve mostrar o tour
  useEffect(() => {
    if (!activeProfile) return;

    const onboardingKey = `onboarding_${activeProfile}_completed`;
    const hasCompletedOnboarding = localStorage.getItem(onboardingKey) === "true";

    if (!hasCompletedOnboarding) {
      // Pequeno delay para não aparecer imediatamente
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeProfile]);

  const steps = activeProfile === "captador" ? captadorSteps : investidorSteps;
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (activeProfile) {
      const onboardingKey = `onboarding_${activeProfile}_completed`;
      localStorage.setItem(onboardingKey, "true");
    }
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible || !activeProfile) {
    return null;
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const profileColor = activeProfile === "captador" ? "blue" : "green";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl border-2">
        <CardHeader className="relative pb-2">
          {/* Botão de fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Progresso */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Passo {currentStep + 1} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Ícone e Título */}
          <div className="flex flex-col items-center text-center pt-4">
            <div className="mb-4 p-4 rounded-full bg-muted">
              {step.icon}
            </div>
            <CardTitle className="text-xl">{step.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="text-center px-8">
          <CardDescription className="text-base leading-relaxed">
            {step.description}
          </CardDescription>

          {step.tip && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> {step.tip}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-4 pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <Button
            onClick={handleNext}
            className={`flex-1 ${
              activeProfile === "captador" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Começar
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>

        {/* Indicadores de passo */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep 
                  ? `w-6 ${activeProfile === "captador" ? "bg-blue-500" : "bg-green-500"}` 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
