/**
 * Serviço de Verificação de WhatsApp via Twilio
 * 
 * Para configurar:
 * 1. Crie uma conta no Twilio (https://www.twilio.com)
 * 2. Ative o WhatsApp Sandbox ou configure um número WhatsApp Business
 * 3. Adicione as seguintes variáveis de ambiente:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_WHATSAPP_NUMBER (formato: whatsapp:+14155238886)
 */

import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Armazenar códigos de verificação temporariamente (em produção, usar Redis)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; attempts: number }>();

// Gerar código de 6 dígitos
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Formatar número de telefone para formato internacional
function formatPhoneNumber(phone: string): string {
  // Remover caracteres não numéricos
  const digits = phone.replace(/\D/g, "");
  
  // Se começar com 0, remover
  const cleanDigits = digits.startsWith("0") ? digits.slice(1) : digits;
  
  // Adicionar código do Brasil se não tiver
  if (cleanDigits.length === 10 || cleanDigits.length === 11) {
    return `+55${cleanDigits}`;
  }
  
  // Se já tiver código do país
  if (cleanDigits.startsWith("55") && cleanDigits.length >= 12) {
    return `+${cleanDigits}`;
  }
  
  return `+${cleanDigits}`;
}

// Enviar código de verificação via WhatsApp
export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Verificar se já existe um código válido para este número
  const existing = verificationCodes.get(formattedPhone);
  if (existing && existing.expiresAt > new Date()) {
    const secondsRemaining = Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000);
    if (secondsRemaining > 240) { // Se ainda tem mais de 4 minutos, não reenviar
      return {
        success: false,
        message: `Aguarde ${Math.ceil(secondsRemaining / 60)} minutos antes de solicitar um novo código.`
      };
    }
  }
  
  // Gerar novo código
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
  
  // Armazenar código
  verificationCodes.set(formattedPhone, { code, expiresAt, attempts: 0 });
  
  // Verificar se Twilio está configurado
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  
  if (!accountSid || !authToken || !twilioWhatsappNumber) {
    console.log(`[WhatsApp Verification] Código para ${formattedPhone}: ${code}`);
    console.log("[WhatsApp Verification] Twilio não configurado - código exibido apenas no console");
    return {
      success: true,
      message: "Código de verificação gerado. (Modo de desenvolvimento - verifique o console do servidor)"
    };
  }
  
  try {
    // Importar Twilio dinamicamente
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    
    // Enviar mensagem via WhatsApp
    await client.messages.create({
      body: `🔐 Seu código de verificação do Simulador Tokeniza é: *${code}*\n\nEste código expira em 5 minutos.\n\nSe você não solicitou este código, ignore esta mensagem.`,
      from: twilioWhatsappNumber,
      to: `whatsapp:${formattedPhone}`
    });
    
    console.log(`[WhatsApp Verification] Código enviado para ${formattedPhone}`);
    
    return {
      success: true,
      message: "Código de verificação enviado para seu WhatsApp!"
    };
  } catch (error: any) {
    console.error("[WhatsApp Verification] Erro ao enviar:", error);
    
    // Em caso de erro, ainda permitir verificação via console em desenvolvimento
    if (process.env.NODE_ENV !== "production") {
      console.log(`[WhatsApp Verification] Código para ${formattedPhone}: ${code}`);
      return {
        success: true,
        message: "Código de verificação gerado. (Erro no envio - verifique o console)"
      };
    }
    
    return {
      success: false,
      message: "Erro ao enviar código de verificação. Tente novamente."
    };
  }
}

// Verificar código
export async function verifyCode(
  phoneNumber: string, 
  code: string,
  userId?: number
): Promise<{ success: boolean; message: string }> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  const stored = verificationCodes.get(formattedPhone);
  
  if (!stored) {
    return {
      success: false,
      message: "Nenhum código de verificação encontrado. Solicite um novo código."
    };
  }
  
  // Verificar se expirou
  if (stored.expiresAt < new Date()) {
    verificationCodes.delete(formattedPhone);
    return {
      success: false,
      message: "Código expirado. Solicite um novo código."
    };
  }
  
  // Verificar tentativas
  if (stored.attempts >= 5) {
    verificationCodes.delete(formattedPhone);
    return {
      success: false,
      message: "Muitas tentativas incorretas. Solicite um novo código."
    };
  }
  
  // Verificar código
  if (stored.code !== code) {
    stored.attempts++;
    return {
      success: false,
      message: `Código incorreto. ${5 - stored.attempts} tentativas restantes.`
    };
  }
  
  // Código correto - remover do cache
  verificationCodes.delete(formattedPhone);
  
  // Se tiver userId, marcar telefone como verificado no banco
  if (userId) {
    try {
      const db = await getDb();
      if (db) {
        await db.update(users)
          .set({ 
            telefone: formattedPhone,
            // Podemos adicionar um campo telefoneVerificado se necessário
          })
          .where(eq(users.id, userId));
      }
    } catch (error) {
      console.error("[WhatsApp Verification] Erro ao atualizar usuário:", error);
    }
  }
  
  return {
    success: true,
    message: "Telefone verificado com sucesso!"
  };
}

// Limpar códigos expirados periodicamente
setInterval(() => {
  const now = new Date();
  const entries = Array.from(verificationCodes.entries());
  for (const [phone, data] of entries) {
    if (data.expiresAt < now) {
      verificationCodes.delete(phone);
    }
  }
}, 60000); // A cada minuto
