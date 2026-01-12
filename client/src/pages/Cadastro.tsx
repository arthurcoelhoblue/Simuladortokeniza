import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Loader2, Check, X } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Cadastro() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const utils = trpc.useUtils();
  
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Conta criada com sucesso!");
      await utils.auth.me.invalidate();
      // Redirecionar para seleção de perfil ou home
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });
  
  // Validações de senha
  const passwordValidations = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  };
  
  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos mínimos");
      return;
    }
    
    if (!passwordsMatch) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos de uso");
      return;
    }
    
    registerMutation.mutate({ 
      name, 
      email, 
      password,
      telefone: telefone || undefined,
    });
  };
  
  // Formatar telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})/, "($1) ")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .trim();
    }
    return telefone;
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img 
              src={APP_LOGO} 
              alt={APP_TITLE} 
              className="h-12 mx-auto mb-4 cursor-pointer"
            />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          <p className="text-muted-foreground mt-2">
            Crie sua conta gratuita
          </p>
        </div>
        
        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">
              Preencha os dados abaixo para começar
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={registerMutation.isPending}
                  autoComplete="name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={registerMutation.isPending}
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone (opcional)</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                  disabled={registerMutation.isPending}
                  autoComplete="tel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={registerMutation.isPending}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Indicadores de força da senha */}
                {password.length > 0 && (
                  <div className="space-y-1 text-xs mt-2">
                    <div className={`flex items-center gap-1 ${passwordValidations.minLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {passwordValidations.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidations.hasLetter ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {passwordValidations.hasLetter ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      Pelo menos uma letra
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidations.hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {passwordValidations.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      Pelo menos um número
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  disabled={registerMutation.isPending}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-tight cursor-pointer"
                >
                  Li e aceito os{" "}
                  <Link href="/termos" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                </label>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending || !isPasswordValid || !passwordsMatch || !acceptTerms}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar conta
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link 
                  href="/login" 
                  className="text-primary hover:underline font-medium"
                >
                  Fazer login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
