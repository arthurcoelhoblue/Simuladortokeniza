import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NovaProposta() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  const createMutation = trpc.proposals.create.useMutation({
    onSuccess: (data) => {
      toast.success("Proposta criada com sucesso!");
      setLocation(`/propostas/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar proposta: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    // Página 1
    dataMesAno: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    
    // Página 2
    empresa: "",
    cnpj: "",
    endereco: "",
    dataApresentacao: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    
    // Página 3
    valorCaptacao: "",
    nomeProjeto: "",
    lastroAtivo: "",
    visaoGeral: "O projeto consiste na construção e comercialização de um condomínio de galpões industriais/logísticos, com captação tokenizada para investidores, direcionado a um projeto imediato com demanda regional.",
    captacaoInicial: "",
    destinacaoRecursos: "",
    prazoExecucao: "",
    prazoCaptacao: "",
    
    // Página 6
    valorFixoInicial: "",
    taxaSucesso: "",
    valorLiquidoTotal: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.empresa || !formData.cnpj || !formData.nomeProjeto) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    // Converter valores monetários de string para centavos
    const valorCaptacao = Math.round(parseFloat(formData.valorCaptacao.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
    const valorFixoInicial = Math.round(parseFloat(formData.valorFixoInicial.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
    const taxaSucesso = Math.round(parseFloat(formData.taxaSucesso.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
    const valorLiquidoTotal = Math.round(parseFloat(formData.valorLiquidoTotal.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
    
    createMutation.mutate({
      ...formData,
      valorCaptacao,
      valorFixoInicial,
      taxaSucesso,
      valorLiquidoTotal,
    });
  };

  if (loading) {
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

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/propostas")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Página 1 - Capa */}
          <Card>
            <CardHeader>
              <CardTitle>Página 1 - Capa</CardTitle>
              <CardDescription>Informações da capa da proposta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dataMesAno">Data (mês e ano)</Label>
                <Input
                  id="dataMesAno"
                  value={formData.dataMesAno}
                  onChange={(e) => setFormData({ ...formData, dataMesAno: e.target.value })}
                  placeholder="Dezembro de 2025"
                />
              </div>
            </CardContent>
          </Card>

          {/* Página 2 - Apresentação */}
          <Card>
            <CardHeader>
              <CardTitle>Página 2 - Apresentação</CardTitle>
              <CardDescription>Informações do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Projeto de Condomínio Logístico"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade, estado"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dataApresentacao">Data</Label>
                <Input
                  id="dataApresentacao"
                  value={formData.dataApresentacao}
                  onChange={(e) => setFormData({ ...formData, dataApresentacao: e.target.value })}
                  placeholder="dezembro de 2025"
                />
              </div>
            </CardContent>
          </Card>

          {/* Página 3 - Projeto */}
          <Card>
            <CardHeader>
              <CardTitle>Página 3 - Informações do Projeto</CardTitle>
              <CardDescription>Detalhes da captação e do projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="valorCaptacao">Valor da Captação (R$) *</Label>
                <Input
                  id="valorCaptacao"
                  value={formData.valorCaptacao}
                  onChange={(e) => setFormData({ ...formData, valorCaptacao: e.target.value })}
                  placeholder="7.000.000,00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nomeProjeto">Nome do Projeto *</Label>
                <Input
                  id="nomeProjeto"
                  value={formData.nomeProjeto}
                  onChange={(e) => setFormData({ ...formData, nomeProjeto: e.target.value })}
                  placeholder="Welshman"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastroAtivo">Lastro/Ativo *</Label>
                <Input
                  id="lastroAtivo"
                  value={formData.lastroAtivo}
                  onChange={(e) => setFormData({ ...formData, lastroAtivo: e.target.value })}
                  placeholder="A definir"
                  required
                />
              </div>
              <div>
                <Label htmlFor="visaoGeral">Visão Geral</Label>
                <Textarea
                  id="visaoGeral"
                  value={formData.visaoGeral}
                  onChange={(e) => setFormData({ ...formData, visaoGeral: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="captacaoInicial">Captação Inicial Requerida *</Label>
                  <Input
                    id="captacaoInicial"
                    value={formData.captacaoInicial}
                    onChange={(e) => setFormData({ ...formData, captacaoInicial: e.target.value })}
                    placeholder="R$ 7.000.000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="destinacaoRecursos">Destinação dos Recursos *</Label>
                  <Input
                    id="destinacaoRecursos"
                    value={formData.destinacaoRecursos}
                    onChange={(e) => setFormData({ ...formData, destinacaoRecursos: e.target.value })}
                    placeholder="Construção dos galpões e infraestrutura"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prazoExecucao">Prazo de Execução/Retorno *</Label>
                  <Input
                    id="prazoExecucao"
                    value={formData.prazoExecucao}
                    onChange={(e) => setFormData({ ...formData, prazoExecucao: e.target.value })}
                    placeholder="18 meses"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prazoCaptacao">Prazo de Captação/Remuneração *</Label>
                  <Input
                    id="prazoCaptacao"
                    value={formData.prazoCaptacao}
                    onChange={(e) => setFormData({ ...formData, prazoCaptacao: e.target.value })}
                    placeholder="36 meses"
                    required
                  />
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="valorFixoInicial">Valor Fixo Inicial (R$) *</Label>
                <Input
                  id="valorFixoInicial"
                  value={formData.valorFixoInicial}
                  onChange={(e) => setFormData({ ...formData, valorFixoInicial: e.target.value })}
                  placeholder="150.000,00"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Condições de Pagamento: À vista
                </p>
              </div>
              <div>
                <Label htmlFor="taxaSucesso">Taxa de Sucesso (R$) *</Label>
                <Input
                  id="taxaSucesso"
                  value={formData.taxaSucesso}
                  onChange={(e) => setFormData({ ...formData, taxaSucesso: e.target.value })}
                  placeholder="1.500.000,00"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Condição: Pagamento condicionado exclusivamente ao êxito da captação
                </p>
              </div>
              <div>
                <Label htmlFor="valorLiquidoTotal">Valor Líquido Total (R$) *</Label>
                <Input
                  id="valorLiquidoTotal"
                  value={formData.valorLiquidoTotal}
                  onChange={(e) => setFormData({ ...formData, valorLiquidoTotal: e.target.value })}
                  placeholder="10.000.000,00"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Salvando..." : "Salvar Proposta"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/propostas")}>
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
