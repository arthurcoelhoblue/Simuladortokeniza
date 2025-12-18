import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function PropostaDetalhes() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const proposalId = parseInt(params.id || "0");

  const { data: proposal, isLoading, refetch } = trpc.proposals.getById.useQuery(
    { id: proposalId },
    { enabled: proposalId > 0 }
  );

  const generatePDFMutation = trpc.proposals.generatePDF.useMutation({
    onSuccess: (data) => {
      toast.success("PDF gerado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    },
  });

  if (authLoading || isLoading) {
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

  if (!proposal) {
    return (
      <div className="container py-8">
        <p>Proposta não encontrada.</p>
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
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/propostas")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{proposal.empresa}</h1>
          <p className="text-muted-foreground">{proposal.nomeProjeto}</p>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 text-sm rounded-full ${
              proposal.status === "gerado"
                ? "bg-green-100 text-green-700"
                : proposal.status === "enviado"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {proposal.status === "gerado"
              ? "Gerado"
              : proposal.status === "enviado"
              ? "Enviado"
              : "Rascunho"}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 mb-6">
        {!proposal.pdfUrl && (
          <Button
            onClick={() => generatePDFMutation.mutate({ id: proposal.id })}
            disabled={generatePDFMutation.isPending}
          >
            {generatePDFMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        )}
        {proposal.pdfUrl && (
          <Button onClick={() => window.open(proposal.pdfUrl!, "_blank")}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Página 1 - Capa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Página 1 - Capa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Data:</span> {proposal.dataMesAno}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Página 2 - Apresentação */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Página 2 - Apresentação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Empresa:</span>
              <p>{proposal.empresa}</p>
            </div>
            <div>
              <span className="font-medium">CNPJ:</span>
              <p>{proposal.cnpj}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Endereço:</span>
              <p>{proposal.endereco}</p>
            </div>
            <div>
              <span className="font-medium">Data:</span>
              <p>{proposal.dataApresentacao}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Página 3 - Projeto */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Página 3 - Informações do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Valor da Captação:</span>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(proposal.valorCaptacao)}
              </p>
            </div>
            <div>
              <span className="font-medium">Nome do Projeto:</span>
              <p>{proposal.nomeProjeto}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Lastro/Ativo:</span>
              <p>{proposal.lastroAtivo}</p>
            </div>
          </div>

          <div>
            <span className="font-medium">Visão Geral:</span>
            <p className="mt-2 text-muted-foreground">{proposal.visaoGeral}</p>
          </div>

          <div>
            <span className="font-medium">Especificações Principais:</span>
            <ul className="mt-2 space-y-2 list-disc list-inside">
              <li>
                <strong>Captação inicial:</strong> {proposal.captacaoInicial}
              </li>
              <li>
                <strong>Destinação dos recursos:</strong> {proposal.destinacaoRecursos}
              </li>
              <li>
                <strong>Prazo de execução:</strong> {proposal.prazoExecucao}
              </li>
              <li>
                <strong>Prazo de captação:</strong> {proposal.prazoCaptacao}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Página 6 - Valores */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Página 6 - Estrutura de Custos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="font-medium">Valor Fixo Inicial:</span>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(proposal.valorFixoInicial)}
            </p>
            <p className="text-sm text-muted-foreground">Condições: À vista</p>
          </div>

          <div>
            <span className="font-medium">Taxa de Sucesso:</span>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(proposal.taxaSucesso)}
            </p>
            <p className="text-sm text-muted-foreground">
              Condição: Pagamento condicionado ao êxito da captação
            </p>
          </div>

          <div className="pt-4 border-t">
            <span className="font-medium">Valor Líquido Total:</span>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(proposal.valorLiquidoTotal)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metadados */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Criado em:</span>
              <p>{formatDate(proposal.createdAt)}</p>
            </div>
            <div>
              <span className="font-medium">Atualizado em:</span>
              <p>{formatDate(proposal.updatedAt)}</p>
            </div>
            {proposal.pdfUrl && (
              <div className="col-span-2">
                <span className="font-medium">URL do PDF:</span>
                <p className="text-xs text-muted-foreground break-all">{proposal.pdfUrl}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
