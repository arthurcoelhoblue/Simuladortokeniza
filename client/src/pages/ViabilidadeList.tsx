import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Página de listagem de análises de viabilidade
 */
export default function ViabilidadeList() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: analyses, isLoading } = trpc.viability.list.useQuery();

  // Redirecionar se não for captador
  useEffect(() => {
    if (user && user.perfil !== 'captador') {
      setLocation('/selecionar-perfil');
    }
  }, [user, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando análises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Análise de Viabilidade</h1>
            <p className="text-xl text-muted-foreground">
              Valide a viabilidade financeira dos seus projetos
            </p>
          </div>
          <Button onClick={() => setLocation('/captador/viabilidade/nova')} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nova Análise
          </Button>
        </div>

        {/* Lista de Análises */}
        {!analyses || analyses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma análise criada</CardTitle>
              <CardDescription>
                Crie sua primeira análise de viabilidade para começar a validar seus projetos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation('/captador/viabilidade/nova')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Análise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {analyses.map((analysis) => (
              <Card 
                key={analysis.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/captador/viabilidade/${analysis.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{analysis.nome}</CardTitle>
                      <CardDescription>
                        Criado em {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysis.status === 'viavel' 
                        ? 'bg-green-500/10 text-green-600' 
                        : analysis.status === 'inviavel'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {analysis.status === 'viavel' ? '✓ Viável' : analysis.status === 'inviavel' ? '✗ Inviável' : '⏳ Em Análise'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor da Captação</p>
                      <p className="text-lg font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analysis.valorCaptacao / 100)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prazo</p>
                      <p className="text-lg font-semibold">{analysis.prazoMeses} meses</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modelo</p>
                      <p className="text-lg font-semibold">{analysis.modeloPagamento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Atualizado</p>
                      <p className="text-lg font-semibold">
                        {new Date(analysis.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
