
import { Package, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiKey } from "@/lib/types";

interface ShopeeCardProps {
  apiKeys: ApiKey | null;
  onConnect: () => void;
}

export const ShopeeCard = ({ apiKeys, onConnect }: ShopeeCardProps) => {
  const isShopeeConnected = apiKeys?.shopee_access_token;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          Shopee
        </CardTitle>
        <CardDescription>
          Conecte sua conta da Shopee para gerenciar produtos e vendas automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {isShopeeConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" />
              Conta conectada
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <X className="h-3 w-3 mr-1" />
              Não conectada
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Benefícios da integração:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Sincronização automática de produtos</li>
            <li>Gestão centralizada de estoque</li>
            <li>Análise de vendas em tempo real</li>
            <li>Otimização de preços automática</li>
          </ul>
        </div>

        <Button 
          onClick={onConnect}
          className="w-full"
          variant={isShopeeConnected ? "outline" : "default"}
        >
          {isShopeeConnected ? "Reconectar" : "Conectar"} Shopee
        </Button>
      </CardContent>
    </Card>
  );
};
