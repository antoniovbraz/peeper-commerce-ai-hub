
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKey } from "@/lib/types";
import { ShoppingCart, Package, Check, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const IntegrationsPage = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchApiKeys = async () => {
      setLoading(true);
      try {
        const { data: apiKeysData, error } = await supabase
          .from("api_keys")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;
        setApiKeys(apiKeysData || null);
      } catch (error) {
        console.error("Erro ao carregar integrações:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas integrações",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, [user]);

  const handleShopeeConnect = () => {
    toast({
      title: "Em desenvolvimento",
      description: "A integração com Shopee será implementada em breve.",
    });
  };

  const handleMercadoLivreConnect = () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para conectar sua conta.",
        variant: "destructive"
      });
      return;
    }

    // URL do aplicativo Mercado Livre com parâmetros corretos
    const clientId = '2824444403230454'; // ID do seu app ML
    const redirectUri = `${supabase.supabaseUrl}/functions/v1/meli-callback`;
    const state = user.id; // Passar o user_id como state para identificar o usuário

    const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    // Abrir popup para autorização
    const popup = window.open(
      authUrl,
      'mercado_livre_auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Monitorar se o popup foi fechado
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        // Recarregar dados após possível conexão
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }, 1000);

    toast({
      title: "Redirecionando...",
      description: "Você será direcionado para autorizar a conexão com o Mercado Livre.",
    });
  };

  const isShopeeConnected = apiKeys?.shopee_access_token;
  const isMercadoLivreConnected = apiKeys?.mercado_livre_access_token;

  // Verificar se o token do ML está próximo do vencimento
  const isMercadoLivreExpiringSoon = () => {
    if (!apiKeys?.mercado_livre_expires_at) return false;
    const expiresAt = new Date(apiKeys.mercado_livre_expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7; // Expira em menos de 7 dias
  };

  if (loading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Carregando integrações...</div>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Integrações com Marketplaces</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Shopee Integration */}
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
                  onClick={handleShopeeConnect}
                  className="w-full"
                  variant={isShopeeConnected ? "outline" : "default"}
                >
                  {isShopeeConnected ? "Reconectar" : "Conectar"} Shopee
                </Button>
              </CardContent>
            </Card>

            {/* Mercado Livre Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-yellow-500" />
                  Mercado Livre
                </CardTitle>
                <CardDescription>
                  Conecte sua conta do Mercado Livre para automatizar suas operações de venda
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
                  <p><strong>Benefícios da integração:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Publicação automática de produtos</li>
                    <li>Gestão de pedidos integrada</li>
                    <li>Relatórios de performance</li>
                    <li>Controle de reputação</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleMercadoLivreConnect}
                  className="w-full"
                  variant={isMercadoLivreConnected ? "outline" : "default"}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isMercadoLivreConnected ? "Reconectar" : "Conectar"} Mercado Livre
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Como funciona a integração?</CardTitle>
              <CardDescription>
                Entenda o processo de conexão com os marketplaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium">Autorização</h4>
                  <p className="text-sm text-gray-600">Clique em conectar e autorize o acesso seguro à sua conta</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium">Sincronização</h4>
                  <p className="text-sm text-gray-600">Seus produtos e dados são sincronizados automaticamente</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium">Automação</h4>
                  <p className="text-sm text-gray-600">Gerencie tudo de forma centralizada no hub</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default IntegrationsPage;
