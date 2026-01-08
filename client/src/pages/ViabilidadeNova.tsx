import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { businessTemplates, getTemplateById } from "@/lib/businessTemplates";
import { RequireLeadCapture } from "@/components/RequireLeadCapture";

// Patch 6.1: Tipos para viabilidade genérica
type ReceitaItem = {
  nome: string;
  precoUnitario: number;
  quantidadeMensal: number;
  crescimentoMensalPct?: number;
  custoVariavelPct?: number | null; // Patch 7: Custo variável por receita
};

type CustoFixoItem = {
  nome: string;
  valorMensal: number;
  reajusteAnualPct?: number;
};

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
    // Patch 7: Custo variável global
    custoVariavelGlobalPct: "", // 0-100%
  });

  // Patch 6.1: Estados para receitas e custos fixos dinâmicos
  const [receitas, setReceitas] = useState<ReceitaItem[]>([
    { nome: "", precoUnitario: 0, quantidadeMensal: 0 },
  ]);

  const [custosFixos, setCustosFixos] = useState<CustoFixoItem[]>([
    { nome: "", valorMensal: 0 },
  ]);

  // Patch 8: Estados para cenários
  const [usarCenariosAutomaticos, setUsarCenariosAutomaticos] = useState(true);
  
  type CenarioCustom = {
    nome: "Base" | "Conservador" | "Otimista";
    multiplicadorReceita: number;
    multiplicadorCustoVariavel: number;
    multiplicadorOpex: number;
  };
  
  const [cenariosCustom, setCenariosCustom] = useState<CenarioCustom[]>([
    { nome: "Base", multiplicadorReceita: 1, multiplicadorCustoVariavel: 1, multiplicadorOpex: 1 },
    { nome: "Conservador", multiplicadorReceita: 0.85, multiplicadorCustoVariavel: 1.1, multiplicadorOpex: 1.1 },
    { nome: "Otimista", multiplicadorReceita: 1.15, multiplicadorCustoVariavel: 0.95, multiplicadorOpex: 0.95 },
  ]);

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

  // Helper para converter string vazia ou inválida em 0
  const parseFloatSafe = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseIntSafe = (value: string): number => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  };

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
      capexObras: Math.round(parseFloatSafe(formData.capexObras) * 100),
      capexEquipamentos: Math.round(parseFloatSafe(formData.capexEquipamentos) * 100),
      capexLicencas: Math.round(parseFloatSafe(formData.capexLicencas) * 100),
      capexMarketing: Math.round(parseFloatSafe(formData.capexMarketing) * 100),
      capexCapitalGiro: Math.round(parseFloatSafe(formData.capexCapitalGiro) * 100),
      capexOutros: Math.round(parseFloatSafe(formData.capexOutros) * 100),
      opexAluguel: Math.round(parseFloatSafe(formData.opexAluguel) * 100),
      opexPessoal: Math.round(parseFloatSafe(formData.opexPessoal) * 100),
      opexRoyalties: Math.round(parseFloatSafe(formData.opexRoyalties) * 100),
      opexMarketing: Math.round(parseFloatSafe(formData.opexMarketing) * 100),
      opexUtilidades: Math.round(parseFloatSafe(formData.opexUtilidades) * 100),
      opexManutencao: Math.round(parseFloatSafe(formData.opexManutencao) * 100),
      opexSeguros: Math.round(parseFloatSafe(formData.opexSeguros) * 100),
      opexOutros: Math.round(parseFloatSafe(formData.opexOutros) * 100),
      ticketMedio: Math.round(parseFloatSafe(formData.ticketMedio) * 100),
      capacidadeMaxima: parseIntSafe(formData.capacidadeMaxima),
      mesAbertura: parseIntSafe(formData.mesAbertura),
      clientesInicio: parseIntSafe(formData.clientesInicio),
      taxaCrescimento: Math.round(parseFloatSafe(formData.taxaCrescimento) * 100),
      mesEstabilizacao: parseIntSafe(formData.mesEstabilizacao),
      clientesSteadyState: parseIntSafe(formData.clientesSteadyState),
    };

    // Patch 6.1: Adicionar receitas e custosFixos ao payload
    const receitasPayload = receitas.map(r => ({
      nome: r.nome,
      precoUnitario: r.precoUnitario,
      quantidadeMensal: r.quantidadeMensal,
      crescimentoMensalPct: r.crescimentoMensalPct,
      custoVariavelPct: r.custoVariavelPct, // Patch 7
    }));

    const custosFixosPayload = custosFixos.map(c => ({
      nome: c.nome,
      valorMensal: c.valorMensal,
      reajusteAnualPct: c.reajusteAnualPct,
    }));

    // Patch 5: Adicionar originSimulationId se vier de uma simulação
    const payload = {
      ...input,
      receitas: receitasPayload,
      custosFixos: custosFixosPayload,
      // Patch 7: Adicionar custo variável global
      custoVariavelGlobalPct: formData.custoVariavelGlobalPct
        ? parseFloat(formData.custoVariavelGlobalPct)
        : null,
      // Patch 8: Adicionar cenários
      usarCenariosAutomaticos,
      ...(usarCenariosAutomaticos ? {} : { cenariosCustom }),
      ...(fromSimulationId && { originSimulationId: parseInt(fromSimulationId) }),
    };

    createMutation.mutate(payload);
  };

  return (
    <RequireLeadCapture variant="captador">
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

          {/* Patch 6.1: Custos Fixos Dinâmicos (Múltiplas Linhas) */}
          <Card>
            <CardHeader>
              <CardTitle>4. Custos Fixos Mensais</CardTitle>
              <CardDescription>Adicione todos os custos operacionais recorrentes do seu negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {custosFixos.map((c, idx) => (
                <div key={idx} className="grid gap-2 items-end" style={{ gridTemplateColumns: 'repeat(3, 1fr) auto' }}>
                  <div>
                    <Label>Nome do Custo</Label>
                    <Input
                      placeholder="Ex: Aluguel"
                      value={c.nome}
                      onChange={e => {
                        const next = [...custosFixos];
                        next[idx].nome = e.target.value;
                        setCustosFixos(next);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Valor Mensal (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      value={c.valorMensal || ""}
                      onChange={e => {
                        const next = [...custosFixos];
                        next[idx].valorMensal = Number(e.target.value);
                        setCustosFixos(next);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Reajuste Anual % (opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5"
                      value={c.reajusteAnualPct ?? ""}
                      onChange={e => {
                        const next = [...custosFixos];
                        next[idx].reajusteAnualPct = e.target.value ? Number(e.target.value) : undefined;
                        setCustosFixos(next);
                      }}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (custosFixos.length > 1) {
                          setCustosFixos(custosFixos.filter((_, i) => i !== idx));
                        }
                      }}
                      disabled={custosFixos.length === 1}
                      title={custosFixos.length === 1 ? "Pelo menos 1 custo é necessário" : "Remover custo"}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCustosFixos([...custosFixos, { nome: "", valorMensal: 0 }])
                }>
                + Adicionar Custo
              </Button>
            </CardContent>
          </Card>

          {/* Campos legados OPEX mantidos ocultos para retrocompatibilidade */}
          <input type="hidden" value={formData.opexAluguel} />
          <input type="hidden" value={formData.opexPessoal} />
          <input type="hidden" value={formData.opexRoyalties} />
          <input type="hidden" value={formData.opexMarketing} />
          <input type="hidden" value={formData.opexUtilidades} />
          <input type="hidden" value={formData.opexManutencao} />
          <input type="hidden" value={formData.opexSeguros} />
          <input type="hidden" value={formData.opexOutros} />

          {/* Patch 7: Custo Variável Global */}
          <Card>
            <CardHeader>
              <CardTitle>5. Custo Variável Global (Opcional)</CardTitle>
              <CardDescription>
                Defina um percentual de custo variável que se aplica a todas as receitas que não tiverem custo específico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custoVariavelGlobalPct">Custo Variável Global (%)</Label>
                  <Input
                    id="custoVariavelGlobalPct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ex: 30 (30% da receita)"
                    value={formData.custoVariavelGlobalPct}
                    onChange={e => setFormData({ ...formData, custoVariavelGlobalPct: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este percentual será aplicado às receitas que não tiverem custo variável específico
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patch 8: Cenários */}
          <Card>
            <CardHeader>
              <CardTitle>6. Cenários de Análise</CardTitle>
              <CardDescription>
                Analise sua viabilidade em 3 cenários: Base, Conservador e Otimista
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="usarCenariosAutomaticos"
                  checked={usarCenariosAutomaticos}
                  onChange={e => setUsarCenariosAutomaticos(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="usarCenariosAutomaticos" className="text-sm font-medium">
                  Usar cenários automáticos (recomendado)
                </Label>
              </div>

              {/* Preview de presets (se automático) */}
              {usarCenariosAutomaticos && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-3">Multiplicadores Automáticos:</p>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="font-semibold">Base</p>
                      <p>Receita: 1.0x</p>
                      <p>Custo Var.: 1.0x</p>
                      <p>OPEX: 1.0x</p>
                    </div>
                    <div>
                      <p className="font-semibold">Conservador</p>
                      <p>Receita: 0.8x</p>
                      <p>Custo Var.: 1.1x</p>
                      <p>OPEX: 1.1x</p>
                    </div>
                    <div>
                      <p className="font-semibold">Otimista</p>
                      <p>Receita: 1.2x</p>
                      <p>Custo Var.: 0.9x</p>
                      <p>OPEX: 0.95x</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Inputs customizáveis (se livre) */}
              {!usarCenariosAutomaticos && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Configure os multiplicadores para cada cenário:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Cenário</th>
                          <th className="text-center py-2">Receita</th>
                          <th className="text-center py-2">Custo Var.</th>
                          <th className="text-center py-2">OPEX</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cenariosCustom.map((cenario, idx) => (
                          <tr key={cenario.nome} className="border-b">
                            <td className="py-2 font-medium">{cenario.nome}</td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cenario.multiplicadorReceita}
                                onChange={e => {
                                  const novo = [...cenariosCustom];
                                  novo[idx].multiplicadorReceita = parseFloat(e.target.value) || 0;
                                  setCenariosCustom(novo);
                                }}
                                className="h-8 text-center"
                              />
                            </td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cenario.multiplicadorCustoVariavel}
                                onChange={e => {
                                  const novo = [...cenariosCustom];
                                  novo[idx].multiplicadorCustoVariavel = parseFloat(e.target.value) || 0;
                                  setCenariosCustom(novo);
                                }}
                                className="h-8 text-center"
                              />
                            </td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cenario.multiplicadorOpex}
                                onChange={e => {
                                  const novo = [...cenariosCustom];
                                  novo[idx].multiplicadorOpex = parseFloat(e.target.value) || 0;
                                  setCenariosCustom(novo);
                                }}
                                className="h-8 text-center"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patch 6.2: Seletor de Templates de Negócio */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader>
              <CardTitle>🎯 Templates de Negócio</CardTitle>
              <CardDescription>Comece rápido usando um template pré-configurado com receitas e custos típicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {businessTemplates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setReceitas(template.receitas);
                      setCustosFixos(template.custosFixos);
                      toast.success(`Template "${template.nome}" aplicado!`);
                    }}
                    className="p-4 border rounded-lg hover:border-primary hover:bg-background transition-all text-left"
                  >
                    <div className="text-3xl mb-2">{template.icone}</div>
                    <div className="font-semibold mb-1">{template.nome}</div>
                    <div className="text-xs text-muted-foreground">{template.descricao}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {template.receitas.length} receitas • {template.custosFixos.length} custos
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patch 6.1: Receitas Dinâmicas (Múltiplas Linhas) */}
          <Card>
            <CardHeader>
              <CardTitle>5. Receitas Mensais</CardTitle>
              <CardDescription>Adicione todas as fontes de receita do seu negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {receitas.map((r, idx) => (
                <div key={idx} className="grid gap-2 items-end" style={{ gridTemplateColumns: 'repeat(5, 1fr) auto' }}>
                  <div>
                    <Label>Nome da Receita</Label>
                    <Input
                      placeholder="Ex: Mensalidade"
                      value={r.nome}
                      onChange={e => {
                        const next = [...receitas];
                        next[idx].nome = e.target.value;
                        setReceitas(next);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Preço Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={r.precoUnitario || ""}
                      onChange={e => {
                        const next = [...receitas];
                        next[idx].precoUnitario = Number(e.target.value);
                        setReceitas(next);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Qtd/Mês</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={r.quantidadeMensal || ""}
                      onChange={e => {
                        const next = [...receitas];
                        next[idx].quantidadeMensal = Number(e.target.value);
                        setReceitas(next);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Crescimento % (opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5"
                      value={r.crescimentoMensalPct ?? ""}
                      onChange={e => {
                        const next = [...receitas];
                        next[idx].crescimentoMensalPct = e.target.value ? Number(e.target.value) : undefined;
                        setReceitas(next);
                      }}
                    />
                  </div>
                  {/* Patch 7: Custo variável por receita */}
                  <div>
                    <Label>Custo var. (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Opcional"
                      value={r.custoVariavelPct ?? ""}
                      onChange={e => {
                        const next = [...receitas];
                        next[idx].custoVariavelPct = e.target.value ? Number(e.target.value) : null;
                        setReceitas(next);
                      }}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (receitas.length > 1) {
                          setReceitas(receitas.filter((_, i) => i !== idx));
                        }
                      }}
                      disabled={receitas.length === 1}
                      title={receitas.length === 1 ? "Pelo menos 1 receita é necessária" : "Remover receita"}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setReceitas([...receitas, { nome: "", precoUnitario: 0, quantidadeMensal: 0 }])
                }
              >
                + Adicionar Receita
              </Button>
            </CardContent>
          </Card>

          {/* Campos legados mantidos ocultos para retrocompatibilidade */}
          <input type="hidden" value={formData.ticketMedio} />
          <input type="hidden" value={formData.capacidadeMaxima} />
          <input type="hidden" value={formData.mesAbertura} />
          <input type="hidden" value={formData.clientesInicio} />
          <input type="hidden" value={formData.taxaCrescimento} />
          <input type="hidden" value={formData.mesEstabilizacao} />
          <input type="hidden" value={formData.clientesSteadyState} />

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
    </RequireLeadCapture>
  );
}
