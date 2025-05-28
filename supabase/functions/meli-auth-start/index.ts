
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
    console.log('🚀 Iniciando função meli-auth-start');
    console.log('📋 Headers recebidos:', Object.fromEntries(req.headers.entries()));

    // Verificar se o usuário está autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Authorization header não encontrado');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Authorization header encontrado');

    // Verificar variáveis de ambiente do Mercado Livre
    const clientId = Deno.env.get('MERCADO_LIVRE_CLIENT_ID');
    const redirectUri = Deno.env.get('MERCADO_LIVRE_REDIRECT_URI');

    console.log('🔍 Verificando variáveis de ambiente:');
    console.log('- MERCADO_LIVRE_CLIENT_ID:', clientId ? '✅ Configurado' : '❌ Não configurado');
    console.log('- MERCADO_LIVRE_REDIRECT_URI:', redirectUri ? '✅ Configurado' : '❌ Não configurado');

    if (!clientId || !redirectUri) {
      console.error('❌ Variáveis de ambiente ML não configuradas');
      return new Response(
        JSON.stringify({ 
          error: 'Mercado Livre configuration missing',
          details: {
            clientId: !!clientId,
            redirectUri: !!redirectUri
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    console.log('🔧 Inicializando Supabase client');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar o usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Verificando token de autenticação');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Erro ao verificar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Usuário autenticado:', user.id);

    // Gerar PKCE parameters
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    console.log('🔑 Parâmetros PKCE gerados:');
    console.log('- Code verifier (primeiros 20 chars):', codeVerifier.substring(0, 20) + '...');
    console.log('- Code challenge (primeiros 20 chars):', codeChallenge.substring(0, 20) + '...');
    console.log('- State:', state);

    // Limpar estados antigos do usuário
    console.log('🧹 Limpando estados antigos do usuário');
    const { error: deleteError } = await supabase
      .from('meli_auth_states')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.warn('⚠️ Aviso ao limpar estados antigos:', deleteError);
    }

    // Salvar estado temporário no banco
    console.log('💾 Salvando estado de autenticação no banco');
    const { error: insertError } = await supabase
      .from('meli_auth_states')
      .insert({
        user_id: user.id,
        code_verifier: codeVerifier,
        state: state
      });

    if (insertError) {
      console.error('❌ Erro ao salvar estado de autenticação:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save auth state',
          details: insertError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Estado de autenticação salvo com sucesso');

    // Construir URL de autorização do Mercado Livre Brasil
    const authUrl = new URL('https://auth.mercadolibre.com/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('site_id', 'MLB'); // Brasil

    console.log('🌐 URL de autorização construída:');
    console.log('- URL completa:', authUrl.toString());
    console.log('- Parâmetros:', Object.fromEntries(authUrl.searchParams.entries()));

    console.log('🎉 Processo de autenticação iniciado com sucesso');

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state: state,
        debug: {
          userId: user.id,
          timestamp: new Date().toISOString(),
          clientId: clientId,
          redirectUri: redirectUri
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Erro inesperado em meli-auth-start:', error);
    console.error('📊 Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
