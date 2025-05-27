
import { corsHeaders } from './types.ts';
import { validateCallbackParams } from './validation.ts';
import { getAuthState, cleanupAuthState } from './auth-state.ts';
import { exchangeCodeForTokens } from './token-exchange.ts';
import { saveTokens } from './token-storage.ts';
import { createSuccessPage, createErrorPage } from './html-responses.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Validate callback parameters
    const validationResult = validateCallbackParams(url);
    if (validationResult instanceof Response) {
      return validationResult;
    }
    
    const { code, state } = validationResult;

    // Get auth state from database
    const authStateResult = await getAuthState(state);
    if (authStateResult instanceof Response) {
      return authStateResult;
    }
    
    const authState = authStateResult;

    // Exchange code for tokens
    const tokenResult = await exchangeCodeForTokens(code, authState);
    if (tokenResult instanceof Response) {
      return tokenResult;
    }
    
    const tokenData = tokenResult;

    // Save tokens to database
    const saveResult = await saveTokens(tokenData, authState.user_id);
    if (saveResult instanceof Response) {
      return saveResult;
    }

    // Clean up temporary auth state
    await cleanupAuthState(state);

    console.log('Conexão com Mercado Livre Brasil bem-sucedida para usuário:', authState.user_id);

    // Return success page
    return new Response(
      createSuccessPage(tokenData.user_id),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );

  } catch (error) {
    console.error('Erro inesperado no meli-callback:', error);
    
    return new Response(
      createErrorPage('Erro Inesperado', `Ocorreu um erro inesperado: ${error.message}<br>Tente novamente ou contate o suporte.`),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }
});
