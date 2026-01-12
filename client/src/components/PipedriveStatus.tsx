import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Loader2,
  Zap
} from "lucide-react";

interface PipedriveStatusProps {
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function PipedriveStatus({ showLabel = true, size = "md" }: PipedriveStatusProps) {
  const [isChecking, setIsChecking] = useState(false);
  
  // Query para verificar status do Pipedrive
  const { data: status, isLoading, refetch } = trpc.pipedrive.checkStatus.useQuery(undefined, {
    refetchInterval: 60000, // Verificar a cada minuto
    retry: false,
  });
  
  const handleRefresh = async () => {
    setIsChecking(true);
    await refetch();
    setIsChecking(false);
  };
  
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className={`${iconSize} animate-spin text-muted-foreground`} />
        {showLabel && <span className="text-sm text-muted-foreground">Verificando...</span>}
      </div>
    );
  }
  
  if (!status) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <AlertCircle className={`${iconSize} text-yellow-500`} />
            {showLabel && <span className="text-sm text-yellow-600">Não configurado</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Integração com Pipedrive não configurada</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  if (status.connected) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
              <Zap className={iconSize} />
              {showLabel && "Pipedrive"}
              <CheckCircle2 className={iconSize} />
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Pipedrive Conectado</p>
            {status.companyName && <p className="text-sm">Empresa: {status.companyName}</p>}
            {status.lastSync && (
              <p className="text-xs text-muted-foreground">
                Última sincronização: {new Date(status.lastSync).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-red-500 text-red-600 gap-1">
            <Zap className={iconSize} />
            {showLabel && "Pipedrive"}
            <XCircle className={iconSize} />
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-medium text-red-600">Pipedrive Desconectado</p>
          {status.error && <p className="text-sm">{status.error}</p>}
          <p className="text-xs text-muted-foreground">
            Clique para tentar reconectar
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default PipedriveStatus;
