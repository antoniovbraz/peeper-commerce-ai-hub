
import { corsHeaders } from './types.ts';
import { createErrorPage } from './html-responses.ts';

export const validateCallbackParams = (url: URL) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.log('Mercado Livre Brasil callback recebido:', { 
    code: !!code, 
    state, 
    error, 
    errorDescription,
    fullUrl: url.toString()
  });

  // Se houve erro na autorização
  if (error) {
    console.error('Erro na autorização ML:', { error, errorDescription });
    return new Response(
      createErrorPage('Erro na Autorização', `<strong>Erro:</strong> ${error}<br><strong>Descrição:</strong> ${errorDescription || 'Erro desconhecido'}<br>Tente novamente ou contate o suporte.`),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }

  if (!code || !state) {
    console.error('Código ou state não encontrados');
    return new Response(
      createErrorPage('Erro na Conexão', 'Parâmetros de autorização inválidos. Tente novamente.'),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }

  return { code, state };
};
