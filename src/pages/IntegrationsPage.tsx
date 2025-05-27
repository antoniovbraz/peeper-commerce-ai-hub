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
  const [connecting, setConnecting] = useState(false);

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

  const handleMercadoLivreConnect = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para conectar sua conta.",
        variant: "destructive"
      });
      return;
    }

    setConnecting(true);

    try {
      console.log('Iniciando processo de conexão ML com PKCE...');

      // Chamar a edge function para iniciar o processo OAuth2 com PKCE
      const { data, error } = await supabase.functions.invoke('meli-auth-start', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Erro ao iniciar autenticação ML:', error);
        toast({
          title: "Erro",
          description: "Erro ao iniciar processo de autorização. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      if (!data?.authUrl) {
        console.error('URL de autorização não retornada');
        toast({
          title: "Erro",
          description: "Erro interno. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      console.log('URL de autorização recebida, abrindo popup...');

      // Abrir popup para autorização
      const popup = window.open(
        data.authUrl,
        'mercado_livre_auth',
        'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes'
      );

      if (!popup) {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de autorização. Verifique se o bloqueador de pop-ups está desabilitado.",
          variant: "destructive"
        });
        return;
      }

      // Monitorar se o popup foi fechado
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          console.log('Popup do ML fechado, recarregando dados...');
          setConnecting(false);
          // Recarregar dados após possível conexão
          setTimeout(() => {
            fetchApiKeys();
          }, 1000);
        }
      }, 1000);

      // Timeout para limpar o intervalo após 5 minutos
      setTimeout(() => {
        clearInterval(checkClosed);
        setConnecting(false);
      }, 300000);

      toast({
        title: "Redirecionando...",
        description: "Você será direcionado para autorizar a conexão com o Mercado Livre Brasil usando OAuth2 + PKCE.",
      });

    } catch (error) {
      console.error('Erro ao iniciar autorização ML:', error);
      setConnecting(false);
      toast({
        title: "Erro",
        description: "Erro ao iniciar processo de autorização. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleMercadoLivreRefresh = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para renovar os tokens.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Renovando tokens ML...');

      const { data, error } = await supabase.functions.invoke('meli-refresh', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Erro ao renovar tokens ML:', error);
        toast({
          title: "Erro ao renovar",
          description: "Não foi possível renovar os tokens. Tente reconectar sua conta.",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Tokens renovados",
          description: "Seus tokens do Mercado Livre foram renovados com sucesso.",
        });
        
        // Recarregar dados
        fetchApiKeys();
      }

    } catch (error) {
      console.error('Erro ao renovar tokens:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao renovar tokens. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const fetchApiKeys = async () => {
    if (!user) return;
    
    try {
      const { data: apiKeysData, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setApiKeys(apiKeysData || null);
    } catch (error) {
      console.error("Erro ao recarregar integrações:", error);
    }
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
                    onClick={handleMercadoLivreConnect}
                    className="flex-1"
                    variant={isMercadoLivreConnected ? "outline" : "default"}
                    disabled={connecting}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {connecting ? "Conectando..." : (isMercadoLivreConnected ? "Reconectar" : "Conectar")}
                  </Button>
                  
                  {isMercadoLivreConnected && (
                    <Button 
                      onClick={handleMercadoLivreRefresh}
                      variant="secondary"
                      size="sm"
                    >
                      🔄 Renovar
                    </Button>
                  )}
                </div>
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
