
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createErrorPage } from './html-responses.ts';
import type { MercadoLivreTokenResponse } from './types.ts';

export const saveTokens = async (tokenData: MercadoLivreTokenResponse, userId: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

  console.log('Salvando tokens para usuário Supabase:', userId);

  const { error: upsertError } = await supabase
    .from('api_keys')
    .upsert({
      user_id: userId,
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
      createErrorPage('Erro ao Salvar', `Tokens obtidos, mas houve erro ao salvar no banco de dados.<br><strong>Erro:</strong> ${upsertError.message}`),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }

  return null; // Success
};
