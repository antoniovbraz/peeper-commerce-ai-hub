
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MercadoLivreRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se o usuário está autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar o usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Erro ao verificar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Iniciando refresh de tokens ML para usuário:', user.id);

    // Buscar tokens atuais do usuário
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('mercado_livre_refresh_token')
      .eq('user_id', user.id)
      .single();

    if (keysError || !apiKeys?.mercado_livre_refresh_token) {
      console.error('Refresh token não encontrado:', keysError);
      return new Response(
        JSON.stringify({ error: 'Mercado Livre not connected or refresh token missing' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Configurações do Mercado Livre Brasil
    const clientId = Deno.env.get('MERCADO_LIVRE_CLIENT_ID');
    const clientSecret = Deno.env.get('MERCADO_LIVRE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Configurações ML não encontradas');
      return new Response(
        JSON.stringify({ error: 'Mercado Livre configuration missing' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fazendo refresh dos tokens ML...');

    // Fazer refresh dos tokens
    const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: apiKeys.mercado_livre_refresh_token
      })
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Erro ao fazer refresh dos tokens:', {
        status: refreshResponse.status,
        statusText: refreshResponse.statusText,
        error: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to refresh tokens',
          details: errorText 
        }),
        { 
          status: refreshResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const refreshData: MercadoLivreRefreshResponse = await refreshResponse.json();
    console.log('Refresh bem-sucedido para usuário ML:', refreshData.user_id);

    // Calcular nova data de expiração
    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

    // Atualizar tokens no banco de dados
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({
        mercado_livre_access_token: refreshData.access_token,
        mercado_livre_refresh_token: refreshData.refresh_token,
        mercado_livre_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar tokens:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update tokens in database' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Tokens atualizados com sucesso para usuário:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        expires_at: newExpiresAt.toISOString(),
        user_id: refreshData.user_id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro inesperado em meli-refresh:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
