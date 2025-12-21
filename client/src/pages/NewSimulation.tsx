import { useAuth } from "@/_core/hooks/useAuth";
import { OfferSelectionModal } from "@/components/OfferSelectionModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calculator, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Componente auxiliar para ajuda que funciona em mobile e desktop
const HelpTooltip = ({ content }: { content: string | React.ReactNode }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="inline-flex items-center justify-center" aria-label="Ajuda">
        <HelpCircle className="h-4 w-4 text-lime-500 hover:text-lime-600 transition-colors cursor-help" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="max-w-xs text-sm" side="top">
      {typeof content === 'string' ? <p>{content}</p> : content}
    </PopoverContent>
  </Popover>
);

export default function NewSimulation() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Modo derivado da URL (não é mais um estado alterável)
  const search = window.location.search;
  const qs = new URLSearchParams(search);
  const modoParam = qs.get("modo");
  
  // GUARDA: Se não tiver modo, redireciona para seletor
  useEffect(() => {
    if (!modoParam || (modoParam !== "captador" && modoParam !== "investidor")) {
      setLocation("/nova-simulacao");
    }
  }, [modoParam, setLocation]);
  
  const modo = (modoParam === "captador" || modoParam === "investidor")
    ? modoParam
    : "investidor";
  
  // Pegar fromViabilityId para pré-preenchimento
  const fromViabilityId = qs.get("fromViabilityId");
  
  // Buscar viabilidade se fromViabilityId existir (apenas modo captador)
  const viabilityQuery = trpc.viability.getById.useQuery(
    { id: parseInt(fromViabilityId!) },
    { enabled: modo === "captador" && !!fromViabilityId }
  );
  
  // Sistema de scoring - captura de intenção
  const [origemSimulacao, setOrigemSimulacao] = useState<'manual' | 'oferta_tokeniza'>('manual');
  const [offerId, setOfferId] = useState<number | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Função para calcular taxa de estruturação baseada no valor da oferta (em R$)
  const calcularTaxaEstruturacao = (valorOferta: number): number => {
    if (valorOferta <= 100000) return 5000;      // Até 100 mil = 5 mil
    if (valorOferta <= 200000) return 7500;      // Até 200 mil = 7,5 mil
    if (valorOferta <= 350000) return 10000;     // Até 350 mil = 10 mil
    if (valorOferta <= 500000) return 13500;     // Até 500 mil = 13,5 mil
    if (valorOferta <= 750000) return 16500;     // Até 750 mil = 16,5 mil
    if (valorOferta <= 1000000) return 20000;    // Até 1 milhão = 20 mil
    if (valorOferta <= 3000000) return 27000;    // Até 3 milhões = 27 mil
    if (valorOferta <= 5000000) return 35000;    // Até 5 milhões = 35 mil
    if (valorOferta <= 7500000) return 43000;    // Até 7,5 milhões = 43 mil
    if (valorOferta <= 10000000) return 52000;   // Até 10 milhões = 52 mil
    if (valorOferta <= 15000000) return 60000;   // Até 15 milhões = 60 mil
    return 0; // Acima de 15 milhões precisa consultar (personalizado)
  };

  // Função para validar WhatsApp brasileiro
  const validarWhatsApp = (whatsapp: string): boolean => {
    // Remove caracteres não numéricos
    const numeros = whatsapp.replace(/\D/g, '');
    // Valida formato brasileiro: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
    // 11 dígitos (com 9) ou 10 dígitos (sem 9)
    return numeros.length === 11 || numeros.length === 10;
  };

  const [formData, setFormData] = useState({
    // Dados de contato
    nomeCompleto: "",
    whatsapp: "",
    
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

    // Custos do captador (apenas modo captador)
    taxaEstruturacao: "", // Taxa fixa paga à Tokeniza (calculada automaticamente)
    feePercentualCaptacao: "5", // % sobre valor captado pago à Tokeniza (padrão 5%)
    outrosCustos: "",
    outrosCustosTipo: "valor" as 'valor' | 'percentual',
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

  // Pré-preenchimento a partir de análise de viabilidade (modo captador)
  useEffect(() => {
    if (!viabilityQuery.data) return;
    const v = viabilityQuery.data;

    setFormData(prev => ({
      ...prev,
      descricaoOferta: v.nome || "",
      valorTotalOferta: ((v.valorCaptacao || 0) / 100).toString(),
      prazoMeses: (v.prazoMeses || 24).toString(),
      taxaJurosAa: ((v.taxaJurosMensal || 185) * 12).toString(), // converter mensal para anual
      taxaEstruturacao: ((v.feeFixo || 2500000) / 100).toString(),
      feePercentualCaptacao: ((v.taxaSucesso || 500) / 100).toString(),
    }));

    toast.success("Pré-preenchido a partir da análise de viabilidade");
  }, [viabilityQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Valida WhatsApp
    if (!validarWhatsApp(formData.whatsapp)) {
      toast.error('WhatsApp inválido. Use formato: (DD) 9XXXX-XXXX');
      return;
    }

    // Converte valores de string para número (em centavos)
    // No modo captador, valorInvestido = valorTotalOferta (simula o custo total)
    createMutation.mutate({
      // Dados do lead
      nomeCompleto: formData.nomeCompleto,
      whatsapp: formData.whatsapp,
      email: undefined, // Email não está sendo capturado no formulário atual
      // Dados da oferta
      descricaoOferta: formData.descricaoOferta || undefined,
      valorTotalOferta: parseFloat(formData.valorTotalOferta) * 100,
      valorInvestido: modo === 'captador' 
        ? parseFloat(formData.valorTotalOferta) * 100 
        : parseFloat(formData.valorInvestido) * 100,
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
      modo: modo, // Salva o modo da simulação
      // Sistema de scoring - intenção
      origemSimulacao: origemSimulacao,
      engajouComOferta: offerId !== null,
      offerId: offerId,
      // Custos são calculados apenas no modo captador
      taxaSetupFixaBrl: modo === 'captador' && formData.taxaEstruturacao ? parseFloat(formData.taxaEstruturacao) * 100 : undefined,
      feeSucessoPercentSobreCaptacao: modo === 'captador' && formData.feePercentualCaptacao ? parseFloat(formData.feePercentualCaptacao) * 100 : undefined,
      feeManutencaoMensalBrl: undefined,
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

        {/* Captura de Intenção - Sistema de Scoring - APENAS PARA INVESTIDOR */}
        {modo === 'investidor' && (
        <Card className="mb-6 border-lime-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Como você quer simular?
            </CardTitle>
            <CardDescription>
              Sua resposta nos ajuda a entender melhor sua intenção e priorizar seu atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setOrigemSimulacao('manual');
                  setOfferId(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  origemSimulacao === 'manual'
                    ? 'border-lime-500 bg-lime-500/10'
                    : 'border-border hover:border-lime-500/50'
                }`}
              >
                <div className="font-semibold mb-1">✏️ Simulação Livre</div>
                <p className="text-sm text-muted-foreground">
                  Quero explorar diferentes cenários sem uma oferta específica
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setOrigemSimulacao('oferta_tokeniza');
                  setShowOfferModal(true);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  origemSimulacao === 'oferta_tokeniza'
                    ? 'border-lime-500 bg-lime-500/10'
                    : 'border-border hover:border-lime-500/50'
                }`}
              >
                <div className="font-semibold mb-1">💼 A partir de uma Oferta Tokeniza</div>
                <p className="text-sm text-muted-foreground">
                  Tenho interesse em uma oferta específica da plataforma
                </p>
              </button>
            </div>
            
            {origemSimulacao === 'oferta_tokeniza' && offerId && (
              <div className="p-3 bg-lime-500/10 border border-lime-500/50 rounded-lg">
                <p className="text-sm font-medium text-lime-700 dark:text-lime-400">
                  ✅ Oferta selecionada (ID: {offerId})
                </p>
                <button
                  type="button"
                  onClick={() => setShowOfferModal(true)}
                  className="text-xs text-lime-600 dark:text-lime-400 hover:underline mt-1"
                >
                  Trocar oferta
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Oferta */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Oferta</CardTitle>
              <CardDescription>Informações básicas sobre a oferta de investimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campos de Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="nomeCompleto">Nome Completo</Label>
                    <HelpTooltip content="Seu nome completo para identificação" />
                  </div>
                  <Input
                    id="nomeCompleto"
                    type="text"
                    required
                    value={formData.nomeCompleto}
                    onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                    placeholder="João da Silva"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="whatsapp">WhatsApp para receber a simulação</Label>
                    <HelpTooltip content="Enviaremos o relatório completo da simulação para este WhatsApp. Use formato: (DD) 9XXXX-XXXX" />
                  </div>
                  <Input
                    id="whatsapp"
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, whatsapp: valor });
                    }}
                    onBlur={(e) => {
                      if (e.target.value && !validarWhatsApp(e.target.value)) {
                        toast.error('WhatsApp inválido. Use formato: (DD) 9XXXX-XXXX');
                      }
                    }}
                    placeholder="11987654321"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="descricaoOferta">Descrição da Oferta (opcional)</Label>
                  <HelpTooltip content="Nome ou descrição breve da oferta de investimento para identificação" />
                </div>
                <Textarea
                  id="descricaoOferta"
                  value={formData.descricaoOferta}
                  onChange={(e) => setFormData({ ...formData, descricaoOferta: e.target.value })}
                  placeholder="Ex: Capital de giro para expansão"
                />
              </div>

              <div className={modo === 'investidor' ? 'grid grid-cols-2 gap-4' : ''}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="valorTotalOferta">Valor Total da Oferta (R$)</Label>
                    <HelpTooltip content="Valor total que está sendo captado na oferta tokenizada" />
                  </div>
                  <Input
                    id="valorTotalOferta"
                    type="number"
                    step="0.01"
                    required
                    value={formData.valorTotalOferta}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      const taxaEstruturacao = modo === 'captador' ? calcularTaxaEstruturacao(valor) : 0;
                      setFormData({ 
                        ...formData, 
                        valorTotalOferta: e.target.value,
                        taxaEstruturacao: taxaEstruturacao > 0 ? taxaEstruturacao.toString() : formData.taxaEstruturacao
                      });
                    }}
                    placeholder="5000000.00"
                  />
                </div>

                {modo === 'investidor' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="valorInvestido">Valor Investido (R$)</Label>
                      <HelpTooltip content="Valor que você pretende investir nesta oferta" />
                    </div>
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
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modo === 'investidor' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="dataEncerramentoOferta">Data de Encerramento da Oferta</Label>
                      <HelpTooltip content="Data em que a oferta será encerrada. Os pagamentos começam 30 dias após esta data" />
                    </div>
                    <Input
                      id="dataEncerramentoOferta"
                      type="date"
                      required
                      value={formData.dataEncerramentoOferta}
                      onChange={(e) => setFormData({ ...formData, dataEncerramentoOferta: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                    <HelpTooltip content="Duração total do investimento em meses" />
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="taxaJurosAa">Taxa de Juros (% a.a.)</Label>
                    <HelpTooltip content="Taxa de juros anual prometida pela oferta (ex: 24% ao ano)" />
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="tipoCapitalizacao">Tipo de Capitalização</Label>
                    <HelpTooltip content={<><strong>Simples:</strong> juros sempre sobre o valor inicial. <strong>Composta:</strong> juros sobre o saldo devedor atual (efeito composto)</>} />
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="amortizacaoMetodo">Método de Amortização</Label>
                    <HelpTooltip content={<><strong>Linear:</strong> amortização constante a cada período. <strong>Bullet:</strong> principal pago apenas no final</>} />
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="periodicidadeJuros">Periodicidade de Juros</Label>
                    <HelpTooltip content='Frequência com que os juros serão pagos. "No Fim" significa que todos os juros são pagos apenas no último mês' />
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="carenciaJurosMeses">Carência de Juros (meses)</Label>
                    <HelpTooltip content="Período inicial em que os juros não são pagos. Podem ser capitalizados (acumulados) ou pagos depois" />
                  </div>
                  <Input
                    id="carenciaJurosMeses"
                    type="number"
                    value={formData.carenciaJurosMeses}
                    onChange={(e) => setFormData({ ...formData, carenciaJurosMeses: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="carenciaPrincipalMeses">Carência de Principal (meses)</Label>
                    <HelpTooltip content="Período inicial em que o principal (valor investido) não é amortizado. A amortização começa após este período" />
                  </div>
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
                <HelpTooltip content="Se marcado, os juros durante a carência são acumulados ao saldo devedor. Se desmarcado, são pagos normalmente" />
              </div>
            </CardContent>
          </Card>

          {/* Painel de Custos do Captador */}
          {modo === 'captador' && (
            <Card>
              <CardHeader>
                <CardTitle>Custos da Captação</CardTitle>
                <CardDescription>Simule os custos totais para captar recursos via Tokeniza</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="taxaEstruturacao">Taxa de Estruturação (R$)</Label>
                      <HelpTooltip content="Taxa fixa paga à Tokeniza para estruturar e publicar a oferta" />
                    </div>
                    <Input
                      id="taxaEstruturacao"
                      type="number"
                      step="0.01"
                      value={formData.taxaEstruturacao}
                      onChange={(e) => setFormData({ ...formData, taxaEstruturacao: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="feePercentualCaptacao">Fee sobre Captação (%)</Label>
                      <HelpTooltip content="Percentual sobre o valor total captado pago à Tokeniza" />
                    </div>
                    <Input
                      id="feePercentualCaptacao"
                      type="number"
                      step="0.01"
                      value={formData.feePercentualCaptacao}
                      onChange={(e) => setFormData({ ...formData, feePercentualCaptacao: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="outrosCustos">Outros Custos</Label>
                    <HelpTooltip content="Custos adicionais (assessoria jurídica, marketing, etc.)" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="outrosCustos"
                      type="number"
                      step="0.01"
                      value={formData.outrosCustos}
                      onChange={(e) => setFormData({ ...formData, outrosCustos: e.target.value })}
                      placeholder="0.00"
                      className="flex-1"
                    />
                    <Select
                      value={formData.outrosCustosTipo}
                      onValueChange={(value: 'valor' | 'percentual') => setFormData({ ...formData, outrosCustosTipo: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valor">R$</SelectItem>
                        <SelectItem value="percentual">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Resumo de Custos */}
                {(formData.taxaEstruturacao || formData.feePercentualCaptacao || formData.outrosCustos) && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3">Resumo de Custos</h4>
                    <div className="space-y-2 text-sm">
                      {formData.taxaEstruturacao && (
                        <div className="flex justify-between">
                          <span>Taxa de Estruturação:</span>
                          <span className="font-medium">R$ {parseFloat(formData.taxaEstruturacao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {formData.feePercentualCaptacao && formData.valorTotalOferta && (
                        <div className="flex justify-between">
                          <span>Fee sobre Captação ({formData.feePercentualCaptacao}%):</span>
                          <span className="font-medium">R$ {(parseFloat(formData.valorTotalOferta) * parseFloat(formData.feePercentualCaptacao) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {formData.outrosCustos && (
                        <div className="flex justify-between">
                          <span>Outros Custos:</span>
                          <span className="font-medium">
                            {formData.outrosCustosTipo === 'valor'
                              ? `R$ ${parseFloat(formData.outrosCustos).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : formData.valorTotalOferta
                              ? `R$ ${(parseFloat(formData.valorTotalOferta) * parseFloat(formData.outrosCustos) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${formData.outrosCustos}%)`
                              : `${formData.outrosCustos}%`
                            }
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base text-lime-600">
                        <span>Custo Total:</span>
                        <span>
                          R$ {(
                            (parseFloat(formData.taxaEstruturacao) || 0) +
                            (formData.feePercentualCaptacao && formData.valorTotalOferta ? parseFloat(formData.valorTotalOferta) * parseFloat(formData.feePercentualCaptacao) / 100 : 0) +
                            (formData.outrosCustos
                              ? formData.outrosCustosTipo === 'valor'
                                ? parseFloat(formData.outrosCustos)
                                : formData.valorTotalOferta
                                ? parseFloat(formData.valorTotalOferta) * parseFloat(formData.outrosCustos) / 100
                                : 0
                              : 0)
                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={createMutation.isPending} className="flex-1">
              <Calculator className="mr-2 h-5 w-5" />
              {createMutation.isPending ? "Calculando..." : "Calcular Simulação"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Modal de Seleção de Ofertas */}
      <OfferSelectionModal
        open={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        onSelectOffer={(offer) => {
          // Preencher automaticamente os campos do formulário
          setFormData(prev => ({
            ...prev,
            valorTotalOferta: ((offer.valorMinimo || 0) / 100).toString(),
            valorInvestido: ((offer.valorMinimo || 0) / 100).toString(),
            prazoMeses: offer.prazoMeses.toString(),
            taxaJurosAa: offer.taxaAnual.toString(),
          }));
          
          // Setar campos de scoring
          setOfferId(offer.id);
          setOrigemSimulacao('oferta_tokeniza');
          
          toast.success(`Oferta "${offer.nome}" selecionada! Campos preenchidos automaticamente.`);
        }}
      />
    </div>
  );
}

