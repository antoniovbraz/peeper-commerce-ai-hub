
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar string aleatória segura
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  
  return result;
}

// Função para gerar code_challenge a partir do code_verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Converter para base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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

    console.log('Iniciando processo de autenticação ML para usuário:', user.id);

    // Configurações do Mercado Livre Brasil
    const clientId = Deno.env.get('MERCADO_LIVRE_CLIENT_ID');
    const redirectUri = Deno.env.get('MERCADO_LIVRE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      console.error('Variáveis de ambiente ML não configuradas');
      return new Response(
        JSON.stringify({ error: 'Mercado Livre configuration missing' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Gerar PKCE parameters
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    console.log('Gerados parâmetros PKCE:', { 
      codeVerifier: codeVerifier.substring(0, 10) + '...', 
      codeChallenge: codeChallenge.substring(0, 10) + '...',
      state 
    });

    // Limpar estados antigos do usuário
    await supabase
      .from('meli_auth_states')
      .delete()
      .eq('user_id', user.id);

    // Salvar estado temporário no banco
    const { error: insertError } = await supabase
      .from('meli_auth_states')
      .insert({
        user_id: user.id,
        code_verifier: codeVerifier,
        state: state
      });

    if (insertError) {
      console.error('Erro ao salvar estado de autenticação:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save auth state' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Construir URL de autorização do Mercado Livre Brasil
    const authUrl = new URL('https://auth.mercadolibre.com/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('site_id', 'MLB'); // Brasil

    console.log('URL de autorização gerada:', authUrl.toString());

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state: state 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro inesperado em meli-auth-start:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
