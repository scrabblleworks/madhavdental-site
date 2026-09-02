// Cloudflare Pages Function: /api/verify
// Lightweight password check for the admin unlock screen.
// POST -> validates "x-admin-password" header against ADMIN_PASSWORD, no side effects.
function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password"
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const providedPassword = request.headers.get("x-admin-password") || "";
  if (!env.ADMIN_PASSWORD || providedPassword !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders()
    });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders() });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}
