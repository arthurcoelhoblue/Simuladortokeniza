import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { BarChart3, FileText, Home, LogOut, Plus, Target } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

export default function Navigation() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const isAdmin = user?.email === "arthur@blueconsult.com.br" || user?.email === "arthurcsantos@gmail.com";

  const navItems = [
    { path: "/", label: "Início", icon: Home, public: true },
    { path: "/new", label: "Nova Simulação", icon: Plus, public: false },
    { path: "/opportunities", label: "Oportunidades", icon: Target, public: false },
    { path: "/dashboard/leads", label: "Dashboard", icon: BarChart3, public: false, adminOnly: true },
    { path: "/propostas", label: "Propostas", icon: FileText, public: false, adminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.public && !isAuthenticated) return false;
    return true;
  });

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
            <span>{APP_TITLE}</span>
          </button>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
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

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-sm text-muted-foreground">Carregando...</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.name || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
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
            const isActive = location === item.path;
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
