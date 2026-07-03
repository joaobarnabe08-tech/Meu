import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { client_id, email, client_name } = await req.json();

    if (!client_id || !email) {
      return new Response(
        JSON.stringify({ error: "client_id e email são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .insert({
        client_id,
        email,
        status: "pending",
      })
      .select()
      .single();

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build activation URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://viperfactory.app";
    const activationUrl = `${siteUrl}/ativar-conta?token=${invite.token}`;

    // Send welcome email via Supabase Auth admin API
    const emailHtml = buildWelcomeEmail(client_name || "atleta", activationUrl);

    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: activationUrl,
        data: {
          client_id,
          invite_token: invite.token,
          client_name: client_name || "atleta",
        },
      }
    );

    // Even if email fails, return success with the invite token
    // (trainer can share the link manually)
    return new Response(
      JSON.stringify({
        success: true,
        invite_id: invite.id,
        token: invite.token,
        activation_url: activationUrl,
        email_sent: !emailError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildWelcomeEmail(name: string, activationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo(a) à Viper Factory</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0B0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0B0B;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#121212;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(212,175,55,0.15);border:1px solid #2A2A2A;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0B0B0B,#1A1A1A);padding:40px 40px 32px;text-align:center;border-bottom:2px solid #D4AF37;">
              <h1 style="margin:0;color:#D4AF37;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Viper Factory</h1>
              <p style="margin:8px 0 0;color:#9F9F9F;font-size:14px;font-weight:500;">Plataforma de Personal Training</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;background-color:#121212;">
              <h2 style="margin:0 0 24px;color:#ffffff;font-size:22px;font-weight:700;">Bem-vindo(a) à Viper Factory!</h2>
              <p style="margin:0 0 16px;color:#C9C9C9;font-size:16px;line-height:1.6;">Olá <strong style="color:#D4AF37;">${name}</strong>.</p>
              <p style="margin:0 0 24px;color:#C9C9C9;font-size:16px;line-height:1.6;">O teu treinador convidou-te para utilizar a Viper Factory. Clica no botão abaixo para ativares a tua conta.</p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${activationUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8932B);color:#0B0B0B;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(212,175,55,0.3);">Ativar Conta</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;color:#C9C9C9;font-size:16px;line-height:1.6;">Depois de iniciares sessão, poderás instalar a aplicação no teu telemóvel e consultar os teus treinos, plano alimentar e progresso.</p>

              <div style="margin:32px 0;padding:20px;background-color:#1A1A1A;border-radius:12px;border:1px solid #D4AF37;">
                <p style="margin:0;color:#D4AF37;font-size:14px;line-height:1.5;">💡 <strong>Dica:</strong> Depois de abrires a aplicação no telemóvel, podes adicioná-la ao ecrã principal para acesso rápido, como uma app nativa.</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#0B0B0B;padding:24px 40px;border-top:1px solid #2A2A2A;">
              <p style="margin:0;color:#6B6B6B;font-size:13px;text-align:center;line-height:1.5;">Cumprimentos,<br><strong style="color:#D4AF37;">Equipa Viper Factory</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
