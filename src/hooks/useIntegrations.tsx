
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ApiKey } from "@/lib/types";

export const useIntegrations = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchApiKeys = async () => {
    if (!user) return;
    
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

  useEffect(() => {
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

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          console.log('Popup do ML fechado, recarregando dados...');
          setConnecting(false);
          setTimeout(() => {
            fetchApiKeys();
          }, 1000);
        }
      }, 1000);

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

  return {
    apiKeys,
    loading,
    connecting,
    handleShopeeConnect,
    handleMercadoLivreConnect,
    handleMercadoLivreRefresh,
    refetchApiKeys: fetchApiKeys
  };
};
