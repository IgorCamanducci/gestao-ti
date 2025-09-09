import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Função 'reset-user-password' inicializada.`);

Deno.serve(async (req) => {
  // Lida com a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("1. Recebida nova requisição.");
    const { user_id } = await req.json()
    if (!user_id) throw new Error("ID do usuário alvo não fornecido no corpo da requisição.")
    console.log("2. ID do usuário alvo:", user_id);

    // Cria cliente para verificar quem está chamando
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user: invoker } } = await supabaseClient.auth.getUser()
    if (!invoker) throw new Error("Não foi possível identificar o autor da chamada (invoker).")
    console.log("3. Autor da chamada (invoker) identificado:", invoker.id);

    // Cria cliente ADMIN com superpoderes
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    console.log("4. Cliente Admin criado.");

    // Pega o email do usuário alvo
    const { data: { user: targetUser }, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(user_id)
    if (targetUserError) throw targetUserError
    if (!targetUser) throw new Error("Usuário alvo não encontrado no sistema.")
    console.log("5. Email do usuário alvo encontrado:", targetUser.email);

    // Gera o link de recuperação apontando para o site online
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_SITE_URL') || ''
    const redirectTo = siteUrl ? `${siteUrl.replace(/\/$/, '')}/update-password` : undefined
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.email,
      options: redirectTo ? { redirectTo } : undefined as any,
    })
    if (linkError) throw linkError
    console.log("6. Link de recuperação gerado com sucesso.");

    return new Response(JSON.stringify({ message: 'Link de recuperação enviado!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("ERRO DENTRO DA EDGE FUNCTION:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})