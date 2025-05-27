
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MercadoLivreTokenResponse {
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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    console.log('Mercado Livre Brasil callback recebido:', { 
      code: !!code, 
      state, 
      error, 
      errorDescription,
      fullUrl: req.url 
    });

    // Se houve erro na autorização
    if (error) {
      console.error('Erro na autorização ML:', { error, errorDescription });
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro na Autorização</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Erro na Autorização</h1>
          <p><strong>Erro:</strong> ${error}</p>
          <p><strong>Descrição:</strong> ${errorDescription || 'Erro desconhecido'}</p>
          <p>Tente novamente ou contate o suporte.</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
        </body>
        </html>
        `,
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }

    if (!code || !state) {
      console.error('Código ou state não encontrados');
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro na Conexão</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Erro na Conexão</h1>
          <p>Parâmetros de autorização inválidos. Tente novamente.</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
        </body>
        </html>
        `,
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o estado de autenticação salvo
    const { data: authState, error: stateError } = await supabase
      .from('meli_auth_states')
      .select('user_id, code_verifier')
      .eq('state', state)
      .single();

    if (stateError || !authState) {
      console.error('Estado de autenticação não encontrado:', stateError);
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro de Segurança</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Erro de Segurança</h1>
          <p>Estado de autenticação inválido ou expirado. Tente novamente.</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
        </body>
        </html>
        `,
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }

    // Configuração para Mercado Livre Brasil
    const clientId = Deno.env.get('MERCADO_LIVRE_CLIENT_ID');
    const clientSecret = Deno.env.get('MERCADO_LIVRE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('MERCADO_LIVRE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Configurações ML não encontradas');
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro de Configuração</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Erro de Configuração</h1>
          <p>Configurações do Mercado Livre não encontradas. Contate o administrador.</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
        </body>
        </html>
        `,
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }

    console.log('Trocando código por tokens com PKCE para usuário:', authState.user_id);

    // Trocar o código por tokens usando PKCE
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: authState.code_verifier
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Erro ao trocar código por token:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro na Conexão</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Erro na Conexão</h1>
          <p>Falha ao obter tokens do Mercado Livre Brasil.</p>
          <p><strong>Status:</strong> ${tokenResponse.status}</p>
          <p><strong>Erro:</strong> ${errorText}</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
        </body>
        </html>
        `,
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }

    const tokenData: MercadoLivreTokenResponse = await tokenResponse.json();
    console.log('Tokens obtidos com sucesso para usuário ML:', tokenData.user_id);

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    console.log('Salvando tokens para usuário Supabase:', authState.user_id);

    // Salvar tokens no banco de dados
    const { error: upsertError } = await supabase
      .from('api_keys')
      .upsert({
        user_id: authState.user_id,
        mercado_livre_access_token: tokenData.access_token,
        mercado_livre_refresh_token: tokenData.refresh_token,
        mercado_livre_user_id: tokenData.user_id.toString(),
        mercado_livre_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Erro ao salvar tokens:', upsertError);
      
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro ao Salvar</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Erro ao Salvar</h1>
          <p>Tokens obtidos, mas houve erro ao salvar no banco de dados.</p>
          <p><strong>Erro:</strong> ${upsertError.message}</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
        </body>
        </html>
        `,
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }

    // Limpar estado temporário
    await supabase
      .from('meli_auth_states')
      .delete()
      .eq('state', state);

    console.log('Conexão com Mercado Livre Brasil bem-sucedida para usuário:', authState.user_id);

    // Retornar página de sucesso
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conexão Bem-sucedida</title>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
          }
          .container {
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 500px;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #27ae60; margin-bottom: 20px;">✅ Conexão Bem-sucedida!</h1>
          <p style="font-size: 18px; margin-bottom: 20px;">Sua conta do Mercado Livre Brasil foi conectada com sucesso usando OAuth2 + PKCE.</p>
          <p style="color: #666; margin-bottom: 10px;"><strong>ID do usuário ML:</strong> ${tokenData.user_id}</p>
          <p style="color: #666; margin-bottom: 30px;">Você pode fechar esta aba e retornar ao aplicativo.</p>
          <button onclick="window.close()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Fechar esta aba</button>
        </div>
        <script>
          // Tentar fechar automaticamente após 3 segundos
          setTimeout(() => {
            try {
              window.close();
            } catch(e) {
              console.log('Auto-close não suportado');
            }
          }, 3000);
        </script>
      </body>
      </html>
      `,
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );

  } catch (error) {
    console.error('Erro inesperado no meli-callback:', error);
    
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro Inesperado</title>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #e74c3c;">❌ Erro Inesperado</h1>
        <p>Ocorreu um erro inesperado: ${error.message}</p>
        <p>Tente novamente ou contate o suporte.</p>
        <button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar esta aba</button>
      </body>
      </html>
      `,
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }
});
