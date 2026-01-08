import { useProfile, ProfileType } from "@/contexts/ProfileContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface ProfileOption {
  type: ProfileType;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  route: string;
}

const profileOptions: ProfileOption[] = [
  {
    type: "captador",
    title: "Captador",
    description: "Crie ofertas e capte recursos para seus projetos",
    icon: <Building2 className="w-12 h-12" />,
    features: [
      "Análise de Viabilidade Financeira",
      "Criar e Gerenciar Ofertas",
      "Simulações de Captação",
      "Dashboard de Leads",
      "Propostas Comerciais",
    ],
    color: "from-blue-500 to-blue-700",
    route: "/captador/dashboard",
  },
  {
    type: "investidor",
    title: "Investidor",
    description: "Explore ofertas e invista em projetos tokenizados",
    icon: <TrendingUp className="w-12 h-12" />,
    features: [
      "Explorar Ofertas Disponíveis",
      "Simulações de Investimento",
      "Acompanhar Investimentos",
      "Histórico de Operações",
      "Análise de Rentabilidade",
    ],
    color: "from-green-500 to-green-700",
    route: "/investidor/dashboard",
  },
];

interface ProfileSelectorProps {
  /** Se deve mostrar como página completa ou modal */
  variant?: "page" | "compact";
  /** Callback após selecionar perfil */
  onSelect?: (profile: ProfileType) => void;
}

/**
 * Componente de seleção de perfil
 * 
 * Exibe as opções de Captador e Investidor com suas funcionalidades.
 * O usuário pode alternar entre perfis a qualquer momento.
 */
export default function ProfileSelector({ variant = "page", onSelect }: ProfileSelectorProps) {
  const { switchProfile, activeProfile } = useProfile();
  const [, setLocation] = useLocation();

  const handleSelectProfile = (option: ProfileOption) => {
    switchProfile(option.type);
    if (onSelect) {
      onSelect(option.type);
    } else {
      setLocation(option.route);
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex gap-4">
        {profileOptions.map((option) => (
          <Button
            key={option.type}
            variant={activeProfile === option.type ? "default" : "outline"}
            onClick={() => handleSelectProfile(option)}
            className="gap-2"
          >
            {option.type === "captador" ? <Building2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {option.title}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Como você quer usar o sistema?</h1>
          <p className="text-muted-foreground">
            Você pode alternar entre os perfis a qualquer momento
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {profileOptions.map((option) => (
            <Card
              key={option.type}
              className={`relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
                activeProfile === option.type ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectProfile(option)}
            >
              {/* Gradient header */}
              <div className={`h-2 bg-gradient-to-r ${option.color}`} />
              
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${option.color} text-white`}>
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{option.title}</CardTitle>
                    <CardDescription className="text-base">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-4">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button className="w-full gap-2" variant={activeProfile === option.type ? "default" : "outline"}>
                  {activeProfile === option.type ? "Perfil Ativo" : "Selecionar"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>

              {activeProfile === option.type && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                    Ativo
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          💡 Dica: Você pode trocar de perfil a qualquer momento pelo menu superior
        </p>
      </div>
    </div>
  );
}
