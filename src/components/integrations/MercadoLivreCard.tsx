
import { ShoppingCart, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiKey } from "@/lib/types";

interface MercadoLivreCardProps {
  apiKeys: ApiKey | null;
  connecting: boolean;
  onConnect: () => void;
  onRefresh: () => void;
}

export const MercadoLivreCard = ({ apiKeys, connecting, onConnect, onRefresh }: MercadoLivreCardProps) => {
  const isMercadoLivreConnected = apiKeys?.mercado_livre_access_token;

  const isMercadoLivreExpiringSoon = () => {
    if (!apiKeys?.mercado_livre_expires_at) return false;
    const expiresAt = new Date(apiKeys.mercado_livre_expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-yellow-500" />
          Mercado Livre Brasil
          <Badge variant="outline" className="text-xs">OAuth2 + PKCE</Badge>
        </CardTitle>
        <CardDescription>
          Conecte sua conta do Mercado Livre Brasil com autenticação segura OAuth2 + PKCE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {isMercadoLivreConnected ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Conta conectada
              </Badge>
              {isMercadoLivreExpiringSoon() && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  ⚠️ Expira em breve
                </Badge>
              )}
            </div>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <X className="h-3 w-3 mr-1" />
              Não conectada
            </Badge>
          )}
        </div>

        {isMercadoLivreConnected && apiKeys?.mercado_livre_user_id && (
          <div className="text-sm text-gray-600">
            <p><strong>ID do usuário ML:</strong> {apiKeys.mercado_livre_user_id}</p>
            {apiKeys.mercado_livre_expires_at && (
              <p><strong>Token expira em:</strong> {new Date(apiKeys.mercado_livre_expires_at).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Benefícios da integração OAuth2 + PKCE:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Autenticação máxima segurança</li>
            <li>Renovação automática de tokens</li>
            <li>Publicação automática de produtos</li>
            <li>Gestão de pedidos integrada</li>
            <li>Relatórios de performance</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onConnect}
            className="flex-1"
            variant={isMercadoLivreConnected ? "outline" : "default"}
            disabled={connecting}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {connecting ? "Conectando..." : (isMercadoLivreConnected ? "Reconectar" : "Conectar")}
          </Button>
          
          {isMercadoLivreConnected && (
            <Button 
              onClick={onRefresh}
              variant="secondary"
              size="sm"
            >
              🔄 Renovar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
