import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { 
  BarChart3, 
  FileText, 
  Home, 
  LogOut, 
  Plus, 
  Target, 
  Building2, 
  TrendingUp,
  Calculator,
  Users,
  Briefcase,
  PieChart,
  Wallet,
  History
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import ProfileSwitcher from "./ProfileSwitcher";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  public?: boolean;
  adminOnly?: boolean;
}

// Itens de navegação para Captador
const captadorNavItems: NavItem[] = [
  { path: "/captador/dashboard", label: "Dashboard", icon: Home },
  { path: "/captador/viabilidade", label: "Viabilidade", icon: Calculator },
  { path: "/captador/simulacoes/nova", label: "Nova Captação", icon: Plus },
  { path: "/captador/oportunidades", label: "Oportunidades", icon: Target },
  { path: "/captador/propostas", label: "Propostas", icon: FileText, adminOnly: true },
  { path: "/captador/leads", label: "Leads", icon: Users, adminOnly: true },
];

// Itens de navegação para Investidor
const investidorNavItems: NavItem[] = [
  { path: "/investidor/dashboard", label: "Dashboard", icon: Home },
  { path: "/investidor/ofertas", label: "Ofertas", icon: Briefcase },
  { path: "/investidor/simulacoes/nova", label: "Simular", icon: Calculator },
  { path: "/investidor/investimentos", label: "Investimentos", icon: Wallet },
  { path: "/investidor/historico", label: "Histórico", icon: History },
];

// Itens públicos (sem perfil selecionado)
const publicNavItems: NavItem[] = [
  { path: "/", label: "Início", icon: Home, public: true },
];

export default function Navigation() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { activeProfile } = useProfile();
  const [location, setLocation] = useLocation();

  const isAdmin = user?.email === "arthur@blueconsult.com.br" || user?.email === "arthurcsantos@gmail.com";

  // Determinar quais itens de navegação mostrar baseado no perfil ativo
  const getNavItems = (): NavItem[] => {
    if (!isAuthenticated) {
      return publicNavItems;
    }

    if (activeProfile === "captador") {
      return captadorNavItems;
    }

    if (activeProfile === "investidor") {
      return investidorNavItems;
    }

    // Sem perfil selecionado, mostrar apenas início
    return publicNavItems;
  };

  const navItems = getNavItems();

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.public && !isAuthenticated) return false;
    return true;
  });

  // Verificar se a rota atual pertence ao perfil ativo
  const isRouteActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return location === path;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <span className="hidden sm:inline">{APP_TITLE}</span>
          </button>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLocation(item.path)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Auth Section + Profile Switcher */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-muted-foreground">Carregando...</span>
          ) : isAuthenticated && user ? (
            <>
              {/* Profile Switcher */}
              <ProfileSwitcher />
              
              {/* User info */}
              <span className="hidden lg:inline text-sm text-muted-foreground">
                {user.name || user.email}
              </span>
              
              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sair</span>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>
              Entrar
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t">
        <div className="container flex items-center gap-1 py-2 overflow-x-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.path);
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation(item.path)}
                className="gap-2 whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
