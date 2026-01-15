import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { AlertCircle, BarChart3, TrendingUp, Users, ChevronRight } from "lucide-react";
import { Redirect } from "wouter";
import LeadListModal from "@/components/LeadListModal";

type FilterType = 
  | "all" 
  | "today" 
  | "week" 
  | "month"
  | "with_simulation"
  | "without_simulation"
  | "with_opportunity"
  | "without_opportunity"
  | "without_whatsapp"
  | "without_email"
  | "without_location"
  | "investidor"
  | "emissor"
  | "by_origin";

/**
 * Dashboard de Leads (Lead Leader)
 * Acesso restrito a administradores
 */
export default function DashboardLeads() {
  const { user, loading: authLoading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<string | undefined>();
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState<string | undefined>();

  // Verificar se usuário é admin pelo campo role ou por emails específicos
  const isAdmin = user?.role === "admin" || 
    user?.email === "arthur@blueconsult.com.br" || 
    user?.email === "arthurcsantos@gmail.com";

  // Carregar métricas
  const { data, isLoading, error } = trpc.dashboard.getLeadMetrics.useQuery(undefined, {
    enabled: isAdmin,
  });

  const openModal = (filter: FilterType, title: string, description?: string, origin?: string) => {
    setSelectedFilter(filter);
    setSelectedOrigin(origin);
    setModalTitle(title);
    setModalDescription(description);
    setModalOpen(true);
  };

  // Controle de acesso visual
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erro ao Carregar Dashboard
            </CardTitle>
            <CardDescription>
              {error.message || "Não foi possível carregar as métricas de leads."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Lead Leader</h1>
        <p className="text-muted-foreground">
          Dashboard interno de leads gerados pelo simulador
        </p>
      </div>

      {isLoading && <DashboardSkeleton />}

      {data && (
        <>
          {/* Cards Principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total de Leads"
              value={data.totalLeads}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              onClick={() => openModal("all", "Todos os Leads", `${data.totalLeads} leads no total`)}
            />
            <MetricCard
              title="Leads Hoje"
              value={data.leadsHoje}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              trend={data.leadsHoje > 0 ? "up" : undefined}
              onClick={() => openModal("today", "Leads de Hoje", `${data.leadsHoje} leads capturados hoje`)}
            />
            <MetricCard
              title="Leads na Semana"
              value={data.leadsSemana}
              icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
              onClick={() => openModal("week", "Leads da Semana", `${data.leadsSemana} leads esta semana`)}
            />
            <MetricCard
              title="Leads no Mês"
              value={data.leadsMes}
              icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
              onClick={() => openModal("month", "Leads do Mês", `${data.leadsMes} leads este mês`)}
            />
          </div>

          {/* Engajamento */}
          <Section title="Engajamento">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Leads com Simulação"
                value={data.leadsComSimulacoes}
                subtitle={`${Math.round((data.leadsComSimulacoes / data.totalLeads) * 100)}% do total`}
                onClick={() => openModal("with_simulation", "Leads com Simulação", "Leads que realizaram pelo menos uma simulação")}
              />
              <MetricCard
                title="Leads sem Simulação"
                value={data.leadsSemSimulacoes}
                subtitle={`${Math.round((data.leadsSemSimulacoes / data.totalLeads) * 100)}% do total`}
                onClick={() => openModal("without_simulation", "Leads sem Simulação", "Leads que ainda não realizaram simulação")}
              />
              <MetricCard
                title="Leads com Oportunidade"
                value={data.leadsComOportunidades}
                subtitle={`${Math.round((data.leadsComOportunidades / data.totalLeads) * 100)}% do total`}
                onClick={() => openModal("with_opportunity", "Leads com Oportunidade", "Leads convertidos em oportunidade")}
              />
              <MetricCard
                title="Leads sem Oportunidade"
                value={data.leadsSemOportunidades}
                subtitle={`${Math.round((data.leadsSemOportunidades / data.totalLeads) * 100)}% do total`}
                onClick={() => openModal("without_opportunity", "Leads sem Oportunidade", "Leads ainda não convertidos")}
              />
            </div>
          </Section>

          {/* Origem dos Leads */}
          <Section title="Origem dos Leads">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal de Origem</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">% do Total</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.porOrigem.map((item) => (
                      <TableRow 
                        key={item.canalOrigem}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openModal("by_origin", `Leads: ${item.canalOrigem}`, `${item.total} leads desta origem`, item.canalOrigem)}
                      >
                        <TableCell className="font-medium">{item.canalOrigem}</TableCell>
                        <TableCell className="text-right">{item.total}</TableCell>
                        <TableCell className="text-right">
                          {Math.round((item.total / data.totalLeads) * 100)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight className="h-4 w-4 inline-block text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Section>

          {/* Perfil por Tipo */}
          <Section title="Perfil por Tipo">
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard
                title="Investidores"
                value={data.porTipo.investidor}
                subtitle="Leads com simulações de investimento"
                onClick={() => openModal("investidor", "Leads Investidores", "Leads que simularam investimentos")}
              />
              <MetricCard
                title="Emissores"
                value={data.porTipo.emissor}
                subtitle="Leads com simulações de financiamento"
                onClick={() => openModal("emissor", "Leads Emissores", "Leads que simularam captação")}
              />
            </div>
          </Section>

          {/* TOP 10 por Intenção */}
          <Section title="TOP 10 por Intenção (Score Tokeniza)">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Simulação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topIntencao.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhuma oportunidade com score disponível
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.topIntencao.map((lead) => (
                        <TableRow key={lead.leadId}>
                          <TableCell className="font-medium">{lead.nome}</TableCell>
                          <TableCell>{lead.whatsapp || "-"}</TableCell>
                          <TableCell>{lead.email || "-"}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                              {lead.tipoSimulacao === "investimento" ? "Investidor" : "Emissor"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-lg">{lead.tokenizaScore}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <a
                              href={`/simulation/${lead.ultimaSimulacaoId}`}
                              className="text-primary hover:underline"
                            >
                              #{lead.ultimaSimulacaoId}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Section>

          {/* Dados Faltantes */}
          <Section title="Dados Faltantes">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Leads sem WhatsApp"
                value={data.dadosFaltantes.semWhatsapp}
                subtitle={`${Math.round((data.dadosFaltantes.semWhatsapp / data.totalLeads) * 100)}% do total`}
                variant="warning"
                onClick={() => openModal("without_whatsapp", "Leads sem WhatsApp", "Leads sem número de WhatsApp cadastrado")}
              />
              <MetricCard
                title="Leads sem Email"
                value={data.dadosFaltantes.semEmail}
                subtitle={`${Math.round((data.dadosFaltantes.semEmail / data.totalLeads) * 100)}% do total`}
                variant="warning"
                onClick={() => openModal("without_email", "Leads sem Email", "Leads sem email cadastrado")}
              />
              <MetricCard
                title="Leads sem Cidade/Estado"
                value={data.dadosFaltantes.semCidadeOuEstado}
                subtitle={`${Math.round((data.dadosFaltantes.semCidadeOuEstado / data.totalLeads) * 100)}% do total`}
                variant="warning"
                onClick={() => openModal("without_location", "Leads sem Localização", "Leads sem cidade ou estado cadastrado")}
              />
            </div>
          </Section>
        </>
      )}

      {/* Modal de Lista de Leads */}
      <LeadListModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        filter={selectedFilter}
        origin={selectedOrigin}
        title={modalTitle}
        description={modalDescription}
      />
    </div>
  );
}

// Componentes auxiliares

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down";
  variant?: "default" | "warning";
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, icon, trend, variant = "default", onClick }: MetricCardProps) {
  return (
    <Card 
      className={`${variant === "warning" ? "border-orange-500/50" : ""} ${onClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {trend === "up" && <span className="text-green-500 text-sm ml-2">↑</span>}
          {trend === "down" && <span className="text-red-500 text-sm ml-2">↓</span>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
