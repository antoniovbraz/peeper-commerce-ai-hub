
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, characteristics, style, marketplace } = await req.json()

    // Buscar a chave da OpenAI das configurações do sistema
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings?key=eq.openai_api_key`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
    })

    const settings = await settingsResponse.json()
    const openaiKey = settings[0]?.value

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured by administrator' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Prompts personalizados por marketplace
    const prompts = {
      shopee: {
        title: `Crie um título otimizado para Shopee para o produto: ${name}. 
                Características: ${characteristics}. 
                Use palavras-chave relevantes, seja claro e atrativo. Máximo 60 caracteres.`,
        description: `Crie uma descrição ${style} para Shopee do produto: ${name}. 
                     Características: ${characteristics}. 
                     Use emojis, destaque benefícios, inclua informações técnicas relevantes. 
                     Seja persuasivo e otimizado para mobile.`,
        tags: `Sugira 10 tags relevantes para o produto ${name} no marketplace Shopee. 
               Características: ${characteristics}. 
               Retorne apenas as tags separadas por vírgula.`
      },
      mercado_livre: {
        title: `Crie um título otimizado para Mercado Livre para o produto: ${name}. 
                Características: ${characteristics}. 
                Use palavras-chave específicas, inclua marca se relevante. Máximo 60 caracteres.`,
        description: `Crie uma descrição ${style} para Mercado Livre do produto: ${name}. 
                     Características: ${characteristics}. 
                     Inclua especificações técnicas, garantia, envio. 
                     Use formatação em tópicos quando apropriado.`,
        tags: `Sugira 10 tags relevantes para o produto ${name} no Mercado Livre. 
               Características: ${characteristics}. 
               Retorne apenas as tags separadas por vírgula.`
      }
    }

    const selectedPrompts = prompts[marketplace as keyof typeof prompts] || prompts.shopee

    // Gerar título
    const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: selectedPrompts.title
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    })

    const titleData = await titleResponse.json()
    const title = titleData.choices[0]?.message?.content?.trim() || ''

    // Gerar descrição
    const descriptionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: selectedPrompts.description
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    const descriptionData = await descriptionResponse.json()
    const description = descriptionData.choices[0]?.message?.content?.trim() || ''

    // Gerar tags
    const tagsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: selectedPrompts.tags
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    const tagsData = await tagsResponse.json()
    const tagsString = tagsData.choices[0]?.message?.content?.trim() || ''
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

    return new Response(
      JSON.stringify({ title, description, tags }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating content:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate content' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
