import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLeads from "./pages/DashboardLeads";
import Home from "./pages/Home";
import NewSimulation from "./pages/NewSimulation";
import NovaProposta from "./pages/NovaProposta";
import Opportunities from "./pages/Opportunities";
import PropostaDetalhes from "./pages/PropostaDetalhes";
import Propostas from "./pages/Propostas";
import SimulationView from "./pages/SimulationView";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <Navigation />
      <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/new"} component={NewSimulation} />
      <Route path="/simulation/:id" component={SimulationView} />
      <Route path="/dashboard/leads" component={DashboardLeads} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/propostas" component={Propostas} />
      <Route path="/propostas/nova" component={NovaProposta} />
      <Route path="/propostas/:id" component={PropostaDetalhes} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
      </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
