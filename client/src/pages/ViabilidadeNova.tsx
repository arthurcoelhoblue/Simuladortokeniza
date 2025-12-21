import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

/**
 * Formulário simplificado de análise de viabilidade
 * Baseado na planilha de simulação fornecida
 */
export default function ViabilidadeNova() {
  const [, setLocation] = useLocation();
  
  // Pegar query param fromSimulationId
  const qs = new URLSearchParams(window.location.search);
  const fromSimulationId = qs.get("fromSimulationId");
  
  // Buscar simulação se fromSimulationId existir
  const simulationQuery = trpc.simulations.getById.useQuery(
    { id: parseInt(fromSimulationId!) },
    { enabled: !!fromSimulationId }
  );
  const [formData, setFormData] = useState({
    nome: "",
    // Captação
    valorCaptacao: "",
    coInvestimento: "20", // 20%
    feeFixo: "25000",
    taxaSucesso: "5", // 5%
    // Remuneração
    taxaJurosMensal: "1.85", // 1.85%
    prazoMeses: "48",
    carenciaMeses: "6",
    modeloPagamento: "SAC" as "SAC" | "PRICE" | "BULLET",
    // CAPEX
    capexObras: "",
    capexEquipamentos: "",
    capexLicencas: "",
    capexMarketing: "",
    capexCapitalGiro: "",
    capexOutros: "0",
    // OPEX
    opexAluguel: "",
    opexPessoal: "",
    opexRoyalties: "",
    opexMarketing: "",
    opexUtilidades: "",
    opexManutencao: "",
    opexSeguros: "",
    opexOutros: "0",
    // Receitas
    ticketMedio: "",
    capacidadeMaxima: "",
    mesAbertura: "3",
    clientesInicio: "",
    taxaCrescimento: "10", // 10%
    mesEstabilizacao: "15",
    clientesSteadyState: "",
  });

  const createMutation = trpc.viability.create.useMutation({
    onSuccess: (data) => {
      toast.success("Análise criada com sucesso!");
      setLocation(`/captador/viabilidade/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Pré-preenchimento a partir de simulação
  useEffect(() => {
    if (!simulationQuery.data) return;
    const s = simulationQuery.data;

    setFormData(prev => ({
      ...prev,
      nome: s.descricaoOferta || "",
      valorCaptacao: ((s.valorTotalOferta || 0) / 100).toString(),
      prazoMeses: (s.prazoMeses || 48).toString(),
      taxaJurosMensal: ((s.taxaMensal || 185) / 100).toString(),
      feeFixo: ((s.taxaSetupFixaBrl || 2500000) / 100).toString(),
      taxaSucesso: ((s.feeSucessoPercentSobreCaptacao || 500) / 100).toString(),
    }));

    toast.success("Pré-preenchido a partir da simulação");
  }, [simulationQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter para centavos e basis points
    const input = {
      nome: formData.nome,
      valorCaptacao: Math.round(parseFloat(formData.valorCaptacao) * 100),
      coInvestimento: Math.round(parseFloat(formData.coInvestimento) * 100),
      feeFixo: Math.round(parseFloat(formData.feeFixo) * 100),
      taxaSucesso: Math.round(parseFloat(formData.taxaSucesso) * 100),
      taxaJurosMensal: Math.round(parseFloat(formData.taxaJurosMensal) * 100),
      prazoMeses: parseInt(formData.prazoMeses),
      carenciaMeses: parseInt(formData.carenciaMeses),
      modeloPagamento: formData.modeloPagamento,
      capexObras: Math.round(parseFloat(formData.capexObras) * 100),
      capexEquipamentos: Math.round(parseFloat(formData.capexEquipamentos) * 100),
      capexLicencas: Math.round(parseFloat(formData.capexLicencas) * 100),
      capexMarketing: Math.round(parseFloat(formData.capexMarketing) * 100),
      capexCapitalGiro: Math.round(parseFloat(formData.capexCapitalGiro) * 100),
      capexOutros: Math.round(parseFloat(formData.capexOutros) * 100),
      opexAluguel: Math.round(parseFloat(formData.opexAluguel) * 100),
      opexPessoal: Math.round(parseFloat(formData.opexPessoal) * 100),
      opexRoyalties: Math.round(parseFloat(formData.opexRoyalties) * 100),
      opexMarketing: Math.round(parseFloat(formData.opexMarketing) * 100),
      opexUtilidades: Math.round(parseFloat(formData.opexUtilidades) * 100),
      opexManutencao: Math.round(parseFloat(formData.opexManutencao) * 100),
      opexSeguros: Math.round(parseFloat(formData.opexSeguros) * 100),
      opexOutros: Math.round(parseFloat(formData.opexOutros) * 100),
      ticketMedio: Math.round(parseFloat(formData.ticketMedio) * 100),
      capacidadeMaxima: parseInt(formData.capacidadeMaxima),
      mesAbertura: parseInt(formData.mesAbertura),
      clientesInicio: parseInt(formData.clientesInicio),
      taxaCrescimento: Math.round(parseFloat(formData.taxaCrescimento) * 100),
      mesEstabilizacao: parseInt(formData.mesEstabilizacao),
      clientesSteadyState: parseInt(formData.clientesSteadyState),
    };

    createMutation.mutate(input);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Nova Análise de Viabilidade</h1>
          <p className="text-xl text-muted-foreground">
            Preencha os dados do seu projeto para calcular a viabilidade financeira
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="nome">Nome do Projeto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                placeholder="Ex: Academia Bairro Centro"
              />
            </CardContent>
          </Card>

          {/* Captação */}
          <Card>
            <CardHeader>
              <CardTitle>1. Dados da Captação</CardTitle>
              <CardDescription>Valores da tokenização</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Total da Captação (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valorCaptacao}
                  onChange={(e) => setFormData({ ...formData, valorCaptacao: e.target.value })}
                  required
                  placeholder="3000000"
                />
              </div>
              <div>
                <Label>% Co-investimento *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.coInvestimento}
                  onChange={(e) => setFormData({ ...formData, coInvestimento: e.target.value })}
                  required
                  placeholder="20"
                />
              </div>
              <div>
                <Label>Fee Fixo (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.feeFixo}
                  onChange={(e) => setFormData({ ...formData, feeFixo: e.target.value })}
                  required
                  placeholder="25000"
                />
              </div>
              <div>
                <Label>Taxa de Sucesso (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.taxaSucesso}
                  onChange={(e) => setFormData({ ...formData, taxaSucesso: e.target.value })}
                  required
                  placeholder="5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Remuneração */}
          <Card>
            <CardHeader>
              <CardTitle>2. Remuneração dos Investidores</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taxa de Juros Mensal (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.taxaJurosMensal}
                  onChange={(e) => setFormData({ ...formData, taxaJurosMensal: e.target.value })}
                  required
                  placeholder="1.85"
                />
              </div>
              <div>
                <Label>Prazo Total (meses) *</Label>
                <Input
                  type="number"
                  value={formData.prazoMeses}
                  onChange={(e) => setFormData({ ...formData, prazoMeses: e.target.value })}
                  required
                  placeholder="48"
                />
              </div>
              <div>
                <Label>Carência (meses) *</Label>
                <Input
                  type="number"
                  value={formData.carenciaMeses}
                  onChange={(e) => setFormData({ ...formData, carenciaMeses: e.target.value })}
                  required
                  placeholder="6"
                />
              </div>
              <div>
                <Label>Modelo de Pagamento *</Label>
                <Select
                  value={formData.modeloPagamento}
                  onValueChange={(value: "SAC" | "PRICE" | "BULLET") =>
                    setFormData({ ...formData, modeloPagamento: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAC">SAC</SelectItem>
                    <SelectItem value="PRICE">PRICE</SelectItem>
                    <SelectItem value="BULLET">BULLET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* CAPEX */}
          <Card>
            <CardHeader>
              <CardTitle>3. Custos de Implantação (CAPEX)</CardTitle>
              <CardDescription>Valores em R$</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Obras e Infraestrutura *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.capexObras}
                  onChange={(e) => setFormData({ ...formData, capexObras: e.target.value })}
                  required
                  placeholder="1200000"
                />
              </div>
              <div>
                <Label>Equipamentos *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.capexEquipamentos}
                  onChange={(e) => setFormData({ ...formData, capexEquipamentos: e.target.value })}
                  required
                  placeholder="800000"
                />
              </div>
              <div>
                <Label>Licenças e Autorizações *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.capexLicencas}
                  onChange={(e) => setFormData({ ...formData, capexLicencas: e.target.value })}
                  required
                  placeholder="100000"
                />
              </div>
              <div>
                <Label>Marketing de Lançamento *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.capexMarketing}
                  onChange={(e) => setFormData({ ...formData, capexMarketing: e.target.value })}
                  required
                  placeholder="150000"
                />
              </div>
              <div>
                <Label>Capital de Giro Inicial *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.capexCapitalGiro}
                  onChange={(e) => setFormData({ ...formData, capexCapitalGiro: e.target.value })}
                  required
                  placeholder="200000"
                />
              </div>
            </CardContent>
          </Card>

          {/* OPEX */}
          <Card>
            <CardHeader>
              <CardTitle>4. Custos Operacionais Mensais (OPEX)</CardTitle>
              <CardDescription>Valores mensais em R$</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aluguel + Condomínio *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opexAluguel}
                  onChange={(e) => setFormData({ ...formData, opexAluguel: e.target.value })}
                  required
                  placeholder="25000"
                />
              </div>
              <div>
                <Label>Pessoal *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opexPessoal}
                  onChange={(e) => setFormData({ ...formData, opexPessoal: e.target.value })}
                  required
                  placeholder="35000"
                />
              </div>
              <div>
                <Label>Royalties *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opexRoyalties}
                  onChange={(e) => setFormData({ ...formData, opexRoyalties: e.target.value })}
                  required
                  placeholder="8000"
                />
              </div>
              <div>
                <Label>Marketing Local *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opexMarketing}
                  onChange={(e) => setFormData({ ...formData, opexMarketing: e.target.value })}
                  required
                  placeholder="5000"
                />
              </div>
              <div>
                <Label>Utilidades (Água, Luz, Internet) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opexUtilidades}
                  onChange={(e) => setFormData({ ...formData, opexUtilidades: e.target.value })}
                  required
                  placeholder="4000"
                />
              </div>
              <div>
                <Label>Manutenção e Limpeza *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opexManutencao}
                  onChange={(e) => setFormData({ ...formData, opexManutencao: e.target.value })}
                  required
                  placeholder="2000"
                />
              </div>
              <div>
                <Label>Seguros *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opexSeguros}
                  onChange={(e) => setFormData({ ...formData, opexSeguros: e.target.value })}
                  required
                  placeholder="1000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Receitas */}
          <Card>
            <CardHeader>
              <CardTitle>5. Projeção de Receitas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ticket Médio Mensal (R$/cliente) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.ticketMedio}
                  onChange={(e) => setFormData({ ...formData, ticketMedio: e.target.value })}
                  required
                  placeholder="150"
                />
              </div>
              <div>
                <Label>Capacidade Máxima (clientes) *</Label>
                <Input
                  type="number"
                  value={formData.capacidadeMaxima}
                  onChange={(e) => setFormData({ ...formData, capacidadeMaxima: e.target.value })}
                  required
                  placeholder="500"
                />
              </div>
              <div>
                <Label>Mês de Abertura *</Label>
                <Input
                  type="number"
                  value={formData.mesAbertura}
                  onChange={(e) => setFormData({ ...formData, mesAbertura: e.target.value })}
                  required
                  placeholder="3"
                />
              </div>
              <div>
                <Label>Clientes no Mês 1 de Operação *</Label>
                <Input
                  type="number"
                  value={formData.clientesInicio}
                  onChange={(e) => setFormData({ ...formData, clientesInicio: e.target.value })}
                  required
                  placeholder="50"
                />
              </div>
              <div>
                <Label>Taxa de Crescimento Mensal (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.taxaCrescimento}
                  onChange={(e) => setFormData({ ...formData, taxaCrescimento: e.target.value })}
                  required
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Mês de Estabilização *</Label>
                <Input
                  type="number"
                  value={formData.mesEstabilizacao}
                  onChange={(e) => setFormData({ ...formData, mesEstabilizacao: e.target.value })}
                  required
                  placeholder="15"
                />
              </div>
              <div>
                <Label>Clientes no Steady State *</Label>
                <Input
                  type="number"
                  value={formData.clientesSteadyState}
                  onChange={(e) => setFormData({ ...formData, clientesSteadyState: e.target.value })}
                  required
                  placeholder="400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/captador/viabilidade')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Calculando...' : 'Calcular Viabilidade'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
