
import { corsHeaders, createErrorPage } from './html-responses.ts';
import type { MercadoLivreTokenResponse, AuthState } from './types.ts';

export const exchangeCodeForTokens = async (code: string, authState: AuthState): Promise<MercadoLivreTokenResponse | Response> => {
  const clientId = Deno.env.get('MERCADO_LIVRE_CLIENT_ID');
  const clientSecret = Deno.env.get('MERCADO_LIVRE_CLIENT_SECRET');
  const redirectUri = Deno.env.get('MERCADO_LIVRE_REDIRECT_URI');

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Configurações ML não encontradas');
    return new Response(
      createErrorPage('Erro de Configuração', 'Configurações do Mercado Livre não encontradas. Contate o administrador.'),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }

  console.log('Trocando código por tokens com PKCE para usuário:', authState.user_id);

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
      createErrorPage('Erro na Conexão', `Falha ao obter tokens do Mercado Livre Brasil.<br><strong>Status:</strong> ${tokenResponse.status}<br><strong>Erro:</strong> ${errorText}`),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }

  const tokenData: MercadoLivreTokenResponse = await tokenResponse.json();
  console.log('Tokens obtidos com sucesso para usuário ML:', tokenData.user_id);

  return tokenData;
};
