
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createErrorPage } from './html-responses.ts';
import type { AuthState } from './types.ts';

export const getAuthState = async (state: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: authState, error: stateError } = await supabase
    .from('meli_auth_states')
    .select('user_id, code_verifier')
    .eq('state', state)
    .single();

  if (stateError || !authState) {
    console.error('Estado de autenticação não encontrado:', stateError);
    return new Response(
      createErrorPage('Erro de Segurança', 'Estado de autenticação inválido ou expirado. Tente novamente.'),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }

  return authState as AuthState;
};

export const cleanupAuthState = async (state: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase
    .from('meli_auth_states')
    .delete()
    .eq('state', state);
};
