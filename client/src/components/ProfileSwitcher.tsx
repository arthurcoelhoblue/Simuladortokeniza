import { useProfile, ProfileType } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, TrendingUp, ChevronDown, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Componente de troca rápida de perfil
 * 
 * Exibe o perfil ativo e permite alternar entre Captador e Investidor
 * através de um dropdown no header.
 */
export default function ProfileSwitcher() {
  const { activeProfile, switchProfile } = useProfile();
  const [, setLocation] = useLocation();

  const profiles: { type: ProfileType; label: string; icon: React.ReactNode; route: string }[] = [
    { type: "captador", label: "Captador", icon: <Building2 className="w-4 h-4" />, route: "/captador/dashboard" },
    { type: "investidor", label: "Investidor", icon: <TrendingUp className="w-4 h-4" />, route: "/investidor/dashboard" },
  ];

  const currentProfile = profiles.find((p) => p.type === activeProfile);

  const handleSwitch = (profile: typeof profiles[0]) => {
    switchProfile(profile.type);
    setLocation(profile.route);
  };

  if (!activeProfile) {
    return (
      <Button variant="outline" size="sm" onClick={() => setLocation("/selecionar-perfil")}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Selecionar Perfil
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentProfile?.icon}
          <span className="hidden sm:inline">{currentProfile?.label}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Trocar Perfil</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.type}
            onClick={() => handleSwitch(profile)}
            className={`gap-2 cursor-pointer ${activeProfile === profile.type ? "bg-accent" : ""}`}
          >
            {profile.icon}
            {profile.label}
            {activeProfile === profile.type && (
              <span className="ml-auto text-xs text-muted-foreground">Ativo</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
