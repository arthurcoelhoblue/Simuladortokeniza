import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { LeadProvider } from "./contexts/LeadContext";

// Páginas compartilhadas
import Home from "./pages/Home";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import SimulationView from "./pages/SimulationView";

// Páginas do Captador
import CaptadorDashboard from "./pages/CaptadorDashboard";
import ViabilidadeList from "./pages/ViabilidadeList";
import ViabilidadeNova from "./pages/ViabilidadeNova";
import ViabilidadeDetalhes from "./pages/ViabilidadeDetalhes";
import ViabilidadeComparacao from "./pages/ViabilidadeComparacao";
import NewSimulation from "./pages/NewSimulation";
import DashboardLeads from "./pages/DashboardLeads";
import Propostas from "./pages/Propostas";
import NovaProposta from "./pages/NovaProposta";
import EditarProposta from "./pages/EditarProposta";
import PropostaDetalhes from "./pages/PropostaDetalhes";
import Opportunities from "./pages/Opportunities";
import OfertasTokeniza from "./pages/OfertasTokeniza";

// Páginas do Investidor
import InvestidorDashboard from "./pages/InvestidorDashboard";
import NovaSimulacao from "./pages/NovaSimulacao";
import SelecionarModoInvestidor from "./pages/SelecionarModoInvestidor";
import MeusInvestimentos from "./pages/MeusInvestimentos";
import HistoricoInvestidor from "./pages/HistoricoInvestidor";
import OnboardingTour from "./components/OnboardingTour";
import LeadCapturePage from "./pages/LeadCapturePage";

// Páginas de Autenticação
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";

// Páginas de Administração
import AdminPermissoes from "./pages/AdminPermissoes";

function Router() {
  return (
    <>
      <Navigation />
      <OnboardingTour />
      <Switch>
        {/* ========== ROTAS PÚBLICAS ========== */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/esqueci-senha" component={EsqueciSenha} />
        <Route path="/selecionar-perfil" component={SelecionarPerfil} />
        <Route path="/capturar-lead" component={LeadCapturePage} />
        
        {/* ========== ROTAS DO CAPTADOR ========== */}
        {/* Dashboard principal do captador */}
        <Route path="/captador/dashboard" component={CaptadorDashboard} />
        
        {/* Análise de Viabilidade */}
        <Route path="/captador/viabilidade" component={ViabilidadeList} />
        <Route path="/captador/viabilidade/nova" component={ViabilidadeNova} />
        <Route path="/captador/viabilidade/comparacao" component={ViabilidadeComparacao} />
        <Route path="/captador/viabilidade/:id" component={ViabilidadeDetalhes} />
        
        {/* Simulações de Captação */}
        <Route path="/captador/simulacoes/nova" component={NewSimulation} />
        <Route path="/captador/simulacoes/:id" component={SimulationView} />
        
        {/* Propostas */}
        <Route path="/captador/propostas" component={Propostas} />
        <Route path="/captador/propostas/nova" component={NovaProposta} />
        <Route path="/captador/propostas/:id/editar" component={EditarProposta} />
        <Route path="/captador/propostas/:id" component={PropostaDetalhes} />
        
        {/* Dashboard de Leads */}
        <Route path="/captador/leads" component={DashboardLeads} />
        
        {/* Administração */}
        <Route path="/admin/permissoes" component={AdminPermissoes} />
        
        {/* Oportunidades (funil de vendas) */}
        <Route path="/captador/oportunidades" component={Opportunities} />
        
        {/* ========== ROTAS DO INVESTIDOR ========== */}
        {/* Dashboard principal do investidor */}
        <Route path="/investidor/dashboard" component={InvestidorDashboard} />
        
        {/* Simulações de Investimento */}
        <Route path="/investidor/simulacoes" component={NovaSimulacao} />
        <Route path="/investidor/simulacoes/nova" component={SelecionarModoInvestidor} />
        <Route path="/investidor/simulacoes/:id" component={SimulationView} />
        
        {/* Ofertas disponíveis */}
        <Route path="/investidor/ofertas" component={OfertasTokeniza} />
        
        {/* Meus Investimentos */}
        <Route path="/investidor/investimentos" component={MeusInvestimentos} />
        
        {/* Histórico de Transações */}
        <Route path="/investidor/historico" component={HistoricoInvestidor} />
        
        {/* ========== ROTAS LEGADAS (redirecionamentos) ========== */}
        {/* Manter compatibilidade com URLs antigas */}
        <Route path="/nova-simulacao" component={NovaSimulacao} />
        <Route path="/nova-simulacao/captador" component={NewSimulation} />
        <Route path="/nova-simulacao/investidor" component={SelecionarModoInvestidor} />
        <Route path="/new" component={NewSimulation} />
        <Route path="/simulation/:id" component={SimulationView} />
        <Route path="/dashboard/leads" component={DashboardLeads} />
        <Route path="/opportunities" component={Opportunities} />
        <Route path="/propostas" component={Propostas} />
        <Route path="/propostas/nova" component={NovaProposta} />
        <Route path="/propostas/:id/editar" component={EditarProposta} />
        <Route path="/propostas/:id" component={PropostaDetalhes} />
        <Route path="/captador/viabilidade-comparacao" component={ViabilidadeComparacao} />
        
        {/* ========== 404 ========== */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <ProfileProvider>
          <LeadProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </LeadProvider>
        </ProfileProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
