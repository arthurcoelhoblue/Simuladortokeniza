import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar email");
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Digite seu email");
      return;
    }
    
    forgotPasswordMutation.mutate({ email });
  };
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <img 
                src={APP_LOGO} 
                alt={APP_TITLE} 
                className="h-12 mx-auto mb-4 cursor-pointer"
              />
            </Link>
          </div>
          
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Email enviado!</h2>
                <p className="text-muted-foreground text-sm">
                  Se existe uma conta com o email <strong>{email}</strong>, 
                  você receberá instruções para redefinir sua senha.
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Não recebeu o email? Verifique sua pasta de spam ou{" "}
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-primary hover:underline"
                >
                  tente novamente
                </button>
              </p>
            </CardContent>
            
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
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
        </div>
        
        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Esqueceu a senha?</CardTitle>
            <CardDescription className="text-center">
              Digite seu email e enviaremos instruções para redefinir sua senha
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={forgotPasswordMutation.isPending}
                  autoComplete="email"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar instruções
                  </>
                )}
              </Button>
              
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para login
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
