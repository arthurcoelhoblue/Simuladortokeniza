import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLead } from "@/contexts/LeadContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Rocket, 
  TrendingUp, 
  Phone, 
  Mail, 
  CheckCircle2,
  Loader2,
  Calendar,
  MessageCircle
} from "lucide-react";

interface ConversionCTAProps {
  variant: "investidor" | "captador";
  context?: {
    simulationId?: number;
    analysisId?: number;
    offerName?: string;
    investmentAmount?: number;
    expectedReturn?: number;
    projectName?: string;
    viabilityStatus?: string;
  };
}

/**
 * Componente de CTA de conversão que aparece após simulações/análises.
 * Captura interesse do lead e cria oportunidade para follow-up.
 */
export function ConversionCTA({ variant, context }: ConversionCTAProps) {
  const { lead } = useLead();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const notifyOwner = trpc.system.notifyOwner.useMutation();

  const handleConversion = async (action: "quero_investir" | "quero_tokenizar" | "agendar_reuniao") => {
    if (!lead) {
      toast.error("Dados do lead não encontrados. Por favor, preencha o formulário novamente.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Notificar owner sobre interesse do lead
      const actionLabels = {
        quero_investir: "🎯 QUERO INVESTIR",
        quero_tokenizar: "🚀 QUERO TOKENIZAR",
        agendar_reuniao: "📅 AGENDAR REUNIÃO",
      };

      const contextInfo = variant === "investidor" 
        ? `📊 **Simulação:** ${context?.offerName || "Simulação personalizada"}\n` +
          `💰 **Valor:** R$ ${context?.investmentAmount?.toLocaleString("pt-BR") || "N/A"}\n` +
          `📈 **Retorno esperado:** ${context?.expectedReturn?.toFixed(2) || "N/A"}%`
        : `📋 **Projeto:** ${context?.projectName || "Análise de viabilidade"}\n` +
          `✅ **Status:** ${context?.viabilityStatus || "Viável"}`;

      await notifyOwner.mutateAsync({
        title: `${actionLabels[action]} - ${lead.nomeCompleto}`,
        content: `**Lead qualificado solicitou ação!**\n\n` +
          `👤 **Nome:** ${lead.nomeCompleto}\n` +
          `📧 **Email:** ${lead.email}\n` +
          `📱 **WhatsApp:** ${lead.whatsapp}\n` +
          `🏢 **Empresa:** ${lead.empresa || "Não informada"}\n\n` +
          `**Contexto:**\n${contextInfo}\n\n` +
          `⚡ **Ação solicitada:** ${actionLabels[action]}\n\n` +
          `Entre em contato o mais rápido possível!`,
      });

      setIsSubmitted(true);
      toast.success("Solicitação enviada! Entraremos em contato em breve.");
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estado de sucesso
  if (isSubmitted) {
    return (
      <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                Solicitação Enviada!
              </h3>
              <p className="text-muted-foreground mt-2">
                Nossa equipe entrará em contato em até 24 horas úteis.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="outline" size="sm" asChild>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:contato@tokeniza.com.br">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // CTA para Investidor
  if (variant === "investidor") {
    return (
      <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Gostou da simulação?</CardTitle>
          <CardDescription className="text-base">
            Dê o próximo passo e comece a investir em ativos tokenizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={() => handleConversion("quero_investir")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Rocket className="w-5 h-5 mr-2" />
            )}
            Quero Investir!
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-12"
              onClick={() => handleConversion("agendar_reuniao")}
              disabled={isSubmitting}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Reunião
            </Button>
            <Button 
              variant="outline" 
              className="h-12"
              asChild
            >
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                <Phone className="w-4 h-4 mr-2" />
                Falar Agora
              </a>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Investimento mínimo a partir de R$ 1.000 • Sem taxas de entrada
          </p>
        </CardContent>
      </Card>
    );
  }

  // CTA para Captador
  return (
    <Card className="border-2 border-blue-500/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Rocket className="w-7 h-7 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Projeto viável?</CardTitle>
        <CardDescription className="text-base">
          Transforme seu projeto em uma oferta tokenizada e capte recursos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
          onClick={() => handleConversion("quero_tokenizar")}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Rocket className="w-5 h-5 mr-2" />
          )}
          Quero Tokenizar!
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-12"
            onClick={() => handleConversion("agendar_reuniao")}
            disabled={isSubmitting}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Reunião
          </Button>
          <Button 
            variant="outline" 
            className="h-12"
            asChild
          >
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
              <Phone className="w-4 h-4 mr-2" />
              Falar Agora
            </a>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Captação a partir de R$ 500.000 • Processo 100% digital
        </p>
      </CardContent>
    </Card>
  );
}

export default ConversionCTA;
