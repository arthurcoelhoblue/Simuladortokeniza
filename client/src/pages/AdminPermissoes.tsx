import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Search, 
  UserCog, 
  Crown,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Redirect } from "wouter";

export default function AdminPermissoes() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Verificar se é super admin
  const isSuperAdmin = user?.email === "arthur@blueconsult.com.br" || 
                       user?.email === "arthurcsantos@gmail.com";
  
  // Buscar todos os usuários
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: isSuperAdmin,
  });
  
  // Mutation para atualizar role
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Permissão atualizada com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar permissão");
    },
  });
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isSuperAdmin) {
    return <Redirect to="/" />;
  }
  
  // Filtrar usuários
  const filteredUsers = users?.filter((u: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    );
  }) || [];
  
  const handleRoleChange = (userId: number, newRole: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };
  
  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600">
          <Crown className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        Usuário
      </Badge>
    );
  };
  
  const getPerfilBadge = (perfil: string | null) => {
    if (perfil === "captador") {
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Captador</Badge>;
    }
    if (perfil === "investidor") {
      return <Badge variant="outline" className="border-green-500 text-green-500">Investidor</Badge>;
    }
    return <Badge variant="outline">Não definido</Badge>;
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gerenciamento de Permissões</h1>
              <p className="text-muted-foreground">
                Configure quem tem acesso às funcionalidades administrativas
              </p>
            </div>
          </div>
        </div>
        
        {/* Info Card */}
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Sobre as permissões</p>
                <p className="text-amber-700 mt-1">
                  <strong>Usuários</strong> têm acesso às funcionalidades básicas do simulador.
                  <br />
                  <strong>Admins</strong> podem acessar: Dashboard de Leads, Propostas Comerciais, e Gerenciamento de Usuários.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filtro */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {filteredUsers.length} usuários
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Usuários do Sistema
            </CardTitle>
            <CardDescription>
              Clique no seletor de permissão para alterar o nível de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {u.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="font-medium">{u.name || "Sem nome"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {getPerfilBadge(u.perfil)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u.id, value as "user" | "admin")}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Usuário
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
