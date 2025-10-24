import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calculator } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NewSimulation() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    // Dados da oferta
    descricaoOferta: "",
    valorTotalOferta: "",
    valorInvestido: "",
    dataEncerramentoOferta: new Date().toISOString().split("T")[0],
    prazoMeses: "24",
    taxaJurosAa: "2400", // 24% em centésimos
    convencaoCalendario: "civil/365" as const,
    tipoCapitalizacao: "composta" as const,

    // Regras de pagamento
    periodicidadeJuros: "mensal" as const,
    periodicidadeAmortizacao: "mensal" as const,
    carenciaJurosMeses: "0",
    carenciaPrincipalMeses: "0",
    capitalizarJurosEmCarencia: true,
    amortizacaoMetodo: "linear" as const,

    // Custos e taxas (opcionais)
    taxaSetupFixaBrl: "",
    feeSucessoPercentSobreCaptacao: "",
    feeManutencaoMensalBrl: "",
  });

  const createMutation = trpc.simulations.create.useMutation({
    onSuccess: (data) => {
      toast.success("Simulação criada com sucesso!");
      setLocation(`/simulation/${data.simulationId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar simulação");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Converte valores de string para número (em centavos)
    createMutation.mutate({
      descricaoOferta: formData.descricaoOferta || undefined,
      valorTotalOferta: parseFloat(formData.valorTotalOferta) * 100,
      valorInvestido: parseFloat(formData.valorInvestido) * 100,
      dataEncerramentoOferta: formData.dataEncerramentoOferta,
      prazoMeses: parseInt(formData.prazoMeses),
      taxaJurosAa: parseInt(formData.taxaJurosAa),
      convencaoCalendario: formData.convencaoCalendario,
      tipoCapitalizacao: formData.tipoCapitalizacao,
      periodicidadeJuros: formData.periodicidadeJuros,
      periodicidadeAmortizacao: formData.periodicidadeAmortizacao,
      carenciaJurosMeses: parseInt(formData.carenciaJurosMeses) || 0,
      carenciaPrincipalMeses: parseInt(formData.carenciaPrincipalMeses) || 0,
      capitalizarJurosEmCarencia: formData.capitalizarJurosEmCarencia,
      amortizacaoMetodo: formData.amortizacaoMetodo,
      taxaSetupFixaBrl: formData.taxaSetupFixaBrl ? parseInt(formData.taxaSetupFixaBrl) : undefined,
      feeSucessoPercentSobreCaptacao: formData.feeSucessoPercentSobreCaptacao ? parseInt(formData.feeSucessoPercentSobreCaptacao) : undefined,
      feeManutencaoMensalBrl: formData.feeManutencaoMensalBrl ? parseInt(formData.feeManutencaoMensalBrl) : undefined,
      taxaTransacaoPercent: undefined,
      aliquotaImpostoRendaPercent: undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Nova Simulação</h1>
          <p className="text-muted-foreground mt-2">
            Configure os parâmetros da simulação de investimento tokenizado
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Oferta */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Oferta</CardTitle>
              <CardDescription>Informações básicas sobre a oferta de investimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descricaoOferta">Descrição da Oferta (opcional)</Label>
                <Textarea
                  id="descricaoOferta"
                  value={formData.descricaoOferta}
                  onChange={(e) => setFormData({ ...formData, descricaoOferta: e.target.value })}
                  placeholder="Ex: Capital de giro para expansão"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorTotalOferta">Valor Total da Oferta (R$)</Label>
                  <Input
                    id="valorTotalOferta"
                    type="number"
                    step="0.01"
                    required
                    value={formData.valorTotalOferta}
                    onChange={(e) => setFormData({ ...formData, valorTotalOferta: e.target.value })}
                    placeholder="5000000.00"
                  />
                </div>

                <div>
                  <Label htmlFor="valorInvestido">Valor Investido (R$)</Label>
                  <Input
                    id="valorInvestido"
                    type="number"
                    step="0.01"
                    required
                    value={formData.valorInvestido}
                    onChange={(e) => setFormData({ ...formData, valorInvestido: e.target.value })}
                    placeholder="100000.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataEncerramentoOferta">Data de Encerramento da Oferta</Label>
                  <Input
                    id="dataEncerramentoOferta"
                    type="date"
                    required
                    value={formData.dataEncerramentoOferta}
                    onChange={(e) => setFormData({ ...formData, dataEncerramentoOferta: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                  <Input
                    id="prazoMeses"
                    type="number"
                    required
                    value={formData.prazoMeses}
                    onChange={(e) => setFormData({ ...formData, prazoMeses: e.target.value })}
                    placeholder="24"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxaJurosAa">Taxa de Juros (% a.a.)</Label>
                  <Input
                    id="taxaJurosAa"
                    type="number"
                    step="0.01"
                    required
                    value={(parseInt(formData.taxaJurosAa) / 100).toFixed(2)}
                    onChange={(e) =>
                      setFormData({ ...formData, taxaJurosAa: (parseFloat(e.target.value) * 100).toString() })
                    }
                    placeholder="24.00"
                  />
                </div>

                <div>
                  <Label htmlFor="tipoCapitalizacao">Tipo de Capitalização</Label>
                  <Select
                    value={formData.tipoCapitalizacao}
                    onValueChange={(value: any) => setFormData({ ...formData, tipoCapitalizacao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="composta">Composta</SelectItem>
                      <SelectItem value="simples">Simples</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regras de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Regras de Pagamento</CardTitle>
              <CardDescription>Configure periodicidade, carências e método de amortização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amortizacaoMetodo">Método de Amortização</Label>
                  <Select
                    value={formData.amortizacaoMetodo}
                    onValueChange={(value: any) => setFormData({ ...formData, amortizacaoMetodo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear (Amortização Constante)</SelectItem>
                      <SelectItem value="bullet">Bullet (Pagamento no Fim)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="periodicidadeJuros">Periodicidade de Juros</Label>
                  <Select
                    value={formData.periodicidadeJuros}
                    onValueChange={(value: any) => setFormData({ ...formData, periodicidadeJuros: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="no_fim">No Fim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carenciaJurosMeses">Carência de Juros (meses)</Label>
                  <Input
                    id="carenciaJurosMeses"
                    type="number"
                    value={formData.carenciaJurosMeses}
                    onChange={(e) => setFormData({ ...formData, carenciaJurosMeses: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="carenciaPrincipalMeses">Carência de Principal (meses)</Label>
                  <Input
                    id="carenciaPrincipalMeses"
                    type="number"
                    value={formData.carenciaPrincipalMeses}
                    onChange={(e) => setFormData({ ...formData, carenciaPrincipalMeses: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="capitalizarJuros"
                  checked={formData.capitalizarJurosEmCarencia}
                  onChange={(e) =>
                    setFormData({ ...formData, capitalizarJurosEmCarencia: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="capitalizarJuros" className="cursor-pointer">
                  Capitalizar juros durante carência
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Custos e Taxas */}
          <Card>
            <CardHeader>
              <CardTitle>Custos e Taxas (Opcional)</CardTitle>
              <CardDescription>Custos do captador - deixe em branco se não aplicável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="taxaSetup">Taxa de Setup (R$)</Label>
                  <Input
                    id="taxaSetup"
                    type="number"
                    step="0.01"
                    value={formData.taxaSetupFixaBrl ? (parseInt(formData.taxaSetupFixaBrl) / 100).toFixed(2) : ""}
                    onChange={(e) =>
                      setFormData({ ...formData, taxaSetupFixaBrl: e.target.value ? (parseFloat(e.target.value) * 100).toString() : "" })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="feeSucesso">Fee de Sucesso (%)</Label>
                  <Input
                    id="feeSucesso"
                    type="number"
                    step="0.01"
                    value={formData.feeSucessoPercentSobreCaptacao ? (parseInt(formData.feeSucessoPercentSobreCaptacao) / 100).toFixed(2) : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSucessoPercentSobreCaptacao: e.target.value ? (parseFloat(e.target.value) * 100).toString() : "",
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="feeManutencao">Fee Manutenção Mensal (R$)</Label>
                  <Input
                    id="feeManutencao"
                    type="number"
                    step="0.01"
                    value={formData.feeManutencaoMensalBrl ? (parseInt(formData.feeManutencaoMensalBrl) / 100).toFixed(2) : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeManutencaoMensalBrl: e.target.value ? (parseFloat(e.target.value) * 100).toString() : "",
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={createMutation.isPending} className="flex-1">
              <Calculator className="mr-2 h-5 w-5" />
              {createMutation.isPending ? "Calculando..." : "Calcular Simulação"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

