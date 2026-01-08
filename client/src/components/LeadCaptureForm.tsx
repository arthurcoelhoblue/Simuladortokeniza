import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Building2, Shield, Loader2 } from "lucide-react";
import { Link } from "wouter";

export interface LeadData {
  nomeCompleto: string;
  email: string;
  whatsapp: string;
  empresa?: string;
  aceitouTermos: boolean;
}

interface LeadCaptureFormProps {
  title?: string;
  subtitle?: string;
  onSubmit: (data: LeadData) => Promise<void>;
  onSkip?: () => void;
  showSkip?: boolean;
  prefillData?: Partial<LeadData>;
  variant?: "investidor" | "captador";
}

export function LeadCaptureForm({
  title = "Antes de continuar...",
  subtitle = "Preencha seus dados para receber os resultados por email",
  onSubmit,
  onSkip,
  showSkip = false,
  prefillData,
  variant = "investidor",
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<LeadData>({
    nomeCompleto: prefillData?.nomeCompleto || "",
    email: prefillData?.email || "",
    whatsapp: prefillData?.whatsapp || "",
    empresa: prefillData?.empresa || "",
    aceitouTermos: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de telefone brasileiro (com ou sem formatação)
  const validateWhatsapp = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 11;
  };

  // Formatar telefone enquanto digita
  const formatWhatsapp = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleChange = (field: keyof LeadData, value: string | boolean) => {
    if (field === "whatsapp" && typeof value === "string") {
      value = formatWhatsapp(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro ao editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LeadData, string>> = {};

    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = "Nome é obrigatório";
    } else if (formData.nomeCompleto.trim().split(" ").length < 2) {
      newErrors.nomeCompleto = "Informe nome e sobrenome";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "WhatsApp é obrigatório";
    } else if (!validateWhatsapp(formData.whatsapp)) {
      newErrors.whatsapp = "WhatsApp inválido (DDD + número)";
    }

    if (!formData.aceitouTermos) {
      newErrors.aceitouTermos = "Você precisa aceitar os termos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradientClass = variant === "investidor" 
    ? "from-emerald-500 to-teal-600" 
    : "from-blue-500 to-indigo-600";

  const iconBgClass = variant === "investidor"
    ? "bg-emerald-100 text-emerald-600"
    : "bg-blue-100 text-blue-600";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className={`bg-gradient-to-r ${gradientClass} text-white rounded-t-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="text-white/80 mt-1">
                {subtitle}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome Completo *
              </Label>
              <Input
                id="nomeCompleto"
                placeholder="Seu nome completo"
                value={formData.nomeCompleto}
                onChange={(e) => handleChange("nomeCompleto", e.target.value)}
                className={errors.nomeCompleto ? "border-red-500" : ""}
              />
              {errors.nomeCompleto && (
                <p className="text-sm text-red-500">{errors.nomeCompleto}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                WhatsApp *
              </Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                className={errors.whatsapp ? "border-red-500" : ""}
              />
              {errors.whatsapp && (
                <p className="text-sm text-red-500">{errors.whatsapp}</p>
              )}
            </div>

            {/* Empresa (opcional para captador) */}
            {variant === "captador" && (
              <div className="space-y-2">
                <Label htmlFor="empresa" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Empresa
                </Label>
                <Input
                  id="empresa"
                  placeholder="Nome da sua empresa (opcional)"
                  value={formData.empresa}
                  onChange={(e) => handleChange("empresa", e.target.value)}
                />
              </div>
            )}

            {/* Termos LGPD */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <Checkbox
                  id="termos"
                  checked={formData.aceitouTermos}
                  onCheckedChange={(checked) => handleChange("aceitouTermos", !!checked)}
                  className={errors.aceitouTermos ? "border-red-500" : ""}
                />
                <Label htmlFor="termos" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  Li e aceito os{" "}
                  <Link href="/termos" className="text-primary underline hover:no-underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-primary underline hover:no-underline">
                    Política de Privacidade
                  </Link>
                  . Autorizo o contato via WhatsApp e email.
                </Label>
              </div>
              {errors.aceitouTermos && (
                <p className="text-sm text-red-500">{errors.aceitouTermos}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r ${gradientClass} hover:opacity-90`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>

              {showSkip && onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  className="text-muted-foreground"
                >
                  Pular por agora
                </Button>
              )}
            </div>
          </form>

          {/* Garantia de privacidade */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Seus dados estão protegidos e não serão compartilhados.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LeadCaptureForm;
