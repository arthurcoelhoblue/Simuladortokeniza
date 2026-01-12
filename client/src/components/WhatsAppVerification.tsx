import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Phone, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppVerificationProps {
  telefone: string;
  onVerified: () => void;
  userId?: number;
}

export function WhatsAppVerification({ telefone, onVerified, userId }: WhatsAppVerificationProps) {
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const sendCodeMutation = trpc.auth.sendWhatsAppCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setCodeSent(true);
        setCountdown(60); // 60 segundos para reenviar
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar código");
    },
  });

  const verifyCodeMutation = trpc.auth.verifyWhatsAppCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsVerified(true);
        toast.success(data.message);
        onVerified();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao verificar código");
    },
  });

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = () => {
    sendCodeMutation.mutate({ telefone });
  };

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    verifyCodeMutation.mutate({ telefone, code, userId });
  };

  // Formatar código enquanto digita (apenas números)
  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <span className="text-green-700 font-medium">WhatsApp verificado!</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span>Verificação de WhatsApp</span>
      </div>

      {!codeSent ? (
        <div className="space-y-3">
          <p className="text-sm">
            Enviaremos um código de verificação para o número:
          </p>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{telefone}</span>
          </div>
          <Button
            onClick={handleSendCode}
            disabled={sendCodeMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {sendCodeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar código via WhatsApp
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">
            Digite o código de 6 dígitos enviado para seu WhatsApp:
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="code">Código de verificação</Label>
            <Input
              id="code"
              placeholder="000000"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
            />
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={verifyCodeMutation.isPending || code.length !== 6}
            className="w-full"
          >
            {verifyCodeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar código"
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Não recebeu o código?
            </span>
            {countdown > 0 ? (
              <span className="text-muted-foreground">
                Reenviar em {countdown}s
              </span>
            ) : (
              <Button
                variant="link"
                size="sm"
                onClick={handleSendCode}
                disabled={sendCodeMutation.isPending}
                className="p-0 h-auto"
              >
                Reenviar código
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatsAppVerification;
