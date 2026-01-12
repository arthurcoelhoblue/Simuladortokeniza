import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Calendar,
  TrendingUp,
  Shield,
  Calculator,
  Search,
  Filter,
  ArrowRight,
  Percent,
  Clock,
  DollarSign
} from "lucide-react";

export default function OfertasTokeniza() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoAtivoFilter, setTipoAtivoFilter] = useState<string | undefined>(undefined);
  const [garantiaFilter, setGarantiaFilter] = useState<string | undefined>(undefined);

  // Buscar ofertas ativas
  const { data: ofertas, isLoading, error } = trpc.offers.listActive.useQuery();

  // Filtrar ofertas
  const filteredOfertas = ofertas?.filter((oferta) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchNome = oferta.nome?.toLowerCase().includes(searchLower);
      const matchDescricao = oferta.descricao?.toLowerCase().includes(searchLower);
      const matchTipo = oferta.tipoAtivo?.toLowerCase().includes(searchLower);
      if (!matchNome && !matchDescricao && !matchTipo) return false;
    }

    // Filtro de tipo de ativo
    if (tipoAtivoFilter && oferta.tipoAtivo !== tipoAtivoFilter) return false;

    // Filtro de garantia
    if (garantiaFilter && oferta.tipoGarantia !== garantiaFilter) return false;

    return true;
  });

  // Tipos únicos de ativos para o filtro
  const tiposAtivo = ofertas ? Array.from(new Set(ofertas.map(o => o.tipoAtivo).filter(Boolean))) : [];
  const tiposGarantia = ofertas ? Array.from(new Set(ofertas.map(o => o.tipoGarantia).filter(Boolean))) : [];

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("pt-BR");
  };

  const getGarantiaBadgeColor = (garantia: string | null) => {
    if (!garantia) return "bg-gray-500";
    const colors: Record<string, string> = {
      imovel: "bg-emerald-500",
      recebiveis: "bg-blue-500",
      aval: "bg-yellow-500",
      alienacao_fiduciaria: "bg-purple-500",
      sem_garantia: "bg-red-500",
    };
    return colors[garantia] || "bg-gray-500";
  };

  const getGarantiaLabel = (garantia: string | null) => {
    if (!garantia) return "N/A";
    const labels: Record<string, string> = {
      imovel: "Imóvel",
      recebiveis: "Recebíveis",
      aval: "Aval",
      alienacao_fiduciaria: "Alienação Fiduciária",
      sem_garantia: "Sem Garantia",
    };
    return labels[garantia] || garantia;
  };

  const handleSimular = (ofertaId: number) => {
    // Redirecionar para simulação com a oferta selecionada
    setLocation(`/investidor/simulacoes?offerId=${ofertaId}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Ofertas Tokeniza</h1>
          </div>
          <p className="text-muted-foreground">
            Explore as oportunidades de investimento tokenizado disponíveis
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, descrição ou tipo de ativo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tipo de Ativo */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Ativo</label>
                <Select
                  value={tipoAtivoFilter || "todos"}
                  onValueChange={(value) =>
                    setTipoAtivoFilter(value === "todos" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {tiposAtivo.map((tipo) => (
                      <SelectItem key={tipo} value={tipo!}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Garantia */}
              <div>
                <label className="text-sm font-medium mb-2 block">Garantia</label>
                <Select
                  value={garantiaFilter || "todos"}
                  onValueChange={(value) =>
                    setGarantiaFilter(value === "todos" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {tiposGarantia.map((garantia) => (
                      <SelectItem key={garantia} value={garantia!}>
                        {getGarantiaLabel(garantia!)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ofertas */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Carregando ofertas...
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">
            Erro ao carregar ofertas: {error.message}
          </div>
        )}

        {!isLoading && !error && filteredOfertas && filteredOfertas.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma oferta encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || tipoAtivoFilter || garantiaFilter
                  ? "Tente ajustar os filtros para encontrar ofertas."
                  : "Não há ofertas disponíveis no momento."}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && filteredOfertas && filteredOfertas.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredOfertas.length} oferta(s) encontrada(s)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOfertas.map((oferta) => (
                <Card key={oferta.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{oferta.nome}</CardTitle>
                        <CardDescription className="mt-1">
                          {oferta.tipoAtivo || "Ativo Tokenizado"}
                        </CardDescription>
                      </div>
                      <Badge className={`${getGarantiaBadgeColor(oferta.tipoGarantia)} text-white`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {getGarantiaLabel(oferta.tipoGarantia)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    {oferta.descricao && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {oferta.descricao}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      {/* Rentabilidade */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Rentabilidade
                        </span>
                        <span className="font-semibold text-green-500">
                          {formatPercent(oferta.taxaAnual ? oferta.taxaAnual / 100 : null)} a.a.
                        </span>
                      </div>

                      {/* Investimento Mínimo */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Mínimo
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(oferta.valorMinimo ? oferta.valorMinimo / 100 : null)}
                        </span>
                      </div>

                      {/* Prazo */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Prazo
                        </span>
                        <span className="font-semibold">
                          {oferta.prazoMeses} meses
                        </span>
                      </div>

                      {/* Data de Encerramento */}
                      {oferta.dataEncerramento && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Encerramento
                          </span>
                          <span className="font-semibold">
                            {formatDate(oferta.dataEncerramento)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t">
                    <Button 
                      className="w-full gap-2"
                      onClick={() => handleSimular(oferta.id)}
                    >
                      <Calculator className="h-4 w-4" />
                      Simular Investimento
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
