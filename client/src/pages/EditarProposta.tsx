import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

export default function EditarProposta() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const proposalId = parseInt(params.id || "0");

  const { data: proposal, isLoading } = trpc.proposals.getById.useQuery(
    { id: proposalId },
    { enabled: proposalId > 0 }
  );

  const [formData, setFormData] = useState({
    dataMesAno: "",
    empresa: "",
    cnpj: "",
    endereco: "",
    dataApresentacao: "",
    valorCaptacao: 0,
    nomeProjeto: "",
    lastroAtivo: "",
    visaoGeral: "",
    captacaoInicial: "",
    destinacaoRecursos: "",
    prazoExecucao: "",
    prazoCaptacao: "",
    valorFixoInicial: 0,
    taxaSucesso: 0,
    valorLiquidoTotal: 0,
  });

  useEffect(() => {
    if (proposal) {
      setFormData({
        dataMesAno: proposal.dataMesAno,
        empresa: proposal.empresa,
        cnpj: proposal.cnpj,
        endereco: proposal.endereco,
        dataApresentacao: proposal.dataApresentacao,
        valorCaptacao: proposal.valorCaptacao,
        nomeProjeto: proposal.nomeProjeto,
        lastroAtivo: proposal.lastroAtivo,
        visaoGeral: proposal.visaoGeral,
        captacaoInicial: proposal.captacaoInicial,
        destinacaoRecursos: proposal.destinacaoRecursos,
        prazoExecucao: proposal.prazoExecucao,
        prazoCaptacao: proposal.prazoCaptacao,
        valorFixoInicial: proposal.valorFixoInicial,
        taxaSucesso: proposal.taxaSucesso,
        valorLiquidoTotal: proposal.valorLiquidoTotal,
      });
    }
  }, [proposal]);

  const updateMutation = trpc.proposals.update.useMutation({
    onSuccess: () => {
      toast.success("Proposta atualizada com sucesso!");
      setLocation(`/propostas/${proposalId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar proposta: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: proposalId,
      ...formData,
    });
  };

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

  if (proposal.status !== "rascunho") {
    return (
      <div className="container py-8">
        <p>Apenas propostas em rascunho podem ser editadas.</p>
        <Button onClick={() => setLocation(`/propostas/${proposalId}`)}>
          Ver Detalhes
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation(`/propostas/${proposalId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Editar Proposta</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Página 1 - Capa */}
        <Card>
          <CardHeader>
            <CardTitle>Página 1 - Capa</CardTitle>
            <CardDescription>Data que aparecerá na capa da proposta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataMesAno">Data (Mês e Ano)</Label>
                <Input
                  id="dataMesAno"
                  placeholder="Ex: Dezembro de 2025"
                  value={formData.dataMesAno}
                  onChange={(e) => setFormData({ ...formData, dataMesAno: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Página 2 - Apresentação */}
        <Card>
          <CardHeader>
            <CardTitle>Página 2 - Apresentação</CardTitle>
            <CardDescription>Dados da empresa cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  placeholder="Nome da empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dataApresentacao">Data</Label>
                <Input
                  id="dataApresentacao"
                  placeholder="Ex: dezembro de 2025"
                  value={formData.dataApresentacao}
                  onChange={(e) => setFormData({ ...formData, dataApresentacao: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  placeholder="Endereço completo"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Página 3 - Projeto */}
        <Card>
          <CardHeader>
            <CardTitle>Página 3 - Informações do Projeto</CardTitle>
            <CardDescription>Detalhes da captação e do projeto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorCaptacao">Valor da Captação (em centavos)</Label>
                  <Input
                    id="valorCaptacao"
                    type="number"
                    placeholder="700000000 (R$ 7.000.000,00)"
                    value={formData.valorCaptacao}
                    onChange={(e) =>
                      setFormData({ ...formData, valorCaptacao: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor em centavos (ex: 700000000 = R$ 7.000.000,00)
                  </p>
                </div>
                <div>
                  <Label htmlFor="nomeProjeto">Nome do Projeto</Label>
                  <Input
                    id="nomeProjeto"
                    placeholder="Ex: Projeto Welshman"
                    value={formData.nomeProjeto}
                    onChange={(e) => setFormData({ ...formData, nomeProjeto: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lastroAtivo">Lastro/Ativo</Label>
                <Input
                  id="lastroAtivo"
                  placeholder="Ex: Imóveis comerciais"
                  value={formData.lastroAtivo}
                  onChange={(e) => setFormData({ ...formData, lastroAtivo: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="visaoGeral">Visão Geral</Label>
                <Textarea
                  id="visaoGeral"
                  placeholder="Descrição detalhada do projeto..."
                  value={formData.visaoGeral}
                  onChange={(e) => setFormData({ ...formData, visaoGeral: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="captacaoInicial">Captação Inicial Requerida</Label>
                  <Input
                    id="captacaoInicial"
                    placeholder="Ex: R$ 2.000.000,00"
                    value={formData.captacaoInicial}
                    onChange={(e) => setFormData({ ...formData, captacaoInicial: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="destinacaoRecursos">Destinação dos Recursos</Label>
                  <Input
                    id="destinacaoRecursos"
                    placeholder="Ex: Construção e comercialização"
                    value={formData.destinacaoRecursos}
                    onChange={(e) =>
                      setFormData({ ...formData, destinacaoRecursos: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prazoExecucao">Prazo de Execução/Retorno</Label>
                  <Input
                    id="prazoExecucao"
                    placeholder="Ex: 24 meses"
                    value={formData.prazoExecucao}
                    onChange={(e) => setFormData({ ...formData, prazoExecucao: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prazoCaptacao">Prazo de Captação/Remuneração</Label>
                  <Input
                    id="prazoCaptacao"
                    placeholder="Ex: 12 meses"
                    value={formData.prazoCaptacao}
                    onChange={(e) => setFormData({ ...formData, prazoCaptacao: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Página 6 - Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Página 6 - Estrutura de Custos</CardTitle>
            <CardDescription>Valores e condições de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorFixoInicial">Valor Fixo Inicial (em centavos)</Label>
                  <Input
                    id="valorFixoInicial"
                    type="number"
                    placeholder="5000000 (R$ 50.000,00)"
                    value={formData.valorFixoInicial}
                    onChange={(e) =>
                      setFormData({ ...formData, valorFixoInicial: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="taxaSucesso">Taxa de Sucesso (em centavos)</Label>
                  <Input
                    id="taxaSucesso"
                    type="number"
                    placeholder="10000000 (R$ 100.000,00)"
                    value={formData.taxaSucesso}
                    onChange={(e) =>
                      setFormData({ ...formData, taxaSucesso: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="valorLiquidoTotal">Valor Líquido Total (em centavos)</Label>
                  <Input
                    id="valorLiquidoTotal"
                    type="number"
                    placeholder="685000000 (R$ 6.850.000,00)"
                    value={formData.valorLiquidoTotal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valorLiquidoTotal: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(`/propostas/${proposalId}`)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
