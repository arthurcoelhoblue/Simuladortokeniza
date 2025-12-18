import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FileText, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Propostas() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: propostas, isLoading } = trpc.proposals.list.useQuery();

  if (loading || isLoading) {
    return (
      <div className="container py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Propostas Comerciais</h1>
          <p className="text-muted-foreground">
            Gerencie propostas de estruturação para captação via tokenização
          </p>
        </div>
        <Button onClick={() => setLocation("/propostas/nova")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      {!propostas || propostas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Nenhuma proposta criada</p>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira proposta clicando no botão acima
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {propostas.map((proposta) => (
            <Card key={proposta.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{proposta.empresa}</CardTitle>
                    <CardDescription>
                      {proposta.nomeProjeto} • {formatCurrency(proposta.valorCaptacao)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        proposta.status === "gerado"
                          ? "bg-green-100 text-green-700"
                          : proposta.status === "enviado"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {proposta.status === "gerado"
                        ? "Gerado"
                        : proposta.status === "enviado"
                        ? "Enviado"
                        : "Rascunho"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{proposta.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Fixo</p>
                    <p className="font-medium">{formatCurrency(proposta.valorFixoInicial)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa Sucesso</p>
                    <p className="font-medium">{formatCurrency(proposta.taxaSucesso)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatDate(proposta.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/propostas/${proposta.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  {proposta.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(proposta.pdfUrl!, "_blank")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
